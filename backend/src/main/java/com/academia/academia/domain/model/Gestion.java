package com.academia.academia.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class Gestion {

    private Gestion() {}

    public static final int DIA_VENCIMIENTO = 20;

    public record CursoInfo(Integer id, String nombre, BigDecimal costoMensual, boolean activo) {}

    public record InscripcionInfo(Integer id, Integer idEstudiante, String estudiante, Integer idCurso, String curso,
                                  BigDecimal costoMensual, String estado) {}

    public record InscripcionAdmin(Integer id, Integer idCurso, String curso, String docente, String estado,
                                   LocalDateTime fecha, int cuotasPorPagar) {}

    public record ResultadoInscripcion(Integer idInscripcion, String estudiante, String curso,
                                       boolean pasoAEstudiante, boolean reactivada, int cuotasGeneradas) {}

    public record ResultadoRetiro(Integer idInscripcion, String estudiante, String curso, int cuotasAnuladas) {}

    public record CuotaInfo(Integer id, Integer idInscripcion, Integer idEstudiante, String estudiante, String curso,
                            int mes, int anio, BigDecimal monto, LocalDate fechaVencimiento, String estado) {}

    public record TransaccionInfo(Integer id, String estado, String metodoPago, String nroComprobante,
                                  Integer idCuota, BigDecimal montoCuota, BigDecimal montoPago,
                                  String estudiante, String curso) {}

    public record ResultadoPago(Integer idTransaccion, String estado, String estudiante, String curso,
                                Integer idCuota, String estadoCuota) {}

    public record ResultadoGeneracion(int mes, int anio, int cuotasCreadas, int yaExistian) {}

    public record ResultadoVencimientos(int cuotasVencidas, int prestamosAtrasados) {}

    public record Comprobante(String metodoPago, String nroComprobante, String urlComprobante) {}
}
