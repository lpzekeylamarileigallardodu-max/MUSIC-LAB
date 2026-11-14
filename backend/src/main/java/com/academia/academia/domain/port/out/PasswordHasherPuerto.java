package com.academia.academia.domain.port.out;

/** Encripta y verifica contraseñas, sin que el dominio conozca el algoritmo. */
public interface PasswordHasherPuerto {

    boolean coincide(String passwordPlano, String hash);

    String encriptar(String passwordPlano);
}
