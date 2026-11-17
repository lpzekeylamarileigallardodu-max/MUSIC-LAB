package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.EstudiantePanel;
import com.academia.academia.domain.model.HorarioGestion;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.Reporte;
import com.academia.academia.domain.model.Reporte.Columna;
import com.academia.academia.domain.model.Reporte.Hoja;
import com.academia.academia.domain.model.UsuarioAdmin;
import com.academia.academia.domain.port.in.ReportesCasosDeUso;
import com.academia.academia.domain.port.out.AdminRepositorioPuerto;
import com.academia.academia.domain.port.out.DocenteRepositorioPuerto;
import com.academia.academia.domain.port.out.EstudianteRepositorioPuerto;
import com.academia.academia.domain.port.out.GeneradorExcelPuerto;
import com.academia.academia.domain.port.out.HorarioGestionPuerto;
import com.academia.academia.domain.port.out.ReportesRepositorioPuerto;
import com.academia.academia.domain.port.out.ReportesRepositorioPuerto.AsistenciaFila;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportesServiceImpl implements ReportesCasosDeUso {

    private static final String[] MESES = {"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
            "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"};
    private static final DateTimeFormatter SELLO = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final GeneradorExcelPuerto excel;
    private final AdminRepositorioPuerto admin;
    private final HorarioGestionPuerto horarios;
    private final ReportesRepositorioPuerto datos;
    private final DocenteRepositorioPuerto docentes;
    private final EstudianteRepositorioPuerto estudiantes;

    public ReportesServiceImpl(GeneradorExcelPuerto excel, AdminRepositorioPuerto admin, HorarioGestionPuerto horarios,
                               ReportesRepositorioPuerto datos, DocenteRepositorioPuerto docentes,
                               EstudianteRepositorioPuerto estudiantes) {
        this.excel = excel;
        this.admin = admin;
        this.horarios = horarios;
        this.datos = datos;
        this.docentes = docentes;
        this.estudiantes = estudiantes;
    }

    @Override
    public Archivo usuarios() {
        List<UsuarioAdmin> lista = admin.listarUsuarios();
        List<List<Object>> filas = lista.stream()
                .map(u -> fila(u.nombre(), u.ci(), u.correo(), u.telefono(), u.tipoUsuario(),
                        u.activo() ? "Activo" : "Inactivo", u.fechaRegistro()))
                .toList();

        Map<String, Long> porTipo = lista.stream()
                .collect(Collectors.groupingBy(UsuarioAdmin::tipoUsuario, LinkedHashMap::new, Collectors.counting()));
        List<List<Object>> resumen = porTipo.entrySet().stream()
                .map(e -> fila(e.getKey(), e.getValue(),
                        lista.stream().filter(u -> u.tipoUsuario().equals(e.getKey()) && u.activo()).count()))
                .toList();

        return archivo(new Reporte("usuarios", "Usuarios de la academia", List.of(
                Hoja.tabla("Usuarios", lista.size() + " usuarios", List.of(
                        Columna.texto("Nombre", 32), Columna.texto("CI", 12), Columna.texto("Correo", 36),
                        Columna.texto("Teléfono", 16), Columna.texto("Tipo", 15), Columna.texto("Estado", 10),
                        Columna.fechaHora("Registro")), filas),
                Hoja.tabla("Por tipo", "Cantidad de usuarios por tipo", List.of(
                        Columna.texto("Tipo", 18), Columna.entero("Total"), Columna.entero("Activos")), resumen)
                        .conTotales())));
    }

    @Override
    public Archivo cursos() {
        List<CursoAdmin> cursos = admin.listarCursos();
        List<List<Object>> filas = cursos.stream()
                .map(c -> fila(c.nombre(), c.nivel(), c.docente(), c.costoMensual(), c.inscritos(),
                        c.costoMensual() == null ? null : c.costoMensual().multiply(BigDecimal.valueOf(c.inscritos())),
                        c.horarios().stream().map(h -> h.dia() + " " + h.horaInicio() + "-" + h.horaFin() + " (" + h.aula() + ")")
                                .collect(Collectors.joining("; ")),
                        c.activo() ? "Activo" : "Inactivo"))
                .toList();
        List<List<Object>> inscripciones = datos.inscripciones().stream()
                .map(i -> fila(i.curso(), i.docente(), i.estudiante(), i.correo(), i.estado(), i.fecha()))
                .toList();

        return archivo(new Reporte("cursos", "Cursos e inscripciones", List.of(
                Hoja.tabla("Cursos", cursos.size() + " cursos — ingreso mensual esperado = costo × inscritos", List.of(
                        Columna.texto("Curso", 26), Columna.texto("Nivel", 14), Columna.texto("Docente", 28),
                        Columna.dinero("Costo mensual"), Columna.entero("Inscritos"), Columna.dinero("Ingreso esperado"),
                        Columna.texto("Horarios", 60), Columna.texto("Estado", 10)), filas).conTotales(),
                Hoja.tabla("Inscripciones", inscripciones.size() + " inscripciones", List.of(
                        Columna.texto("Curso", 26), Columna.texto("Docente", 28), Columna.texto("Estudiante", 30),
                        Columna.texto("Correo", 32), Columna.texto("Estado", 12), Columna.fechaHora("Inscrito el")),
                        inscripciones))));
    }

    @Override
    public Archivo horarios() {
        List<Bloque> activos = horarios.listarTodos().stream().filter(b -> b.activo() && b.cursoActivo()).toList();

        List<List<Object>> lista = activos.stream()
                .sorted((a, b) -> {
                    int d = Integer.compare(DiaSemana.valueOf(a.dia()).ordinal(), DiaSemana.valueOf(b.dia()).ordinal());
                    return d != 0 ? d : a.horaInicio().compareTo(b.horaInicio());
                })
                .map(b -> fila(b.dia(), b.horaInicio(), b.horaFin(), b.curso(), b.docente(), b.aula()))
                .toList();

        List<Hoja> hojas = new ArrayList<>();
        hojas.add(cuadricula("Semana", "Horario semanal de todas las aulas", activos, true));

        activos.stream().map(Bloque::aula).distinct().sorted()
                .forEach(aula -> hojas.add(cuadricula(aula, "Ocupación de " + aula,
                        activos.stream().filter(b -> b.aula().equals(aula)).toList(), false)));
        hojas.add(Hoja.tabla("Lista", activos.size() + " clases por semana", List.of(
                Columna.texto("Día", 12), Columna.texto("Inicio", 8), Columna.texto("Fin", 8),
                Columna.texto("Curso", 26), Columna.texto("Docente", 28), Columna.texto("Aula", 14)), lista));

        return archivo(new Reporte("horarios", "Horarios de la academia", hojas));
    }

    private Hoja cuadricula(String nombre, String subtitulo, List<Bloque> bloques, boolean conAula) {
        List<Columna> columnas = new ArrayList<>();
        columnas.add(Columna.texto("Hora", 9));
        Arrays.stream(DiaSemana.values()).forEach(d -> columnas.add(Columna.texto(d.name(), 22)));

        List<List<Object>> filas = new ArrayList<>();
        for (LocalTime t = HorarioGestion.APERTURA; t.isBefore(HorarioGestion.CIERRE); t = t.plusMinutes(30)) {
            List<Object> fila = new ArrayList<>();
            fila.add(t.toString());
            for (DiaSemana d : DiaSemana.values()) {
                LocalTime slot = t;
                String texto = bloques.stream()
                        .filter(b -> b.dia().equals(d.name())
                                && !LocalTime.parse(b.horaInicio()).isAfter(slot)
                                && LocalTime.parse(b.horaFin()).isAfter(slot))
                        .map(b -> b.curso() + (conAula ? " · " + b.aula() : "") + "\n" + b.horaInicio() + "–" + b.horaFin())
                        .collect(Collectors.joining("\n"));
                fila.add(texto);
            }
            filas.add(fila);
        }
        return new Hoja(nombre, subtitulo, columnas, filas, false, true);
    }

    @Override
    public Archivo cuotas() {
        var cuotas = datos.cuotas();
        List<List<Object>> filas = cuotas.stream()
                .map(q -> fila(q.estudiante(), q.ci(), q.telefono(), q.curso(), mes(q.mes()) + " " + q.anio(),
                        q.monto(), q.vencimiento(), q.estado()))
                .toList();

        Map<String, BigDecimal> deuda = new LinkedHashMap<>();
        Map<String, Integer> cantidad = new HashMap<>();
        cuotas.stream().filter(q -> "VENCIDA".equals(q.estado())).forEach(q -> {
            deuda.merge(q.estudiante(), q.monto(), BigDecimal::add);
            cantidad.merge(q.estudiante(), 1, Integer::sum);
        });
        List<List<Object>> morosos = deuda.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(e -> fila(e.getKey(), cantidad.get(e.getKey()), e.getValue()))
                .toList();

        Map<String, List<ReportesRepositorioPuerto.CuotaFila>> porEstado = cuotas.stream()
                .collect(Collectors.groupingBy(ReportesRepositorioPuerto.CuotaFila::estado, LinkedHashMap::new, Collectors.toList()));
        List<List<Object>> estados = porEstado.entrySet().stream()
                .map(e -> fila(e.getKey(), e.getValue().size(),
                        e.getValue().stream().map(ReportesRepositorioPuerto.CuotaFila::monto).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .toList();

        return archivo(new Reporte("cuotas", "Cuotas y morosidad", List.of(
                Hoja.tabla("Cuotas", cuotas.size() + " cuotas", List.of(
                        Columna.texto("Estudiante", 30), Columna.texto("CI", 12), Columna.texto("Teléfono", 16),
                        Columna.texto("Curso", 24), Columna.texto("Mes", 16), Columna.dinero("Monto"),
                        Columna.fecha("Vence"), Columna.texto("Estado", 11)), filas),
                Hoja.tabla("Morosidad", "Estudiantes con cuotas vencidas", List.of(
                        Columna.texto("Estudiante", 30), Columna.entero("Cuotas vencidas"), Columna.dinero("Deuda")),
                        morosos).conTotales(),
                Hoja.tabla("Por estado", "Resumen por estado", List.of(
                        Columna.texto("Estado", 14), Columna.entero("Cuotas"), Columna.dinero("Monto")), estados)
                        .conTotales())));
    }

    @Override
    public Archivo pagos() {
        var pagos = datos.pagos();
        List<List<Object>> filas = pagos.stream()
                .map(p -> fila(p.fecha(), p.estudiante(), p.curso(), p.concepto(), p.montoPago(), p.montoRecibido(),
                        p.metodo(), p.estado(), p.nroComprobante(), p.verificadoPor(), p.fechaConfirmacion(), p.codigoError()))
                .toList();

        Map<String, Map<String, BigDecimal>> porMes = new LinkedHashMap<>();
        TreeSet<String> metodos = new TreeSet<>();
        pagos.stream().filter(p -> "APROBADA".equals(p.estado())).forEach(p -> {
            var cuando = p.fechaConfirmacion() != null ? p.fechaConfirmacion() : p.fecha();
            String clave = cuando.getYear() + "-" + String.format("%02d", cuando.getMonthValue());
            BigDecimal monto = p.montoRecibido() != null ? p.montoRecibido() : p.montoPago();
            porMes.computeIfAbsent(clave, k -> new HashMap<>()).merge(p.metodo(), monto, BigDecimal::add);
            metodos.add(p.metodo());
        });
        List<Columna> columnasMes = new ArrayList<>();
        columnasMes.add(Columna.texto("Mes", 12));
        metodos.forEach(m -> columnasMes.add(Columna.dinero(m)));
        columnasMes.add(Columna.dinero("Total"));
        List<List<Object>> ingresos = porMes.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    List<Object> f = new ArrayList<>();
                    f.add(e.getKey());
                    metodos.forEach(m -> f.add(e.getValue().getOrDefault(m, BigDecimal.ZERO)));
                    f.add(e.getValue().values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
                    return f;
                })
                .toList();

        return archivo(new Reporte("pagos", "Pagos y transacciones", List.of(
                Hoja.tabla("Transacciones", pagos.size() + " transacciones", List.of(
                        Columna.fechaHora("Fecha"), Columna.texto("Estudiante", 28), Columna.texto("Curso", 22),
                        Columna.texto("Concepto", 30), Columna.dinero("Monto"), Columna.dinero("Recibido"),
                        Columna.texto("Método", 14), Columna.texto("Estado", 11), Columna.texto("Comprobante", 20),
                        Columna.texto("Verificó", 24), Columna.fechaHora("Confirmado"), Columna.texto("Motivo rechazo", 22)),
                        filas),
                Hoja.tabla("Ingresos por mes", "Solo pagos aprobados", columnasMes, ingresos).conTotales())));
    }

    @Override
    public Archivo cursoDocente(String correoDocente, Integer idCurso) {
        Integer idDocente = docentes.buscarIdPorCorreo(correoDocente)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de docente"));
        if (idCurso == null || !docentes.dictaCurso(idDocente, idCurso)) {
            throw new RecursoNoEncontradoException("No se encontró el curso");
        }
        String curso = datos.nombreCurso(idCurso);
        List<AlumnoCurso> alumnos = docentes.alumnos(idCurso);
        List<EvaluacionDocente> evaluaciones = docentes.evaluaciones(idCurso);
        List<AsistenciaFila> asistencia = datos.asistenciaDeCurso(idCurso);

        List<List<Object>> filasAlumnos = alumnos.stream()
                .map(a -> fila(a.nombre(), a.correo(),
                        a.asistenciaPorcentaje() == null ? null : a.asistenciaPorcentaje() / 100.0, a.promedio()))
                .toList();

        List<String> nombresEval = evaluaciones.stream()
                .sorted(java.util.Comparator.comparing(EvaluacionDocente::fecha,
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(EvaluacionDocente::nombre).collect(Collectors.toCollection(LinkedHashSet::new))
                .stream().toList();
        Map<Integer, Map<String, BigDecimal>> notas = new HashMap<>();
        evaluaciones.forEach(e -> notas.computeIfAbsent(e.idInscripcion(), k -> new HashMap<>()).put(e.nombre(), e.nota()));
        List<Columna> colNotas = new ArrayList<>();
        colNotas.add(Columna.texto("Alumno", 30));
        nombresEval.forEach(n -> colNotas.add(Columna.numero(n)));
        colNotas.add(Columna.numero("Promedio"));
        List<List<Object>> filasNotas = alumnos.stream().map(a -> {
            List<Object> f = new ArrayList<>();
            f.add(a.nombre());
            nombresEval.forEach(n -> f.add(notas.getOrDefault(a.idInscripcion(), Map.of()).get(n)));
            f.add(a.promedio());
            return f;
        }).toList();

        List<LocalDate> fechas = asistencia.stream().map(AsistenciaFila::fecha).distinct().sorted().toList();
        Map<Integer, Map<LocalDate, String>> marcas = new HashMap<>();
        asistencia.forEach(a -> marcas.computeIfAbsent(a.idInscripcion(), k -> new HashMap<>()).put(a.fecha(), inicial(a.estado())));
        List<Columna> colAsis = new ArrayList<>();
        colAsis.add(Columna.texto("Alumno", 30));
        fechas.forEach(f -> colAsis.add(Columna.texto(f.format(DateTimeFormatter.ofPattern("dd/MM")), 7)));
        colAsis.add(Columna.porcentaje("Asistencia"));
        List<List<Object>> filasAsis = alumnos.stream().map(a -> {
            List<Object> f = new ArrayList<>();
            f.add(a.nombre());
            fechas.forEach(d -> f.add(marcas.getOrDefault(a.idInscripcion(), Map.of()).getOrDefault(d, "")));
            f.add(a.asistenciaPorcentaje() == null ? null : a.asistenciaPorcentaje() / 100.0);
            return f;
        }).toList();

        return archivo(new Reporte("curso-" + slug(curso), curso, List.of(
                Hoja.tabla("Alumnos", alumnos.size() + " alumnos activos", List.of(
                        Columna.texto("Alumno", 30), Columna.texto("Correo", 32), Columna.porcentaje("Asistencia"),
                        Columna.numero("Promedio")), filasAlumnos),
                Hoja.tabla("Notas", "Notas sobre 100", colNotas, filasNotas),
                Hoja.tabla("Asistencia", "P = presente, T = tardanza, A = ausente, L = licencia", colAsis, filasAsis))));
    }

    @Override
    public Archivo libretaEstudiante(String correoEstudiante) {
        Integer id = estudiantes.buscarIdPorCorreo(correoEstudiante)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de estudiante"));
        EstudiantePanel.Resumen r = estudiantes.resumen(id);

        List<List<Object>> resumen = List.of(
                fila("Cursos activos", r.cursosActivos()),
                fila("Promedio de notas", r.promedioNotas()),
                fila("Asistencia (%)", r.asistenciaPorcentaje()),
                fila("Cuotas pendientes", r.cuotasPendientes()),
                fila("Cuotas vencidas", r.cuotasVencidas()),
                fila("Monto por pagar (Bs)", r.montoPorPagar()));
        List<List<Object>> cursos = estudiantes.cursos(id).stream()
                .map(c -> fila(c.curso(), c.nivel(), c.docente(), c.estadoInscripcion(), c.fechaInscripcion(), c.costoMensual(),
                        c.horarios().stream().map(h -> h.dia() + " " + h.horaInicio() + "-" + h.horaFin())
                                .collect(Collectors.joining("; "))))
                .toList();
        List<List<Object>> notas = estudiantes.evaluaciones(id).stream()
                .map(e -> fila(e.curso(), e.nombre(), e.fecha(), e.nota(), e.comentario()))
                .toList();
        List<List<Object>> asistencia = estudiantes.asistencia(id).stream()
                .map(a -> fila(a.fecha(), a.curso(), a.estado(), a.observacion()))
                .toList();
        List<List<Object>> cuotas = estudiantes.cuotas(id).stream()
                .map(q -> fila(q.curso(), mes(q.mes()) + " " + q.anio(), q.monto(), q.fechaVencimiento(), q.estado(),
                        q.comprobanteEnRevision() ? "Sí" : ""))
                .toList();

        return archivo(new Reporte("mi-libreta", "Mi libreta", List.of(
                Hoja.tabla("Resumen", "Resumen al " + LocalDate.now(), List.of(
                        Columna.texto("Dato", 26), Columna.numero("Valor")), resumen),
                Hoja.tabla("Cursos", null, List.of(
                        Columna.texto("Curso", 26), Columna.texto("Nivel", 14), Columna.texto("Docente", 28),
                        Columna.texto("Estado", 12), Columna.fechaHora("Inscrito el"), Columna.dinero("Mensualidad"),
                        Columna.texto("Horarios", 50)), cursos),
                Hoja.tabla("Notas", null, List.of(
                        Columna.texto("Curso", 26), Columna.texto("Evaluación", 28), Columna.fecha("Fecha"),
                        Columna.numero("Nota"), Columna.texto("Comentario", 40)), notas),
                Hoja.tabla("Asistencia", null, List.of(
                        Columna.fecha("Fecha"), Columna.texto("Curso", 26), Columna.texto("Estado", 12),
                        Columna.texto("Observación", 40)), asistencia),
                Hoja.tabla("Cuotas", null, List.of(
                        Columna.texto("Curso", 26), Columna.texto("Mes", 16), Columna.dinero("Monto"), Columna.fecha("Vence"),
                        Columna.texto("Estado", 11), Columna.texto("En revisión", 11)), cuotas))));
    }

    private Archivo archivo(Reporte reporte) {
        String nombre = reporte.nombreArchivo() + "-" + LocalDate.now().format(SELLO) + ".xlsx";
        return new Archivo(nombre, excel.generar(reporte));
    }

    private static List<Object> fila(Object... valores) {
        return Arrays.asList(valores);
    }

    private static String mes(int m) {
        return m >= 1 && m <= 12 ? MESES[m - 1] : String.valueOf(m);
    }

    private static String inicial(String estado) {
        return switch (estado) {
            case "PRESENTE" -> "P";
            case "TARDANZA" -> "T";
            case "AUSENTE" -> "A";
            case "LICENCIA" -> "L";
            default -> estado;
        };
    }

    private static String slug(String texto) {
        String s = java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase().replaceAll("[^a-z0-9]+", "-");
        return s.replaceAll("(^-|-$)", "");
    }
}
