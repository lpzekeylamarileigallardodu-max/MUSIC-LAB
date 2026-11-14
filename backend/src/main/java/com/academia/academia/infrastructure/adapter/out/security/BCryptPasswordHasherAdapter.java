package com.academia.academia.infrastructure.adapter.out.security;

import com.academia.academia.domain.port.out.PasswordHasherPuerto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordHasherAdapter implements PasswordHasherPuerto {

    private final PasswordEncoder passwordEncoder;

    public BCryptPasswordHasherAdapter(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public boolean coincide(String passwordPlano, String hash) {
        return hash != null && passwordEncoder.matches(passwordPlano, hash);
    }

    @Override
    public String encriptar(String passwordPlano) {
        return passwordEncoder.encode(passwordPlano);
    }
}
