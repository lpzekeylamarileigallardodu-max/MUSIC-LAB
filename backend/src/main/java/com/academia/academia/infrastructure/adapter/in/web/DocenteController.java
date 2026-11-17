package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.DocentePanel;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.AsistenciaAlumno;
import com.academia.academia.domain.model.DocentePanel.CursoDocente;
import com.academia.academia.domain.model.DocentePanel.EntradaAsistencia;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.DocentePanel.Guardado;
import com.academia.academia.domain.model.DocentePanel.MaterialDocente;
import com.academia.academia.domain.model.DocentePanel.NuevoMaterial;
import com.academia.academia.domain.port.in.DocenteCasosDeUso;
import com.academia.academia.domain.port.in.GestionHorariosCasosDeUso;
import com.academia.academia.domain.model.HorarioGestion;
import com.academia.academia.infrastructure.adapter.in.web.dto.DocenteDto.CalificarDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.DocenteDto.EstadoMaterialDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.DocenteDto.GuardarAsistenciaDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.DocenteDto.NuevaEvaluacionDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.DocenteDto.NuevoMaterialDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/docente")
public class DocenteController {

    private final DocenteCasosDeUso docente;
    private final GestionHorariosCasosDeUso horarios;

    public DocenteController(DocenteCasosDeUso docente, GestionHorariosCasosDeUso horarios) {
        this.docente = docente;
        this.horarios = horarios;
    }

    @GetMapping("/horario")
    public List<HorarioGestion.Bloque> horario(Authentication auth) {
        return horarios.horarioDocente(auth.getName());
    }

    @GetMapping("/resumen")
    public DocentePanel.Resumen resumen(Authentication auth) {
        return docente.resumen(auth.getName());
    }

    @GetMapping("/cursos")
    public List<CursoDocente> cursos(Authentication auth) {
        return docente.misCursos(auth.getName());
    }

    @GetMapping("/cursos/{idCurso}/alumnos")
    public List<AlumnoCurso> alumnos(@PathVariable Integer idCurso, Authentication auth) {
        return docente.alumnos(auth.getName(), idCurso);
    }

    @GetMapping("/cursos/{idCurso}/asistencia")
    public List<AsistenciaAlumno> asistencia(@PathVariable Integer idCurso,
                                             @RequestParam(required = false)
                                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                             Authentication auth) {
        return docente.asistencia(auth.getName(), idCurso, fecha);
    }

    @PostMapping("/cursos/{idCurso}/asistencia")
    public Guardado guardarAsistencia(@PathVariable Integer idCurso,
                                      @Valid @RequestBody GuardarAsistenciaDto dto,
                                      Authentication auth, HttpServletRequest request) {
        List<EntradaAsistencia> registros = dto.registros().stream()
                .map(r -> new EntradaAsistencia(r.idInscripcion(), r.estado(), r.observacion()))
                .toList();
        return docente.guardarAsistencia(auth.getName(), idCurso, dto.fecha(), registros, request.getRemoteAddr());
    }

    @GetMapping("/cursos/{idCurso}/evaluaciones")
    public List<EvaluacionDocente> evaluaciones(@PathVariable Integer idCurso, Authentication auth) {
        return docente.evaluaciones(auth.getName(), idCurso);
    }

    @PostMapping("/cursos/{idCurso}/evaluaciones")
    public Guardado crearEvaluacion(@PathVariable Integer idCurso,
                                    @Valid @RequestBody NuevaEvaluacionDto dto,
                                    Authentication auth, HttpServletRequest request) {
        return docente.crearEvaluacion(auth.getName(), idCurso, dto.nombre(), dto.fecha(), request.getRemoteAddr());
    }

    @PatchMapping("/evaluaciones/{idEvaluacion}")
    public EvaluacionDocente calificar(@PathVariable Integer idEvaluacion,
                                       @Valid @RequestBody CalificarDto dto,
                                       Authentication auth, HttpServletRequest request) {
        return docente.calificar(auth.getName(), idEvaluacion, dto.nota(), dto.comentario(), request.getRemoteAddr());
    }

    @GetMapping("/material")
    public List<MaterialDocente> material(Authentication auth) {
        return docente.material(auth.getName());
    }

    @PostMapping("/material")
    public MaterialDocente agregarMaterial(@Valid @RequestBody NuevoMaterialDto dto,
                                           Authentication auth, HttpServletRequest request) {
        NuevoMaterial datos = new NuevoMaterial(dto.idCurso(), dto.titulo(), dto.descripcion(), dto.tipo(), dto.url());
        return docente.agregarMaterial(auth.getName(), datos, request.getRemoteAddr());
    }

    @PatchMapping("/material/{idMaterial}/estado")
    public MaterialDocente cambiarEstadoMaterial(@PathVariable Integer idMaterial,
                                                 @Valid @RequestBody EstadoMaterialDto dto,
                                                 Authentication auth, HttpServletRequest request) {
        return docente.cambiarEstadoMaterial(auth.getName(), idMaterial, dto.activo(), request.getRemoteAddr());
    }
}
