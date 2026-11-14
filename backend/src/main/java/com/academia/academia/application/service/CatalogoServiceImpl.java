package com.academia.academia.application.service;

import com.academia.academia.domain.model.Curso;
import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.Horario;
import com.academia.academia.domain.port.in.CursosCasosDeUso;
import com.academia.academia.domain.port.in.HorariosCasosDeUso;
import com.academia.academia.domain.port.out.CursoRepositorioPuerto;
import com.academia.academia.domain.port.out.HorarioRepositorioPuerto;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class CatalogoServiceImpl implements CursosCasosDeUso, HorariosCasosDeUso {

    private final CursoRepositorioPuerto cursoRepositorio;
    private final HorarioRepositorioPuerto horarioRepositorio;

    public CatalogoServiceImpl(CursoRepositorioPuerto cursoRepositorio,
                               HorarioRepositorioPuerto horarioRepositorio) {
        this.cursoRepositorio = cursoRepositorio;
        this.horarioRepositorio = horarioRepositorio;
    }

    @Override
    public List<Curso> listarActivos() {
        return cursoRepositorio.listarActivos();
    }

    @Override
    public List<Horario> consultar(Integer cursoId, DiaSemana dia) {
        return horarioRepositorio.listarActivos().stream()
                .filter(h -> cursoId == null || h.cursoId().equals(cursoId))
                .filter(h -> dia == null || h.dia() == dia)
                .sorted(Comparator.comparing(Horario::dia)
                        .thenComparing(Horario::horaInicio)
                        .thenComparing(Horario::curso))
                .toList();
    }
}
