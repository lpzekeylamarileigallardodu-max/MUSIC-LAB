package com.academia.academia.domain.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ReportesRepositorioPuerto {

    record CuotaFila(String estudiante, String ci, String telefono, String curso, int mes, int anio,
                     BigDecimal monto, LocalDate vencimiento, String estado) {}

    record PagoFila(LocalDateTime fecha, String estudiante, String curso, String concepto, BigDecimal montoPago,
                    BigDecimal montoRecibido, String metodo, String estado, String nroComprobante,
                    String verificadoPor, LocalDateTime fechaConfirmacion, String codigoError) {}

    record InscripcionFila(String curso, String docente, String estudiante, String correo, String estado,
                           LocalDateTime fecha) {}

    record AsistenciaFila(Integer idInscripcion, String alumno, LocalDate fecha, String estado) {}

    List<CuotaFila> cuotas();

    List<PagoFila> pagos();

    List<InscripcionFila> inscripciones();

    List<AsistenciaFila> asistenciaDeCurso(Integer idCurso);

    String nombreCurso(Integer idCurso);
}
