package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class DocentePanel {

    private DocentePanel() {}

    public record ProximaClase(String curso, String dia, LocalDate fecha, String horaInicio, String horaFin, String aula) {}

    public record Resumen(
            int cursosActivos,
            int alumnosActivos,
            int clasesHoy,
            int evaluacionesSinCalificar,
            Integer asistenciaPorcentaje,
            ProximaClase proximaClase) {}

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
            Integer asistenciaPorcentaje,
            BigDecimal promedio) {}

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

    public record Guardado(int cantidad) {}

    public record EntradaAsistencia(Integer idInscripcion, String estado, String observacion) {}

    public record NuevoMaterial(Integer idCurso, String titulo, String descripcion, String tipo, String url) {}
}
