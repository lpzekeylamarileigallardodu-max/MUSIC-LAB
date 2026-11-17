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
import java.util.Locale;
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
            return objetivo;
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
    @Transactional
    public UsuarioAdmin editarUsuario(Integer idUsuario, UsuarioAdmin.Datos d, String correoActor, String ip) {
        Usuario actor = actorDe(correoActor);
        UsuarioAdmin antes = admin.buscarUsuario(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));

        String nombres = texto(d.nombres(), "los nombres", 2, 100);
        String apPat = texto(d.apPat(), "el apellido paterno", 2, 50);
        String apMat = opcional(d.apMat(), "El apellido materno", 50);
        String ci = texto(d.ci(), "el CI", 4, 20);
        if (!ci.matches("[0-9A-Za-z-]+")) {
            throw new ReglaDeNegocioException("El CI solo puede tener números, letras y guion");
        }
        String correo = texto(d.correo(), "el correo", 5, 150).toLowerCase(Locale.ROOT);
        if (!correo.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ReglaDeNegocioException("El correo no es válido");
        }
        String telefono = opcional(d.telefono(), "El teléfono", 30);
        if (telefono != null && !telefono.matches("^[0-9+() -]{6,30}$")) {
            throw new ReglaDeNegocioException("El teléfono solo puede tener números, espacios, +, ( ) y guion (mínimo 6)");
        }
        String direccion = opcional(d.direccion(), "La dirección", 200);

        if (admin.correoEnUso(correo, idUsuario)) {
            throw new ReglaDeNegocioException("Ese correo ya lo usa otro usuario");
        }
        if (admin.ciEnUso(ci, idUsuario)) {
            throw new ReglaDeNegocioException("Ese CI ya lo usa otro usuario");
        }

        admin.actualizarDatosUsuario(idUsuario, new UsuarioAdmin.Datos(nombres, apPat, apMat, ci, correo, telefono, direccion));
        admin.registrarBitacora(actor.getId(), "ACTUALIZAR", "usuario", String.valueOf(idUsuario),
                "Datos editados de " + antes.correo() + (antes.correo().equals(correo) ? "" : " (nuevo correo: " + correo + ")"), ip);
        return admin.buscarUsuario(idUsuario).orElse(antes);
    }

    @Override
    @Transactional
    public void eliminarUsuario(Integer idUsuario, String correoActor, String ip) {
        Usuario actor = actorDe(correoActor);
        UsuarioAdmin objetivo = admin.buscarUsuario(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));
        if (actor.getId().equals(idUsuario)) {
            throw new ReglaDeNegocioException("No puedes eliminar tu propia cuenta");
        }
        admin.eliminarUsuario(idUsuario);
        admin.registrarBitacora(actor.getId(), "ELIMINAR", "usuario", String.valueOf(idUsuario),
                "Usuario eliminado: " + objetivo.nombre() + " (" + objetivo.correo() + ")", ip);
    }

    private static String texto(String valor, String campo, int min, int max) {
        String v = valor == null ? "" : valor.trim().replaceAll("\\s+", " ");
        if (v.length() < min || v.length() > max) {
            throw new ReglaDeNegocioException("Escribe " + campo + " (entre " + min + " y " + max + " caracteres)");
        }
        return v;
    }

    private static String opcional(String valor, String campo, int max) {
        if (valor == null || valor.isBlank()) return null;
        String v = valor.trim().replaceAll("\\s+", " ");
        if (v.length() > max) {
            throw new ReglaDeNegocioException(campo + " puede tener hasta " + max + " caracteres");
        }
        return v;
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
