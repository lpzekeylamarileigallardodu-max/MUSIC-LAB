package com.academia.academia.application.service;

import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.port.in.ComprobantesCasosDeUso;
import com.academia.academia.domain.port.out.AlmacenArchivosPuerto;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ComprobantesServiceImpl implements ComprobantesCasosDeUso {

    static final int MAX_BYTES = 5 * 1024 * 1024;

    private final AlmacenArchivosPuerto almacen;

    public ComprobantesServiceImpl(AlmacenArchivosPuerto almacen) {
        this.almacen = almacen;
    }

    @Override
    public String subir(byte[] contenido) {
        if (contenido == null || contenido.length == 0) {
            throw new ReglaDeNegocioException("Elige la foto del comprobante");
        }
        if (contenido.length > MAX_BYTES) {
            throw new ReglaDeNegocioException("La foto pesa más de 5 MB. Toma una captura o redúcela.");
        }

        String extension = extensionDe(contenido);
        if (extension == null) {
            throw new ReglaDeNegocioException("El comprobante debe ser una imagen PNG, JPG o WEBP");
        }
        return RUTA + almacen.guardarComprobante(contenido, extension);
    }

    @Override
    public Optional<Imagen> leer(String nombre) {

        if (nombre == null || !nombre.matches("[0-9a-f-]{36}\\.(png|jpg|webp)")) {
            return Optional.empty();
        }
        String tipo = nombre.endsWith(".png") ? "image/png" : nombre.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return almacen.leerComprobante(nombre).map(b -> new Imagen(b, tipo));
    }

    static String extensionDe(byte[] b) {
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "png";
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        return null;
    }
}
