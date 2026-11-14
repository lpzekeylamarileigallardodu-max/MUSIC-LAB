package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transacción en estado PENDIENTE: espera que secretaría verifique el comprobante.
 * montoCuota es lo que debía pagar (null si el pago no está ligado a una cuota).
 */
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
