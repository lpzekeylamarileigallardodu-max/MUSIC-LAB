package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Fila de la tabla docente: su clave es la misma del usuario. */
@Entity
@Table(name = "docente")
@Getter
@Setter
public class DocenteJpaEntity {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;
}
