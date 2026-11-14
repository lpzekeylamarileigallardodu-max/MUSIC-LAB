package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Horario;

import java.util.List;

public interface HorarioRepositorioPuerto {

    /** Horarios activos de cursos activos. */
    List<Horario> listarActivos();
}
