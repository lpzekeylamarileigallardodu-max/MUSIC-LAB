package com.academia.academia.domain.port.out;

import com.academia.academia.domain.model.Reporte;

public interface GeneradorExcelPuerto {

    byte[] generar(Reporte reporte);
}
