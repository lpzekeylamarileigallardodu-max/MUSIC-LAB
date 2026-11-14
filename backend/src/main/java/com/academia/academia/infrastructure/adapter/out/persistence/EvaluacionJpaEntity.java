package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "evaluacion")
@Getter
@Setter
public class EvaluacionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evaluacion")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_inscripcion", nullable = false)
    private InscripcionJpaEntity inscripcion;

    @Column(name = "nombre_evaluacion", nullable = false)
    private String nombre;

    @Column(name = "nota")
    private BigDecimal nota;

    @Column(name = "fecha_evaluacion")
    private LocalDate fecha;

    @Column(name = "comentario")
    private String comentario;
}
