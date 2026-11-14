package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.DocentePanel;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.AsistenciaAlumno;
import com.academia.academia.domain.model.DocentePanel.CursoDocente;
import com.academia.academia.domain.model.DocentePanel.EntradaAsistencia;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.DocentePanel.Guardado;
import com.academia.academia.domain.model.DocentePanel.MaterialDocente;
import com.academia.academia.domain.model.DocentePanel.NuevoMaterial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Casos de uso del panel del docente. Todos reciben el correo de quien tiene la sesión abierta:
 * un docente solo ve y modifica sus propios cursos. Si pide un curso, evaluación o material que no es
 * suyo, responde "no encontrado" (no revela que existe).
 */
public interface DocenteCasosDeUso {

    DocentePanel.Resumen resumen(String correo);

    List<CursoDocente> misCursos(String correo);

    List<AlumnoCurso> alumnos(String correo, Integer idCurso);

    List<AsistenciaAlumno> asistencia(String correo, Integer idCurso, LocalDate fecha);

    /** Guarda (crea o corrige) la asistencia de un día. No admite fechas futuras. */
    Guardado guardarAsistencia(String correo, Integer idCurso, LocalDate fecha,
                               List<EntradaAsistencia> registros, String ip);

    List<EvaluacionDocente> evaluaciones(String correo, Integer idCurso);

    /** Crea la evaluación para todos los alumnos activos del curso (con la nota vacía). */
    Guardado crearEvaluacion(String correo, Integer idCurso, String nombre, LocalDate fecha, String ip);

    /** nota entre 0 y 100, o null para dejarla sin calificar. */
    EvaluacionDocente calificar(String correo, Integer idEvaluacion, BigDecimal nota, String comentario, String ip);

    List<MaterialDocente> material(String correo);

    MaterialDocente agregarMaterial(String correo, NuevoMaterial datos, String ip);

    MaterialDocente cambiarEstadoMaterial(String correo, Integer idMaterial, boolean activo, String ip);
}
