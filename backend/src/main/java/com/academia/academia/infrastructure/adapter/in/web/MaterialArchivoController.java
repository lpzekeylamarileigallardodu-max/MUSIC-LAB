package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.port.out.AlmacenArchivosPuerto;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
public class MaterialArchivoController {

    public static final String RUTA = "/api/archivos/materiales/";
    private static final long MAX_BYTES = 20L * 1024 * 1024;
    private static final Set<String> PERMITIDAS = Set.of(
            "pdf", "png", "jpg", "jpeg", "webp", "mp3", "wav", "ogg", "mp4",
            "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "zip", "mid", "midi", "mscz");

    private final AlmacenArchivosPuerto almacen;

    public MaterialArchivoController(AlmacenArchivosPuerto almacen) {
        this.almacen = almacen;
    }

    @PostMapping(value = "/api/docente/materiales/archivo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> subir(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            throw new ReglaDeNegocioException("Elige un archivo");
        }
        if (archivo.getSize() > MAX_BYTES) {
            throw new ReglaDeNegocioException("El archivo pesa más de 20 MB");
        }
        String extension = extensionDe(archivo.getOriginalFilename());
        if (extension == null) {
            throw new ReglaDeNegocioException("Tipo de archivo no permitido. Usa PDF, imagen, audio, video, Word, PowerPoint, Excel o ZIP");
        }
        return Map.of("url", RUTA + almacen.guardarMaterial(archivo.getBytes(), extension),
                "nombre", archivo.getOriginalFilename() == null ? "archivo" : archivo.getOriginalFilename());
    }

    @GetMapping("/api/archivos/materiales/{nombre}")
    public ResponseEntity<byte[]> ver(@PathVariable String nombre) {

        if (!nombre.matches("[0-9a-f-]{36}\\.[a-z0-9]{2,5}")) {
            return ResponseEntity.notFound().build();
        }
        MediaType tipo = MediaTypeFactory.getMediaType(nombre).orElse(MediaType.APPLICATION_OCTET_STREAM);
        boolean enNavegador = tipo.getType().equals("image") || tipo.getType().equals("audio")
                || tipo.getType().equals("video") || tipo.equals(MediaType.APPLICATION_PDF);
        return almacen.leerMaterial(nombre)
                .map(b -> ResponseEntity.ok()
                        .contentType(tipo)
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                (enNavegador ? ContentDisposition.inline() : ContentDisposition.attachment())
                                        .filename(nombre).build().toString())
                        .body(b))
                .orElse(ResponseEntity.notFound().build());
    }

    private static String extensionDe(String nombre) {
        if (nombre == null || !nombre.contains(".")) return null;
        String ext = nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return PERMITIDAS.contains(ext) ? ext : null;
    }
}
