package com.academia.academia.domain.model;

import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public record SolicitudClasePrueba(
        String nombres,
        String apPat,
        String apMat,
        String telefono,
        String correo,
        Integer cursoId,
        LocalDate fecha) {

    public String nombreCompleto() {
        return Stream.of(nombres, apPat, apMat)
                .filter(parte -> parte != null && !parte.isBlank())
                .collect(Collectors.joining(" "));
    }
}
