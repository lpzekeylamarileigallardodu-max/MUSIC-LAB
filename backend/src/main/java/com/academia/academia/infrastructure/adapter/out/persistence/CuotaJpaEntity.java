package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cuota")
@Getter
@Setter
public class CuotaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cuota")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_inscripcion", nullable = false)
    private InscripcionJpaEntity inscripcion;

    @Column(name = "mes", nullable = false)
    private Short mes;

    @Column(name = "anio", nullable = false)
    private Short anio;

    @Column(name = "monto", nullable = false)
    private BigDecimal monto;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    /** PENDIENTE, PAGADA, VENCIDA o ANULADA. */
    @Column(name = "estado_cuota", nullable = false)
    private String estado;
}
