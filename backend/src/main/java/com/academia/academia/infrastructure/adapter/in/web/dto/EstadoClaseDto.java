package com.academia.academia.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record EstadoClaseDto(@NotBlank(message = "Indica el nuevo estado de la clase") String estado) {
}
