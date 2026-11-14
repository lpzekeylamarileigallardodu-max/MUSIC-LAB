package com.academia.academia.domain.model;

public record LoginResultado(boolean autenticado, TipoUsuario tipoUsuario, String nombre, String mensaje) {

    public static LoginResultado exitoso(TipoUsuario tipoUsuario, String nombre) {
        return new LoginResultado(true, tipoUsuario, nombre, null);
    }

    public static LoginResultado fallido(String mensaje) {
        return new LoginResultado(false, null, null, mensaje);
    }
}
