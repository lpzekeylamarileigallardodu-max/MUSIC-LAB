package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Fila de la tabla estudiante: su clave es la misma del usuario (no se genera). */
@Entity
@Table(name = "estudiante")
@Getter
@Setter
public class EstudianteJpaEntity {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;
}
