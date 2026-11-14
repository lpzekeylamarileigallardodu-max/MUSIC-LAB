package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "administrativo")
public class AdministrativoJpaEntity {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "cargo", nullable = false)
    private String cargo;

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
}
