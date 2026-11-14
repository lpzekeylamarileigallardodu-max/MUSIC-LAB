package com.academia.academia.domain.model;

import java.time.LocalDateTime;

public record ClasePruebaAdmin(
        Integer id,
        String prospecto,
        String telefono,
        String correo,
        String curso,
        LocalDateTime fechaHora,
        String estado,
        String observaciones) {
}
