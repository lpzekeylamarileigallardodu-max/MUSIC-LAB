package com.academia.academia.domain.port.out;

import java.util.Optional;

/** Dónde se guardan las fotos de los comprobantes de pago (hoy: una carpeta del servidor). */
public interface AlmacenArchivosPuerto {

    /** Guarda los bytes con un nombre nuevo e irrepetible y devuelve ese nombre (ej. "3f2a...c1.jpg"). */
    String guardarComprobante(byte[] contenido, String extension);

    /** Lee un comprobante guardado. Vacío si no existe. */
    Optional<byte[]> leerComprobante(String nombre);

    /** Igual que los comprobantes, pero en la carpeta del material de apoyo. */
    String guardarMaterial(byte[] contenido, String extension);

    Optional<byte[]> leerMaterial(String nombre);
}
