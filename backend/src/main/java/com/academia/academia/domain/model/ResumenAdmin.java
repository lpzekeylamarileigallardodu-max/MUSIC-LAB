package com.academia.academia.domain.model;

import java.math.BigDecimal;

/**
 * Números del panel de inicio. Los campos de dinero son null cuando quien consulta
 * no puede ver finanzas (RECEPCIONISTA).
 */
public record ResumenAdmin(
        int estudiantes,
        int docentes,
        int invitados,
        int cursosActivos,
        int inscripcionesActivas,
        int clasesPruebaProgramadas,
        int prospectosNuevos,
        int prestamosAtrasados,
        Integer pagosPorVerificar,
        Integer cuotasVencidas,
        BigDecimal ingresosMes) {
}
