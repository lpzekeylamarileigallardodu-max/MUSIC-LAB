package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.DatosBloque;
import com.academia.academia.domain.model.HorarioGestion.Tablero;

import java.time.LocalTime;
import java.util.List;

/**
 * Tablero de horarios del personal administrativo. Cada operación valida las reglas
 * (rango del día, duración, choques de aula y de docente) y queda anotada en la bitácora.
 */
public interface GestionHorariosCasosDeUso {

    Tablero tablero();

    /** Revisa sin guardar si un bloque chocaría con otros. idExcluir: el propio bloque cuando se edita (o null). */
    List<Choque> verificar(Integer idExcluir, DatosBloque datos);

    Bloque crear(DatosBloque datos, String correoActor, String ip);

    /** Cambia curso, aula, día y horas (editar o redimensionar). */
    Bloque actualizar(Integer id, DatosBloque datos, String correoActor, String ip);

    /** Arrastrar el bloque: otro día u hora, misma duración. idAula opcional para cambiar de aula. */
    Bloque mover(Integer id, DiaSemana dia, LocalTime inicio, Integer idAula, String correoActor, String ip);

    /** Copia el bloque a otro día/hora (misma duración, curso y aula). */
    Bloque duplicar(Integer id, DiaSemana dia, LocalTime inicio, String correoActor, String ip);

    /** Desactivar lo saca del horario sin borrarlo; activar vuelve a comprobar choques. */
    Bloque cambiarEstado(Integer id, boolean activo, String correoActor, String ip);

    void eliminar(Integer id, String correoActor, String ip);

    /** Horario semanal del docente de la sesión. */
    List<Bloque> horarioDocente(String correo);

    /** Horario semanal del estudiante de la sesión (sus inscripciones activas). */
    List<Bloque> horarioEstudiante(String correo);
}
