package com.academia.academia.domain.port.out;

public interface NotificadorCorreoPuerto {

    /** Envía el mensaje de bienvenida. Nunca debe hacer fallar el registro si el correo no sale. */
    void enviarBienvenida(String nombre, String correo);
}
