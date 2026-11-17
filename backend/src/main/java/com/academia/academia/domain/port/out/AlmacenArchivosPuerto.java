package com.academia.academia.domain.port.out;

import java.util.Optional;

public interface AlmacenArchivosPuerto {

    String guardarComprobante(byte[] contenido, String extension);

    Optional<byte[]> leerComprobante(String nombre);

    String guardarMaterial(byte[] contenido, String extension);

    Optional<byte[]> leerMaterial(String nombre);
}
