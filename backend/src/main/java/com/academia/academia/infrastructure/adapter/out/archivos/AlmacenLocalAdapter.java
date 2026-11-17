package com.academia.academia.infrastructure.adapter.out.archivos;

import com.academia.academia.domain.port.out.AlmacenArchivosPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

@Component
public class AlmacenLocalAdapter implements AlmacenArchivosPuerto {

    private final Path carpeta;
    private final Path carpetaMaterial;

    public AlmacenLocalAdapter(@Value("${academia.archivos.directorio:uploads}") String directorio) {
        this.carpeta = Path.of(directorio, "comprobantes").toAbsolutePath().normalize();
        this.carpetaMaterial = Path.of(directorio, "materiales").toAbsolutePath().normalize();
    }

    @Override
    public String guardarMaterial(byte[] contenido, String extension) {
        return guardar(carpetaMaterial, contenido, extension);
    }

    @Override
    public Optional<byte[]> leerMaterial(String nombre) {
        return leer(carpetaMaterial, nombre);
    }

    @Override
    public String guardarComprobante(byte[] contenido, String extension) {
        return guardar(carpeta, contenido, extension);
    }

    private static String guardar(Path carpeta, byte[] contenido, String extension) {
        String nombre = UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(carpeta);
            Files.write(carpeta.resolve(nombre), contenido);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el comprobante", e);
        }
        return nombre;
    }

    @Override
    public Optional<byte[]> leerComprobante(String nombre) {
        return leer(carpeta, nombre);
    }

    private static Optional<byte[]> leer(Path carpeta, String nombre) {
        Path archivo = carpeta.resolve(nombre).normalize();
        if (!archivo.startsWith(carpeta) || !Files.isRegularFile(archivo)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(archivo));
        } catch (IOException e) {
            return Optional.empty();
        }
    }
}
