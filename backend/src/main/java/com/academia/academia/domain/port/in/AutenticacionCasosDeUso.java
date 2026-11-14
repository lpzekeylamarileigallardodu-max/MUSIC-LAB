package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.LoginResultado;

import java.util.Optional;

public interface AutenticacionCasosDeUso {

    LoginResultado login(String correo, String password);

    /** Datos actuales de quien tiene la sesión abierta (vacío si el usuario ya no existe o está inactivo). */
    Optional<LoginResultado> sesionDe(String correo);
}