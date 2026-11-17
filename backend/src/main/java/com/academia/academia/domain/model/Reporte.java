package com.academia.academia.domain.model;

import java.util.List;

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
