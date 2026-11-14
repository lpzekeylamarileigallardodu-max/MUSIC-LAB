package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")
public class UsuarioJpaEntity {

    // SERIAL en PostgreSQL = int4, por eso Integer (con Long la validación del esquema falla)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_rol", nullable = false)
    private RolJpaEntity rol;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "nombres")
    private String nombres;

    @Column(name = "ap_pat")
    private String apPat;

    @Column(name = "ap_mat")
    private String apMat;

    @Column(name = "ci", nullable = false, unique = true)
    private String ci;

    @Column(name = "direccion")
    private String direccion;

    @Column(name = "correo", nullable = false, unique = true)
    private String correo;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "contrasena", nullable = false)
    private String contrasena;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    // La rellena la base de datos (DEFAULT CURRENT_TIMESTAMP)
    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public RolJpaEntity getRol() { return rol; }
    public void setRol(RolJpaEntity rol) { this.rol = rol; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApPat() { return apPat; }
    public void setApPat(String apPat) { this.apPat = apPat; }
    public String getApMat() { return apMat; }
    public void setApMat(String apMat) { this.apMat = apMat; }
    public String getCi() { return ci; }
    public void setCi(String ci) { this.ci = ci; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
