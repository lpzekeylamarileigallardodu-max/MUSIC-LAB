package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.DiaSemana;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Comparator;

final class Apoyo {

    static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    static final Comparator<HorarioJpaEntity> ORDEN_HORARIO = Comparator
            .comparingInt((HorarioJpaEntity h) -> ordenDia(h.getDia()))
            .thenComparing(HorarioJpaEntity::getHoraInicio);

    private Apoyo() {}

    static String hora(LocalTime t) {
        return t == null ? null : t.format(HORA);
    }

    static int ordenDia(String dia) {
        try {
            return DiaSemana.valueOf(dia).ordinal();
        } catch (IllegalArgumentException | NullPointerException e) {
            return 99;
        }
    }

    static DayOfWeek diaDeSemana(String dia) {
        return DayOfWeek.of(DiaSemana.valueOf(dia).ordinal() + 1);
    }

    static String diaDeHoy() {
        return DiaSemana.values()[LocalDateTime.now().getDayOfWeek().getValue() - 1].name();
    }

    static Integer porcentajeAsistencia(Collection<String> estados) {
        long validas = estados.stream().filter(e -> !"LICENCIA".equals(e)).count();
        if (validas == 0) return null;
        long asistidas = estados.stream().filter(e -> "PRESENTE".equals(e) || "TARDANZA".equals(e)).count();
        return (int) Math.round(asistidas * 100.0 / validas);
    }

    static BigDecimal promedio(Collection<BigDecimal> notas) {
        if (notas == null || notas.isEmpty()) return null;
        BigDecimal suma = notas.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return suma.divide(BigDecimal.valueOf(notas.size()), 1, RoundingMode.HALF_UP);
    }

    static LocalDateTime proximaOcurrencia(String dia, LocalTime inicio, LocalDateTime ahora) {
        DayOfWeek d = diaDeSemana(dia);
        LocalDateTime cuando = ahora.toLocalDate().atTime(inicio)
                .plusDays(Math.floorMod(d.getValue() - ahora.getDayOfWeek().getValue(), 7));
        return cuando.isBefore(ahora) ? cuando.plusWeeks(1) : cuando;
    }

    static void bitacora(SpringDataBitacoraRepository repo, Integer idUsuario, String accion, String tabla,
                         String idRegistro, String descripcion, String ip) {
        BitacoraJpaEntity b = new BitacoraJpaEntity();
        b.setIdUsuario(idUsuario);
        b.setAccion(accion);
        b.setTablaAfectada(tabla);
        b.setIdRegistro(idRegistro);
        b.setDescripcion(descripcion);
        b.setIpOrigen(ip);
        b.setFechaHora(LocalDateTime.now());
        repo.save(b);
    }
}
