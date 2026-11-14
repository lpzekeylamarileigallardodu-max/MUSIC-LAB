package com.academia.academia.application.service;

import com.academia.academia.domain.model.LoginResultado;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.AutenticacionCasosDeUso;
import com.academia.academia.domain.port.out.PasswordHasherPuerto;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AutenticacionServiceImpl implements AutenticacionCasosDeUso {

    // Mismo mensaje si el correo no existe o la contraseña es incorrecta:
    // así no se revela qué correos están registrados.
    private static final String CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos";
    private static final String USUARIO_INACTIVO = "Usuario inactivo. Comunícate con la academia.";

    private final UsuarioRepositorioPuerto usuarioRepositorio;
    private final PasswordHasherPuerto passwordHasher;

    public AutenticacionServiceImpl(UsuarioRepositorioPuerto usuarioRepositorio,
                                    PasswordHasherPuerto passwordHasher) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordHasher = passwordHasher;
    }

    @Override
    public LoginResultado login(String correo, String password) {
        if (correo == null || password == null) {
            return LoginResultado.fallido(CREDENCIALES_INVALIDAS);
        }

        Optional<Usuario> usuarioOpt = usuarioRepositorio.buscarPorCorreo(correo.trim());
        if (usuarioOpt.isEmpty()
                || !passwordHasher.coincide(password, usuarioOpt.get().getPasswordHash())) {
            return LoginResultado.fallido(CREDENCIALES_INVALIDAS);
        }

        Usuario usuario = usuarioOpt.get();
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            return LoginResultado.fallido(USUARIO_INACTIVO);
        }

        return LoginResultado.exitoso(usuario.getTipoUsuario(), usuario.getNombreCompleto());
    }

    @Override
    public Optional<LoginResultado> sesionDe(String correo) {
        return usuarioRepositorio.buscarPorCorreo(correo.trim())
                .filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
                .map(usuario -> LoginResultado.exitoso(usuario.getTipoUsuario(), usuario.getNombreCompleto()));
    }
}
