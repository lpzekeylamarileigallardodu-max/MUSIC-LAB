package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Curso;

import java.util.List;
import java.util.Optional;

public interface CursoRepositorioPuerto {

    List<Curso> listarActivos();

    Optional<Curso> buscarActivoPorId(Integer id);
}
