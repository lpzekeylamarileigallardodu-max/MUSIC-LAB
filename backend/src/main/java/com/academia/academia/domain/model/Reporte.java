package com.academia.academia.domain.model;

import java.util.List;

/**
 * Reporte tabular independiente del formato. El adaptador de Excel (Apache POI) lo convierte en un .xlsx;
 * así el dominio no conoce la librería.
 */
public record Reporte(String nombreArchivo, String titulo, List<Hoja> hojas) {

    public enum Tipo { TEXTO, ENTERO, NUMERO, DINERO, PORCENTAJE, FECHA, FECHA_HORA }

    public record Columna(String nombre, Tipo tipo, int ancho) {
        public static Columna texto(String nombre, int ancho) { return new Columna(nombre, Tipo.TEXTO, ancho); }
        public static Columna entero(String nombre) { return new Columna(nombre, Tipo.ENTERO, 12); }
        public static Columna numero(String nombre) { return new Columna(nombre, Tipo.NUMERO, 12); }
        public static Columna dinero(String nombre) { return new Columna(nombre, Tipo.DINERO, 14); }
        public static Columna porcentaje(String nombre) { return new Columna(nombre, Tipo.PORCENTAJE, 12); }
        public static Columna fecha(String nombre) { return new Columna(nombre, Tipo.FECHA, 13); }
        public static Columna fechaHora(String nombre) { return new Columna(nombre, Tipo.FECHA_HORA, 18); }
    }

    /**
     * Una hoja del libro. filaTotales: suma las columnas numéricas al final.
     * cuadricula: hoja tipo calendario (celdas de texto con color; las celdas iguales consecutivas
     * en una columna se combinan en un solo bloque).
     */
    public record Hoja(String nombre, String subtitulo, List<Columna> columnas, List<List<Object>> filas,
                       boolean filaTotales, boolean cuadricula) {

        public static Hoja tabla(String nombre, String subtitulo, List<Columna> columnas, List<List<Object>> filas) {
            return new Hoja(nombre, subtitulo, columnas, filas, false, false);
        }

        public Hoja conTotales() {
            return new Hoja(nombre, subtitulo, columnas, filas, true, cuadricula);
        }
    }
}
