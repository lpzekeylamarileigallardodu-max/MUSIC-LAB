package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "material_apoyo")
@Getter
@Setter
public class MaterialApoyoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_material")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_curso", nullable = false)
    private CursoJpaEntity curso;

    /** Docente que lo subió. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioJpaEntity docente;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "descripcion")
    private String descripcion;

    /** PARTITURA, GUIA, AUDIO, VIDEO, ENLACE u OTRO. */
    @Column(name = "tipo_material", nullable = false)
    private String tipo;

    @Column(name = "url_archivo", nullable = false)
    private String url;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;

    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
