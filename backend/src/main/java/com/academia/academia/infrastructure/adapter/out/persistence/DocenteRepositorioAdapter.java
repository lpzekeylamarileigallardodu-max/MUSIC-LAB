package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.DocentePanel;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.AsistenciaAlumno;
import com.academia.academia.domain.model.DocentePanel.CursoDocente;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.DocentePanel.HorarioItem;
import com.academia.academia.domain.model.DocentePanel.MaterialDocente;
import com.academia.academia.domain.model.DocentePanel.ProximaClase;
import com.academia.academia.domain.port.out.DocenteRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Consultas y escrituras del panel del docente con JPA (entidades + JPQL, sin SQL nativo).
 * Las operaciones que reciben un id de curso, evaluación o material se llaman solo después de que el servicio
 * comprobó que son del docente de la sesión.
 */
@Component
public class DocenteRepositorioAdapter implements DocenteRepositorioPuerto {

    private final SpringDataDocenteRepository docentes;
    private final SpringDataCursoRepository cursos;
    private final SpringDataHorarioRepository horarios;
    private final SpringDataInscripcionRepository inscripciones;
    private final SpringDataAsistenciaRepository asistencias;
    private final SpringDataEvaluacionRepository evaluaciones;
    private final SpringDataMaterialRepository materiales;
    private final SpringDataUsuarioRepository usuarios;
    private final SpringDataBitacoraRepository bitacora;

    public DocenteRepositorioAdapter(SpringDataDocenteRepository docentes,
                                     SpringDataCursoRepository cursos,
                                     SpringDataHorarioRepository horarios,
                                     SpringDataInscripcionRepository inscripciones,
                                     SpringDataAsistenciaRepository asistencias,
                                     SpringDataEvaluacionRepository evaluaciones,
                                     SpringDataMaterialRepository materiales,
                                     SpringDataUsuarioRepository usuarios,
                                     SpringDataBitacoraRepository bitacora) {
        this.docentes = docentes;
        this.cursos = cursos;
        this.horarios = horarios;
        this.inscripciones = inscripciones;
        this.asistencias = asistencias;
        this.evaluaciones = evaluaciones;
        this.materiales = materiales;
        this.usuarios = usuarios;
        this.bitacora = bitacora;
    }

    @Override
    public Optional<Integer> buscarIdPorCorreo(String correo) {
        return docentes.buscarIdActivoPorCorreo(correo);
    }

    // ---------------- Resumen ----------------

    @Override
    public DocentePanel.Resumen resumen(Integer id) {
        return new DocentePanel.Resumen(
                (int) cursos.countByDocenteIdAndActivoTrue(id),
                (int) inscripciones.contarAlumnosDeDocente(id),
                (int) horarios.contarClasesDelDia(id, Apoyo.diaDeHoy()),
                (int) evaluaciones.contarSinCalificarDeDocente(id),
                Apoyo.porcentajeAsistencia(asistencias.estadosDeDocente(id)),
                proximaClase(id));
    }

    /** La clase más cercana de aquí en adelante, mirando los horarios activos de sus cursos activos. */
    private ProximaClase proximaClase(Integer idDocente) {
        LocalDateTime ahora = LocalDateTime.now();
        return horarios.listarActivosDeDocente(idDocente).stream()
                .min(Comparator.comparing(h -> Apoyo.proximaOcurrencia(h.getDia(), h.getHoraInicio(), ahora)))
                .map(h -> new ProximaClase(h.getCurso().getNombreCurso(), h.getDia(),
                        Apoyo.proximaOcurrencia(h.getDia(), h.getHoraInicio(), ahora).toLocalDate(),
                        Apoyo.hora(h.getHoraInicio()), Apoyo.hora(h.getHoraFin()), h.getAula().getNombreAula()))
                .orElse(null);
    }

    // ---------------- Cursos y alumnos ----------------

    @Override
    public List<CursoDocente> cursos(Integer idDocente) {
        List<CursoJpaEntity> propios = cursos.listarDeDocente(idDocente);
        Map<Integer, List<HorarioItem>> horariosPorCurso = horarios
                .listarActivosDeCursos(propios.stream().map(CursoJpaEntity::getId).toList()).stream()
                .sorted(Apoyo.ORDEN_HORARIO)
                .collect(Collectors.groupingBy(h -> h.getCurso().getId(), Collectors.mapping(
                        h -> new HorarioItem(h.getDia(), Apoyo.hora(h.getHoraInicio()), Apoyo.hora(h.getHoraFin()),
                                h.getAula().getNombreAula()),
                        Collectors.toList())));

        Map<Integer, Integer> inscritos = new HashMap<>();
        for (Object[] fila : inscripciones.contarActivasPorCurso()) {
            inscritos.put((Integer) fila[0], ((Number) fila[1]).intValue());
        }

        return propios.stream()
                .map(c -> new CursoDocente(c.getId(), c.getNombreCurso(), c.getNivel(), Boolean.TRUE.equals(c.getActivo()),
                        inscritos.getOrDefault(c.getId(), 0), horariosPorCurso.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    @Override
    public boolean dictaCurso(Integer idDocente, Integer idCurso) {
        return cursos.existsByIdAndDocenteId(idCurso, idDocente);
    }

    @Override
    public List<AlumnoCurso> alumnos(Integer idCurso) {
        List<InscripcionJpaEntity> activas = inscripciones.activasDeCurso(idCurso);
        List<Integer> ids = activas.stream().map(InscripcionJpaEntity::getId).toList();

        Map<Integer, List<String>> estados = new HashMap<>();
        Map<Integer, List<BigDecimal>> notas = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] f : asistencias.estadosDeInscripciones(ids)) {
                estados.computeIfAbsent((Integer) f[0], k -> new ArrayList<>()).add((String) f[1]);
            }
            for (Object[] f : evaluaciones.notasDeInscripciones(ids)) {
                notas.computeIfAbsent((Integer) f[0], k -> new ArrayList<>()).add((BigDecimal) f[1]);
            }
        }

        return activas.stream()
                .map(i -> new AlumnoCurso(i.getId(), i.getEstudiante().getNombreCompleto(), i.getEstudiante().getCorreo(),
                        Apoyo.porcentajeAsistencia(estados.getOrDefault(i.getId(), List.of())),
                        Apoyo.promedio(notas.get(i.getId()))))
                .toList();
    }

    @Override
    public Set<Integer> inscripcionesActivas(Integer idCurso) {
        return inscripciones.activasDeCurso(idCurso).stream().map(InscripcionJpaEntity::getId).collect(Collectors.toSet());
    }

    // ---------------- Asistencia ----------------

    @Override
    public List<AsistenciaAlumno> asistencia(Integer idCurso, LocalDate fecha) {
        Map<Integer, AsistenciaJpaEntity> delDia = asistencias.deCursoEnFecha(idCurso, fecha).stream()
                .collect(Collectors.toMap(a -> a.getInscripcion().getId(), Function.identity()));
        return inscripciones.activasDeCurso(idCurso).stream()
                .map(i -> {
                    AsistenciaJpaEntity a = delDia.get(i.getId());
                    return new AsistenciaAlumno(i.getId(), i.getEstudiante().getNombreCompleto(),
                            a == null ? null : a.getEstado(), a == null ? null : a.getObservacion());
                })
                .toList();
    }

    /** Si ese alumno ya tiene asistencia ese día se corrige; si no, se crea (no se duplica). */
    @Override
    public void guardarAsistencia(Integer idInscripcion, LocalDate fecha, String estado, String observacion) {
        AsistenciaJpaEntity a = asistencias.findByInscripcionIdAndFecha(idInscripcion, fecha).orElseGet(() -> {
            AsistenciaJpaEntity nueva = new AsistenciaJpaEntity();
            nueva.setInscripcion(inscripciones.getReferenceById(idInscripcion));
            nueva.setFecha(fecha);
            return nueva;
        });
        a.setEstado(estado);
        a.setObservacion(observacion);
        asistencias.save(a);
    }

    // ---------------- Evaluaciones ----------------

    @Override
    public List<EvaluacionDocente> evaluaciones(Integer idCurso) {
        return evaluaciones.deCurso(idCurso).stream()
                .sorted(Comparator.comparing(EvaluacionJpaEntity::getFecha, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(EvaluacionJpaEntity::getNombre)
                        .thenComparing(e -> e.getInscripcion().getEstudiante().getNombreCompleto()))
                .map(this::aEvaluacion)
                .toList();
    }

    @Override
    public boolean existeEvaluacion(Integer idCurso, String nombre) {
        return evaluaciones.contarPorNombreEnCurso(idCurso, nombre) > 0;
    }

    @Override
    public int crearEvaluacion(Integer idCurso, String nombre, LocalDate fecha) {
        List<EvaluacionJpaEntity> nuevas = inscripciones.activasDeCurso(idCurso).stream()
                .map(i -> {
                    EvaluacionJpaEntity e = new EvaluacionJpaEntity();
                    e.setInscripcion(i);
                    e.setNombre(nombre);
                    e.setFecha(fecha);
                    return e;
                })
                .toList();
        evaluaciones.saveAll(nuevas);
        return nuevas.size();
    }

    @Override
    public Optional<EvaluacionDocente> buscarEvaluacionDeDocente(Integer idDocente, Integer idEvaluacion) {
        return evaluaciones.buscarDeDocente(idDocente, idEvaluacion).map(this::aEvaluacion);
    }

    private EvaluacionDocente aEvaluacion(EvaluacionJpaEntity e) {
        return new EvaluacionDocente(e.getId(), e.getInscripcion().getId(),
                e.getInscripcion().getEstudiante().getNombreCompleto(), e.getNombre(), e.getNota(), e.getFecha(),
                e.getComentario());
    }

    @Override
    public void actualizarEvaluacion(Integer idEvaluacion, BigDecimal nota, String comentario) {
        evaluaciones.findById(idEvaluacion).ifPresent(e -> {
            e.setNota(nota);
            e.setComentario(comentario);
            evaluaciones.saveAndFlush(e);
        });
    }

    // ---------------- Material de apoyo ----------------

    @Override
    public List<MaterialDocente> material(Integer idDocente) {
        return materiales.deDocente(idDocente).stream().map(this::aMaterial).toList();
    }

    @Override
    public Optional<MaterialDocente> buscarMaterialDeDocente(Integer idDocente, Integer idMaterial) {
        return materiales.buscarDeDocente(idDocente, idMaterial).map(this::aMaterial);
    }

    private MaterialDocente aMaterial(MaterialApoyoJpaEntity m) {
        return new MaterialDocente(m.getId(), m.getCurso().getId(), m.getCurso().getNombreCurso(), m.getTitulo(),
                m.getDescripcion(), m.getTipo(), m.getUrl(), m.getFechaSubida(), Boolean.TRUE.equals(m.getActivo()));
    }

    @Override
    public Integer insertarMaterial(Integer idDocente, Integer idCurso, String titulo, String descripcion,
                                    String tipo, String url) {
        MaterialApoyoJpaEntity m = new MaterialApoyoJpaEntity();
        m.setCurso(cursos.getReferenceById(idCurso));
        m.setDocente(usuarios.getReferenceById(idDocente));
        m.setTitulo(titulo);
        m.setDescripcion(descripcion);
        m.setTipo(tipo);
        m.setUrl(url);
        m.setFechaSubida(LocalDateTime.now());
        m.setActivo(true);
        return materiales.saveAndFlush(m).getId();
    }

    @Override
    public void actualizarActivoMaterial(Integer idMaterial, boolean activo) {
        materiales.findById(idMaterial).ifPresent(m -> {
            m.setActivo(activo);
            materiales.saveAndFlush(m);
        });
    }

    // ---------------- Bitácora ----------------

    @Override
    public void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro,
                                  String descripcion, String ip) {
        Apoyo.bitacora(bitacora, idUsuario, accion, tabla, idRegistro, descripcion, ip);
    }
}
