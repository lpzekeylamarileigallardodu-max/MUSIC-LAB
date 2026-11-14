package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.EstudiantePanel;

import java.util.List;
import java.util.Optional;

public interface EstudianteRepositorioPuerto {

    /** id del estudiante (usuario con fila en la tabla estudiante) dueño de ese correo. */
    Optional<Integer> buscarIdPorCorreo(String correo);

    EstudiantePanel.Resumen resumen(Integer idEstudiante);

    List<EstudiantePanel.CursoEstudiante> cursos(Integer idEstudiante);

    List<EstudiantePanel.CuotaEstudiante> cuotas(Integer idEstudiante);

    List<EstudiantePanel.AsistenciaEstudiante> asistencia(Integer idEstudiante);

    List<EstudiantePanel.EvaluacionEstudiante> evaluaciones(Integer idEstudiante);

    List<EstudiantePanel.MaterialEstudiante> material(Integer idEstudiante);

    List<EstudiantePanel.PrestamoEstudiante> prestamos(Integer idEstudiante);

    List<EstudiantePanel.EventoEstudiante> eventos(Integer idEstudiante);
}
