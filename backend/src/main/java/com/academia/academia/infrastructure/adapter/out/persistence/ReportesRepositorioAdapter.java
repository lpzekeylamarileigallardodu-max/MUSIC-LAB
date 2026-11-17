package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.port.out.ReportesRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReportesRepositorioAdapter implements ReportesRepositorioPuerto {

    private final SpringDataCuotaRepository cuotas;
    private final SpringDataTransaccionRepository transacciones;
    private final SpringDataInscripcionRepository inscripciones;
    private final SpringDataAsistenciaRepository asistencias;
    private final SpringDataCursoRepository cursos;

    public ReportesRepositorioAdapter(SpringDataCuotaRepository cuotas, SpringDataTransaccionRepository transacciones,
                                      SpringDataInscripcionRepository inscripciones,
                                      SpringDataAsistenciaRepository asistencias, SpringDataCursoRepository cursos) {
        this.cuotas = cuotas;
        this.transacciones = transacciones;
        this.inscripciones = inscripciones;
        this.asistencias = asistencias;
        this.cursos = cursos;
    }

    @Override
    public List<CuotaFila> cuotas() {
        LocalDate hoy = LocalDate.now();
        return cuotas.listarTodas().stream()
                .map(q -> {
                    UsuarioJpaEntity u = q.getInscripcion().getEstudiante();
                    String estado = "PENDIENTE".equals(q.getEstado()) && q.getFechaVencimiento().isBefore(hoy)
                            ? "VENCIDA" : q.getEstado();
                    return new CuotaFila(u.getNombreCompleto(), u.getCi(), u.getTelefono(),
                            q.getInscripcion().getCurso().getNombreCurso(), q.getMes(), q.getAnio(), q.getMonto(),
                            q.getFechaVencimiento(), estado);
                })
                .toList();
    }

    @Override
    public List<PagoFila> pagos() {
        return transacciones.listarTodas().stream()
                .map(t -> {
                    PagoJpaEntity p = t.getPago();
                    return new PagoFila(t.getFechaHora(), p.getEstudiante().getNombreCompleto(),
                            p.getInscripcion().getCurso().getNombreCurso(), p.getConcepto(), p.getMontoTotal(),
                            t.getMontoRecibido(), t.getMetodoPago(), t.getEstado(), t.getNroComprobante(),
                            t.getProcesadoPor() == null ? null : t.getProcesadoPor().getNombreCompleto(),
                            t.getFechaConfirmacion(), t.getCodigoError());
                })
                .toList();
    }

    @Override
    public List<InscripcionFila> inscripciones() {
        return inscripciones.listarTodas().stream()
                .map(i -> new InscripcionFila(i.getCurso().getNombreCurso(), i.getCurso().getDocente().getNombreCompleto(),
                        i.getEstudiante().getNombreCompleto(), i.getEstudiante().getCorreo(), i.getEstado(),
                        i.getFechaInscripcion()))
                .toList();
    }

    @Override
    public List<AsistenciaFila> asistenciaDeCurso(Integer idCurso) {
        return asistencias.deCurso(idCurso).stream()
                .map(a -> new AsistenciaFila(a.getInscripcion().getId(), a.getInscripcion().getEstudiante().getNombreCompleto(),
                        a.getFecha(), a.getEstado()))
                .toList();
    }

    @Override
    public String nombreCurso(Integer idCurso) {
        return cursos.findById(idCurso).map(CursoJpaEntity::getNombreCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el curso"));
    }
}
