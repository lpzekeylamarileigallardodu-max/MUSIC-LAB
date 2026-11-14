package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prestamo_instrumento")
@Getter
@Setter
public class PrestamoInstrumentoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prestamo")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_instrumento", nullable = false)
    private InstrumentoJpaEntity instrumento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario_prestatario", nullable = false)
    private UsuarioJpaEntity prestatario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario_registro", nullable = false)
    private UsuarioJpaEntity registradoPor;

    @Column(name = "fecha_prestamo", nullable = false)
    private LocalDateTime fechaPrestamo;

    @Column(name = "fecha_devolucion_prevista", nullable = false)
    private LocalDate fechaDevolucionPrevista;

    @Column(name = "fecha_devolucion_real")
    private LocalDateTime fechaDevolucionReal;

    /** ACTIVO, DEVUELTO, ATRASADO o PERDIDO. */
    @Column(name = "estado_prestamo", nullable = false)
    private String estado;

    @Column(name = "observaciones")
    private String observaciones;
}
