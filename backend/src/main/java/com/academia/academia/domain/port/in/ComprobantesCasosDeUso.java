package com.academia.academia.domain.port.in;

import java.util.Optional;

/** Subida y lectura de la foto del comprobante de pago. */
public interface ComprobantesCasosDeUso {

    /** Prefijo de la URL con la que se ve una foto guardada. */
    String RUTA = "/api/archivos/comprobantes/";

    /**
     * Revisa que sea una imagen PNG, JPG o WEBP de hasta 5 MB, la guarda y devuelve su URL
     * (RUTA + nombre). Lanza ReglaDeNegocioException si no es una imagen válida.
     */
    String subir(byte[] contenido);

    /** Imagen guardada con su tipo (image/png, image/jpeg o image/webp). */
    Optional<Imagen> leer(String nombre);

    record Imagen(byte[] contenido, String tipo) {
    }
}
