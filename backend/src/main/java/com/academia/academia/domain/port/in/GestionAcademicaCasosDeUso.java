package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.Gestion.Comprobante;
import com.academia.academia.domain.model.Gestion.InscripcionAdmin;
import com.academia.academia.domain.model.Gestion.ResultadoGeneracion;
import com.academia.academia.domain.model.Gestion.ResultadoInscripcion;
import com.academia.academia.domain.model.Gestion.ResultadoPago;
import com.academia.academia.domain.model.Gestion.ResultadoRetiro;
import com.academia.academia.domain.model.Gestion.ResultadoVencimientos;

import java.math.BigDecimal;
import java.util.List;

/**
 * Procesos de la academia que van más allá de un CRUD: inscripción con alta de estudiante y cuotas,
 * retiro con anulación de cuotas, generación de mensualidades, flujo de pago con comprobante
 * (estudiante envía → secretaría aprueba o rechaza) y vencimientos automáticos.
 */
public interface GestionAcademicaCasosDeUso {

    List<InscripcionAdmin> inscripcionesDe(Integer idUsuario);

    /** Inscribe al usuario en el curso. Si es INVITADO lo pasa a ESTUDIANTE y genera la cuota del mes. */
    ResultadoInscripcion inscribir(Integer idUsuario, Integer idCurso, String correoActor, String ip);

    /** Retira la inscripción y anula sus cuotas pendientes que todavía no vencieron. */
    ResultadoRetiro retirar(Integer idInscripcion, String correoActor, String ip);

    /** Crea la cuota del mes para cada inscripción activa que todavía no la tiene. */
    ResultadoGeneracion generarCuotas(int mes, int anio, String correoActor, String ip);

    ResultadoPago aprobarPago(Integer idTransaccion, BigDecimal montoRecibido, String correoActor, String ip);

    ResultadoPago rechazarPago(Integer idTransaccion, String codigoError, String observaciones, String correoActor, String ip);

    /** Secretaría cobra una cuota en ventanilla: queda pagada al instante. */
    ResultadoPago cobrarEnEfectivo(Integer idCuota, BigDecimal montoRecibido, String correoActor, String ip);

    /** El estudiante informa que pagó una cuota (QR o transferencia): queda en revisión. */
    ResultadoPago enviarComprobante(String correoEstudiante, Integer idCuota, Comprobante comprobante, String ip);

    /** Marca cuotas VENCIDA y préstamos ATRASADO según la fecha de hoy (lo llama la tarea programada). */
    ResultadoVencimientos actualizarVencimientos();
}
