package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.Gestion.InscripcionAdmin;
import com.academia.academia.domain.model.Gestion.ResultadoGeneracion;
import com.academia.academia.domain.model.Gestion.ResultadoInscripcion;
import com.academia.academia.domain.model.Gestion.ResultadoPago;
import com.academia.academia.domain.model.Gestion.ResultadoRetiro;
import com.academia.academia.domain.model.Gestion.ResultadoVencimientos;
import com.academia.academia.domain.port.in.GestionAcademicaCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.GenerarCuotasDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.InscribirDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.MontoDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.RechazoDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminGestionController {

    private final GestionAcademicaCasosDeUso gestion;

    public AdminGestionController(GestionAcademicaCasosDeUso gestion) {
        this.gestion = gestion;
    }

    @GetMapping("/usuarios/{id}/inscripciones")
    public List<InscripcionAdmin> inscripciones(@PathVariable Integer id) {
        return gestion.inscripcionesDe(id);
    }

    @PostMapping("/inscripciones")
    public ResultadoInscripcion inscribir(@Valid @RequestBody InscribirDto dto, Authentication auth, HttpServletRequest req) {
        return gestion.inscribir(dto.idUsuario(), dto.idCurso(), auth.getName(), req.getRemoteAddr());
    }

    @PatchMapping("/inscripciones/{id}/retirar")
    public ResultadoRetiro retirar(@PathVariable Integer id, Authentication auth, HttpServletRequest req) {
        return gestion.retirar(id, auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/cuotas/generar")
    public ResultadoGeneracion generar(@Valid @RequestBody GenerarCuotasDto dto, Authentication auth, HttpServletRequest req) {
        return gestion.generarCuotas(dto.mes(), dto.anio(), auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/cuotas/{id}/cobrar")
    public ResultadoPago cobrar(@PathVariable Integer id, @RequestBody(required = false) MontoDto dto,
                                Authentication auth, HttpServletRequest req) {
        return gestion.cobrarEnEfectivo(id, dto == null ? null : dto.montoRecibido(), auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/pagos/{idTransaccion}/aprobar")
    public ResultadoPago aprobar(@PathVariable Integer idTransaccion, @RequestBody(required = false) MontoDto dto,
                                 Authentication auth, HttpServletRequest req) {
        return gestion.aprobarPago(idTransaccion, dto == null ? null : dto.montoRecibido(), auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/pagos/{idTransaccion}/rechazar")
    public ResultadoPago rechazar(@PathVariable Integer idTransaccion, @Valid @RequestBody RechazoDto dto,
                                  Authentication auth, HttpServletRequest req) {
        return gestion.rechazarPago(idTransaccion, dto.codigoError(), dto.observaciones(), auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/vencimientos/actualizar")
    public ResultadoVencimientos vencimientos() {
        return gestion.actualizarVencimientos();
    }
}
