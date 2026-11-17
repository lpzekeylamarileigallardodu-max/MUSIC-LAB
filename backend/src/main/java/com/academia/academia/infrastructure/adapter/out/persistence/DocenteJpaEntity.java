package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "docente")
@Getter
@Setter
public class DocenteJpaEntity {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;
}
