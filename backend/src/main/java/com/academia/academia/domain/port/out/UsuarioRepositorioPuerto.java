package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Usuario;

import java.util.Optional;

public interface UsuarioRepositorioPuerto {

    Optional<Usuario> buscarPorCorreo(String correo);

    Optional<Usuario> buscarPorId(Integer id);

    boolean existePorCorreo(String correo);

    boolean existePorCi(String ci);

    Usuario guardarInvitado(Usuario usuario);

    Usuario promoverAEstudiante(Integer idUsuario);
}
