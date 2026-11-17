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

public interface DocenteCasosDeUso {

    DocentePanel.Resumen resumen(String correo);

    List<CursoDocente> misCursos(String correo);

    List<AlumnoCurso> alumnos(String correo, Integer idCurso);

    List<AsistenciaAlumno> asistencia(String correo, Integer idCurso, LocalDate fecha);

    Guardado guardarAsistencia(String correo, Integer idCurso, LocalDate fecha,
                               List<EntradaAsistencia> registros, String ip);

    List<EvaluacionDocente> evaluaciones(String correo, Integer idCurso);

    Guardado crearEvaluacion(String correo, Integer idCurso, String nombre, LocalDate fecha, String ip);

    EvaluacionDocente calificar(String correo, Integer idEvaluacion, BigDecimal nota, String comentario, String ip);

    List<MaterialDocente> material(String correo);

    MaterialDocente agregarMaterial(String correo, NuevoMaterial datos, String ip);

    MaterialDocente cambiarEstadoMaterial(String correo, Integer idMaterial, boolean activo, String ip);
}
