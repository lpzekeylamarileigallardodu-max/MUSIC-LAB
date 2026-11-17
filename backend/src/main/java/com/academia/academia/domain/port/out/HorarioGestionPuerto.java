package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.HorarioGestion.AulaItem;
import com.academia.academia.domain.model.HorarioGestion.Bloque;
import com.academia.academia.domain.model.HorarioGestion.Choque;
import com.academia.academia.domain.model.HorarioGestion.CursoItem;

import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface HorarioGestionPuerto {

    List<Bloque> listarTodos();

    List<Bloque> listarActivosDeDocente(Integer idDocente);

    List<Bloque> listarActivosDeCursos(Collection<Integer> idCursos);

    List<AulaItem> aulas();

    List<CursoItem> cursos();

    Optional<Bloque> buscar(Integer id);

    Optional<CursoItem> buscarCurso(Integer idCurso);

    Optional<AulaItem> buscarAula(Integer idAula);

    List<Choque> choques(Integer idExcluir, Integer idCurso, Integer idAula, Integer idDocente, String dia,
                         LocalTime inicio, LocalTime fin);

    Integer guardar(Integer id, Integer idCurso, Integer idAula, String dia, LocalTime inicio, LocalTime fin, boolean activo);

    void eliminar(Integer id);

    void registrarBitacora(Integer idUsuario, String accion, String idRegistro, String descripcion, String ip);
}
