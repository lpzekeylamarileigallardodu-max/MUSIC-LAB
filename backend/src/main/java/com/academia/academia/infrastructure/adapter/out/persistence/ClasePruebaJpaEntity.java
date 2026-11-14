package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "clase_prueba")
public class ClasePruebaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_clase_prueba")
    private Integer id;

    @Column(name = "id_prospecto", nullable = false)
    private Integer idProspecto;

    @Column(name = "id_curso", nullable = false)
    private Integer idCurso;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "estado_clase", nullable = false)
    private String estadoClase;

    @Column(name = "observaciones")
    private String observaciones;

    // Administrativo que la registró. Queda NULL cuando la solicitud viene de la web.
    @Column(name = "id_usuario_registro")
    private Integer idUsuarioRegistro;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getIdProspecto() { return idProspecto; }
    public void setIdProspecto(Integer idProspecto) { this.idProspecto = idProspecto; }
    public Integer getIdCurso() { return idCurso; }
    public void setIdCurso(Integer idCurso) { this.idCurso = idCurso; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public String getEstadoClase() { return estadoClase; }
    public void setEstadoClase(String estadoClase) { this.estadoClase = estadoClase; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Integer getIdUsuarioRegistro() { return idUsuarioRegistro; }
    public void setIdUsuarioRegistro(Integer idUsuarioRegistro) { this.idUsuarioRegistro = idUsuarioRegistro; }
}
