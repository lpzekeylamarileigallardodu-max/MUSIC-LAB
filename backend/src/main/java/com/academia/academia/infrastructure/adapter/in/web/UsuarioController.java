package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.GestionUsuariosCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.UsuarioRespuestaDto;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Gestión de usuarios. Solo para DIRECTOR y SECRETARIA (ver SecurityConfig). */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final GestionUsuariosCasosDeUso gestionUsuarios;

    public UsuarioController(GestionUsuariosCasosDeUso gestionUsuarios) {
        this.gestionUsuarios = gestionUsuarios;
    }

    /** Pasa a un invitado a estudiante. Más adelante lo llamará la inscripción a un curso. */
    @PostMapping("/{id}/promover-estudiante")
    public UsuarioRespuestaDto promoverAEstudiante(@PathVariable Integer id) {
        Usuario usuario = gestionUsuarios.promoverAEstudiante(id);
        return new UsuarioRespuestaDto(
                usuario.getId(), usuario.getNombreCompleto(), usuario.getCorreo(), usuario.getTipoUsuario().name());
    }
}
