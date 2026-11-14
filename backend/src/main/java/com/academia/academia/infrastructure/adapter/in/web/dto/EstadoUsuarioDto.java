package com.academia.academia.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoUsuarioDto(@NotNull(message = "Indica si el usuario queda activo o inactivo") Boolean activo) {
}
