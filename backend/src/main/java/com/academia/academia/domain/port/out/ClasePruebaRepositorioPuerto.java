package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.Curso;
import com.academia.academia.domain.model.SolicitudClasePrueba;

public interface ClasePruebaRepositorioPuerto {

    ClasePruebaRegistrada guardar(SolicitudClasePrueba solicitud, Curso curso);
}
