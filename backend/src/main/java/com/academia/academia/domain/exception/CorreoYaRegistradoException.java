package com.academia.academia.domain.exception;

public class CorreoYaRegistradoException extends ReglaDeNegocioException {

    public CorreoYaRegistradoException() {
        super("Ya existe una cuenta con ese correo");
    }
}
