package com.academia.academia.domain.model;

import java.time.LocalTime;

public record Horario(
        Integer id,
        Integer cursoId,
        String curso,
        String docente,
        String aula,
        DiaSemana dia,
        LocalTime horaInicio,
        LocalTime horaFin) {
}
