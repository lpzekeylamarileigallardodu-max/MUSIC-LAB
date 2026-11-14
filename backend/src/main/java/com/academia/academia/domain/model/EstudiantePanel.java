package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Datos que ve un estudiante en su panel. Todos son de solo lectura. */
public final class EstudiantePanel {

    private EstudiantePanel() {}

    /** Próxima clase de la semana según los horarios de sus cursos activos. */
    public record ProximaClase(String curso, String dia, String horaInicio, String horaFin, String aula) {}

    public record Resumen(
            int cursosActivos,
            int cuotasPendientes,
            int cuotasVencidas,
            BigDecimal montoPorPagar,
            int comprobantesEnRevision,
            Integer asistenciaPorcentaje,   // null si todavía no tiene clases registradas
            BigDecimal promedioNotas,       // null si todavía no tiene notas
            int prestamosActivos,
            ProximaClase proximaClase) {}   // null si no tiene horarios

    public record HorarioItem(String dia, String horaInicio, String horaFin, String aula) {}

    public record CursoEstudiante(
            Integer idInscripcion,
            Integer idCurso,
            String curso,
            String nivel,
            String docente,
            String estadoInscripcion,
            LocalDateTime fechaInscripcion,
            BigDecimal costoMensual,
            List<HorarioItem> horarios) {}

    public record CuotaEstudiante(
            Integer idCuota,
            String curso,
            int mes,
            int anio,
            BigDecimal monto,
            LocalDate fechaVencimiento,
            /** PENDIENTE, VENCIDA, PAGADA o ANULADA (una PENDIENTE con fecha pasada se informa como VENCIDA). */
            String estado,
            /** true si ya envió un comprobante y la secretaría todavía no lo revisó. */
            boolean comprobanteEnRevision) {}

    public record AsistenciaEstudiante(String curso, LocalDate fecha, String estado, String observacion) {}

    public record EvaluacionEstudiante(String curso, String nombre, BigDecimal nota, LocalDate fecha, String comentario) {}

    public record MaterialEstudiante(
            Integer id,
            String curso,
            String titulo,
            String descripcion,
            String tipo,
            String url,
            String docente,
            LocalDateTime fechaSubida) {}

    public record PrestamoEstudiante(
            Integer id,
            String instrumento,
            String codigo,
            LocalDateTime fechaPrestamo,
            LocalDate fechaDevolucionPrevista,
            LocalDateTime fechaDevolucionReal,
            /** ACTIVO, ATRASADO, DEVUELTO o PERDIDO (un ACTIVO con fecha pasada se informa como ATRASADO). */
            String estado) {}

    public record EventoEstudiante(
            Integer id,
            String nombre,
            String descripcion,
            String tipo,
            LocalDateTime inicio,
            LocalDateTime fin,
            String lugar,
            String estado,
            /** null si el estudiante no participa en este evento. */
            String miParticipacion) {}
}
