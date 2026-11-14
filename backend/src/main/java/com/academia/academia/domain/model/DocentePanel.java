package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Datos y operaciones del panel del docente. */
public final class DocentePanel {

    private DocentePanel() {}

    // ---------------- Lo que ve el docente ----------------

    /** Próxima clase según los horarios de sus cursos activos. fecha es el día concreto en que ocurre. */
    public record ProximaClase(String curso, String dia, LocalDate fecha, String horaInicio, String horaFin, String aula) {}

    public record Resumen(
            int cursosActivos,
            int alumnosActivos,
            int clasesHoy,
            int evaluacionesSinCalificar,
            Integer asistenciaPorcentaje,   // null si todavía no registró asistencia
            ProximaClase proximaClase) {}   // null si sus cursos no tienen horarios

    public record HorarioItem(String dia, String horaInicio, String horaFin, String aula) {}

    public record CursoDocente(
            Integer idCurso,
            String curso,
            String nivel,
            boolean activo,
            int alumnosActivos,
            List<HorarioItem> horarios) {}

    public record AlumnoCurso(
            Integer idInscripcion,
            String nombre,
            String correo,
            Integer asistenciaPorcentaje,   // null si no tiene clases registradas
            BigDecimal promedio) {}         // null si no tiene notas

    /** Un alumno en la lista de asistencia de un día. estado es null si ese día todavía no se registró. */
    public record AsistenciaAlumno(Integer idInscripcion, String nombre, String estado, String observacion) {}

    public record EvaluacionDocente(
            Integer idEvaluacion,
            Integer idInscripcion,
            String alumno,
            String nombre,
            BigDecimal nota,
            LocalDate fecha,
            String comentario) {}

    public record MaterialDocente(
            Integer id,
            Integer idCurso,
            String curso,
            String titulo,
            String descripcion,
            String tipo,
            String url,
            LocalDateTime fechaSubida,
            boolean activo) {}

    /** Resultado de una operación que guarda varias filas. */
    public record Guardado(int cantidad) {}

    // ---------------- Lo que envía el docente ----------------

    /** estado: PRESENTE, AUSENTE, TARDANZA o LICENCIA. */
    public record EntradaAsistencia(Integer idInscripcion, String estado, String observacion) {}

    /** tipo: PARTITURA, GUIA, AUDIO, VIDEO, ENLACE u OTRO. */
    public record NuevoMaterial(Integer idCurso, String titulo, String descripcion, String tipo, String url) {}
}
