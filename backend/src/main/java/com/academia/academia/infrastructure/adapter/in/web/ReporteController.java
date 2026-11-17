package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.port.in.ReportesCasosDeUso;
import com.academia.academia.domain.port.in.ReportesCasosDeUso.Archivo;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
public class ReporteController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final ReportesCasosDeUso reportes;

    public ReporteController(ReportesCasosDeUso reportes) {
        this.reportes = reportes;
    }

    @GetMapping("/api/admin/reportes/{tipo}.xlsx")
    public ResponseEntity<byte[]> admin(@PathVariable String tipo) {
        Archivo archivo = switch (tipo) {
            case "usuarios" -> reportes.usuarios();
            case "cursos" -> reportes.cursos();
            case "horarios" -> reportes.horarios();
            case "cuotas" -> reportes.cuotas();
            case "pagos" -> reportes.pagos();
            default -> throw new RecursoNoEncontradoException("No existe el reporte " + tipo);
        };
        return descarga(archivo);
    }

    @GetMapping("/api/docente/cursos/{idCurso}/reporte.xlsx")
    public ResponseEntity<byte[]> docente(@PathVariable Integer idCurso, Authentication auth) {
        return descarga(reportes.cursoDocente(auth.getName(), idCurso));
    }

    @GetMapping("/api/estudiante/reporte.xlsx")
    public ResponseEntity<byte[]> estudiante(Authentication auth) {
        return descarga(reportes.libretaEstudiante(auth.getName()));
    }

    private static ResponseEntity<byte[]> descarga(Archivo archivo) {
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(archivo.nombre(), StandardCharsets.UTF_8).build().toString())
                .body(archivo.contenido());
    }
}
