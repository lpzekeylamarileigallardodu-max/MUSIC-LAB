package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Gestion.CuotaInfo;
import com.academia.academia.domain.model.Gestion.CursoInfo;
import com.academia.academia.domain.model.Gestion.InscripcionAdmin;
import com.academia.academia.domain.model.Gestion.InscripcionInfo;
import com.academia.academia.domain.model.Gestion.TransaccionInfo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GestionAcademicaPuerto {

    Optional<CursoInfo> buscarCurso(Integer idCurso);

    Optional<InscripcionInfo> buscarInscripcion(Integer idInscripcion);

    Optional<InscripcionInfo> buscarInscripcion(Integer idEstudiante, Integer idCurso);

    List<InscripcionInfo> inscripcionesActivasDeCursosActivos();

    List<InscripcionAdmin> inscripcionesDe(Integer idUsuario);

    Integer crearInscripcion(Integer idEstudiante, Integer idCurso);

    void cambiarEstadoInscripcion(Integer idInscripcion, String estado);

    boolean existeCuota(Integer idInscripcion, int mes, int anio);

    Integer crearCuota(Integer idInscripcion, int mes, int anio, BigDecimal monto, LocalDate vencimiento);

    int anularCuotasPendientes(Integer idInscripcion, LocalDate desde);

    Optional<CuotaInfo> buscarCuota(Integer idCuota);

    void cambiarEstadoCuota(Integer idCuota, String estado);

    boolean cuotaEnRevision(Integer idCuota);

    boolean existeComprobante(String nroComprobante);

    Integer registrarTransaccion(Integer idCuota, String metodoPago, String estado, String nroComprobante,
                                 String urlComprobante, BigDecimal montoRecibido, Integer idProcesador);

    Optional<TransaccionInfo> buscarTransaccion(Integer idTransaccion);

    void resolverTransaccion(Integer idTransaccion, String estado, Integer idProcesador, BigDecimal montoRecibido,
                             String codigoError, String observaciones);

    int marcarCuotasVencidas(LocalDate hoy);

    int marcarPrestamosAtrasados(LocalDate hoy);

    void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro, String descripcion, String ip);
}
