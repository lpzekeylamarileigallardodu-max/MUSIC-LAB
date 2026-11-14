package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.model.TipoUsuario;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.GestionUsuariosCasosDeUso;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;

@Service
public class GestionUsuariosServiceImpl implements GestionUsuariosCasosDeUso {

    private final UsuarioRepositorioPuerto usuarioRepositorio;

    public GestionUsuariosServiceImpl(UsuarioRepositorioPuerto usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    public Usuario promoverAEstudiante(Integer idUsuario) {
        Usuario usuario = usuarioRepositorio.buscarPorId(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));

        if (usuario.getTipoUsuario() != TipoUsuario.INVITADO) {
            throw new ReglaDeNegocioException(
                    "Solo un invitado puede pasar a estudiante (este usuario es " + usuario.getTipoUsuario() + ")");
        }

        return usuarioRepositorio.promoverAEstudiante(idUsuario);
    }
}
