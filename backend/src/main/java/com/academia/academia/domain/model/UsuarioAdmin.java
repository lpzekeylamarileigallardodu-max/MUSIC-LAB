package com.academia.academia.domain.model;

import java.time.LocalDateTime;

/** Fila de la lista de usuarios del panel. tipoUsuario: DIRECTOR, SECRETARIA, RECEPCIONISTA, DOCENTE, ESTUDIANTE o INVITADO. */
public record UsuarioAdmin(
        Integer id,
        String nombre,
        String correo,
        String ci,
        String telefono,
        String tipoUsuario,
        boolean activo,
        LocalDateTime fechaRegistro) {
}
