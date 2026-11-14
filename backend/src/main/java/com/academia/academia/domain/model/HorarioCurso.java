package com.academia.academia.domain.model;

/** Un bloque de horario de un curso. dia: LUNES, MARTES, MIERCOLES... Las horas van como "HH:mm". */
public record HorarioCurso(String dia, String horaInicio, String horaFin, String aula) {
}
