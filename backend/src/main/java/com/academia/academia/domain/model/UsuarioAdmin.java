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
        LocalDateTime fechaRegistro,
        String nombres,
        String apPat,
        String apMat,
        String direccion) {

    /** Lo que se puede cambiar desde "Editar usuario" (el tipo y la contraseña no se tocan aquí). */
    public record Datos(String nombres, String apPat, String apMat, String ci, String correo,
                        String telefono, String direccion) {
    }
}
