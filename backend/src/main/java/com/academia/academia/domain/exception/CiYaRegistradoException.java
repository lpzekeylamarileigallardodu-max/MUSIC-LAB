package com.academia.academia.domain.exception;

public class CiYaRegistradoException extends ReglaDeNegocioException {

    public CiYaRegistradoException() {
        super("Ya existe una cuenta con ese CI");
    }
}
