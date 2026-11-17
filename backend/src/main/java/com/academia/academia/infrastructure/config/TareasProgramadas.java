package com.academia.academia.infrastructure.config;

import com.academia.academia.domain.model.Gestion.ResultadoVencimientos;
import com.academia.academia.domain.port.in.GestionAcademicaCasosDeUso;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class TareasProgramadas {

    private static final Logger log = LoggerFactory.getLogger(TareasProgramadas.class);

    private final GestionAcademicaCasosDeUso gestion;

    public TareasProgramadas(GestionAcademicaCasosDeUso gestion) {
        this.gestion = gestion;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        revisarVencimientos();
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "America/La_Paz")
    public void revisarVencimientos() {
        try {
            ResultadoVencimientos r = gestion.actualizarVencimientos();
            if (r.cuotasVencidas() > 0 || r.prestamosAtrasados() > 0) {
                log.info("Vencimientos: {} cuotas pasaron a VENCIDA y {} préstamos a ATRASADO",
                        r.cuotasVencidas(), r.prestamosAtrasados());
            }
        } catch (RuntimeException e) {
            log.warn("No se pudieron revisar los vencimientos: {}", e.getMessage());
        }
    }
}
