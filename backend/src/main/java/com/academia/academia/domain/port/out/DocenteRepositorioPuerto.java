package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.DocentePanel;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.AsistenciaAlumno;
import com.academia.academia.domain.model.DocentePanel.CursoDocente;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.DocentePanel.MaterialDocente;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface DocenteRepositorioPuerto {

    Optional<Integer> buscarIdPorCorreo(String correo);

    DocentePanel.Resumen resumen(Integer idDocente);

    List<CursoDocente> cursos(Integer idDocente);

    boolean dictaCurso(Integer idDocente, Integer idCurso);

    List<AlumnoCurso> alumnos(Integer idCurso);

    Set<Integer> inscripcionesActivas(Integer idCurso);

    List<AsistenciaAlumno> asistencia(Integer idCurso, LocalDate fecha);

    void guardarAsistencia(Integer idInscripcion, LocalDate fecha, String estado, String observacion);

    List<EvaluacionDocente> evaluaciones(Integer idCurso);

    boolean existeEvaluacion(Integer idCurso, String nombre);

    int crearEvaluacion(Integer idCurso, String nombre, LocalDate fecha);

    Optional<EvaluacionDocente> buscarEvaluacionDeDocente(Integer idDocente, Integer idEvaluacion);

    void actualizarEvaluacion(Integer idEvaluacion, BigDecimal nota, String comentario);

    List<MaterialDocente> material(Integer idDocente);

    Optional<MaterialDocente> buscarMaterialDeDocente(Integer idDocente, Integer idMaterial);

    Integer insertarMaterial(Integer idDocente, Integer idCurso, String titulo, String descripcion,
                             String tipo, String url);

    void actualizarActivoMaterial(Integer idMaterial, boolean activo);

    void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro,
                           String descripcion, String ip);
}
