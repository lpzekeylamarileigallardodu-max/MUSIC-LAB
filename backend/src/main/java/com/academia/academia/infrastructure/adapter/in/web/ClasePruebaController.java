package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.SolicitudClasePrueba;
import com.academia.academia.domain.port.in.ClasePruebaCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.ClasePruebaDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.ClasePruebaRespuestaDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Solicitud de clase de prueba. Requiere sesión iniciada. */
@RestController
@RequestMapping("/api/clases-prueba")
public class ClasePruebaController {

    private final ClasePruebaCasosDeUso clasePrueba;

    public ClasePruebaController(ClasePruebaCasosDeUso clasePrueba) {
        this.clasePrueba = clasePrueba;
    }

    @PostMapping
    public ResponseEntity<ClasePruebaRespuestaDto> solicitar(@Valid @RequestBody ClasePruebaDto dto,
                                                             Authentication authentication) {
        // authentication.getName() es el correo de quien tiene la sesión abierta
        ClasePruebaRegistrada registrada = clasePrueba.solicitar(new SolicitudClasePrueba(
                dto.nombres(), dto.apPat(), dto.apMat(), dto.telefono(),
                authentication.getName(), dto.cursoId(), dto.fecha()));

        return ResponseEntity.status(HttpStatus.CREATED).body(new ClasePruebaRespuestaDto(
                registrada.id(),
                registrada.curso(),
                registrada.fecha(),
                "Recibimos tu solicitud de clase de prueba. La academia te contactará para confirmar la hora."));
    }
}
