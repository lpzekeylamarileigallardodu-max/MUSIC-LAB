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

public interface SpringDataEstudianteRepository extends JpaRepository<EstudianteJpaEntity, Integer> {

    @Query("""
            select e.idUsuario from EstudianteJpaEntity e, UsuarioJpaEntity u
            where u.id = e.idUsuario and lower(u.correo) = lower(:correo) and u.activo = true""")
    Optional<Integer> buscarIdActivoPorCorreo(@Param("correo") String correo);
}
