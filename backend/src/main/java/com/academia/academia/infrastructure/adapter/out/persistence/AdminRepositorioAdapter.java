package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.HorarioCurso;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.UsuarioAdmin;
import com.academia.academia.domain.port.out.AdminRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class AdminRepositorioAdapter implements AdminRepositorioPuerto {

    private final SpringDataUsuarioRepository usuarios;
    private final SpringDataCursoRepository cursos;
    private final SpringDataHorarioRepository horarios;
    private final SpringDataInscripcionRepository inscripciones;
    private final SpringDataCuotaRepository cuotas;
    private final SpringDataTransaccionRepository transacciones;
    private final SpringDataClasePruebaRepository clasesPrueba;
    private final SpringDataProspectoRepository prospectos;
    private final SpringDataPrestamoRepository prestamos;
    private final SpringDataBitacoraRepository bitacora;

    public AdminRepositorioAdapter(SpringDataUsuarioRepository usuarios,
                                   SpringDataCursoRepository cursos,
                                   SpringDataHorarioRepository horarios,
                                   SpringDataInscripcionRepository inscripciones,
                                   SpringDataCuotaRepository cuotas,
                                   SpringDataTransaccionRepository transacciones,
                                   SpringDataClasePruebaRepository clasesPrueba,
                                   SpringDataProspectoRepository prospectos,
                                   SpringDataPrestamoRepository prestamos,
                                   SpringDataBitacoraRepository bitacora) {
        this.usuarios = usuarios;
        this.cursos = cursos;
        this.horarios = horarios;
        this.inscripciones = inscripciones;
        this.cuotas = cuotas;
        this.transacciones = transacciones;
        this.clasesPrueba = clasesPrueba;
        this.prospectos = prospectos;
        this.prestamos = prestamos;
        this.bitacora = bitacora;
    }

    @Override
    public ResumenAdmin resumen(boolean incluirFinanzas) {
        Map<String, Integer> porRol = new HashMap<>();
        for (Object[] fila : usuarios.contarActivosPorRol()) {
            porRol.put((String) fila[0], ((Number) fila[1]).intValue());
        }
        LocalDate hoy = LocalDate.now();

        Integer pagosPorVerificar = null;
        Integer cuotasVencidas = null;
        BigDecimal ingresosMes = null;
        if (incluirFinanzas) {
            pagosPorVerificar = (int) transacciones.countByEstado("PENDIENTE");
            cuotasVencidas = (int) cuotas.contarVencidas(hoy);
            LocalDateTime inicioMes = hoy.withDayOfMonth(1).atStartOfDay();
            ingresosMes = transacciones.ingresosEntre(inicioMes, inicioMes.plusMonths(1));
        }

        return new ResumenAdmin(
                porRol.getOrDefault("ESTUDIANTE", 0),
                porRol.getOrDefault("DOCENTE", 0),
                porRol.getOrDefault("INVITADO", 0),
                (int) cursos.countByActivoTrue(),
                (int) inscripciones.countByEstado("ACTIVA"),
                (int) clasesPrueba.countByEstadoClase("PROGRAMADA"),
                (int) prospectos.countByEstadoProspecto("NUEVO"),
                (int) prestamos.contarAtrasados(hoy),
                pagosPorVerificar,
                cuotasVencidas,
                ingresosMes);
    }

    @Override
    public List<UsuarioAdmin> listarUsuarios() {
        return usuarios.listarConCargo().stream().map(this::aUsuario).toList();
    }

    @Override
    public Optional<UsuarioAdmin> buscarUsuario(Integer id) {
        return usuarios.buscarConCargo(id).stream().findFirst().map(this::aUsuario);
    }

    private UsuarioAdmin aUsuario(Object[] fila) {
        UsuarioJpaEntity u = (UsuarioJpaEntity) fila[0];
        String cargo = (String) fila[1];
        String rol = u.getRol().getNombreRol();
        String tipo = "ADMINISTRATIVO".equals(rol) ? (cargo != null ? cargo : rol) : rol;
        return new UsuarioAdmin(u.getId(), u.getNombreCompleto(), u.getCorreo(), u.getCi(), u.getTelefono(),
                tipo, Boolean.TRUE.equals(u.getActivo()), u.getFechaRegistro(),
                u.getNombres(), u.getApPat(), u.getApMat(), u.getDireccion());
    }

    @Override
    public void actualizarActivoUsuario(Integer id, boolean activo) {
        usuarios.findById(id).ifPresent(u -> u.setActivo(activo));
    }

    @Override
    public boolean correoEnUso(String correo, Integer idExcluir) {
        return usuarios.existsByCorreoIgnoreCaseAndIdNot(correo, idExcluir);
    }

    @Override
    public boolean ciEnUso(String ci, Integer idExcluir) {
        return usuarios.existsByCiAndIdNot(ci, idExcluir);
    }

    @Override
    public void actualizarDatosUsuario(Integer id, UsuarioAdmin.Datos d) {
        usuarios.findById(id).ifPresent(u -> {
            u.setNombres(d.nombres());
            u.setApPat(d.apPat());
            u.setApMat(d.apMat());
            u.setNombreCompleto(String.join(" ",
                    java.util.stream.Stream.of(d.nombres(), d.apPat(), d.apMat()).filter(x -> x != null && !x.isBlank()).toList()));
            u.setCi(d.ci());
            u.setCorreo(d.correo());
            u.setTelefono(d.telefono());
            u.setDireccion(d.direccion());
        });
    }

    @Override
    public void eliminarUsuario(Integer id) {
        try {
            usuarios.deleteById(id);
            usuarios.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new com.academia.academia.domain.exception.ReglaDeNegocioException(
                    "No se puede eliminar: el usuario tiene historial (inscripciones, pagos, cursos o préstamos). Desactívalo en su lugar.");
        }
    }

    @Override
    public List<ClasePruebaAdmin> listarClasesPrueba() {
        return clasesPrueba.listarConDetalle().stream().map(this::aClase).toList();
    }

    @Override
    public Optional<ClasePruebaAdmin> buscarClasePrueba(Integer id) {
        return clasesPrueba.buscarConDetalle(id).stream().findFirst().map(this::aClase);
    }

    private ClasePruebaAdmin aClase(Object[] fila) {
        ClasePruebaJpaEntity cp = (ClasePruebaJpaEntity) fila[0];
        ProspectoJpaEntity p = (ProspectoJpaEntity) fila[1];
        return new ClasePruebaAdmin(cp.getId(), p.getNombreCompleto(), p.getTelefono(), p.getCorreo(),
                (String) fila[2], cp.getFechaHora(), cp.getEstadoClase(), cp.getObservaciones());
    }

    @Override
    public void actualizarEstadoClasePrueba(Integer id, String estado) {
        clasesPrueba.findById(id).ifPresent(cp -> cp.setEstadoClase(estado));
    }

    @Override
    public List<CursoAdmin> listarCursos() {
        Map<Integer, List<HorarioCurso>> horariosPorCurso = horarios.listarTodos().stream()
                .filter(h -> Boolean.TRUE.equals(h.getActivo()))
                .sorted(Apoyo.ORDEN_HORARIO)
                .collect(Collectors.groupingBy(h -> h.getCurso().getId(), Collectors.mapping(
                        h -> new HorarioCurso(h.getDia(), Apoyo.hora(h.getHoraInicio()), Apoyo.hora(h.getHoraFin()),
                                h.getAula().getNombreAula()),
                        Collectors.toList())));

        Map<Integer, Integer> inscritos = new HashMap<>();
        for (Object[] fila : inscripciones.contarActivasPorCurso()) {
            inscritos.put((Integer) fila[0], ((Number) fila[1]).intValue());
        }

        return cursos.listarConDocente().stream()
                .map(c -> new CursoAdmin(c.getId(), c.getNombreCurso(), c.getDocente().getNombreCompleto(),
                        c.getNivel(), c.getCostoMensual(), Boolean.TRUE.equals(c.getActivo()),
                        inscritos.getOrDefault(c.getId(), 0),
                        horariosPorCurso.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    @Override
    public List<PagoPendienteAdmin> listarPagosPendientes() {
        return transacciones.listarPendientes().stream()
                .map(t -> {
                    PagoJpaEntity p = t.getPago();
                    return new PagoPendienteAdmin(t.getId(), p.getEstudiante().getNombreCompleto(),
                            p.getInscripcion().getCurso().getNombreCurso(), p.getConcepto(), p.getMontoTotal(),
                            t.getMetodoPago(), t.getNroComprobante(), t.getFechaHora(), t.getUrlComprobante(),
                            p.getCuota() == null ? null : p.getCuota().getMonto());
                })
                .toList();
    }

    @Override
    public List<CuotaVencidaAdmin> listarCuotasVencidas() {
        return cuotas.listarVencidas(LocalDate.now()).stream()
                .map(q -> new CuotaVencidaAdmin(q.getId(), q.getInscripcion().getEstudiante().getNombreCompleto(),
                        q.getInscripcion().getEstudiante().getTelefono(),
                        q.getInscripcion().getCurso().getNombreCurso(), q.getMes(), q.getAnio(), q.getMonto(),
                        q.getFechaVencimiento()))
                .toList();
    }

    @Override
    public void registrarBitacora(Integer idUsuario, String accion, String tabla, String idRegistro,
                                  String descripcion, String ip) {
        Apoyo.bitacora(bitacora, idUsuario, accion, tabla, idRegistro, descripcion, ip);
    }
}
