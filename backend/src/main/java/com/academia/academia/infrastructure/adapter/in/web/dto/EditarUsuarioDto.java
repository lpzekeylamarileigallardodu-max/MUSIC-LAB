package com.academia.academia.infrastructure.adapter.in.web.dto;

/** Cuerpo de PUT /api/admin/usuarios/{id}. Las reglas (largos, formato, duplicados) se revisan en AdminServiceImpl. */
public record EditarUsuarioDto(String nombres, String apPat, String apMat, String ci, String correo,
                               String telefono, String direccion) {
}
