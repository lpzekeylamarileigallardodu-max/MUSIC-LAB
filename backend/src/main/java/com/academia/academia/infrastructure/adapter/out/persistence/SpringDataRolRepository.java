package com.academia.academia.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataRolRepository extends JpaRepository<RolJpaEntity, Integer> {

    Optional<RolJpaEntity> findByNombreRol(String nombreRol);
}
