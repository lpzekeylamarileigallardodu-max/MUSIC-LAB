package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.model.UsuarioAdmin;
import com.academia.academia.domain.port.in.AdminCasosDeUso;
import com.academia.academia.domain.port.out.AdminRepositorioPuerto;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AdminServiceImpl implements AdminCasosDeUso {

    private static final Set<String> ESTADOS_CLASE = Set.of("PROGRAMADA", "REALIZADA", "CANCELADA", "NO_ASISTIO");

    private final AdminRepositorioPuerto admin;
    private final UsuarioRepositorioPuerto usuarios;

    public AdminServiceImpl(AdminRepositorioPuerto admin, UsuarioRepositorioPuerto usuarios) {
        this.admin = admin;
        this.usuarios = usuarios;
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenAdmin resumen(boolean incluirFinanzas) {
        return admin.resumen(incluirFinanzas);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioAdmin> listarUsuarios() {
        return admin.listarUsuarios();
    }

    @Override
    @Transactional
    public UsuarioAdmin cambiarEstadoUsuario(Integer idUsuario, boolean activo, String correoActor, String ip) {
        Usuario actor = actorDe(correoActor);
        UsuarioAdmin objetivo = admin.buscarUsuario(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));

        if (!activo && actor.getId().equals(idUsuario)) {
            throw new ReglaDeNegocioException("No puedes desactivar tu propia cuenta");
        }
        if (objetivo.activo() == activo) {
            return objetivo;   // ya estaba así: no hay nada que cambiar
        }

        admin.actualizarActivoUsuario(idUsuario, activo);
        admin.registrarBitacora(
                actor.getId(),
                activo ? "ACTIVAR" : "DESACTIVAR",
                "usuario",
                String.valueOf(idUsuario),
                (activo ? "Usuario activado: " : "Usuario desactivado: ") + objetivo.correo(),
                ip);

        return admin.buscarUsuario(idUsuario).orElse(objetivo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClasePruebaAdmin> listarClasesPrueba() {
        return admin.listarClasesPrueba();
    }

    @Override
    @Transactional
    public ClasePruebaAdmin cambiarEstadoClasePrueba(Integer idClase, String estado, String correoActor, String ip) {
        if (estado == null || !ESTADOS_CLASE.contains(estado)) {
            throw new ReglaDeNegocioException("Estado de clase no válido. Usa: " + String.join(", ", ESTADOS_CLASE));
        }
        Usuario actor = actorDe(correoActor);
        ClasePruebaAdmin clase = admin.buscarClasePrueba(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la clase de prueba " + idClase));

        if (clase.estado().equals(estado)) {
            return clase;
        }

        admin.actualizarEstadoClasePrueba(idClase, estado);
        admin.registrarBitacora(
                actor.getId(),
                "ACTUALIZAR",
                "clase_prueba",
                String.valueOf(idClase),
                "Clase de prueba de " + clase.prospecto() + ": " + clase.estado() + " -> " + estado,
                ip);

        return admin.buscarClasePrueba(idClase).orElse(clase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CursoAdmin> listarCursos() {
        return admin.listarCursos();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoPendienteAdmin> listarPagosPendientes() {
        return admin.listarPagosPendientes();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CuotaVencidaAdmin> listarCuotasVencidas() {
        return admin.listarCuotasVencidas();
    }

    private Usuario actorDe(String correo) {
        return usuarios.buscarPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu cuenta"));
    }
}
