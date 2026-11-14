package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.EstudiantePanel;

import java.util.List;

/**
 * Casos de uso del panel del estudiante. Todos reciben el correo de quien tiene la sesión abierta:
 * un estudiante solo puede ver sus propios datos.
 */
public interface EstudianteCasosDeUso {

    EstudiantePanel.Resumen resumen(String correo);

    List<EstudiantePanel.CursoEstudiante> misCursos(String correo);

    List<EstudiantePanel.CuotaEstudiante> misCuotas(String correo);

    List<EstudiantePanel.AsistenciaEstudiante> miAsistencia(String correo);

    List<EstudiantePanel.EvaluacionEstudiante> misEvaluaciones(String correo);

    List<EstudiantePanel.MaterialEstudiante> miMaterial(String correo);

    List<EstudiantePanel.PrestamoEstudiante> misPrestamos(String correo);

    List<EstudiantePanel.EventoEstudiante> eventos(String correo);
}
