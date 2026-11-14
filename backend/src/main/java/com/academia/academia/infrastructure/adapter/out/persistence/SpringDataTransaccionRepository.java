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

public interface SpringDataTransaccionRepository extends JpaRepository<TransaccionJpaEntity, Integer> {

    long countByEstado(String estado);

    boolean existsByNroComprobanteIgnoreCase(String nroComprobante);

    boolean existsByPagoIdAndEstado(Integer idPago, String estado);

    /** Ingresos aprobados entre dos momentos (monto verificado o, si falta, el del pago). */
    @Query("""
            select coalesce(sum(coalesce(t.montoRecibido, p.montoTotal)), 0)
            from TransaccionJpaEntity t join t.pago p
            where t.estado = 'APROBADA'
              and coalesce(t.fechaConfirmacion, t.fechaHora) >= :desde
              and coalesce(t.fechaConfirmacion, t.fechaHora) < :hasta""")
    BigDecimal ingresosEntre(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** Comprobantes por verificar, con todo lo que muestra la pantalla de secretaría. */
    @Query("""
            select t from TransaccionJpaEntity t
            join fetch t.pago p join fetch p.estudiante join fetch p.inscripcion i join fetch i.curso
            left join fetch p.cuota
            where t.estado = 'PENDIENTE' order by t.fechaHora""")
    List<TransaccionJpaEntity> listarPendientes();

    @Query("""
            select t from TransaccionJpaEntity t
            join fetch t.pago p join fetch p.estudiante join fetch p.inscripcion i join fetch i.curso
            left join fetch p.cuota
            where t.id = :id""")
    Optional<TransaccionJpaEntity> buscarCompleta(@Param("id") Integer id);

    @Query("""
            select count(t) from TransaccionJpaEntity t
            where t.pago.estudiante.id = :idEstudiante and t.estado = 'PENDIENTE'""")
    long contarPendientesDeEstudiante(@Param("idEstudiante") Integer idEstudiante);

    /** Ids de las cuotas del estudiante que tienen un comprobante esperando revisión. */
    @Query("""
            select p.cuota.id from TransaccionJpaEntity t join t.pago p
            where p.estudiante.id = :idEstudiante and t.estado = 'PENDIENTE' and p.cuota is not null""")
    List<Integer> cuotasEnRevision(@Param("idEstudiante") Integer idEstudiante);

    /** Historial completo de transacciones (reporte de pagos). */
    @Query("""
            select t from TransaccionJpaEntity t
            join fetch t.pago p join fetch p.estudiante join fetch p.inscripcion i join fetch i.curso
            left join fetch p.cuota left join fetch t.procesadoPor
            order by t.fechaHora desc""")
    List<TransaccionJpaEntity> listarTodas();
}
