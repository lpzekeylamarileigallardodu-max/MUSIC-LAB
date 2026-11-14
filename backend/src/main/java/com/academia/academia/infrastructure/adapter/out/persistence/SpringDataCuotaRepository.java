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

public interface SpringDataCuotaRepository extends JpaRepository<CuotaJpaEntity, Integer> {

    @Query("""
            select count(q) from CuotaJpaEntity q
            where q.estado = 'VENCIDA' or (q.estado = 'PENDIENTE' and q.fechaVencimiento < :hoy)""")
    long contarVencidas(@Param("hoy") LocalDate hoy);

    /** Cuotas vencidas (o pendientes con la fecha pasada) con estudiante y curso cargados. */
    @Query("""
            select q from CuotaJpaEntity q join fetch q.inscripcion i join fetch i.estudiante u join fetch i.curso
            where q.estado = 'VENCIDA' or (q.estado = 'PENDIENTE' and q.fechaVencimiento < :hoy)
            order by q.fechaVencimiento, u.nombreCompleto""")
    List<CuotaJpaEntity> listarVencidas(@Param("hoy") LocalDate hoy);

    @Query("""
            select q from CuotaJpaEntity q join fetch q.inscripcion i join fetch i.curso c
            where i.estudiante.id = :idEstudiante
            order by q.anio desc, q.mes desc, c.nombreCurso""")
    List<CuotaJpaEntity> deEstudiante(@Param("idEstudiante") Integer idEstudiante);

    @Query("""
            select count(q) from CuotaJpaEntity q
            where q.inscripcion.estudiante.id = :idEstudiante and q.estado = 'PENDIENTE' and q.fechaVencimiento >= :hoy""")
    long contarPendientesDeEstudiante(@Param("idEstudiante") Integer idEstudiante, @Param("hoy") LocalDate hoy);

    @Query("""
            select count(q) from CuotaJpaEntity q
            where q.inscripcion.estudiante.id = :idEstudiante
              and (q.estado = 'VENCIDA' or (q.estado = 'PENDIENTE' and q.fechaVencimiento < :hoy))""")
    long contarVencidasDeEstudiante(@Param("idEstudiante") Integer idEstudiante, @Param("hoy") LocalDate hoy);

    @Query("""
            select coalesce(sum(q.monto), 0) from CuotaJpaEntity q
            where q.inscripcion.estudiante.id = :idEstudiante and q.estado in ('PENDIENTE', 'VENCIDA')""")
    BigDecimal montoPorPagar(@Param("idEstudiante") Integer idEstudiante);

    boolean existsByInscripcionIdAndMesAndAnio(Integer idInscripcion, Short mes, Short anio);

    /** Cuotas PENDIENTE cuya fecha ya pasó: la tarea programada las marca como VENCIDA. */
    @Query("select q from CuotaJpaEntity q where q.estado = 'PENDIENTE' and q.fechaVencimiento < :hoy")
    List<CuotaJpaEntity> pendientesVencidas(@Param("hoy") LocalDate hoy);

    List<CuotaJpaEntity> findByInscripcionIdAndEstadoIn(Integer idInscripcion, Collection<String> estados);

    @Query("""
            select q from CuotaJpaEntity q join fetch q.inscripcion i join fetch i.estudiante u join fetch i.curso
            order by q.anio desc, q.mes desc, u.nombreCompleto""")
    List<CuotaJpaEntity> listarTodas();
}
