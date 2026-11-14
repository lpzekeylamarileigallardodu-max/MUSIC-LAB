package com.academia.academia.infrastructure.adapter.in.web.dto;

public record LoginRespuestaDto(boolean autenticado, String tipoUsuario, String nombre, String mensaje) {
}
