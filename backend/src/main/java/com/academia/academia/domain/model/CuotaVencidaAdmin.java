package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CuotaVencidaAdmin(
        Integer idCuota,
        String estudiante,
        String telefono,
        String curso,
        int mes,
        int anio,
        BigDecimal monto,
        LocalDate fechaVencimiento) {
}
