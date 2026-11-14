package com.academia.academia.infrastructure.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Cuerpos de las peticiones del panel del docente. */
public final class DocenteDto {

    private DocenteDto() {}

    public record RegistroAsistenciaDto(
            @NotNull(message = "Falta el alumno") Integer idInscripcion,
            @NotBlank(message = "Falta el estado de asistencia") String estado,
            @Size(max = 300, message = "La observación es demasiado larga (máximo 300 caracteres)") String observacion) {}

    public record GuardarAsistenciaDto(
            @NotNull(message = "Indica la fecha de la clase") LocalDate fecha,
            @NotEmpty(message = "No hay alumnos para guardar") @Valid List<RegistroAsistenciaDto> registros) {}

    public record NuevaEvaluacionDto(
            @NotBlank(message = "Escribe el nombre de la evaluación")
            @Size(max = 100, message = "El nombre es demasiado largo (máximo 100 caracteres)") String nombre,
            LocalDate fecha) {}

    public record CalificarDto(
            @DecimalMin(value = "0", message = "La nota debe estar entre 0 y 100")
            @DecimalMax(value = "100", message = "La nota debe estar entre 0 y 100") BigDecimal nota,
            @Size(max = 500, message = "El comentario es demasiado largo (máximo 500 caracteres)") String comentario) {}

    public record NuevoMaterialDto(
            @NotNull(message = "Elige el curso") Integer idCurso,
            @NotBlank(message = "El título es obligatorio")
            @Size(max = 150, message = "El título es demasiado largo (máximo 150 caracteres)") String titulo,
            @Size(max = 1000, message = "La descripción es demasiado larga (máximo 1000 caracteres)") String descripcion,
            @NotBlank(message = "Elige el tipo de material") String tipo,
            @NotBlank(message = "El enlace es obligatorio")
            @Size(max = 500, message = "El enlace es demasiado largo (máximo 500 caracteres)") String url) {}

    public record EstadoMaterialDto(@NotNull(message = "Indica si el material queda publicado o retirado") Boolean activo) {}
}
