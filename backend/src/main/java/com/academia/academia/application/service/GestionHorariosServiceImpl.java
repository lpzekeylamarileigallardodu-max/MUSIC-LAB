package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.HorarioGestion;
import com.academia.academia.domain.model.HorarioGestion.AulaItem;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.CursoItem;
import com.academia.academia.domain.model.HorarioGestion.DatosBloque;
import com.academia.academia.domain.model.HorarioGestion.Tablero;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.GestionHorariosCasosDeUso;
import com.academia.academia.domain.port.out.DocenteRepositorioPuerto;
import com.academia.academia.domain.port.out.EstudianteRepositorioPuerto;
import com.academia.academia.domain.port.out.HorarioGestionPuerto;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class GestionHorariosServiceImpl implements GestionHorariosCasosDeUso {

    private final HorarioGestionPuerto horarios;
    private final UsuarioRepositorioPuerto usuarios;
    private final DocenteRepositorioPuerto docentes;
    private final EstudianteRepositorioPuerto estudiantes;

    public GestionHorariosServiceImpl(HorarioGestionPuerto horarios, UsuarioRepositorioPuerto usuarios,
                                      DocenteRepositorioPuerto docentes, EstudianteRepositorioPuerto estudiantes) {
        this.horarios = horarios;
        this.usuarios = usuarios;
        this.docentes = docentes;
        this.estudiantes = estudiantes;
    }

    // ---------------- Lectura ----------------

    @Override
    public Tablero tablero() {
        return new Tablero(horarios.listarTodos(), horarios.aulas(), horarios.cursos());
    }

    @Override
    public List<Choque> verificar(Integer idExcluir, DatosBloque datos) {
        validarForma(datos);
        CursoItem curso = curso(datos.idCurso());
        return horarios.choques(idExcluir, curso.id(), datos.idAula(), curso.idDocente(), datos.dia().name(),
                datos.inicio(), datos.fin());
    }

    @Override
    public List<Bloque> horarioDocente(String correo) {
        Integer id = docentes.buscarIdPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de docente"));
        return horarios.listarActivosDeDocente(id);
    }

    @Override
    public List<Bloque> horarioEstudiante(String correo) {
        Integer id = estudiantes.buscarIdPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de estudiante"));
        List<Integer> cursos = estudiantes.cursos(id).stream()
                .filter(c -> "ACTIVA".equals(c.estadoInscripcion()))
                .map(c -> c.idCurso())
                .toList();
        return cursos.isEmpty() ? List.of() : horarios.listarActivosDeCursos(cursos).stream()
                .filter(Bloque::cursoActivo).toList();
    }

    // ---------------- Escritura ----------------

    @Override
    @Transactional
    public Bloque crear(DatosBloque datos, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        validarParaGuardar(null, datos, true);
        Integer id = horarios.guardar(null, datos.idCurso(), datos.idAula(), datos.dia().name(),
                datos.inicio(), datos.fin(), true);
        Bloque nuevo = bloque(id);
        horarios.registrarBitacora(actor.getId(), "CREAR", String.valueOf(id), "Horario creado: " + describir(nuevo), ip);
        return nuevo;
    }

    @Override
    @Transactional
    public Bloque actualizar(Integer id, DatosBloque datos, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        Bloque antes = bloque(id);
        validarParaGuardar(id, datos, antes.activo());
        horarios.guardar(id, datos.idCurso(), datos.idAula(), datos.dia().name(), datos.inicio(), datos.fin(), antes.activo());
        Bloque despues = bloque(id);
        horarios.registrarBitacora(actor.getId(), "ACTUALIZAR", String.valueOf(id),
                "Horario modificado: " + describir(antes) + " -> " + describir(despues), ip);
        return despues;
    }

    @Override
    @Transactional
    public Bloque mover(Integer id, DiaSemana dia, LocalTime inicio, Integer idAula, String correoActor, String ip) {
        Bloque actual = bloque(id);
        if (dia == null || inicio == null) {
            throw new ReglaDeNegocioException("Indica el día y la hora a la que quieres mover la clase");
        }
        Duration duracion = Duration.between(LocalTime.parse(actual.horaInicio()), LocalTime.parse(actual.horaFin()));
        LocalTime fin = finSeguro(inicio, duracion);
        DatosBloque datos = new DatosBloque(actual.idCurso(), idAula != null ? idAula : actual.idAula(), dia, inicio, fin);
        return actualizar(id, datos, correoActor, ip);
    }

    @Override
    @Transactional
    public Bloque duplicar(Integer id, DiaSemana dia, LocalTime inicio, String correoActor, String ip) {
        Bloque original = bloque(id);
        LocalTime iniOriginal = LocalTime.parse(original.horaInicio());
        Duration duracion = Duration.between(iniOriginal, LocalTime.parse(original.horaFin()));
        DiaSemana nuevoDia = dia != null ? dia : siguienteDia(DiaSemana.valueOf(original.dia()));
        LocalTime nuevoInicio = inicio != null ? inicio : iniOriginal;
        DatosBloque datos = new DatosBloque(original.idCurso(), original.idAula(), nuevoDia, nuevoInicio,
                finSeguro(nuevoInicio, duracion));
        return crear(datos, correoActor, ip);
    }

    @Override
    @Transactional
    public Bloque cambiarEstado(Integer id, boolean activo, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        Bloque actual = bloque(id);
        if (actual.activo() == activo) {
            return actual;
        }
        if (activo) {
            // Al reactivar, el hueco pudo haberse ocupado mientras estaba inactivo
            DatosBloque datos = new DatosBloque(actual.idCurso(), actual.idAula(), DiaSemana.valueOf(actual.dia()),
                    LocalTime.parse(actual.horaInicio()), LocalTime.parse(actual.horaFin()));
            validarParaGuardar(id, datos, true);
        }
        horarios.guardar(id, actual.idCurso(), actual.idAula(), actual.dia(), LocalTime.parse(actual.horaInicio()),
                LocalTime.parse(actual.horaFin()), activo);
        horarios.registrarBitacora(actor.getId(), activo ? "ACTIVAR" : "DESACTIVAR", String.valueOf(id),
                (activo ? "Horario activado: " : "Horario desactivado: ") + describir(actual), ip);
        return bloque(id);
    }

    @Override
    @Transactional
    public void eliminar(Integer id, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        Bloque actual = bloque(id);
        horarios.eliminar(id);
        horarios.registrarBitacora(actor.getId(), "ELIMINAR", String.valueOf(id), "Horario eliminado: " + describir(actual), ip);
    }

    // ---------------- Reglas ----------------

    /** Reglas que no necesitan la base de datos: día, rango del día, duración y pasos de 15 minutos. */
    private void validarForma(DatosBloque d) {
        if (d == null || d.idCurso() == null || d.idAula() == null || d.dia() == null || d.inicio() == null || d.fin() == null) {
            throw new ReglaDeNegocioException("Completa curso, aula, día, hora de inicio y hora de fin");
        }
        if (!d.fin().isAfter(d.inicio())) {
            throw new ReglaDeNegocioException("La hora de fin debe ser posterior a la de inicio");
        }
        if (d.inicio().isBefore(HorarioGestion.APERTURA) || d.fin().isAfter(HorarioGestion.CIERRE)) {
            throw new ReglaDeNegocioException("Las clases deben estar entre las "
                    + HorarioGestion.APERTURA + " y las " + HorarioGestion.CIERRE);
        }
        if (d.inicio().getMinute() % HorarioGestion.MINUTOS_PASO != 0 || d.fin().getMinute() % HorarioGestion.MINUTOS_PASO != 0
                || d.inicio().getSecond() != 0 || d.fin().getSecond() != 0) {
            throw new ReglaDeNegocioException("Las horas van en pasos de " + HorarioGestion.MINUTOS_PASO + " minutos");
        }
        long minutos = Duration.between(d.inicio(), d.fin()).toMinutes();
        if (minutos < HorarioGestion.DURACION_MINIMA) {
            throw new ReglaDeNegocioException("Una clase dura como mínimo " + HorarioGestion.DURACION_MINIMA + " minutos");
        }
        if (minutos > HorarioGestion.DURACION_MAXIMA) {
            throw new ReglaDeNegocioException("Una clase dura como máximo " + HorarioGestion.DURACION_MAXIMA / 60 + " horas");
        }
    }

    private void validarParaGuardar(Integer idExcluir, DatosBloque d, boolean quedaraActivo) {
        validarForma(d);
        CursoItem curso = curso(d.idCurso());
        AulaItem aula = horarios.buscarAula(d.idAula())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el aula " + d.idAula()));
        if (!curso.activo()) {
            throw new ReglaDeNegocioException("El curso " + curso.nombre() + " está inactivo");
        }
        if (!aula.activo()) {
            throw new ReglaDeNegocioException("El aula " + aula.nombre() + " está inactiva");
        }
        if (!quedaraActivo) {
            return;   // un bloque inactivo no ocupa el aula ni al docente
        }
        List<Choque> choques = horarios.choques(idExcluir, curso.id(), aula.id(), curso.idDocente(), d.dia().name(),
                d.inicio(), d.fin());
        if (!choques.isEmpty()) {
            throw new ReglaDeNegocioException("Choca con: " + choques.stream()
                    .map(c -> c.curso() + " " + c.horaInicio() + "-" + c.horaFin() + " (" + motivo(c.motivo()) + ")")
                    .distinct()
                    .collect(Collectors.joining("; ")));
        }
    }

    private static String motivo(String codigo) {
        return switch (codigo) {
            case "AULA" -> "misma aula";
            case "DOCENTE" -> "mismo docente";
            default -> "mismo curso a la misma hora";
        };
    }

    /** Fin de un bloque movido: si se pasa de la hora de cierre, se informa en lugar de cortar la clase. */
    private static LocalTime finSeguro(LocalTime inicio, Duration duracion) {
        LocalTime fin = inicio.plus(duracion);
        if (fin.isBefore(inicio) || fin.isAfter(HorarioGestion.CIERRE)) {
            throw new ReglaDeNegocioException("La clase terminaría después de las " + HorarioGestion.CIERRE);
        }
        return fin;
    }

    private static DiaSemana siguienteDia(DiaSemana dia) {
        DiaSemana[] dias = DiaSemana.values();
        return dias[(dia.ordinal() + 1) % dias.length];
    }

    private CursoItem curso(Integer idCurso) {
        return horarios.buscarCurso(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso " + idCurso));
    }

    private Bloque bloque(Integer id) {
        return horarios.buscar(id).orElseThrow(() -> new RecursoNoEncontradoException("No existe el horario " + id));
    }

    private Usuario actor(String correo) {
        return usuarios.buscarPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu cuenta"));
    }

    private static String describir(Bloque b) {
        return b.curso() + " " + b.dia() + " " + b.horaInicio() + "-" + b.horaFin() + " " + b.aula();
    }
}
