package com.academia.academia.infrastructure.adapter.in.web.dto;

public record HorarioDto(
        Integer id,
        Integer cursoId,
        String curso,
        String docente,
        String aula,
        String dia,
        String horaInicio,
        String horaFin) {
}
