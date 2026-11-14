package com.academia.academia.infrastructure.adapter.in.web.dto;

import java.time.LocalDate;

public record ClasePruebaRespuestaDto(Integer id, String curso, LocalDate fecha, String mensaje) {
}
