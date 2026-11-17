package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.EstudiantePanel.AsistenciaEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.CuotaEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.CursoEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.EvaluacionEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.EventoEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.HorarioItem;
import com.academia.academia.domain.model.EstudiantePanel.MaterialEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.PrestamoEstudiante;
import com.academia.academia.domain.model.EstudiantePanel.ProximaClase;
import com.academia.academia.domain.model.EstudiantePanel.Resumen;
import com.academia.academia.domain.port.out.EstudianteRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class EstudianteRepositorioAdapter implements EstudianteRepositorioPuerto {

    private final SpringDataEstudianteRepository estudiantes;
    private final SpringDataInscripcionRepository inscripciones;
    private final SpringDataHorarioRepository horarios;
    private final SpringDataCuotaRepository cuotas;
    private final SpringDataTransaccionRepository transacciones;
    private final SpringDataAsistenciaRepository asistencias;
    private final SpringDataEvaluacionRepository evaluaciones;
    private final SpringDataMaterialRepository materiales;
    private final SpringDataPrestamoRepository prestamos;
    private final SpringDataEventoRepository eventos;

    public EstudianteRepositorioAdapter(SpringDataEstudianteRepository estudiantes,
                                        SpringDataInscripcionRepository inscripciones,
                                        SpringDataHorarioRepository horarios,
                                        SpringDataCuotaRepository cuotas,
                                        SpringDataTransaccionRepository transacciones,
                                        SpringDataAsistenciaRepository asistencias,
                                        SpringDataEvaluacionRepository evaluaciones,
                                        SpringDataMaterialRepository materiales,
                                        SpringDataPrestamoRepository prestamos,
                                        SpringDataEventoRepository eventos) {
        this.estudiantes = estudiantes;
        this.inscripciones = inscripciones;
        this.horarios = horarios;
        this.cuotas = cuotas;
        this.transacciones = transacciones;
        this.asistencias = asistencias;
        this.evaluaciones = evaluaciones;
        this.materiales = materiales;
        this.prestamos = prestamos;
        this.eventos = eventos;
    }

    @Override
    public Optional<Integer> buscarIdPorCorreo(String correo) {
        return estudiantes.buscarIdActivoPorCorreo(correo);
    }

    @Override
    public Resumen resumen(Integer id) {
        LocalDate hoy = LocalDate.now();
        Double promedio = evaluaciones.promedioDeEstudiante(id);
        return new Resumen(
                (int) inscripciones.countByEstudianteIdAndEstado(id, "ACTIVA"),
                (int) cuotas.contarPendientesDeEstudiante(id, hoy),
                (int) cuotas.contarVencidasDeEstudiante(id, hoy),
                cuotas.montoPorPagar(id),
                (int) transacciones.contarPendientesDeEstudiante(id),
                Apoyo.porcentajeAsistencia(asistencias.estadosDeEstudiante(id)),
                promedio == null ? null : BigDecimal.valueOf(promedio).setScale(1, RoundingMode.HALF_UP),
                (int) prestamos.contarVigentesDe(id),
                proximaClase(id));
    }

    private ProximaClase proximaClase(Integer id) {
        List<Integer> cursosActivos = inscripciones.deEstudiante(id).stream()
                .filter(i -> "ACTIVA".equals(i.getEstado()) && Boolean.TRUE.equals(i.getCurso().getActivo()))
                .map(i -> i.getCurso().getId())
                .toList();
        if (cursosActivos.isEmpty()) return null;

        LocalDateTime ahora = LocalDateTime.now();
        return horarios.listarActivosDeCursos(cursosActivos).stream()
                .min(Comparator.comparing(h -> Apoyo.proximaOcurrencia(h.getDia(), h.getHoraInicio(), ahora)))
                .map(h -> new ProximaClase(h.getCurso().getNombreCurso(), h.getDia(), Apoyo.hora(h.getHoraInicio()),
                        Apoyo.hora(h.getHoraFin()), h.getAula().getNombreAula()))
                .orElse(null);
    }

    @Override
    public List<CursoEstudiante> cursos(Integer id) {
        List<InscripcionJpaEntity> propias = inscripciones.deEstudiante(id);
        Map<Integer, List<HorarioItem>> horariosPorCurso = propias.isEmpty() ? Map.of() : horarios
                .listarActivosDeCursos(propias.stream().map(i -> i.getCurso().getId()).toList()).stream()
                .sorted(Apoyo.ORDEN_HORARIO)
                .collect(Collectors.groupingBy(h -> h.getCurso().getId(), Collectors.mapping(
                        h -> new HorarioItem(h.getDia(), Apoyo.hora(h.getHoraInicio()), Apoyo.hora(h.getHoraFin()),
                                h.getAula().getNombreAula()),
                        Collectors.toList())));

        return propias.stream()

                .sorted(Comparator.comparing((InscripcionJpaEntity i) -> !"ACTIVA".equals(i.getEstado()))
                        .thenComparing(InscripcionJpaEntity::getFechaInscripcion, Comparator.reverseOrder()))
                .map(i -> {
                    CursoJpaEntity c = i.getCurso();
                    return new CursoEstudiante(i.getId(), c.getId(), c.getNombreCurso(), c.getNivel(),
                            c.getDocente().getNombreCompleto(), i.getEstado(), i.getFechaInscripcion(),
                            c.getCostoMensual(), horariosPorCurso.getOrDefault(c.getId(), List.of()));
                })
                .toList();
    }

    @Override
    public List<CuotaEstudiante> cuotas(Integer id) {
        LocalDate hoy = LocalDate.now();
        Set<Integer> enRevision = new HashSet<>(transacciones.cuotasEnRevision(id));
        return cuotas.deEstudiante(id).stream()
                .map(q -> new CuotaEstudiante(q.getId(), q.getInscripcion().getCurso().getNombreCurso(),
                        q.getMes(), q.getAnio(), q.getMonto(), q.getFechaVencimiento(),

                        "PENDIENTE".equals(q.getEstado()) && q.getFechaVencimiento().isBefore(hoy) ? "VENCIDA" : q.getEstado(),
                        enRevision.contains(q.getId())))
                .toList();
    }

    @Override
    public List<AsistenciaEstudiante> asistencia(Integer id) {
        return asistencias.deEstudiante(id).stream()
                .map(a -> new AsistenciaEstudiante(a.getInscripcion().getCurso().getNombreCurso(), a.getFecha(),
                        a.getEstado(), a.getObservacion()))
                .toList();
    }

    @Override
    public List<EvaluacionEstudiante> evaluaciones(Integer id) {
        return evaluaciones.deEstudiante(id).stream()
                .sorted(Comparator.comparing(EvaluacionJpaEntity::getFecha, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(e -> e.getInscripcion().getCurso().getNombreCurso()))
                .map(e -> new EvaluacionEstudiante(e.getInscripcion().getCurso().getNombreCurso(), e.getNombre(),
                        e.getNota(), e.getFecha(), e.getComentario()))
                .toList();
    }

    @Override
    public List<MaterialEstudiante> material(Integer id) {
        return materiales.paraEstudiante(id).stream()
                .map(m -> new MaterialEstudiante(m.getId(), m.getCurso().getNombreCurso(), m.getTitulo(),
                        m.getDescripcion(), m.getTipo(), m.getUrl(), m.getDocente().getNombreCompleto(),
                        m.getFechaSubida()))
                .toList();
    }

    @Override
    public List<PrestamoEstudiante> prestamos(Integer id) {
        LocalDate hoy = LocalDate.now();
        return prestamos.deUsuario(id).stream()

                .sorted(Comparator.comparing((PrestamoInstrumentoJpaEntity p) ->
                                !("ACTIVO".equals(p.getEstado()) || "ATRASADO".equals(p.getEstado())))
                        .thenComparing(PrestamoInstrumentoJpaEntity::getFechaPrestamo, Comparator.reverseOrder()))
                .map(p -> new PrestamoEstudiante(p.getId(), p.getInstrumento().getNombre(),
                        p.getInstrumento().getCodigoInventario(), p.getFechaPrestamo(), p.getFechaDevolucionPrevista(),
                        p.getFechaDevolucionReal(),
                        "ACTIVO".equals(p.getEstado()) && p.getFechaDevolucionPrevista().isBefore(hoy) ? "ATRASADO" : p.getEstado()))
                .toList();
    }

    @Override
    public List<EventoEstudiante> eventos(Integer id) {
        return eventos.visiblesPara(id).stream()
                .map(f -> {
                    EventoJpaEntity e = (EventoJpaEntity) f[0];
                    String lugar = e.getLugarExterno() != null ? e.getLugarExterno() : (String) f[1];
                    return new EventoEstudiante(e.getId(), e.getNombre(), e.getDescripcion(), e.getTipo(),
                            e.getInicio(), e.getFin(), lugar, e.getEstado(), (String) f[2]);
                })
                .toList();
    }
}
