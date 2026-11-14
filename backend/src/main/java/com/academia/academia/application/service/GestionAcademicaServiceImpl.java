package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.model.Gestion;
import com.academia.academia.domain.model.Gestion.Comprobante;
import com.academia.academia.domain.model.Gestion.CuotaInfo;
import com.academia.academia.domain.model.Gestion.CursoInfo;
import com.academia.academia.domain.model.Gestion.InscripcionAdmin;
import com.academia.academia.domain.model.Gestion.InscripcionInfo;
import com.academia.academia.domain.model.Gestion.ResultadoGeneracion;
import com.academia.academia.domain.model.Gestion.ResultadoInscripcion;
import com.academia.academia.domain.model.Gestion.ResultadoPago;
import com.academia.academia.domain.model.Gestion.ResultadoRetiro;
import com.academia.academia.domain.model.Gestion.ResultadoVencimientos;
import com.academia.academia.domain.model.Gestion.TransaccionInfo;
import com.academia.academia.domain.model.TipoUsuario;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.GestionAcademicaCasosDeUso;
import com.academia.academia.domain.port.out.EstudianteRepositorioPuerto;
import com.academia.academia.domain.port.out.GestionAcademicaPuerto;
import com.academia.academia.domain.port.out.UsuarioRepositorioPuerto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class GestionAcademicaServiceImpl implements GestionAcademicaCasosDeUso {

    private static final Set<String> METODOS_ESTUDIANTE = Set.of("QR", "TRANSFERENCIA");
    private static final List<String> CODIGOS_RECHAZO = List.of(
            "COMPROBANTE_ILEGIBLE", "MONTO_INCORRECTO", "NO_ENCONTRADO_EN_BANCO", "COMPROBANTE_DUPLICADO", "OTRO");

    private final GestionAcademicaPuerto gestion;
    private final UsuarioRepositorioPuerto usuarios;
    private final EstudianteRepositorioPuerto estudiantes;

    public GestionAcademicaServiceImpl(GestionAcademicaPuerto gestion, UsuarioRepositorioPuerto usuarios,
                                       EstudianteRepositorioPuerto estudiantes) {
        this.gestion = gestion;
        this.usuarios = usuarios;
        this.estudiantes = estudiantes;
    }

    // ---------------- Inscripciones ----------------

    @Override
    public List<InscripcionAdmin> inscripcionesDe(Integer idUsuario) {
        usuarios.buscarPorId(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));
        return gestion.inscripcionesDe(idUsuario);
    }

    @Override
    @Transactional
    public ResultadoInscripcion inscribir(Integer idUsuario, Integer idCurso, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        Usuario usuario = usuarios.buscarPorId(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));
        CursoInfo curso = gestion.buscarCurso(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso " + idCurso));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ReglaDeNegocioException("La cuenta de " + usuario.getNombreCompleto() + " está inactiva");
        }
        if (!curso.activo()) {
            throw new ReglaDeNegocioException("El curso " + curso.nombre() + " está inactivo y no admite inscripciones");
        }

        // 1) Un invitado pasa a estudiante en el mismo momento en que se inscribe
        boolean promovido = false;
        if (usuario.getTipoUsuario() == TipoUsuario.INVITADO) {
            usuarios.promoverAEstudiante(idUsuario);
            promovido = true;
        } else if (usuario.getTipoUsuario() != TipoUsuario.ESTUDIANTE) {
            throw new ReglaDeNegocioException("Solo se inscriben estudiantes o invitados (este usuario es "
                    + usuario.getTipoUsuario() + ")");
        }

        // 2) Si ya estuvo inscrito antes se reactiva la misma inscripción (la base no admite dos)
        Integer idInscripcion;
        boolean reactivada = false;
        var existente = gestion.buscarInscripcion(idUsuario, idCurso);
        if (existente.isPresent()) {
            if ("ACTIVA".equals(existente.get().estado())) {
                throw new ReglaDeNegocioException(usuario.getNombreCompleto() + " ya está inscrito en " + curso.nombre());
            }
            idInscripcion = existente.get().id();
            gestion.cambiarEstadoInscripcion(idInscripcion, "ACTIVA");
            reactivada = true;
        } else {
            idInscripcion = gestion.crearInscripcion(idUsuario, idCurso);
        }

        // 3) Cuota del mes en curso
        LocalDate hoy = LocalDate.now();
        int cuotas = 0;
        if (!gestion.existeCuota(idInscripcion, hoy.getMonthValue(), hoy.getYear())) {
            gestion.crearCuota(idInscripcion, hoy.getMonthValue(), hoy.getYear(), monto(curso), vencimientoPara(hoy, YearMonth.from(hoy)));
            cuotas = 1;
        }

        gestion.registrarBitacora(actor.getId(), "CREAR", "inscripcion", String.valueOf(idInscripcion),
                (reactivada ? "Reinscripción de " : "Inscripción de ") + usuario.getNombreCompleto() + " en " + curso.nombre()
                        + (promovido ? " (pasó de invitado a estudiante)" : ""), ip);
        return new ResultadoInscripcion(idInscripcion, usuario.getNombreCompleto(), curso.nombre(), promovido, reactivada, cuotas);
    }

    @Override
    @Transactional
    public ResultadoRetiro retirar(Integer idInscripcion, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        InscripcionInfo ins = gestion.buscarInscripcion(idInscripcion)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la inscripción " + idInscripcion));
        if (!"ACTIVA".equals(ins.estado())) {
            throw new ReglaDeNegocioException("Solo se puede retirar una inscripción ACTIVA (está " + ins.estado() + ")");
        }
        gestion.cambiarEstadoInscripcion(idInscripcion, "RETIRADA");
        // Las cuotas que todavía no vencieron ya no se cobran; las vencidas quedan como deuda
        int anuladas = gestion.anularCuotasPendientes(idInscripcion, LocalDate.now());
        gestion.registrarBitacora(actor.getId(), "ANULAR", "inscripcion", String.valueOf(idInscripcion),
                "Retiro de " + ins.estudiante() + " de " + ins.curso() + " (" + anuladas + " cuotas anuladas)", ip);
        return new ResultadoRetiro(idInscripcion, ins.estudiante(), ins.curso(), anuladas);
    }

    @Override
    @Transactional
    public ResultadoGeneracion generarCuotas(int mes, int anio, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        if (mes < 1 || mes > 12) {
            throw new ReglaDeNegocioException("El mes debe estar entre 1 y 12");
        }
        YearMonth objetivo = YearMonth.of(anio, mes);
        YearMonth actual = YearMonth.now();
        if (objetivo.isBefore(actual.minusMonths(1)) || objetivo.isAfter(actual.plusMonths(2))) {
            throw new ReglaDeNegocioException("Solo se generan cuotas desde el mes pasado hasta dentro de dos meses");
        }

        int creadas = 0;
        int existian = 0;
        LocalDate hoy = LocalDate.now();
        for (InscripcionInfo ins : gestion.inscripcionesActivasDeCursosActivos()) {
            if (gestion.existeCuota(ins.id(), mes, anio)) {
                existian++;
                continue;
            }
            BigDecimal monto = ins.costoMensual() == null ? BigDecimal.ZERO : ins.costoMensual();
            gestion.crearCuota(ins.id(), mes, anio, monto, vencimientoPara(hoy, objetivo));
            creadas++;
        }
        gestion.registrarBitacora(actor.getId(), "CREAR", "cuota", objetivo.toString(),
                "Generó " + creadas + " cuotas de " + objetivo + " (" + existian + " ya existían)", ip);
        return new ResultadoGeneracion(mes, anio, creadas, existian);
    }

    // ---------------- Pagos ----------------

    @Override
    @Transactional
    public ResultadoPago aprobarPago(Integer idTransaccion, BigDecimal montoRecibido, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        TransaccionInfo t = transaccionPendiente(idTransaccion);

        BigDecimal esperado = t.montoCuota() != null ? t.montoCuota() : t.montoPago();
        BigDecimal recibido = montoRecibido != null ? montoRecibido : esperado;
        if (recibido == null || recibido.signum() <= 0) {
            throw new ReglaDeNegocioException("Indica el monto que llegó a la cuenta de la academia");
        }
        recibido = recibido.setScale(2, RoundingMode.HALF_UP);
        if (esperado != null && recibido.compareTo(esperado) < 0) {
            throw new ReglaDeNegocioException("El monto recibido (" + recibido + ") es menor a la cuota (" + esperado
                    + "). Rechaza el comprobante con el código MONTO_INCORRECTO.");
        }
        if ("QR".equals(t.metodoPago()) && (t.nroComprobante() == null || t.nroComprobante().isBlank())) {
            throw new ReglaDeNegocioException("Un pago por QR necesita el número de comprobante del banco para aprobarse");
        }

        gestion.resolverTransaccion(idTransaccion, "APROBADA", actor.getId(), recibido, null, null);
        String estadoCuota = null;
        if (t.idCuota() != null) {
            gestion.cambiarEstadoCuota(t.idCuota(), "PAGADA");
            estadoCuota = "PAGADA";
        }
        gestion.registrarBitacora(actor.getId(), "ACTUALIZAR", "transaccion", String.valueOf(idTransaccion),
                "Pago aprobado de " + t.estudiante() + " (" + t.curso() + "): Bs " + recibido, ip);
        return new ResultadoPago(idTransaccion, "APROBADA", t.estudiante(), t.curso(), t.idCuota(), estadoCuota);
    }

    @Override
    @Transactional
    public ResultadoPago rechazarPago(Integer idTransaccion, String codigoError, String observaciones,
                                      String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        TransaccionInfo t = transaccionPendiente(idTransaccion);
        String codigo = codigoError == null ? null : codigoError.trim().toUpperCase(Locale.ROOT);
        if (codigo == null || !CODIGOS_RECHAZO.contains(codigo)) {
            throw new ReglaDeNegocioException("Elige el motivo del rechazo: " + String.join(", ", CODIGOS_RECHAZO));
        }
        String obs = limpiar(observaciones);
        if ("OTRO".equals(codigo) && obs == null) {
            throw new ReglaDeNegocioException("Explica el motivo en las observaciones");
        }
        gestion.resolverTransaccion(idTransaccion, "RECHAZADA", actor.getId(), null, codigo, obs);
        gestion.registrarBitacora(actor.getId(), "ANULAR", "transaccion", String.valueOf(idTransaccion),
                "Comprobante rechazado de " + t.estudiante() + " (" + codigo + ")", ip);
        // La cuota sigue pendiente o vencida: el estudiante puede enviar otro comprobante
        return new ResultadoPago(idTransaccion, "RECHAZADA", t.estudiante(), t.curso(), t.idCuota(), null);
    }

    @Override
    @Transactional
    public ResultadoPago cobrarEnEfectivo(Integer idCuota, BigDecimal montoRecibido, String correoActor, String ip) {
        Usuario actor = actor(correoActor);
        CuotaInfo q = cuotaCobrable(idCuota);
        BigDecimal recibido = montoRecibido != null ? montoRecibido.setScale(2, RoundingMode.HALF_UP) : q.monto();
        if (recibido.compareTo(q.monto()) < 0) {
            throw new ReglaDeNegocioException("El monto recibido es menor a la cuota (Bs " + q.monto() + ")");
        }
        Integer idT = gestion.registrarTransaccion(idCuota, "EFECTIVO", "APROBADA", null, null, recibido, actor.getId());
        gestion.cambiarEstadoCuota(idCuota, "PAGADA");
        gestion.registrarBitacora(actor.getId(), "CREAR", "transaccion", String.valueOf(idT),
                "Cobro en efectivo a " + q.estudiante() + " (" + q.curso() + " " + q.mes() + "/" + q.anio() + "): Bs " + recibido, ip);
        return new ResultadoPago(idT, "APROBADA", q.estudiante(), q.curso(), idCuota, "PAGADA");
    }

    @Override
    @Transactional
    public ResultadoPago enviarComprobante(String correoEstudiante, Integer idCuota, Comprobante c, String ip) {
        Integer idEstudiante = estudiantes.buscarIdPorCorreo(correoEstudiante)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de estudiante"));
        CuotaInfo q = gestion.buscarCuota(idCuota)
                .filter(x -> x.idEstudiante().equals(idEstudiante))   // una cuota ajena es como si no existiera
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la cuota"));
        cuotaCobrable(q.id());

        String metodo = c.metodoPago() == null ? null : c.metodoPago().trim().toUpperCase(Locale.ROOT);
        if (metodo == null || !METODOS_ESTUDIANTE.contains(metodo)) {
            throw new ReglaDeNegocioException("Método de pago no válido. Usa QR o TRANSFERENCIA");
        }
        String nro = limpiar(c.nroComprobante());
        if (nro == null || nro.length() < 4 || nro.length() > 100) {
            throw new ReglaDeNegocioException("Escribe el número de operación del comprobante (entre 4 y 100 caracteres)");
        }
        if (gestion.existeComprobante(nro)) {
            throw new ReglaDeNegocioException("Ese número de comprobante ya fue registrado");
        }
        String url = limpiar(c.urlComprobante());
        if (url != null && !(url.toLowerCase(Locale.ROOT).startsWith("https://") || url.toLowerCase(Locale.ROOT).startsWith("http://"))) {
            throw new ReglaDeNegocioException("El enlace del comprobante debe empezar con https://");
        }

        Integer idT = gestion.registrarTransaccion(idCuota, metodo, "PENDIENTE", nro, url, null, null);
        gestion.registrarBitacora(idEstudiante, "CREAR", "transaccion", String.valueOf(idT),
                "Comprobante enviado por " + q.estudiante() + " para " + q.curso() + " " + q.mes() + "/" + q.anio(), ip);
        return new ResultadoPago(idT, "PENDIENTE", q.estudiante(), q.curso(), idCuota, q.estado());
    }

    // ---------------- Vencimientos ----------------

    @Override
    @Transactional
    public ResultadoVencimientos actualizarVencimientos() {
        LocalDate hoy = LocalDate.now();
        return new ResultadoVencimientos(gestion.marcarCuotasVencidas(hoy), gestion.marcarPrestamosAtrasados(hoy));
    }

    // ---------------- Apoyo ----------------

    private TransaccionInfo transaccionPendiente(Integer id) {
        TransaccionInfo t = gestion.buscarTransaccion(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la transacción " + id));
        if (!"PENDIENTE".equals(t.estado())) {
            throw new ReglaDeNegocioException("Este comprobante ya fue revisado (está " + t.estado() + ")");
        }
        return t;
    }

    /** Una cuota se puede pagar si está PENDIENTE o VENCIDA y no tiene otro comprobante esperando revisión. */
    private CuotaInfo cuotaCobrable(Integer idCuota) {
        CuotaInfo q = gestion.buscarCuota(idCuota)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cuota " + idCuota));
        if (!"PENDIENTE".equals(q.estado()) && !"VENCIDA".equals(q.estado())) {
            throw new ReglaDeNegocioException("Esta cuota está " + q.estado() + " y no se puede pagar");
        }
        if (gestion.cuotaEnRevision(idCuota)) {
            throw new ReglaDeNegocioException("Esta cuota ya tiene un comprobante esperando revisión de secretaría");
        }
        return q;
    }

    /**
     * Vence el día 20 del mes de la cuota. Si alguien se inscribe después del 20,
     * su primera cuota vence 10 días después de inscribirse.
     */
    private static LocalDate vencimientoPara(LocalDate hoy, YearMonth mes) {
        LocalDate dia20 = mes.atDay(Gestion.DIA_VENCIMIENTO);
        return dia20.isBefore(hoy) ? hoy.plusDays(10) : dia20;
    }

    private static BigDecimal monto(CursoInfo curso) {
        return curso.costoMensual() == null ? BigDecimal.ZERO : curso.costoMensual();
    }

    private Usuario actor(String correo) {
        return usuarios.buscarPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu cuenta"));
    }

    private static String limpiar(String t) {
        if (t == null) return null;
        String s = t.trim();
        return s.isEmpty() ? null : s;
    }
}
