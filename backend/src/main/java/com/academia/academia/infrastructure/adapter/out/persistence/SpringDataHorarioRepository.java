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

public interface SpringDataHorarioRepository extends JpaRepository<HorarioJpaEntity, Integer> {

    /** Horarios activos de cursos activos (catálogo público). */
    @Query("""
            select h from HorarioJpaEntity h
            join fetch h.curso c join fetch c.docente join fetch h.aula
            where h.activo = true and c.activo = true""")
    List<HorarioJpaEntity> listarActivos();

    /** Todos los horarios (activos e inactivos) para el tablero de administración. */
    @Query("select h from HorarioJpaEntity h join fetch h.curso c join fetch c.docente join fetch h.aula")
    List<HorarioJpaEntity> listarTodos();

    @Query("select h from HorarioJpaEntity h join fetch h.curso c join fetch c.docente join fetch h.aula where h.id = :id")
    Optional<HorarioJpaEntity> buscarCompleto(@Param("id") Integer id);

    /** Horarios activos de los cursos en la lista. */
    @Query("select h from HorarioJpaEntity h join fetch h.curso join fetch h.aula where h.activo = true and h.curso.id in :cursos")
    List<HorarioJpaEntity> listarActivosDeCursos(@Param("cursos") Collection<Integer> cursos);

    /** Horarios activos de los cursos activos de un docente. */
    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso c join fetch h.aula
            where h.activo = true and c.activo = true and c.docente.id = :idDocente""")
    List<HorarioJpaEntity> listarActivosDeDocente(@Param("idDocente") Integer idDocente);

    @Query("""
            select count(h) from HorarioJpaEntity h
            where h.activo = true and h.curso.activo = true and h.curso.docente.id = :idDocente and h.dia = :dia""")
    long contarClasesDelDia(@Param("idDocente") Integer idDocente, @Param("dia") String dia);

    /** Horarios activos que se cruzan con el rango dado en el mismo día y aula. */
    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso
            where h.activo = true and h.aula.id = :idAula and h.dia = :dia
              and h.horaInicio < :fin and h.horaFin > :inicio and h.id <> :excluir""")
    List<HorarioJpaEntity> choquesDeAula(@Param("idAula") Integer idAula, @Param("dia") String dia,
                                         @Param("inicio") java.time.LocalTime inicio,
                                         @Param("fin") java.time.LocalTime fin,
                                         @Param("excluir") Integer excluir);

    /** Horarios activos del mismo docente que se cruzan con el rango dado ese día. */
    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso c
            where h.activo = true and c.docente.id = :idDocente and h.dia = :dia
              and h.horaInicio < :fin and h.horaFin > :inicio and h.id <> :excluir""")
    List<HorarioJpaEntity> choquesDeDocente(@Param("idDocente") Integer idDocente, @Param("dia") String dia,
                                            @Param("inicio") java.time.LocalTime inicio,
                                            @Param("fin") java.time.LocalTime fin,
                                            @Param("excluir") Integer excluir);

    /** Otro horario del mismo curso que empieza a la misma hora ese día (la base lo prohíbe aunque esté inactivo). */
    Optional<HorarioJpaEntity> findFirstByCursoIdAndDiaAndHoraInicioAndIdNot(Integer idCurso, String dia,
                                                                             java.time.LocalTime horaInicio, Integer id);
}
