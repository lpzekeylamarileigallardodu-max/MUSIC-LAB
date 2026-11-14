package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.Gestion.CuotaInfo;
import com.academia.academia.domain.model.Gestion.CursoInfo;
import com.academia.academia.domain.model.Gestion.InscripcionAdmin;
import com.academia.academia.domain.model.Gestion.InscripcionInfo;
import com.academia.academia.domain.model.Gestion.TransaccionInfo;
import com.academia.academia.domain.port.out.GestionAcademicaPuerto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Persistencia de inscripciones, cuotas y pagos con JPA. */
@Component
public class GestionAcademicaAdapter implements GestionAcademicaPuerto {

    private static final String[] MESES = {"enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
            "agosto", "septiembre", "octubre", "noviembre", "diciembre"};

    private final SpringDataCursoRepository cursos;
    private final SpringDataUsuarioRepository usuarios;
    private final SpringDataInscripcionRepository inscripciones;
    private final SpringDataCuotaRepository cuotas;
    private final SpringDataPagoRepository pagos;
    private final SpringDataTransaccionRepository transacciones;
    private final SpringDataPrestamoRepository prestamos;
    private final SpringDataBitacoraRepository bitacora;

    public GestionAcademicaAdapter(SpringDataCursoRepository cursos, SpringDataUsuarioRepository usuarios,
                                   SpringDataInscripcionRepository inscripciones, SpringDataCuotaRepository cuotas,
                                   SpringDataPagoRepository pagos, SpringDataTransaccionRepository transacciones,
                                   SpringDataPrestamoRepository prestamos, SpringDataBitacoraRepository bitacora) {
        this.cursos = cursos;
        this.usuarios = usuarios;
        this.inscripciones = inscripciones;
        this.cuotas = cuotas;
        this.pagos = pagos;
        this.transacciones = transacciones;
        this.prestamos = prestamos;
        this.bitacora = bitacora;
    }

    // ---------------- Cursos e inscripciones ----------------

    @Override
    public Optional<CursoInfo> buscarCurso(Integer idCurso) {
        return cursos.findById(idCurso)
                .map(c -> new CursoInfo(c.getId(), c.getNombreCurso(), c.getCostoMensual(), Boolean.TRUE.equals(c.getActivo())));
    }

    @Override
    public Optional<InscripcionInfo> buscarInscripcion(Integer idInscripcion) {
        return inscripciones.findById(idInscripcion).map(this::aInfo);
    }

    @Override
    public Optional<InscripcionInfo> buscarInscripcion(Integer idEstudiante, Integer idCurso) {
        return inscripciones.findByEstudianteIdAndCursoId(idEstudiante, idCurso).map(this::aInfo);
    }

    @Override
    public List<InscripcionInfo> inscripcionesActivasDeCursosActivos() {
        return inscripciones.activasDeCursosActivos().stream().map(this::aInfo).toList();
    }

    @Override
    public List<InscripcionAdmin> inscripcionesDe(Integer idUsuario) {
        return inscripciones.deEstudiante(idUsuario).stream()
                .sorted(Comparator.comparing((InscripcionJpaEntity i) -> !"ACTIVA".equals(i.getEstado()))
                        .thenComparing(InscripcionJpaEntity::getFechaInscripcion, Comparator.reverseOrder()))
                .map(i -> new InscripcionAdmin(i.getId(), i.getCurso().getId(), i.getCurso().getNombreCurso(),
                        i.getCurso().getDocente().getNombreCompleto(), i.getEstado(), i.getFechaInscripcion(),
                        cuotas.findByInscripcionIdAndEstadoIn(i.getId(), List.of("PENDIENTE", "VENCIDA")).size()))
                .toList();
    }

    @Override
    public Integer crearInscripcion(Integer idEstudiante, Integer idCurso) {
        InscripcionJpaEntity i = new InscripcionJpaEntity();
        i.setEstudiante(usuarios.getReferenceById(idEstudiante));
        i.setCurso(cursos.getReferenceById(idCurso));
        i.setEstado("ACTIVA");
        i.setFechaInscripcion(LocalDateTime.now());
        return inscripciones.saveAndFlush(i).getId();
    }

    @Override
    public void cambiarEstadoInscripcion(Integer idInscripcion, String estado) {
        InscripcionJpaEntity i = inscripciones.findById(idInscripcion).orElseThrow();
        i.setEstado(estado);
        if ("ACTIVA".equals(estado)) {
            i.setFechaInscripcion(LocalDateTime.now());   // la reinscripción cuenta desde hoy
        }
        inscripciones.saveAndFlush(i);
    }

    private InscripcionInfo aInfo(InscripcionJpaEntity i) {
        return new InscripcionInfo(i.getId(), i.getEstudiante().getId(), i.getEstudiante().getNombreCompleto(),
                i.getCurso().getId(), i.getCurso().getNombreCurso(), i.getCurso().getCostoMensual(), i.getEstado());
    }

    // ---------------- Cuotas ----------------

    @Override
    public boolean existeCuota(Integer idInscripcion, int mes, int anio) {
        return cuotas.existsByInscripcionIdAndMesAndAnio(idInscripcion, (short) mes, (short) anio);
    }

    @Override
    public Integer crearCuota(Integer idInscripcion, int mes, int anio, BigDecimal monto, LocalDate vencimiento) {
        CuotaJpaEntity q = new CuotaJpaEntity();
        q.setInscripcion(inscripciones.getReferenceById(idInscripcion));
        q.setMes((short) mes);
        q.setAnio((short) anio);
        q.setMonto(monto);
        q.setFechaVencimiento(vencimiento);
        q.setEstado(vencimiento.isBefore(LocalDate.now()) ? "VENCIDA" : "PENDIENTE");
        return cuotas.saveAndFlush(q).getId();
    }

    @Override
    public int anularCuotasPendientes(Integer idInscripcion, LocalDate desde) {
        List<CuotaJpaEntity> pendientes = cuotas.findByInscripcionIdAndEstadoIn(idInscripcion, List.of("PENDIENTE")).stream()
                .filter(q -> !q.getFechaVencimiento().isBefore(desde))
                .filter(q -> pagos.findByCuotaId(q.getId())
                        .map(p -> !transacciones.existsByPagoIdAndEstado(p.getId(), "PENDIENTE")).orElse(true))
                .toList();
        pendientes.forEach(q -> q.setEstado("ANULADA"));
        cuotas.saveAll(pendientes);
        return pendientes.size();
    }

    @Override
    public Optional<CuotaInfo> buscarCuota(Integer idCuota) {
        return cuotas.findById(idCuota).map(q -> {
            InscripcionJpaEntity i = q.getInscripcion();
            return new CuotaInfo(q.getId(), i.getId(), i.getEstudiante().getId(), i.getEstudiante().getNombreCompleto(),
                    i.getCurso().getNombreCurso(), q.getMes(), q.getAnio(), q.getMonto(), q.getFechaVencimiento(), q.getEstado());
        });
    }

    @Override
    public void cambiarEstadoCuota(Integer idCuota, String estado) {
        CuotaJpaEntity q = cuotas.findById(idCuota).orElseThrow();
        q.setEstado(estado);
        cuotas.saveAndFlush(q);
    }

    @Override
    public boolean cuotaEnRevision(Integer idCuota) {
        return pagos.findByCuotaId(idCuota)
                .map(p -> transacciones.existsByPagoIdAndEstado(p.getId(), "PENDIENTE"))
                .orElse(false);
    }

    // ---------------- Pagos y transacciones ----------------

    @Override
    public boolean existeComprobante(String nroComprobante) {
        return transacciones.existsByNroComprobanteIgnoreCase(nroComprobante);
    }

    @Override
    public Integer registrarTransaccion(Integer idCuota, String metodoPago, String estado, String nroComprobante,
                                        String urlComprobante, BigDecimal montoRecibido, Integer idProcesador) {
        CuotaJpaEntity q = cuotas.findById(idCuota).orElseThrow();
        // La tabla pago admite un solo pago por cuota: se reutiliza si ya hubo un intento anterior
        PagoJpaEntity pago = pagos.findByCuotaId(idCuota).orElseGet(() -> {
            PagoJpaEntity p = new PagoJpaEntity();
            p.setEstudiante(q.getInscripcion().getEstudiante());
            p.setInscripcion(q.getInscripcion());
            p.setCuota(q);
            p.setMontoTotal(q.getMonto());
            p.setFechaPago(LocalDateTime.now());
            p.setConcepto("Mensualidad " + MESES[q.getMes() - 1] + " " + q.getAnio() + " - "
                    + q.getInscripcion().getCurso().getNombreCurso());
            return pagos.saveAndFlush(p);
        });

        TransaccionJpaEntity t = new TransaccionJpaEntity();
        t.setPago(pago);
        t.setFechaHora(LocalDateTime.now());
        t.setMetodoPago(metodoPago);
        t.setEstado(estado);
        t.setNroComprobante(nroComprobante);
        t.setUrlComprobante(urlComprobante);
        t.setMontoRecibido(montoRecibido);
        if (idProcesador != null) {
            t.setProcesadoPor(usuarios.getReferenceById(idProcesador));
        }
        if ("APROBADA".equals(estado)) {
            t.setFechaConfirmacion(LocalDateTime.now());
        }
        return transacciones.saveAndFlush(t).getId();
    }

    @Override
    public Optional<TransaccionInfo> buscarTransaccion(Integer idTransaccion) {
        return transacciones.buscarCompleta(idTransaccion).map(t -> {
            PagoJpaEntity p = t.getPago();
            CuotaJpaEntity q = p.getCuota();
            return new TransaccionInfo(t.getId(), t.getEstado(), t.getMetodoPago(), t.getNroComprobante(),
                    q == null ? null : q.getId(), q == null ? null : q.getMonto(), p.getMontoTotal(),
                    p.getEstudiante().getNombreCompleto(), p.getInscripcion().getCurso().getNombreCurso());
        });
    }

    @Override
    public void resolverTransaccion(Integer idTransaccion, String estado, Integer idProcesador, BigDecimal montoRecibido,
                                    String codigoError, String observaciones) {
        TransaccionJpaEntity t = transacciones.findById(idTransaccion).orElseThrow();
        t.setEstado(estado);
        t.setProcesadoPor(usuarios.getReferenceById(idProcesador));
        t.setMontoRecibido(montoRecibido);
        t.setCodigoError(codigoError);
        if (observaciones != null) {
            t.setObservaciones(observaciones);
        }
        if ("APROBADA".equals(estado)) {
            t.setFechaConfirmacion(LocalDateTime.now());
        }
        transacciones.saveAndFlush(t);
    }

    // ---------------- Vencimientos ----------------

    @Override
    public int marcarCuotasVencidas(LocalDate hoy) {
        List<CuotaJpaEntity> lista = cuotas.pendientesVencidas(hoy);
        lista.forEach(q -> q.setEstado("VENCIDA"));
        cuotas.saveAll(lista);
        return lista.size();
    }

    @Override
    public int marcarPrestamosAtrasados(LocalDate hoy) {
        List<PrestamoInstrumentoJpaEntity> lista = prestamos.activosVencidos(hoy);
        lista.forEach(p -> p.setEstado("ATRASADO"));
        prestamos.saveAll(lista);
        return lista.size();
    }

    @Override
    public void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro,
                                  String descripcion, String ip) {
        Apoyo.bitacora(bitacora, idUsuario, accion, tabla, idRegistro, descripcion, ip);
    }
}
