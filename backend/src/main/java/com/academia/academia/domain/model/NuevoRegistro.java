package com.academia.academia.domain.model;

/** Datos que llegan desde el formulario de "Crear cuenta" (la persona queda como INVITADO). */
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
