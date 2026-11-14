package com.academia.academia.application.service;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.domain.model.DocentePanel;
import com.academia.academia.domain.model.DocentePanel.AlumnoCurso;
import com.academia.academia.domain.model.DocentePanel.AsistenciaAlumno;
import com.academia.academia.domain.model.DocentePanel.CursoDocente;
import com.academia.academia.domain.model.DocentePanel.EntradaAsistencia;
import com.academia.academia.domain.model.DocentePanel.EvaluacionDocente;
import com.academia.academia.domain.model.DocentePanel.Guardado;
import com.academia.academia.domain.model.DocentePanel.MaterialDocente;
import com.academia.academia.domain.model.DocentePanel.NuevoMaterial;
import com.academia.academia.domain.port.in.DocenteCasosDeUso;
import com.academia.academia.domain.port.out.DocenteRepositorioPuerto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class DocenteServiceImpl implements DocenteCasosDeUso {

    private static final Set<String> ESTADOS_ASISTENCIA = Set.of("PRESENTE", "AUSENTE", "TARDANZA", "LICENCIA");
    private static final Set<String> TIPOS_MATERIAL = Set.of("PARTITURA", "GUIA", "AUDIO", "VIDEO", "ENLACE", "OTRO");
    private static final BigDecimal CIEN = new BigDecimal("100");

    private final DocenteRepositorioPuerto docentes;

    public DocenteServiceImpl(DocenteRepositorioPuerto docentes) {
        this.docentes = docentes;
    }

    // ---------------- Lectura ----------------

    @Override
    public DocentePanel.Resumen resumen(String correo) {
        return docentes.resumen(idDe(correo));
    }

    @Override
    public List<CursoDocente> misCursos(String correo) {
        return docentes.cursos(idDe(correo));
    }

    @Override
    public List<AlumnoCurso> alumnos(String correo, Integer idCurso) {
        verificarCurso(idDe(correo), idCurso);
        return docentes.alumnos(idCurso);
    }

    @Override
    public List<AsistenciaAlumno> asistencia(String correo, Integer idCurso, LocalDate fecha) {
        verificarCurso(idDe(correo), idCurso);
        return docentes.asistencia(idCurso, fecha != null ? fecha : LocalDate.now());
    }

    @Override
    public List<EvaluacionDocente> evaluaciones(String correo, Integer idCurso) {
        verificarCurso(idDe(correo), idCurso);
        return docentes.evaluaciones(idCurso);
    }

    @Override
    public List<DocentePanel.MaterialDocente> material(String correo) {
        return docentes.material(idDe(correo));
    }

    // ---------------- Asistencia ----------------

    @Override
    @Transactional
    public Guardado guardarAsistencia(String correo, Integer idCurso, LocalDate fecha,
                                      List<EntradaAsistencia> registros, String ip) {
        Integer idDocente = idDe(correo);
        verificarCurso(idDocente, idCurso);

        if (fecha == null) {
            throw new ReglaDeNegocioException("Indica la fecha de la clase");
        }
        if (fecha.isAfter(LocalDate.now())) {
            throw new ReglaDeNegocioException("No puedes registrar asistencia de una fecha futura");
        }
        if (registros == null || registros.isEmpty()) {
            throw new ReglaDeNegocioException("No hay alumnos para guardar");
        }

        Set<Integer> activas = docentes.inscripcionesActivas(idCurso);
        Set<Integer> vistos = new HashSet<>();
        for (EntradaAsistencia r : registros) {
            if (r.idInscripcion() == null || !activas.contains(r.idInscripcion())) {
                throw new ReglaDeNegocioException("Hay un alumno que no está inscrito en este curso");
            }
            if (!vistos.add(r.idInscripcion())) {
                throw new ReglaDeNegocioException("Un alumno aparece repetido en la lista");
            }
            if (r.estado() == null || !ESTADOS_ASISTENCIA.contains(r.estado())) {
                throw new ReglaDeNegocioException("Estado de asistencia no válido. Usa: PRESENTE, AUSENTE, TARDANZA o LICENCIA");
            }
        }

        for (EntradaAsistencia r : registros) {
            docentes.guardarAsistencia(r.idInscripcion(), fecha, r.estado(), limpiar(r.observacion()));
        }

        docentes.registrarBitacora(idDocente, "ACTUALIZAR", "asistencia", String.valueOf(idCurso),
                "Asistencia del curso " + idCurso + " del " + fecha + " (" + registros.size() + " alumnos)", ip);
        return new Guardado(registros.size());
    }

    // ---------------- Evaluaciones ----------------

    @Override
    @Transactional
    public Guardado crearEvaluacion(String correo, Integer idCurso, String nombre, LocalDate fecha, String ip) {
        Integer idDocente = idDe(correo);
        verificarCurso(idDocente, idCurso);

        String limpio = limpiar(nombre);
        if (limpio == null) {
            throw new ReglaDeNegocioException("Escribe el nombre de la evaluación");
        }
        if (limpio.length() > 100) {
            throw new ReglaDeNegocioException("El nombre de la evaluación es demasiado largo (máximo 100 caracteres)");
        }
        if (docentes.existeEvaluacion(idCurso, limpio)) {
            throw new ReglaDeNegocioException("Ya existe una evaluación con ese nombre en este curso");
        }

        int creadas = docentes.crearEvaluacion(idCurso, limpio, fecha);
        if (creadas == 0) {
            throw new ReglaDeNegocioException("Este curso no tiene alumnos activos");
        }

        docentes.registrarBitacora(idDocente, "CREAR", "evaluacion", String.valueOf(idCurso),
                "Evaluación «" + limpio + "» creada para " + creadas + " alumnos del curso " + idCurso, ip);
        return new Guardado(creadas);
    }

    @Override
    @Transactional
    public EvaluacionDocente calificar(String correo, Integer idEvaluacion, BigDecimal nota,
                                       String comentario, String ip) {
        Integer idDocente = idDe(correo);
        EvaluacionDocente actual = docentes.buscarEvaluacionDeDocente(idDocente, idEvaluacion)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la evaluación"));

        BigDecimal notaFinal = null;
        if (nota != null) {
            if (nota.compareTo(BigDecimal.ZERO) < 0 || nota.compareTo(CIEN) > 0) {
                throw new ReglaDeNegocioException("La nota debe estar entre 0 y 100");
            }
            notaFinal = nota.setScale(2, RoundingMode.HALF_UP);
        }
        String comentarioFinal = limpiar(comentario);
        if (comentarioFinal != null && comentarioFinal.length() > 500) {
            throw new ReglaDeNegocioException("El comentario es demasiado largo (máximo 500 caracteres)");
        }

        docentes.actualizarEvaluacion(idEvaluacion, notaFinal, comentarioFinal);
        docentes.registrarBitacora(idDocente, "ACTUALIZAR", "evaluacion", String.valueOf(idEvaluacion),
                "Calificó «" + actual.nombre() + "» de " + actual.alumno() + ": "
                        + (notaFinal == null ? "sin nota" : notaFinal.toPlainString()), ip);

        return docentes.buscarEvaluacionDeDocente(idDocente, idEvaluacion).orElse(actual);
    }

    // ---------------- Material de apoyo ----------------

    @Override
    @Transactional
    public MaterialDocente agregarMaterial(String correo, NuevoMaterial datos, String ip) {
        Integer idDocente = idDe(correo);
        verificarCurso(idDocente, datos.idCurso());

        String titulo = limpiar(datos.titulo());
        if (titulo == null || titulo.length() > 150) {
            throw new ReglaDeNegocioException("El título es obligatorio (máximo 150 caracteres)");
        }
        String descripcion = limpiar(datos.descripcion());
        if (descripcion != null && descripcion.length() > 1000) {
            throw new ReglaDeNegocioException("La descripción es demasiado larga (máximo 1000 caracteres)");
        }
        if (datos.tipo() == null || !TIPOS_MATERIAL.contains(datos.tipo())) {
            throw new ReglaDeNegocioException("Tipo de material no válido");
        }
        String url = limpiar(datos.url());
        if (!esEnlaceValido(url)) {
            throw new ReglaDeNegocioException("El enlace debe empezar con https://, http:// o ser una ruta del sitio (/materiales/...)");
        }

        Integer id = docentes.insertarMaterial(idDocente, datos.idCurso(), titulo, descripcion, datos.tipo(), url);
        docentes.registrarBitacora(idDocente, "CREAR", "material_apoyo", String.valueOf(id),
                "Material «" + titulo + "» agregado al curso " + datos.idCurso(), ip);

        return docentes.buscarMaterialDeDocente(idDocente, id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se pudo leer el material creado"));
    }

    @Override
    @Transactional
    public MaterialDocente cambiarEstadoMaterial(String correo, Integer idMaterial, boolean activo, String ip) {
        Integer idDocente = idDe(correo);
        MaterialDocente actual = docentes.buscarMaterialDeDocente(idDocente, idMaterial)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el material"));
        if (actual.activo() == activo) {
            return actual;
        }
        docentes.actualizarActivoMaterial(idMaterial, activo);
        docentes.registrarBitacora(idDocente, activo ? "ACTIVAR" : "DESACTIVAR", "material_apoyo",
                String.valueOf(idMaterial), (activo ? "Material publicado: " : "Material retirado: ") + actual.titulo(), ip);
        return docentes.buscarMaterialDeDocente(idDocente, idMaterial).orElse(actual);
    }

    // ---------------- Apoyo ----------------

    /** El id sale siempre de la sesión, nunca de la petición. */
    private Integer idDe(String correo) {
        return docentes.buscarIdPorCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró tu ficha de docente"));
    }

    /** Un curso ajeno se responde igual que uno inexistente. */
    private void verificarCurso(Integer idDocente, Integer idCurso) {
        if (idCurso == null || !docentes.dictaCurso(idDocente, idCurso)) {
            throw new RecursoNoEncontradoException("No se encontró el curso");
        }
    }

    private String limpiar(String texto) {
        if (texto == null) return null;
        String t = texto.trim();
        return t.isEmpty() ? null : t;
    }

    /** Solo http(s) o una ruta del propio sitio; así no se guardan enlaces tipo javascript:. */
    private boolean esEnlaceValido(String url) {
        if (url == null || url.length() > 500) return false;
        String minus = url.toLowerCase();
        return minus.startsWith("https://") || minus.startsWith("http://")
                || (url.startsWith("/") && !url.startsWith("//"));
    }
}
