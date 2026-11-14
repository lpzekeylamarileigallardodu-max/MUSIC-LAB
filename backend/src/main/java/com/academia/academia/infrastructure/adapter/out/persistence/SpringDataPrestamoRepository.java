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

public interface SpringDataPrestamoRepository extends JpaRepository<PrestamoInstrumentoJpaEntity, Integer> {

    @Query("""
            select count(p) from PrestamoInstrumentoJpaEntity p
            where p.estado = 'ATRASADO' or (p.estado = 'ACTIVO' and p.fechaDevolucionPrevista < :hoy)""")
    long contarAtrasados(@Param("hoy") LocalDate hoy);

    @Query("""
            select count(p) from PrestamoInstrumentoJpaEntity p
            where p.prestatario.id = :idUsuario and p.estado in ('ACTIVO', 'ATRASADO')""")
    long contarVigentesDe(@Param("idUsuario") Integer idUsuario);

    @Query("select p from PrestamoInstrumentoJpaEntity p join fetch p.instrumento where p.prestatario.id = :idUsuario")
    List<PrestamoInstrumentoJpaEntity> deUsuario(@Param("idUsuario") Integer idUsuario);

    /** Préstamos ACTIVO con la fecha de devolución pasada: la tarea programada los marca ATRASADO. */
    @Query("select p from PrestamoInstrumentoJpaEntity p where p.estado = 'ACTIVO' and p.fechaDevolucionPrevista < :hoy")
    List<PrestamoInstrumentoJpaEntity> activosVencidos(@Param("hoy") LocalDate hoy);
}
