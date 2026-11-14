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

public interface SpringDataCursoRepository extends JpaRepository<CursoJpaEntity, Integer> {

    List<CursoJpaEntity> findByActivoTrueOrderByNombreCursoAsc();

    Optional<CursoJpaEntity> findByIdAndActivoTrue(Integer id);

    long countByActivoTrue();

    long countByDocenteIdAndActivoTrue(Integer idDocente);

    boolean existsByIdAndDocenteId(Integer idCurso, Integer idDocente);

    @Query("select c from CursoJpaEntity c join fetch c.docente order by c.activo desc, c.nombreCurso")
    List<CursoJpaEntity> listarConDocente();

    @Query("select c from CursoJpaEntity c where c.docente.id = :idDocente order by c.activo desc, c.nombreCurso")
    List<CursoJpaEntity> listarDeDocente(@Param("idDocente") Integer idDocente);
}
