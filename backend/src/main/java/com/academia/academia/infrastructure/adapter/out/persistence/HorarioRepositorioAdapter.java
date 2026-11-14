package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.DiaSemana;
import com.academia.academia.domain.model.Horario;
import com.academia.academia.domain.port.out.HorarioRepositorioPuerto;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class HorarioRepositorioAdapter implements HorarioRepositorioPuerto {

    private final SpringDataHorarioRepository horarioRepository;

    public HorarioRepositorioAdapter(SpringDataHorarioRepository horarioRepository) {
        this.horarioRepository = horarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Horario> listarActivos() {
        return horarioRepository.listarActivos().stream()
                .map(h -> new Horario(
                        h.getId(),
                        h.getCurso().getId(),
                        h.getCurso().getNombreCurso(),
                        h.getCurso().getDocente().getNombreCompleto(),
                        h.getAula().getNombreAula(),
                        DiaSemana.valueOf(h.getDia()),
                        h.getHoraInicio(),
                        h.getHoraFin()))
                .toList();
    }
}
