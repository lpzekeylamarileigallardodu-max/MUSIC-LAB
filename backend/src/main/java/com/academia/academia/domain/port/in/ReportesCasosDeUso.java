package com.academia.academia.domain.port.in;

/** Reportes en Excel. Cada método devuelve el archivo .xlsx listo para descargar. */
public interface ReportesCasosDeUso {

    record Archivo(String nombre, byte[] contenido) {}

    Archivo usuarios();

    Archivo cursos();

    Archivo horarios();

    Archivo cuotas();

    Archivo pagos();

    /** Libro del curso del docente: alumnos, notas y asistencia. */
    Archivo cursoDocente(String correoDocente, Integer idCurso);

    /** Libreta del estudiante: cursos, notas, asistencia y cuotas. */
    Archivo libretaEstudiante(String correoEstudiante);
}
