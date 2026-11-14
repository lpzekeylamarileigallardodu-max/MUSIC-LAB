package com.academia.academia.domain.model;

import java.time.LocalTime;
import java.util.List;

/** Tablero de horarios: bloques semanales que se crean, mueven, redimensionan, duplican y eliminan. */
public final class HorarioGestion {

    private HorarioGestion() {}

    /** Límites del día académico y del tamaño de un bloque. */
    public static final LocalTime APERTURA = LocalTime.of(7, 0);
    public static final LocalTime CIERRE = LocalTime.of(22, 0);
    public static final int MINUTOS_PASO = 15;
    public static final int DURACION_MINIMA = 30;
    public static final int DURACION_MAXIMA = 240;

    /** Un bloque del tablero (un horario semanal de un curso en un aula). */
    public record Bloque(
            Integer id,
            Integer idCurso,
            String curso,
            Integer idDocente,
            String docente,
            Integer idAula,
            String aula,
            String dia,
            String horaInicio,
            String horaFin,
            boolean activo,
            boolean cursoActivo) {}

    public record AulaItem(Integer id, String nombre, Integer capacidad, boolean activo) {}

    public record CursoItem(Integer id, String nombre, Integer idDocente, String docente, boolean activo) {}

    /** Todo lo que necesita la pantalla del tablero en una sola respuesta. */
    public record Tablero(List<Bloque> bloques, List<AulaItem> aulas, List<CursoItem> cursos) {}

    /** Datos para crear o cambiar un bloque. */
    public record DatosBloque(Integer idCurso, Integer idAula, DiaSemana dia, LocalTime inicio, LocalTime fin) {}

    /** Otro bloque que se cruza con el que se quiere guardar. motivo: AULA, DOCENTE o MISMO_CURSO. */
    public record Choque(Integer idHorario, String curso, String dia, String horaInicio, String horaFin, String motivo) {}
}
