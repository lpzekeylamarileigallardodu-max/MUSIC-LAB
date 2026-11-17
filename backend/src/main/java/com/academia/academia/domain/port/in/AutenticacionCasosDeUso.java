package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.LoginResultado;

import java.util.Optional;

public interface AutenticacionCasosDeUso {

    LoginResultado login(String correo, String password);

    Optional<LoginResultado> sesionDe(String correo);
}