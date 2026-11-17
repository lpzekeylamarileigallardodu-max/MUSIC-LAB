package com.academia.academia.domain.model;

public record NuevoRegistro(
        String nombres,
        String apPat,
        String apMat,
        String ci,
        String direccion,
        String correo,
        String telefono,
        String password) {
}
