package com.academia.academia.infrastructure.adapter.in.web;

import java.io.Serializable;
import java.security.Principal;

/** Datos del usuario que se guardan en la sesión del servidor. getName() devuelve el correo. */
public record SesionUsuario(String correo, String nombre, String tipoUsuario) implements Principal, Serializable {

    @Override
    public String getName() {
        return correo;
    }
}
