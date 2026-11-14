package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.Curso;
import com.academia.academia.domain.model.SolicitudClasePrueba;
import com.academia.academia.domain.port.in.ClasePruebaCasosDeUso;
import com.academia.academia.domain.port.out.ClasePruebaRepositorioPuerto;
import com.academia.academia.domain.port.out.CursoRepositorioPuerto;
import org.springframework.stereotype.Service;

@Service
public class ClasePruebaServiceImpl implements ClasePruebaCasosDeUso {

    private final CursoRepositorioPuerto cursoRepositorio;
    private final ClasePruebaRepositorioPuerto clasePruebaRepositorio;

    public ClasePruebaServiceImpl(CursoRepositorioPuerto cursoRepositorio,
                                  ClasePruebaRepositorioPuerto clasePruebaRepositorio) {
        this.cursoRepositorio = cursoRepositorio;
        this.clasePruebaRepositorio = clasePruebaRepositorio;
    }

    @Override
    public ClasePruebaRegistrada solicitar(SolicitudClasePrueba solicitud) {
        Curso curso = cursoRepositorio.buscarActivoPorId(solicitud.cursoId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "El curso elegido no existe o no está disponible"));

        SolicitudClasePrueba limpia = new SolicitudClasePrueba(
                solicitud.nombres().trim(),
                solicitud.apPat().trim(),
                limpiar(solicitud.apMat()),
                solicitud.telefono().trim(),
                solicitud.correo(),
                solicitud.cursoId(),
                solicitud.fecha());

        return clasePruebaRepositorio.guardar(limpia, curso);
    }

    private String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
