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

    @Query("""
            select h from HorarioJpaEntity h
            join fetch h.curso c join fetch c.docente join fetch h.aula
            where h.activo = true and c.activo = true""")
    List<HorarioJpaEntity> listarActivos();

    @Query("select h from HorarioJpaEntity h join fetch h.curso c join fetch c.docente join fetch h.aula")
    List<HorarioJpaEntity> listarTodos();

    @Query("select h from HorarioJpaEntity h join fetch h.curso c join fetch c.docente join fetch h.aula where h.id = :id")
    Optional<HorarioJpaEntity> buscarCompleto(@Param("id") Integer id);

    @Query("select h from HorarioJpaEntity h join fetch h.curso join fetch h.aula where h.activo = true and h.curso.id in :cursos")
    List<HorarioJpaEntity> listarActivosDeCursos(@Param("cursos") Collection<Integer> cursos);

    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso c join fetch h.aula
            where h.activo = true and c.activo = true and c.docente.id = :idDocente""")
    List<HorarioJpaEntity> listarActivosDeDocente(@Param("idDocente") Integer idDocente);

    @Query("""
            select count(h) from HorarioJpaEntity h
            where h.activo = true and h.curso.activo = true and h.curso.docente.id = :idDocente and h.dia = :dia""")
    long contarClasesDelDia(@Param("idDocente") Integer idDocente, @Param("dia") String dia);

    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso
            where h.activo = true and h.aula.id = :idAula and h.dia = :dia
              and h.horaInicio < :fin and h.horaFin > :inicio and h.id <> :excluir""")
    List<HorarioJpaEntity> choquesDeAula(@Param("idAula") Integer idAula, @Param("dia") String dia,
                                         @Param("inicio") java.time.LocalTime inicio,
                                         @Param("fin") java.time.LocalTime fin,
                                         @Param("excluir") Integer excluir);

    @Query("""
            select h from HorarioJpaEntity h join fetch h.curso c
            where h.activo = true and c.docente.id = :idDocente and h.dia = :dia
              and h.horaInicio < :fin and h.horaFin > :inicio and h.id <> :excluir""")
    List<HorarioJpaEntity> choquesDeDocente(@Param("idDocente") Integer idDocente, @Param("dia") String dia,
                                            @Param("inicio") java.time.LocalTime inicio,
                                            @Param("fin") java.time.LocalTime fin,
                                            @Param("excluir") Integer excluir);

    Optional<HorarioJpaEntity> findFirstByCursoIdAndDiaAndHoraInicioAndIdNot(Integer idCurso, String dia,
                                                                             java.time.LocalTime horaInicio, Integer id);
}
