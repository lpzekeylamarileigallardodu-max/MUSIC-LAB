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

public interface SpringDataEvaluacionRepository extends JpaRepository<EvaluacionJpaEntity, Integer> {

    @Query("""
            select count(e) from EvaluacionJpaEntity e
            where e.inscripcion.curso.docente.id = :idDocente and e.inscripcion.curso.activo = true
              and e.inscripcion.estado = 'ACTIVA' and e.nota is null""")
    long contarSinCalificarDeDocente(@Param("idDocente") Integer idDocente);

    @Query("select e.inscripcion.id, e.nota from EvaluacionJpaEntity e where e.inscripcion.id in :inscripciones and e.nota is not null")
    List<Object[]> notasDeInscripciones(@Param("inscripciones") Collection<Integer> inscripciones);

    @Query("""
            select e from EvaluacionJpaEntity e join fetch e.inscripcion i join fetch i.estudiante
            where i.curso.id = :idCurso and i.estado = 'ACTIVA'""")
    List<EvaluacionJpaEntity> deCurso(@Param("idCurso") Integer idCurso);

    @Query("""
            select count(e) from EvaluacionJpaEntity e
            where e.inscripcion.curso.id = :idCurso and lower(e.nombre) = lower(:nombre)""")
    long contarPorNombreEnCurso(@Param("idCurso") Integer idCurso, @Param("nombre") String nombre);

    @Query("""
            select e from EvaluacionJpaEntity e join fetch e.inscripcion i join fetch i.estudiante
            where e.id = :id and i.curso.docente.id = :idDocente""")
    Optional<EvaluacionJpaEntity> buscarDeDocente(@Param("idDocente") Integer idDocente, @Param("id") Integer id);

    @Query("select avg(e.nota) from EvaluacionJpaEntity e where e.inscripcion.estudiante.id = :idEstudiante and e.nota is not null")
    Double promedioDeEstudiante(@Param("idEstudiante") Integer idEstudiante);

    @Query("""
            select e from EvaluacionJpaEntity e join fetch e.inscripcion i join fetch i.curso c
            where i.estudiante.id = :idEstudiante""")
    List<EvaluacionJpaEntity> deEstudiante(@Param("idEstudiante") Integer idEstudiante);
}
