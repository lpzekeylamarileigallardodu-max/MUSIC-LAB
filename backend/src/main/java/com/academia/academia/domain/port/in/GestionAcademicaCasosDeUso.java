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

public interface GestionAcademicaCasosDeUso {

    List<InscripcionAdmin> inscripcionesDe(Integer idUsuario);

    ResultadoInscripcion inscribir(Integer idUsuario, Integer idCurso, String correoActor, String ip);

    ResultadoRetiro retirar(Integer idInscripcion, String correoActor, String ip);

    ResultadoGeneracion generarCuotas(int mes, int anio, String correoActor, String ip);

    ResultadoPago aprobarPago(Integer idTransaccion, BigDecimal montoRecibido, String correoActor, String ip);

    ResultadoPago rechazarPago(Integer idTransaccion, String codigoError, String observaciones, String correoActor, String ip);

    ResultadoPago cobrarEnEfectivo(Integer idCuota, BigDecimal montoRecibido, String correoActor, String ip);

    ResultadoPago enviarComprobante(String correoEstudiante, Integer idCuota, Comprobante comprobante, String ip);

    ResultadoVencimientos actualizarVencimientos();
}
