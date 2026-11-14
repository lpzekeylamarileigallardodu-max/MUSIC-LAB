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

public interface SpringDataEventoRepository extends JpaRepository<EventoJpaEntity, Integer> {

    /** Eventos aprobados o realizados con el lugar y la participación del usuario: [evento, nombreAula, estadoParticipacion]. */
    @Query("""
            select e, a.nombreAula, pe.estado from EventoJpaEntity e
            left join e.aula a
            left join ParticipacionEventoJpaEntity pe on pe.evento = e and pe.usuario.id = :idUsuario
            where e.estado in ('APROBADO', 'REALIZADO')
            order by e.inicio desc""")
    List<Object[]> visiblesPara(@Param("idUsuario") Integer idUsuario);
}
