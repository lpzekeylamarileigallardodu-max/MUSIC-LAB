package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "bitacora")
@Getter
@Setter
public class BitacoraJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_bitacora")
    private Long id;

    /** Quién hizo la acción; se guarda solo el id para no tener que cargar el usuario. */
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "accion", nullable = false)
    private String accion;

    @Column(name = "tabla_afectada")
    private String tablaAfectada;

    @Column(name = "id_registro")
    private String idRegistro;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "ip_origen")
    private String ipOrigen;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;
}
