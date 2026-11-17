package com.academia.academia.infrastructure.adapter.in.web.dto;

import com.academia.academia.domain.model.DiaSemana;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;

public final class GestionDto {

    private GestionDto() {}

    public record BloqueDto(
            @NotNull(message = "Elige el curso") Integer idCurso,
            @NotNull(message = "Elige el aula") Integer idAula,
            @NotNull(message = "Elige el día") DiaSemana dia,
            @NotNull(message = "Indica la hora de inicio") LocalTime horaInicio,
            @NotNull(message = "Indica la hora de fin") LocalTime horaFin) {}

    public record VerificarDto(Integer id,
                               @NotNull Integer idCurso, @NotNull Integer idAula, @NotNull DiaSemana dia,
                               @NotNull LocalTime horaInicio, @NotNull LocalTime horaFin) {}

    public record MoverDto(
            @NotNull(message = "Indica el día") DiaSemana dia,
            @NotNull(message = "Indica la hora") LocalTime horaInicio,
            Integer idAula) {}

    public record DuplicarDto(DiaSemana dia, LocalTime horaInicio) {}

    public record EstadoDto(@NotNull Boolean activo) {}

    public record InscribirDto(
            @NotNull(message = "Elige el estudiante") Integer idUsuario,
            @NotNull(message = "Elige el curso") Integer idCurso) {}

    public record GenerarCuotasDto(
            @NotNull @Min(1) @Max(12) Integer mes,
            @NotNull @Min(2020) @Max(2100) Integer anio) {}

    public record MontoDto(BigDecimal montoRecibido) {}

    public record RechazoDto(
            @NotNull(message = "Elige el motivo del rechazo") String codigoError,
            @Size(max = 500, message = "Las observaciones son demasiado largas") String observaciones) {}

    public record ComprobanteDto(
            @NotNull(message = "Elige el método de pago") String metodoPago,
            @Size(max = 100) String nroComprobante,
            @Size(max = 500) String urlComprobante) {}
}
