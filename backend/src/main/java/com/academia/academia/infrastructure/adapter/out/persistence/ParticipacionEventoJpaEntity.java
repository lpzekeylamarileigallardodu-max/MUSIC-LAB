package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "participacion_evento")
@Getter
@Setter
public class ParticipacionEventoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_participacion")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private EventoJpaEntity evento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioJpaEntity usuario;

    @Column(name = "rol_participacion", nullable = false)
    private String rol;

    @Column(name = "detalle")
    private String detalle;

    /** INSCRITO, CONFIRMADO, CANCELADO o ASISTIO. */
    @Column(name = "estado_participacion", nullable = false)
    private String estado;
}
