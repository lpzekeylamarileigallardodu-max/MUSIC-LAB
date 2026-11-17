package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.DatosBloque;
import com.academia.academia.domain.model.HorarioGestion.Tablero;
import com.academia.academia.domain.port.in.GestionHorariosCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.BloqueDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.DuplicarDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.EstadoDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.MoverDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto.VerificarDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/horarios")
public class AdminHorarioController {

    private final GestionHorariosCasosDeUso horarios;

    public AdminHorarioController(GestionHorariosCasosDeUso horarios) {
        this.horarios = horarios;
    }

    @GetMapping
    public Tablero tablero() {
        return horarios.tablero();
    }

    @PostMapping("/verificar")
    public List<Choque> verificar(@Valid @RequestBody VerificarDto dto) {
        return horarios.verificar(dto.id(), new DatosBloque(dto.idCurso(), dto.idAula(), dto.dia(), dto.horaInicio(), dto.horaFin()));
    }

    @PostMapping
    public Bloque crear(@Valid @RequestBody BloqueDto dto, Authentication auth, HttpServletRequest req) {
        return horarios.crear(datos(dto), auth.getName(), req.getRemoteAddr());
    }

    @PutMapping("/{id}")
    public Bloque actualizar(@PathVariable Integer id, @Valid @RequestBody BloqueDto dto, Authentication auth,
                             HttpServletRequest req) {
        return horarios.actualizar(id, datos(dto), auth.getName(), req.getRemoteAddr());
    }

    @PatchMapping("/{id}/mover")
    public Bloque mover(@PathVariable Integer id, @Valid @RequestBody MoverDto dto, Authentication auth,
                        HttpServletRequest req) {
        return horarios.mover(id, dto.dia(), dto.horaInicio(), dto.idAula(), auth.getName(), req.getRemoteAddr());
    }

    @PostMapping("/{id}/duplicar")
    public Bloque duplicar(@PathVariable Integer id, @RequestBody(required = false) DuplicarDto dto, Authentication auth,
                           HttpServletRequest req) {
        return horarios.duplicar(id, dto == null ? null : dto.dia(), dto == null ? null : dto.horaInicio(),
                auth.getName(), req.getRemoteAddr());
    }

    @PatchMapping("/{id}/estado")
    public Bloque estado(@PathVariable Integer id, @Valid @RequestBody EstadoDto dto, Authentication auth,
                         HttpServletRequest req) {
        return horarios.cambiarEstado(id, dto.activo(), auth.getName(), req.getRemoteAddr());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id, Authentication auth, HttpServletRequest req) {
        horarios.eliminar(id, auth.getName(), req.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    private static DatosBloque datos(BloqueDto d) {
        return new DatosBloque(d.idCurso(), d.idAula(), d.dia(), d.horaInicio(), d.horaFin());
    }
}
