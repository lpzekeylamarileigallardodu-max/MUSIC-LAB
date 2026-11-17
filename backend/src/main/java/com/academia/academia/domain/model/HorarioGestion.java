package com.academia.academia.domain.model;

import java.time.LocalTime;
import java.util.List;

public final class HorarioGestion {

    private HorarioGestion() {}

    public static final LocalTime APERTURA = LocalTime.of(7, 0);
    public static final LocalTime CIERRE = LocalTime.of(22, 0);
    public static final int MINUTOS_PASO = 15;
    public static final int DURACION_MINIMA = 30;
    public static final int DURACION_MAXIMA = 240;

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

    public record Tablero(List<Bloque> bloques, List<AulaItem> aulas, List<CursoItem> cursos) {}

    public record DatosBloque(Integer idCurso, Integer idAula, DiaSemana dia, LocalTime inicio, LocalTime fin) {}

    public record Choque(Integer idHorario, String curso, String dia, String horaInicio, String horaFin, String motivo) {}
}
