package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.port.in.CursosCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.CursoDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Lista pública de cursos (sirve para llenar los selectores de la página de inicio). */
@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    private final CursosCasosDeUso cursos;

    public CursoController(CursosCasosDeUso cursos) {
        this.cursos = cursos;
    }

    @GetMapping
    public List<CursoDto> listar() {
        return cursos.listarActivos().stream()
                .map(c -> new CursoDto(c.id(), c.nombre()))
                .toList();
    }
}
