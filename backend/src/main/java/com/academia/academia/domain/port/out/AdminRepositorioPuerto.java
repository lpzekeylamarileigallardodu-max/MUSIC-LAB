package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.UsuarioAdmin;

import java.util.List;
import java.util.Optional;

public interface AdminRepositorioPuerto {

    ResumenAdmin resumen(boolean incluirFinanzas);

    List<UsuarioAdmin> listarUsuarios();

    Optional<UsuarioAdmin> buscarUsuario(Integer id);

    void actualizarActivoUsuario(Integer id, boolean activo);

    boolean correoEnUso(String correo, Integer idExcluir);

    boolean ciEnUso(String ci, Integer idExcluir);

    void actualizarDatosUsuario(Integer id, UsuarioAdmin.Datos datos);

    void eliminarUsuario(Integer id);

    List<ClasePruebaAdmin> listarClasesPrueba();

    Optional<ClasePruebaAdmin> buscarClasePrueba(Integer id);

    void actualizarEstadoClasePrueba(Integer id, String estado);

    List<CursoAdmin> listarCursos();

    List<PagoPendienteAdmin> listarPagosPendientes();

    List<CuotaVencidaAdmin> listarCuotasVencidas();

    void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro,
                           String descripcion, String ip);
}
