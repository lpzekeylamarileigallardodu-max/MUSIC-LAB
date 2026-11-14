package com.academia.academia.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cuerpo de POST /api/auth/register. Los límites coinciden con las columnas de la tabla usuario. */
public record RegistroDto(
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 60, message = "Los nombres son demasiado largos") String nombres,

        @NotBlank(message = "El apellido paterno es obligatorio")
        @Size(max = 40, message = "El apellido paterno es demasiado largo") String apPat,

        @Size(max = 40, message = "El apellido materno es demasiado largo") String apMat,

        @NotBlank(message = "El CI es obligatorio")
        @Size(max = 20, message = "El CI es demasiado largo") String ci,

        @Size(max = 200, message = "La dirección es demasiado larga") String direccion,

        @NotBlank(message = "El correo es obligatorio")
        @Size(max = 150, message = "El correo es demasiado largo")
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                 message = "El correo no es válido") String correo,

        @Pattern(regexp = "^$|^[0-9+() -]{6,30}$",
                 message = "El teléfono no es válido") String telefono,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 64, message = "La contraseña debe tener entre 8 y 64 caracteres") String password) {
}
