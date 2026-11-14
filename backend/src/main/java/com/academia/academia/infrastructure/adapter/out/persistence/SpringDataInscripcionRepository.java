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

public interface SpringDataInscripcionRepository extends JpaRepository<InscripcionJpaEntity, Integer> {

    long countByEstado(String estado);

    Optional<InscripcionJpaEntity> findByEstudianteIdAndCursoId(Integer idEstudiante, Integer idCurso);

    /** Inscritos activos por curso: [idCurso, cantidad]. */
    @Query("select i.curso.id, count(i) from InscripcionJpaEntity i where i.estado = 'ACTIVA' group by i.curso.id")
    List<Object[]> contarActivasPorCurso();

    @Query("""
            select count(distinct i.estudiante.id) from InscripcionJpaEntity i
            where i.curso.docente.id = :idDocente and i.curso.activo = true and i.estado = 'ACTIVA'""")
    long contarAlumnosDeDocente(@Param("idDocente") Integer idDocente);

    /** Inscripciones ACTIVA de un curso, con el estudiante cargado y ordenadas por nombre. */
    @Query("""
            select i from InscripcionJpaEntity i join fetch i.estudiante u
            where i.curso.id = :idCurso and i.estado = 'ACTIVA' order by u.nombreCompleto""")
    List<InscripcionJpaEntity> activasDeCurso(@Param("idCurso") Integer idCurso);

    /** Todas las inscripciones de un estudiante, con el curso y su docente cargados. */
    @Query("""
            select i from InscripcionJpaEntity i join fetch i.curso c join fetch c.docente
            where i.estudiante.id = :idEstudiante""")
    List<InscripcionJpaEntity> deEstudiante(@Param("idEstudiante") Integer idEstudiante);

    long countByEstudianteIdAndEstado(Integer idEstudiante, String estado);

    /** Inscripciones activas de cursos activos (para generar las cuotas del mes). */
    @Query("select i from InscripcionJpaEntity i join fetch i.curso c where i.estado = 'ACTIVA' and c.activo = true")
    List<InscripcionJpaEntity> activasDeCursosActivos();

    @Query("""
            select i from InscripcionJpaEntity i join fetch i.estudiante join fetch i.curso c join fetch c.docente
            order by i.curso.nombreCurso, i.estudiante.nombreCompleto""")
    List<InscripcionJpaEntity> listarTodas();
}
