package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.util.List;

public record CursoAdmin(
        Integer id,
        String nombre,
        String docente,
        String nivel,
        BigDecimal costoMensual,
        boolean activo,
        int inscritos,
        List<HorarioCurso> horarios) {
}
