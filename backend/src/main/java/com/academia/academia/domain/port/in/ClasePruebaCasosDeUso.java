package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.SolicitudClasePrueba;

public interface ClasePruebaCasosDeUso {

    /** Registra el prospecto y su clase de prueba. Lanza RecursoNoEncontradoException si el curso no está disponible. */
    ClasePruebaRegistrada solicitar(SolicitudClasePrueba solicitud);
}
