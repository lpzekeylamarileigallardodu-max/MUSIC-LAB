package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.HorarioGestion.AulaItem;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.CursoItem;
import com.academia.academia.domain.port.out.HorarioGestionPuerto;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Persistencia del tablero de horarios con JPA. */
@Component
public class HorarioGestionAdapter implements HorarioGestionPuerto {

    /** Id imposible para "no excluir ninguno" en las consultas de choques. */
    private static final int NINGUNO = -1;

    private final SpringDataHorarioRepository horarios;
    private final SpringDataCursoRepository cursos;
    private final SpringDataAulaRepository aulas;
    private final SpringDataBitacoraRepository bitacora;

    public HorarioGestionAdapter(SpringDataHorarioRepository horarios, SpringDataCursoRepository cursos,
                                 SpringDataAulaRepository aulas, SpringDataBitacoraRepository bitacora) {
        this.horarios = horarios;
        this.cursos = cursos;
        this.aulas = aulas;
        this.bitacora = bitacora;
    }

    @Override
    public List<Bloque> listarTodos() {
        return horarios.listarTodos().stream().sorted(Apoyo.ORDEN_HORARIO).map(this::aBloque).toList();
    }

    @Override
    public List<Bloque> listarActivosDeDocente(Integer idDocente) {
        return horarios.listarActivosDeDocente(idDocente).stream().sorted(Apoyo.ORDEN_HORARIO).map(this::aBloque).toList();
    }

    @Override
    public List<Bloque> listarActivosDeCursos(Collection<Integer> idCursos) {
        if (idCursos.isEmpty()) return List.of();
        return horarios.listarActivosDeCursos(idCursos).stream().sorted(Apoyo.ORDEN_HORARIO).map(this::aBloque).toList();
    }

    @Override
    public List<AulaItem> aulas() {
        return aulas.findAllByOrderByNombreAulaAsc().stream().map(this::aAula).toList();
    }

    @Override
    public List<CursoItem> cursos() {
        return cursos.listarConDocente().stream().map(this::aCurso).toList();
    }

    @Override
    public Optional<Bloque> buscar(Integer id) {
        return horarios.buscarCompleto(id).map(this::aBloque);
    }

    @Override
    public Optional<CursoItem> buscarCurso(Integer idCurso) {
        return cursos.findById(idCurso).map(this::aCurso);
    }

    @Override
    public Optional<AulaItem> buscarAula(Integer idAula) {
        return aulas.findById(idAula).map(this::aAula);
    }

    @Override
    public List<Choque> choques(Integer idExcluir, Integer idCurso, Integer idAula, Integer idDocente, String dia,
                                LocalTime inicio, LocalTime fin) {
        int excluir = idExcluir == null ? NINGUNO : idExcluir;
        List<Choque> lista = new ArrayList<>();
        horarios.choquesDeAula(idAula, dia, inicio, fin, excluir)
                .forEach(h -> lista.add(aChoque(h, "AULA")));
        horarios.choquesDeDocente(idDocente, dia, inicio, fin, excluir).stream()
                .filter(h -> lista.stream().noneMatch(c -> c.idHorario().equals(h.getId())))
                .forEach(h -> lista.add(aChoque(h, "DOCENTE")));
        // La base tiene UNIQUE (id_curso, dia, hora_inicio) aunque el bloque esté inactivo
        horarios.findFirstByCursoIdAndDiaAndHoraInicioAndIdNot(idCurso, dia, inicio, excluir)
                .filter(h -> lista.stream().noneMatch(c -> c.idHorario().equals(h.getId())))
                .ifPresent(h -> lista.add(new Choque(h.getId(),
                        h.getCurso().getNombreCurso() + (Boolean.TRUE.equals(h.getActivo()) ? "" : " (inactivo)"),
                        h.getDia(), Apoyo.hora(h.getHoraInicio()), Apoyo.hora(h.getHoraFin()), "MISMO_CURSO")));
        return lista;
    }

    @Override
    public Integer guardar(Integer id, Integer idCurso, Integer idAula, String dia, LocalTime inicio, LocalTime fin,
                           boolean activo) {
        HorarioJpaEntity h = id == null ? new HorarioJpaEntity() : horarios.findById(id).orElseThrow();
        h.setCurso(cursos.getReferenceById(idCurso));
        h.setAula(aulas.getReferenceById(idAula));
        h.setDia(dia);
        h.setHoraInicio(inicio);
        h.setHoraFin(fin);
        h.setActivo(activo);
        // flush: así el trigger de choques de la base se ejecuta aquí y no al final de la transacción
        return horarios.saveAndFlush(h).getId();
    }

    @Override
    public void eliminar(Integer id) {
        horarios.deleteById(id);
        horarios.flush();
    }

    @Override
    public void registrarBitacora(Integer idUsuario, String accion, String idRegistro, String descripcion, String ip) {
        Apoyo.bitacora(bitacora, idUsuario, accion, "horario", idRegistro, descripcion, ip);
    }

    // ---------------- Conversión ----------------

    private Bloque aBloque(HorarioJpaEntity h) {
        CursoJpaEntity c = h.getCurso();
        return new Bloque(h.getId(), c.getId(), c.getNombreCurso(), c.getDocente().getId(), c.getDocente().getNombreCompleto(),
                h.getAula().getId(), h.getAula().getNombreAula(), h.getDia(), Apoyo.hora(h.getHoraInicio()),
                Apoyo.hora(h.getHoraFin()), Boolean.TRUE.equals(h.getActivo()), Boolean.TRUE.equals(c.getActivo()));
    }

    private Choque aChoque(HorarioJpaEntity h, String motivo) {
        return new Choque(h.getId(), h.getCurso().getNombreCurso(), h.getDia(), Apoyo.hora(h.getHoraInicio()),
                Apoyo.hora(h.getHoraFin()), motivo);
    }

    private AulaItem aAula(AulaJpaEntity a) {
        return new AulaItem(a.getId(), a.getNombreAula(), a.getCapacidad(), Boolean.TRUE.equals(a.getActivo()));
    }

    private CursoItem aCurso(CursoJpaEntity c) {
        return new CursoItem(c.getId(), c.getNombreCurso(), c.getDocente().getId(), c.getDocente().getNombreCompleto(),
                Boolean.TRUE.equals(c.getActivo()));
    }
}
