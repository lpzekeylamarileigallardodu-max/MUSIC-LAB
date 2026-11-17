package com.academia.academia.domain.port.in;

public interface ReportesCasosDeUso {

    record Archivo(String nombre, byte[] contenido) {}

    Archivo usuarios();

    Archivo cursos();

    Archivo horarios();

    Archivo cuotas();

    Archivo pagos();

    Archivo cursoDocente(String correoDocente, Integer idCurso);

    Archivo libretaEstudiante(String correoEstudiante);
}
