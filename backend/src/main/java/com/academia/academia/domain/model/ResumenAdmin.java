package com.academia.academia.domain.model;

import java.math.BigDecimal;

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
