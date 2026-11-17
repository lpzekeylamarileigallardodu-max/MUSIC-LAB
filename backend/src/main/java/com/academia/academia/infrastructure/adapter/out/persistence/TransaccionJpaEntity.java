package com.academia.academia.infrastructure.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaccion")
@Getter
@Setter
public class TransaccionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transaccion")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pago", nullable = false)
    private PagoJpaEntity pago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private UsuarioJpaEntity procesadoPor;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "metodo_pago", nullable = false)
    private String metodoPago;

    @Column(name = "estado_transaccion", nullable = false)
    private String estado;

    @Column(name = "codigo_error")
    private String codigoError;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "nro_comprobante")
    private String nroComprobante;

    @Column(name = "url_comprobante")
    private String urlComprobante;

    @Column(name = "monto_recibido")
    private BigDecimal montoRecibido;

    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;
}
