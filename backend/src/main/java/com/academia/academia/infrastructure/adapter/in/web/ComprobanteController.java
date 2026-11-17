package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.port.in.ComprobantesCasosDeUso;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
public class ComprobanteController {

    private final ComprobantesCasosDeUso comprobantes;

    public ComprobanteController(ComprobantesCasosDeUso comprobantes) {
        this.comprobantes = comprobantes;
    }

    @PostMapping(value = "/api/estudiante/comprobantes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> subir(@RequestParam("imagen") MultipartFile imagen) throws IOException {
        return Map.of("url", comprobantes.subir(imagen.getBytes()));
    }

    @GetMapping("/api/archivos/comprobantes/{nombre}")
    public ResponseEntity<byte[]> ver(@PathVariable String nombre) {
        return comprobantes.leer(nombre)
                .map(img -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(img.tipo()))
                        .cacheControl(CacheControl.noStore())
                        .body(img.contenido()))
                .orElse(ResponseEntity.notFound().build());
    }
}
