package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "estudiante")
@Getter
@Setter
public class EstudianteJpaEntity {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;
}
