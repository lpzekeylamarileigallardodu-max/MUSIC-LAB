package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "aula")
@Getter
@Setter
public class AulaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aula")
    private Integer id;

    @Column(name = "nombre_aula", nullable = false)
    private String nombreAula;

    @Column(name = "capacidad")
    private Integer capacidad;

    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
