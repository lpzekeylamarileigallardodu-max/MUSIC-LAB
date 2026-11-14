package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.TipoUsuario;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class UsuarioRepositorioAdapter implements UsuarioRepositorioPuerto {

    private static final String ROL_INVITADO = "INVITADO";
    private static final String ROL_ESTUDIANTE = "ESTUDIANTE";

    private final SpringDataUsuarioRepository usuarioRepository;
    private final SpringDataAdministrativoRepository administrativoRepository;
    private final SpringDataRolRepository rolRepository;
    private final SpringDataEstudianteRepository estudianteRepository;

    public UsuarioRepositorioAdapter(SpringDataUsuarioRepository usuarioRepository,
                                     SpringDataAdministrativoRepository administrativoRepository,
                                     SpringDataRolRepository rolRepository,
                                     SpringDataEstudianteRepository estudianteRepository) {
        this.usuarioRepository = usuarioRepository;
        this.administrativoRepository = administrativoRepository;
        this.rolRepository = rolRepository;
        this.estudianteRepository = estudianteRepository;
    }

    @Override
    public Optional<Usuario> buscarPorCorreo(String correo) {
        return usuarioRepository.findByCorreoIgnoreCase(correo).map(this::aDominio);
    }

    @Override
    public Optional<Usuario> buscarPorId(Integer id) {
        return usuarioRepository.findById(id).map(this::aDominio);
    }

    @Override
    public boolean existePorCorreo(String correo) {
        return usuarioRepository.existsByCorreoIgnoreCase(correo);
    }

    @Override
    public boolean existePorCi(String ci) {
        return usuarioRepository.existsByCi(ci);
    }

    @Override
    @Transactional
    public Usuario guardarInvitado(Usuario usuario) {
        RolJpaEntity rol = buscarRol(ROL_INVITADO);

        UsuarioJpaEntity entidad = new UsuarioJpaEntity();
        entidad.setRol(rol);
        entidad.setNombreCompleto(usuario.getNombreCompleto());
        entidad.setNombres(usuario.getNombres());
        entidad.setApPat(usuario.getApPat());
        entidad.setApMat(usuario.getApMat());
        entidad.setCi(usuario.getCi());
        entidad.setDireccion(usuario.getDireccion());
        entidad.setCorreo(usuario.getCorreo());
        entidad.setTelefono(usuario.getTelefono());
        entidad.setContrasena(usuario.getPasswordHash());
        entidad.setActivo(true);

        return aDominio(usuarioRepository.saveAndFlush(entidad));
    }

    @Override
    @Transactional
    public Usuario promoverAEstudiante(Integer idUsuario) {
        UsuarioJpaEntity entidad = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalStateException("No existe el usuario " + idUsuario));

        // Primero el rol: el trigger trg_estudiante_rol exige que el usuario ya sea ESTUDIANTE
        entidad.setRol(buscarRol(ROL_ESTUDIANTE));
        usuarioRepository.saveAndFlush(entidad);
        EstudianteJpaEntity estudiante = new EstudianteJpaEntity();
        estudiante.setIdUsuario(entidad.getId());
        estudianteRepository.saveAndFlush(estudiante);

        return aDominio(entidad);
    }

    private RolJpaEntity buscarRol(String nombreRol) {
        return rolRepository.findByNombreRol(nombreRol)
                .orElseThrow(() -> new IllegalStateException(
                        "No existe el rol " + nombreRol + " en la base de datos"));
    }

    private Usuario aDominio(UsuarioJpaEntity e) {
        Usuario u = new Usuario();
        u.setId(e.getId());
        u.setTipoUsuario(resolverTipo(e));
        u.setNombreCompleto(e.getNombreCompleto());
        u.setNombres(e.getNombres());
        u.setApPat(e.getApPat());
        u.setApMat(e.getApMat());
        u.setCi(e.getCi());
        u.setDireccion(e.getDireccion());
        u.setCorreo(e.getCorreo());
        u.setTelefono(e.getTelefono());
        u.setPasswordHash(e.getContrasena());
        u.setActivo(e.getActivo());
        u.setFechaRegistro(e.getFechaRegistro());
        return u;
    }

    /** DOCENTE y ESTUDIANTE vienen del rol; los administrativos se distinguen por su cargo. */
    private TipoUsuario resolverTipo(UsuarioJpaEntity e) {
        String rol = e.getRol().getNombreRol();
        return switch (rol) {
            case "DOCENTE" -> TipoUsuario.DOCENTE;
            case "ESTUDIANTE" -> TipoUsuario.ESTUDIANTE;
            case "INVITADO" -> TipoUsuario.INVITADO;
            case "ADMINISTRATIVO" -> administrativoRepository.findById(e.getId())
                    .map(a -> TipoUsuario.valueOf(a.getCargo()))
                    .orElseThrow(() -> new IllegalStateException(
                            "El usuario " + e.getId() + " es ADMINISTRATIVO pero no tiene cargo"));
            default -> throw new IllegalStateException("Rol desconocido: " + rol);
        };
    }
}
