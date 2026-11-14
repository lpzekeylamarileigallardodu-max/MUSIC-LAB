package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "asistencia")
@Getter
@Setter
public class AsistenciaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asistencia")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_inscripcion", nullable = false)
    private InscripcionJpaEntity inscripcion;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "observacion")
    private String observacion;

    /** PRESENTE, AUSENTE, TARDANZA o LICENCIA. */
    @Column(name = "estado_asistencia", nullable = false)
    private String estado;
}
