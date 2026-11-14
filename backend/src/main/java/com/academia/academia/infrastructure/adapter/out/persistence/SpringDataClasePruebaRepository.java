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

public interface SpringDataClasePruebaRepository extends JpaRepository<ClasePruebaJpaEntity, Integer> {

    long countByEstadoClase(String estadoClase);

    /** [clase, prospecto, nombreCurso] ordenadas de la más reciente a la más antigua. */
    @Query("""
            select cp, p, c.nombreCurso from ClasePruebaJpaEntity cp
            join ProspectoJpaEntity p on p.id = cp.idProspecto
            join CursoJpaEntity c on c.id = cp.idCurso
            order by cp.fechaHora desc""")
    List<Object[]> listarConDetalle();

    @Query("""
            select cp, p, c.nombreCurso from ClasePruebaJpaEntity cp
            join ProspectoJpaEntity p on p.id = cp.idProspecto
            join CursoJpaEntity c on c.id = cp.idCurso
            where cp.id = :id""")
    List<Object[]> buscarConDetalle(@Param("id") Integer id);
}
