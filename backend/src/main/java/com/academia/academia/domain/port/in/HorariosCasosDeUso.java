package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.Horario;

import java.util.List;

public interface HorariosCasosDeUso {

    /** Horarios activos, ordenados por día y hora. cursoId y dia son filtros opcionales (null = todos). */
    List<Horario> consultar(Integer cursoId, DiaSemana dia);
}
