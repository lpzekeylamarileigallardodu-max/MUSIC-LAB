package com.academia.academia.application.service;

import com.academia.academia.domain.exception.CiYaRegistradoException;
import com.academia.academia.domain.exception.CorreoYaRegistradoException;
import com.academia.academia.domain.model.NuevoRegistro;
import com.academia.academia.domain.model.TipoUsuario;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.RegistroCasosDeUso;
import com.academia.academia.domain.port.out.NotificadorCorreoPuerto;
import com.academia.academia.domain.port.out.PasswordHasherPuerto;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class RegistroServiceImpl implements RegistroCasosDeUso {

    private final UsuarioRepositorioPuerto usuarioRepositorio;
    private final PasswordHasherPuerto passwordHasher;
    private final NotificadorCorreoPuerto notificador;

    public RegistroServiceImpl(UsuarioRepositorioPuerto usuarioRepositorio,
                               PasswordHasherPuerto passwordHasher,
                               NotificadorCorreoPuerto notificador) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordHasher = passwordHasher;
        this.notificador = notificador;
    }

    @Override
    public Usuario registrarInvitado(NuevoRegistro datos) {
        String correo = datos.correo().trim().toLowerCase(Locale.ROOT);
        String ci = datos.ci().trim();

        if (usuarioRepositorio.existePorCorreo(correo)) {
            throw new CorreoYaRegistradoException();
        }
        if (usuarioRepositorio.existePorCi(ci)) {
            throw new CiYaRegistradoException();
        }

        String nombres = limpiar(datos.nombres());
        String apPat = limpiar(datos.apPat());
        String apMat = limpiar(datos.apMat());

        Usuario usuario = new Usuario();
        usuario.setTipoUsuario(TipoUsuario.INVITADO);
        usuario.setNombres(nombres);
        usuario.setApPat(apPat);
        usuario.setApMat(apMat);
        usuario.setNombreCompleto(
                Stream.of(nombres, apPat, apMat)
                        .filter(parte -> parte != null)
                        .collect(Collectors.joining(" ")));
        usuario.setCi(ci);
        usuario.setDireccion(limpiar(datos.direccion()));
        usuario.setCorreo(correo);
        usuario.setTelefono(limpiar(datos.telefono()));
        usuario.setPasswordHash(passwordHasher.encriptar(datos.password()));
        usuario.setActivo(true);

        Usuario guardado = usuarioRepositorio.guardarInvitado(usuario);

        // Se envía después de guardar; si el correo falla, el registro igual queda hecho
        notificador.enviarBienvenida(guardado.getNombres(), guardado.getCorreo());

        return guardado;
    }

    /** Quita espacios y convierte texto vacío en null (la base acepta NULL, no cadenas vacías en teléfono). */
    private String limpiar(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        return texto.trim();
    }
}
