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

public interface SpringDataUsuarioRepository extends JpaRepository<UsuarioJpaEntity, Integer> {

    Optional<UsuarioJpaEntity> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCi(String ci);

    /** Usuarios activos agrupados por rol: [nombreRol, cantidad]. */
    @Query("select u.rol.nombreRol, count(u) from UsuarioJpaEntity u where u.activo = true group by u.rol.nombreRol")
    List<Object[]> contarActivosPorRol();

    /** Cada usuario con su cargo (null si no es administrativo): [UsuarioJpaEntity, cargo]. */
    @Query("""
            select u, a.cargo from UsuarioJpaEntity u
            left join AdministrativoJpaEntity a on a.idUsuario = u.id
            order by u.nombreCompleto""")
    List<Object[]> listarConCargo();

    @Query("""
            select u, a.cargo from UsuarioJpaEntity u
            left join AdministrativoJpaEntity a on a.idUsuario = u.id
            where u.id = :id""")
    List<Object[]> buscarConCargo(@Param("id") Integer id);
}
