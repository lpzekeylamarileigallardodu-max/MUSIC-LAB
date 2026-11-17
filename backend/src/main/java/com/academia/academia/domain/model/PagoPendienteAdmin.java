package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoPendienteAdmin(
        Integer idTransaccion,
        String estudiante,
        String curso,
        String concepto,
        BigDecimal monto,
        String metodoPago,
        String nroComprobante,
        LocalDateTime fecha,
        String urlComprobante,
        BigDecimal montoCuota) {
}
