package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Reporte;

/** Convierte un reporte del dominio en un archivo .xlsx (lo implementa el adaptador de Apache POI). */
public interface GeneradorExcelPuerto {

    byte[] generar(Reporte reporte);
}
