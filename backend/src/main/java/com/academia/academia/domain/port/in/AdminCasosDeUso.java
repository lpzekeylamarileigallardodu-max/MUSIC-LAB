package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.UsuarioAdmin;

import java.util.List;

/** Casos de uso del panel de administración (personal administrativo). */
public interface AdminCasosDeUso {

    /** incluirFinanzas = false oculta pagos, cuotas e ingresos (para RECEPCIONISTA). */
    ResumenAdmin resumen(boolean incluirFinanzas);

    List<UsuarioAdmin> listarUsuarios();

    /**
     * Activa o desactiva un usuario y lo anota en la bitácora.
     * Lanza RecursoNoEncontradoException si no existe y ReglaDeNegocioException si intenta desactivarse a sí mismo.
     */
    UsuarioAdmin cambiarEstadoUsuario(Integer idUsuario, boolean activo, String correoActor, String ip);

    List<ClasePruebaAdmin> listarClasesPrueba();

    /** estado: PROGRAMADA, REALIZADA, CANCELADA o NO_ASISTIO. */
    ClasePruebaAdmin cambiarEstadoClasePrueba(Integer idClase, String estado, String correoActor, String ip);

    List<CursoAdmin> listarCursos();

    List<PagoPendienteAdmin> listarPagosPendientes();

    List<CuotaVencidaAdmin> listarCuotasVencidas();
}
