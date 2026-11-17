package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.UsuarioAdmin;

import java.util.List;

public interface AdminCasosDeUso {

    ResumenAdmin resumen(boolean incluirFinanzas);

    List<UsuarioAdmin> listarUsuarios();

    UsuarioAdmin cambiarEstadoUsuario(Integer idUsuario, boolean activo, String correoActor, String ip);

    UsuarioAdmin editarUsuario(Integer idUsuario, UsuarioAdmin.Datos datos, String correoActor, String ip);

    void eliminarUsuario(Integer idUsuario, String correoActor, String ip);

    List<ClasePruebaAdmin> listarClasesPrueba();

    ClasePruebaAdmin cambiarEstadoClasePrueba(Integer idClase, String estado, String correoActor, String ip);

    List<CursoAdmin> listarCursos();

    List<PagoPendienteAdmin> listarPagosPendientes();

    List<CuotaVencidaAdmin> listarCuotasVencidas();
}
