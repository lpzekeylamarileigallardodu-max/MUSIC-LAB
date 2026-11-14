package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "prospecto")
public class ProspectoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prospecto")
    private Integer id;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "correo")
    private String correo;

    @Column(name = "instrumento_interes")
    private String instrumentoInteres;

    @Column(name = "estado_prospecto", nullable = false)
    private String estadoProspecto;

    @Column(name = "observaciones")
    private String observaciones;

    // La rellena la base de datos (DEFAULT CURRENT_TIMESTAMP)
    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    // Administrativo que lo registró. Queda NULL cuando la solicitud viene de la web.
    @Column(name = "id_usuario_registro")
    private Integer idUsuarioRegistro;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getInstrumentoInteres() { return instrumentoInteres; }
    public void setInstrumentoInteres(String instrumentoInteres) { this.instrumentoInteres = instrumentoInteres; }
    public String getEstadoProspecto() { return estadoProspecto; }
    public void setEstadoProspecto(String estadoProspecto) { this.estadoProspecto = estadoProspecto; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public Integer getIdUsuarioRegistro() { return idUsuarioRegistro; }
    public void setIdUsuarioRegistro(Integer idUsuarioRegistro) { this.idUsuarioRegistro = idUsuarioRegistro; }
}
