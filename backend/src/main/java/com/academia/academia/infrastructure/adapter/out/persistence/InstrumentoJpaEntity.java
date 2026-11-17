package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "instrumento")
@Getter
@Setter
public class InstrumentoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_instrumento")
    private Integer id;

    @Column(name = "codigo_inventario", nullable = false)
    private String codigoInventario;

    @Column(name = "nombre_instrumento", nullable = false)
    private String nombre;

    @Column(name = "tipo_instrumento")
    private String tipo;

    @Column(name = "marca")
    private String marca;

    @Column(name = "fecha_adquisicion")
    private LocalDate fechaAdquisicion;

    @Column(name = "estado_instrumento", nullable = false)
    private String estado;

    @Column(name = "observaciones")
    private String observaciones;
}
