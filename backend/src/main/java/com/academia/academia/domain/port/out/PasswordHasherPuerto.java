package com.academia.academia.domain.port.out;

public interface PasswordHasherPuerto {

    boolean coincide(String passwordPlano, String hash);

    String encriptar(String passwordPlano);
}
