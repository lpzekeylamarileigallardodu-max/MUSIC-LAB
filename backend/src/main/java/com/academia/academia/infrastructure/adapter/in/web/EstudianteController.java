package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.Gestion;
import com.academia.academia.domain.model.HorarioGestion;
import com.academia.academia.domain.port.in.GestionAcademicaCasosDeUso;
import com.academia.academia.domain.port.in.GestionHorariosCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.GestionDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.academia.academia.domain.model.EstudiantePanel;
import com.academia.academia.domain.port.in.EstudianteCasosDeUso;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estudiante")
public class EstudianteController {

    private final EstudianteCasosDeUso estudiante;
    private final GestionHorariosCasosDeUso horarios;
    private final GestionAcademicaCasosDeUso gestion;

    public EstudianteController(EstudianteCasosDeUso estudiante, GestionHorariosCasosDeUso horarios,
                                GestionAcademicaCasosDeUso gestion) {
        this.estudiante = estudiante;
        this.horarios = horarios;
        this.gestion = gestion;
    }

    @GetMapping("/horario")
    public List<HorarioGestion.Bloque> horario(Authentication auth) {
        return horarios.horarioEstudiante(auth.getName());
    }

    @PostMapping("/cuotas/{idCuota}/comprobante")
    public Gestion.ResultadoPago enviarComprobante(@PathVariable Integer idCuota,
                                                   @Valid @RequestBody GestionDto.ComprobanteDto dto,
                                                   Authentication auth, HttpServletRequest request) {
        return gestion.enviarComprobante(auth.getName(), idCuota,
                new Gestion.Comprobante(dto.metodoPago(), dto.nroComprobante(), dto.urlComprobante()),
                request.getRemoteAddr());
    }

    @GetMapping("/resumen")
    public EstudiantePanel.Resumen resumen(Authentication auth) {
        return estudiante.resumen(auth.getName());
    }

    @GetMapping("/cursos")
    public List<EstudiantePanel.CursoEstudiante> cursos(Authentication auth) {
        return estudiante.misCursos(auth.getName());
    }

    @GetMapping("/cuotas")
    public List<EstudiantePanel.CuotaEstudiante> cuotas(Authentication auth) {
        return estudiante.misCuotas(auth.getName());
    }

    @GetMapping("/asistencia")
    public List<EstudiantePanel.AsistenciaEstudiante> asistencia(Authentication auth) {
        return estudiante.miAsistencia(auth.getName());
    }

    @GetMapping("/evaluaciones")
    public List<EstudiantePanel.EvaluacionEstudiante> evaluaciones(Authentication auth) {
        return estudiante.misEvaluaciones(auth.getName());
    }

    @GetMapping("/material")
    public List<EstudiantePanel.MaterialEstudiante> material(Authentication auth) {
        return estudiante.miMaterial(auth.getName());
    }

    @GetMapping("/prestamos")
    public List<EstudiantePanel.PrestamoEstudiante> prestamos(Authentication auth) {
        return estudiante.misPrestamos(auth.getName());
    }

    @GetMapping("/eventos")
    public List<EstudiantePanel.EventoEstudiante> eventos(Authentication auth) {
        return estudiante.eventos(auth.getName());
    }
}
