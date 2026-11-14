package com.academia.academia.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Cuerpo de POST /api/clases-prueba. */
public record ClasePruebaDto(
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 60, message = "Los nombres son demasiado largos") String nombres,

        @NotBlank(message = "El apellido paterno es obligatorio")
        @Size(max = 40, message = "El apellido paterno es demasiado largo") String apPat,

        @Size(max = 40, message = "El apellido materno es demasiado largo") String apMat,

        @NotBlank(message = "El teléfono es obligatorio")
        @Pattern(regexp = "^[0-9+() -]{6,30}$", message = "El teléfono no es válido") String telefono,

        @NotNull(message = "Elige un curso") Integer cursoId,

        @NotNull(message = "Elige una fecha")
        @FutureOrPresent(message = "La fecha no puede ser anterior a hoy") LocalDate fecha) {
}
