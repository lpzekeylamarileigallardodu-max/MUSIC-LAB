package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.Curso;
import com.academia.academia.domain.port.out.CursoRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class CursoRepositorioAdapter implements CursoRepositorioPuerto {

    private final SpringDataCursoRepository cursoRepository;

    public CursoRepositorioAdapter(SpringDataCursoRepository cursoRepository) {
        this.cursoRepository = cursoRepository;
    }

    @Override
    public List<Curso> listarActivos() {
        return cursoRepository.findByActivoTrueOrderByNombreCursoAsc().stream()
                .map(this::aDominio)
                .toList();
    }

    @Override
    public Optional<Curso> buscarActivoPorId(Integer id) {
        return cursoRepository.findByIdAndActivoTrue(id).map(this::aDominio);
    }

    private Curso aDominio(CursoJpaEntity e) {
        return new Curso(e.getId(), e.getNombreCurso());
    }
}
