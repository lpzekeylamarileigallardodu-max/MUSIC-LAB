package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.model.EstudiantePanel;
import com.academia.academia.domain.port.in.EstudianteCasosDeUso;
import com.academia.academia.domain.port.out.EstudianteRepositorioPuerto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EstudianteServiceImpl implements EstudianteCasosDeUso {

    private final EstudianteRepositorioPuerto estudiantes;

    public EstudianteServiceImpl(EstudianteRepositorioPuerto estudiantes) {
        this.estudiantes = estudiantes;
    }

    /** El id sale siempre de la sesión, nunca de la petición: así nadie puede pedir datos ajenos. */
    private Integer idDe(String correo) {
        return estudiantes.buscarIdPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de estudiante"));
    }

    @Override
    public EstudiantePanel.Resumen resumen(String correo) {
        return estudiantes.resumen(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.CursoEstudiante> misCursos(String correo) {
        return estudiantes.cursos(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.CuotaEstudiante> misCuotas(String correo) {
        return estudiantes.cuotas(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.AsistenciaEstudiante> miAsistencia(String correo) {
        return estudiantes.asistencia(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.EvaluacionEstudiante> misEvaluaciones(String correo) {
        return estudiantes.evaluaciones(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.MaterialEstudiante> miMaterial(String correo) {
        return estudiantes.material(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.PrestamoEstudiante> misPrestamos(String correo) {
        return estudiantes.prestamos(idDe(correo));
    }

    @Override
    public List<EstudiantePanel.EventoEstudiante> eventos(String correo) {
        return estudiantes.eventos(idDe(correo));
    }
}
