package com.academia.academia.domain.exception;

/** Error de una regla de negocio (el usuario hizo algo que el sistema no permite). */
public class ReglaDeNegocioException extends RuntimeException {

    public ReglaDeNegocioException(String mensaje) {
        super(mensaje);
    }
}
