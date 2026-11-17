package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.SolicitudClasePrueba;

public interface ClasePruebaCasosDeUso {

    ClasePruebaRegistrada solicitar(SolicitudClasePrueba solicitud);
}
