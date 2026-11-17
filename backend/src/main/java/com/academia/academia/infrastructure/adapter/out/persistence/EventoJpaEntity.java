package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "evento")
@Getter
@Setter
public class EventoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento")
    private Integer id;

    @Column(name = "nombre_evento", nullable = false)
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "tipo_evento", nullable = false)
    private String tipo;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime inicio;

    @Column(name = "fecha_hora_fin")
    private LocalDateTime fin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_aula")
    private AulaJpaEntity aula;

    @Column(name = "lugar_externo")
    private String lugarExterno;

    @Column(name = "estado_evento", nullable = false)
    private String estado;

    @Column(name = "id_usuario_creador", nullable = false)
    private Integer idUsuarioCreador;

    @Column(name = "id_usuario_aprobador")
    private Integer idUsuarioAprobador;

    @Column(name = "fecha_aprobacion")
    private LocalDateTime fechaAprobacion;
}
