package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.port.in.HorariosCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.HorarioDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Horarios de los cursos. Requiere sesión iniciada. */
@RestController
@RequestMapping("/api/horarios")
public class HorarioController {

    private final HorariosCasosDeUso horarios;

    public HorarioController(HorariosCasosDeUso horarios) {
        this.horarios = horarios;
    }

    @GetMapping
    public List<HorarioDto> consultar(@RequestParam(required = false) Integer cursoId,
                                      @RequestParam(required = false) DiaSemana dia) {
        return horarios.consultar(cursoId, dia).stream()
                .map(h -> new HorarioDto(
                        h.id(),
                        h.cursoId(),
                        h.curso(),
                        h.docente(),
                        h.aula(),
                        h.dia().name(),
                        h.horaInicio().toString(),
                        h.horaFin().toString()))
                .toList();
    }
}
