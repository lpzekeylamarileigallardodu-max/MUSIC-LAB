package com.academia.academia.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SpringDataAsistenciaRepository extends JpaRepository<AsistenciaJpaEntity, Integer> {

    Optional<AsistenciaJpaEntity> findByInscripcionIdAndFecha(Integer idInscripcion, LocalDate fecha);

    /** Estados de asistencia de todos los cursos de un docente. */
    @Query("select a.estado from AsistenciaJpaEntity a where a.inscripcion.curso.docente.id = :idDocente")
    List<String> estadosDeDocente(@Param("idDocente") Integer idDocente);

    @Query("select a.estado from AsistenciaJpaEntity a where a.inscripcion.estudiante.id = :idEstudiante")
    List<String> estadosDeEstudiante(@Param("idEstudiante") Integer idEstudiante);

    /** [idInscripcion, estado] de las inscripciones dadas. */
    @Query("select a.inscripcion.id, a.estado from AsistenciaJpaEntity a where a.inscripcion.id in :inscripciones")
    List<Object[]> estadosDeInscripciones(@Param("inscripciones") Collection<Integer> inscripciones);

    @Query("select a from AsistenciaJpaEntity a where a.inscripcion.curso.id = :idCurso and a.fecha = :fecha")
    List<AsistenciaJpaEntity> deCursoEnFecha(@Param("idCurso") Integer idCurso, @Param("fecha") LocalDate fecha);

    @Query("""
            select a from AsistenciaJpaEntity a join fetch a.inscripcion i join fetch i.curso c
            where i.estudiante.id = :idEstudiante order by a.fecha desc, c.nombreCurso""")
    List<AsistenciaJpaEntity> deEstudiante(@Param("idEstudiante") Integer idEstudiante);

    @Query("""
            select a from AsistenciaJpaEntity a join fetch a.inscripcion i join fetch i.estudiante
            where i.curso.id = :idCurso and i.estado = 'ACTIVA' order by a.fecha""")
    List<AsistenciaJpaEntity> deCurso(@Param("idCurso") Integer idCurso);
}
