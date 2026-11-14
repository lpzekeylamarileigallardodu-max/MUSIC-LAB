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

public interface SpringDataDocenteRepository extends JpaRepository<DocenteJpaEntity, Integer> {

    @Query("""
            select d.idUsuario from DocenteJpaEntity d, UsuarioJpaEntity u
            where u.id = d.idUsuario and lower(u.correo) = lower(:correo) and u.activo = true""")
    Optional<Integer> buscarIdActivoPorCorreo(@Param("correo") String correo);

    /** Docentes activos con su nombre: [id, nombreCompleto]. */
    @Query("""
            select u.id, u.nombreCompleto from DocenteJpaEntity d, UsuarioJpaEntity u
            where u.id = d.idUsuario and u.activo = true order by u.nombreCompleto""")
    List<Object[]> listarActivos();
}
