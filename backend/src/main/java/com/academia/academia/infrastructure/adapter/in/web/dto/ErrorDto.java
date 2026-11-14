package com.academia.academia.infrastructure.adapter.in.web.dto;

import java.util.Map;

/** Formato único de error para el frontend: siempre trae "mensaje". */
public record ErrorDto(String mensaje, Map<String, String> errores) {

    public static ErrorDto de(String mensaje) {
        return new ErrorDto(mensaje, Map.of());
    }
}
