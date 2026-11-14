package com.academia.academia.domain.model;

import java.time.LocalDateTime;

public class Usuario {

    private Integer id;
    private TipoUsuario tipoUsuario;
    private String nombreCompleto;
    private String nombres;
    private String apPat;
    private String apMat;
    private String ci;
    private String direccion;
    private String correo;
    private String telefono;
    private String passwordHash;
    private Boolean activo = true;
    private LocalDateTime fechaRegistro;

    public Usuario() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public TipoUsuario getTipoUsuario() { return tipoUsuario; }
    public void setTipoUsuario(TipoUsuario tipoUsuario) { this.tipoUsuario = tipoUsuario; }

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

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
