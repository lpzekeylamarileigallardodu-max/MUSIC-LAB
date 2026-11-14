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

public interface SpringDataMaterialRepository extends JpaRepository<MaterialApoyoJpaEntity, Integer> {

    @Query("""
            select m from MaterialApoyoJpaEntity m join fetch m.curso
            where m.docente.id = :idDocente order by m.activo desc, m.fechaSubida desc""")
    List<MaterialApoyoJpaEntity> deDocente(@Param("idDocente") Integer idDocente);

    @Query("select m from MaterialApoyoJpaEntity m join fetch m.curso where m.id = :id and m.docente.id = :idDocente")
    Optional<MaterialApoyoJpaEntity> buscarDeDocente(@Param("idDocente") Integer idDocente, @Param("id") Integer id);

    /** Material activo de los cursos donde el estudiante tiene una inscripción ACTIVA. */
    @Query("""
            select m from MaterialApoyoJpaEntity m join fetch m.curso c join fetch m.docente
            where m.activo = true and exists (
                select 1 from InscripcionJpaEntity i
                where i.curso = m.curso and i.estudiante.id = :idEstudiante and i.estado = 'ACTIVA')
            order by m.fechaSubida desc""")
    List<MaterialApoyoJpaEntity> paraEstudiante(@Param("idEstudiante") Integer idEstudiante);
}
