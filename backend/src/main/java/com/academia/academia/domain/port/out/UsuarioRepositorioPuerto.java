package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Usuario;

import java.util.Optional;

public interface UsuarioRepositorioPuerto {

    Optional<Usuario> buscarPorCorreo(String correo);

    Optional<Usuario> buscarPorId(Integer id);

    boolean existePorCorreo(String correo);

    boolean existePorCi(String ci);

    /** Guarda el usuario con rol INVITADO (no crea fila en la tabla estudiante). */
    Usuario guardarInvitado(Usuario usuario);

    /** Cambia el rol INVITADO por ESTUDIANTE y crea su fila en estudiante (una sola transacción). */
    Usuario promoverAEstudiante(Integer idUsuario);
}
