package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.DatosBloque;
import com.academia.academia.domain.model.HorarioGestion.Tablero;

import java.time.LocalTime;
import java.util.List;

public interface GestionHorariosCasosDeUso {

    Tablero tablero();

    List<Choque> verificar(Integer idExcluir, DatosBloque datos);

    Bloque crear(DatosBloque datos, String correoActor, String ip);

    Bloque actualizar(Integer id, DatosBloque datos, String correoActor, String ip);

    Bloque mover(Integer id, DiaSemana dia, LocalTime inicio, Integer idAula, String correoActor, String ip);

    Bloque duplicar(Integer id, DiaSemana dia, LocalTime inicio, String correoActor, String ip);

    Bloque cambiarEstado(Integer id, boolean activo, String correoActor, String ip);

    void eliminar(Integer id, String correoActor, String ip);

    List<Bloque> horarioDocente(String correo);

    List<Bloque> horarioEstudiante(String correo);
}
