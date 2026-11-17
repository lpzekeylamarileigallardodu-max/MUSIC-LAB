package com.academia.academia.domain.model;

import java.time.LocalDateTime;

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

    public record Datos(String nombres, String apPat, String apMat, String ci, String correo,
                        String telefono, String direccion) {
    }
}
