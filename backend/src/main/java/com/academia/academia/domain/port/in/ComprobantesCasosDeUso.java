package com.academia.academia.domain.port.in;

import java.util.Optional;

public interface ComprobantesCasosDeUso {

    String RUTA = "/api/archivos/comprobantes/";

    String subir(byte[] contenido);

    Optional<Imagen> leer(String nombre);

    record Imagen(byte[] contenido, String tipo) {
    }
}
