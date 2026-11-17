package com.academia.academia.infrastructure.adapter.out.excel;

import com.academia.academia.domain.model.Reporte;
import com.academia.academia.domain.model.Reporte.Columna;
import com.academia.academia.domain.model.Reporte.Hoja;
import com.academia.academia.domain.model.Reporte.Tipo;
import com.academia.academia.domain.port.out.GeneradorExcelPuerto;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ApachePoiExcelAdapter implements GeneradorExcelPuerto {

    private static final int FILA_TITULO = 0;
    private static final int FILA_SUBTITULO = 1;
    private static final int FILA_ENCABEZADO = 3;

    private static final int[][] PALETA = {
            {0xDB, 0xEA, 0xFE}, {0xDC, 0xFC, 0xE7}, {0xFE, 0xF3, 0xC7}, {0xFC, 0xE7, 0xF3},
            {0xED, 0xE9, 0xFE}, {0xCF, 0xFA, 0xFE}, {0xFF, 0xED, 0xD5}, {0xEC, 0xFC, 0xCB}};
    private static final byte[] AZUL_ACADEMIA = {(byte) 0x1E, (byte) 0x3A, (byte) 0x5F};
    private static final byte[] GRIS_CLARO = {(byte) 0xF3, (byte) 0xF4, (byte) 0xF6};

    @Override
    public byte[] generar(Reporte reporte) {
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Estilos estilos = new Estilos(libro);
            Set<String> nombresUsados = new HashSet<>();
            for (Hoja hoja : reporte.hojas()) {
                Sheet sheet = libro.createSheet(nombreUnico(hoja.nombre(), nombresUsados));
                escribirHoja(sheet, reporte.titulo(), hoja, estilos);
            }
            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el Excel", e);
        }
    }

    private void escribirHoja(Sheet sheet, String titulo, Hoja hoja, Estilos estilos) {
        List<Columna> columnas = hoja.columnas();
        int ultimaColumna = Math.max(columnas.size() - 1, 0);

        Cell celdaTitulo = sheet.createRow(FILA_TITULO).createCell(0);
        celdaTitulo.setCellValue(titulo + " — " + hoja.nombre());
        celdaTitulo.setCellStyle(estilos.titulo);
        Cell celdaSub = sheet.createRow(FILA_SUBTITULO).createCell(0);
        String generado = "Generado el " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        celdaSub.setCellValue(hoja.subtitulo() == null ? generado : hoja.subtitulo() + "  ·  " + generado);
        celdaSub.setCellStyle(estilos.subtitulo);
        if (ultimaColumna > 0) {
            sheet.addMergedRegion(new CellRangeAddress(FILA_TITULO, FILA_TITULO, 0, ultimaColumna));
            sheet.addMergedRegion(new CellRangeAddress(FILA_SUBTITULO, FILA_SUBTITULO, 0, ultimaColumna));
        }

        Row encabezado = sheet.createRow(FILA_ENCABEZADO);
        encabezado.setHeightInPoints(22);
        for (int c = 0; c < columnas.size(); c++) {
            Cell cell = encabezado.createCell(c);
            cell.setCellValue(columnas.get(c).nombre());
            cell.setCellStyle(estilos.encabezado);
            sheet.setColumnWidth(c, Math.min(columnas.get(c).ancho(), 80) * 256);
        }

        if (hoja.cuadricula()) {
            escribirCuadricula(sheet, hoja, estilos);
        } else {
            escribirTabla(sheet, hoja, estilos);
        }
        sheet.createFreezePane(1, FILA_ENCABEZADO + 1);
    }

    private void escribirTabla(Sheet sheet, Hoja hoja, Estilos estilos) {
        List<Columna> columnas = hoja.columnas();
        int r = FILA_ENCABEZADO + 1;
        for (List<Object> fila : hoja.filas()) {
            Row row = sheet.createRow(r);
            boolean par = (r - FILA_ENCABEZADO) % 2 == 0;
            for (int c = 0; c < columnas.size(); c++) {
                Object valor = c < fila.size() ? fila.get(c) : null;
                Cell cell = row.createCell(c);
                escribirValor(cell, valor);
                cell.setCellStyle(estilos.de(columnas.get(c).tipo(), par));
            }
            r++;
        }

        int primeraDato = FILA_ENCABEZADO + 1;
        int ultimaDato = r - 1;
        if (!hoja.filas().isEmpty()) {
            sheet.setAutoFilter(new CellRangeAddress(FILA_ENCABEZADO, ultimaDato, 0, columnas.size() - 1));
        }

        if (hoja.filaTotales() && !hoja.filas().isEmpty()) {
            Row total = sheet.createRow(r);
            for (int c = 0; c < columnas.size(); c++) {
                Cell cell = total.createCell(c);
                Tipo tipo = columnas.get(c).tipo();
                if (c == 0) {
                    cell.setCellValue("TOTAL");
                } else if (tipo == Tipo.ENTERO || tipo == Tipo.NUMERO || tipo == Tipo.DINERO) {
                    String letra = CellReference.convertNumToColString(c);
                    cell.setCellFormula("SUM(" + letra + (primeraDato + 1) + ":" + letra + (ultimaDato + 1) + ")");
                }
                cell.setCellStyle(estilos.total(tipo));
            }
        }
    }

    private void escribirCuadricula(Sheet sheet, Hoja hoja, Estilos estilos) {
        List<Columna> columnas = hoja.columnas();
        List<List<Object>> filas = hoja.filas();
        int primera = FILA_ENCABEZADO + 1;

        for (int i = 0; i < filas.size(); i++) {
            Row row = sheet.createRow(primera + i);
            row.setHeightInPoints(30);
            for (int c = 0; c < columnas.size(); c++) {
                Object valor = c < filas.get(i).size() ? filas.get(i).get(c) : null;
                String texto = valor == null ? "" : valor.toString();
                Cell cell = row.createCell(c);
                cell.setCellValue(texto);
                if (c == 0) {
                    cell.setCellStyle(estilos.hora);
                } else if (texto.isBlank()) {
                    cell.setCellStyle(estilos.vacia);
                } else {
                    cell.setCellStyle(estilos.bloque(texto.split("[·\\n]")[0].trim()));
                }
            }
        }

        for (int c = 1; c < columnas.size(); c++) {
            int inicio = 0;
            while (inicio < filas.size()) {
                String texto = texto(filas, inicio, c);
                int fin = inicio;
                while (fin + 1 < filas.size() && !texto.isBlank() && texto.equals(texto(filas, fin + 1, c))) {
                    fin++;
                }
                if (fin > inicio) {
                    sheet.addMergedRegion(new CellRangeAddress(primera + inicio, primera + fin, c, c));
                }
                inicio = fin + 1;
            }
        }
    }

    private static String texto(List<List<Object>> filas, int fila, int col) {
        Object v = col < filas.get(fila).size() ? filas.get(fila).get(col) : null;
        return v == null ? "" : v.toString();
    }

    private static void escribirValor(Cell cell, Object valor) {
        if (valor == null) {
            cell.setBlank();
        } else if (valor instanceof BigDecimal b) {
            cell.setCellValue(b.doubleValue());
        } else if (valor instanceof Number n) {
            cell.setCellValue(n.doubleValue());
        } else if (valor instanceof LocalDateTime t) {
            cell.setCellValue(t);
        } else if (valor instanceof LocalDate d) {
            cell.setCellValue(d);
        } else if (valor instanceof Boolean b) {
            cell.setCellValue(b ? "Sí" : "No");
        } else {
            cell.setCellValue(valor.toString());
        }
    }

    private static String nombreUnico(String nombre, Set<String> usados) {
        String base = WorkbookUtil.createSafeSheetName(nombre == null || nombre.isBlank() ? "Hoja" : nombre);
        String candidato = base;
        int n = 2;
        while (!usados.add(candidato.toLowerCase())) {
            String sufijo = " (" + n++ + ")";
            candidato = base.substring(0, Math.min(base.length(), 31 - sufijo.length())) + sufijo;
        }
        return candidato;
    }

    private static final class Estilos {

        private final XSSFWorkbook libro;
        final CellStyle titulo;
        final CellStyle subtitulo;
        final CellStyle encabezado;
        final CellStyle hora;
        final CellStyle vacia;
        private final Map<Tipo, CellStyle> normales = new EnumMap<>(Tipo.class);
        private final Map<Tipo, CellStyle> alternos = new EnumMap<>(Tipo.class);
        private final Map<Tipo, CellStyle> totales = new EnumMap<>(Tipo.class);
        private final Map<String, CellStyle> bloques = new HashMap<>();

        Estilos(XSSFWorkbook libro) {
            this.libro = libro;

            Font fTitulo = libro.createFont();
            fTitulo.setBold(true);
            fTitulo.setFontHeightInPoints((short) 14);
            titulo = libro.createCellStyle();
            titulo.setFont(fTitulo);

            Font fSub = libro.createFont();
            fSub.setItalic(true);
            fSub.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            subtitulo = libro.createCellStyle();
            subtitulo.setFont(fSub);

            Font fEnc = libro.createFont();
            fEnc.setBold(true);
            fEnc.setColor(IndexedColors.WHITE.getIndex());
            XSSFCellStyle enc = libro.createCellStyle();
            enc.setFont(fEnc);
            enc.setFillForegroundColor(new XSSFColor(AZUL_ACADEMIA, null));
            enc.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            enc.setAlignment(HorizontalAlignment.CENTER);
            enc.setVerticalAlignment(VerticalAlignment.CENTER);
            enc.setWrapText(true);
            bordes(enc);
            encabezado = enc;

            Font fHora = libro.createFont();
            fHora.setBold(true);
            XSSFCellStyle h = libro.createCellStyle();
            h.setFont(fHora);
            h.setAlignment(HorizontalAlignment.CENTER);
            h.setVerticalAlignment(VerticalAlignment.TOP);
            h.setFillForegroundColor(new XSSFColor(GRIS_CLARO, null));
            h.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            bordes(h);
            hora = h;

            vacia = libro.createCellStyle();
            bordes(vacia);

            for (Tipo t : Tipo.values()) {
                normales.put(t, crearDato(t, false, false));
                alternos.put(t, crearDato(t, true, false));
                totales.put(t, crearDato(t, false, true));
            }
        }

        CellStyle de(Tipo tipo, boolean alterno) {
            return alterno ? alternos.get(tipo) : normales.get(tipo);
        }

        CellStyle total(Tipo tipo) {
            return totales.get(tipo);
        }

        CellStyle bloque(String curso) {
            return bloques.computeIfAbsent(curso, k -> {
                int[] rgb = PALETA[Math.floorMod(k.hashCode(), PALETA.length)];
                XSSFCellStyle s = libro.createCellStyle();
                s.setFillForegroundColor(new XSSFColor(new byte[]{(byte) rgb[0], (byte) rgb[1], (byte) rgb[2]}, null));
                s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                s.setWrapText(true);
                s.setAlignment(HorizontalAlignment.CENTER);
                s.setVerticalAlignment(VerticalAlignment.CENTER);
                bordes(s);
                return s;
            });
        }

        private CellStyle crearDato(Tipo tipo, boolean alterno, boolean esTotal) {
            XSSFCellStyle s = libro.createCellStyle();
            bordes(s);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            String formato = switch (tipo) {
                case ENTERO -> "0";
                case NUMERO -> "0.00";
                case DINERO -> "\"Bs\" #,##0.00";
                case PORCENTAJE -> "0%";
                case FECHA -> "dd/mm/yyyy";
                case FECHA_HORA -> "dd/mm/yyyy hh:mm";
                case TEXTO -> null;
            };
            if (formato != null) {
                s.setDataFormat(libro.createDataFormat().getFormat(formato));
            }
            if (alterno) {
                s.setFillForegroundColor(new XSSFColor(GRIS_CLARO, null));
                s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            if (esTotal) {
                Font f = libro.createFont();
                f.setBold(true);
                s.setFont(f);
                s.setBorderTop(BorderStyle.MEDIUM);
            }
            return s;
        }

        private static void bordes(CellStyle s) {
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
            s.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            s.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            s.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            s.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        }
    }
}
