package com.academia.academia.infrastructure.adapter.out.persistence;

import com.academia.academia.domain.model.ClasePruebaRegistrada;
import com.academia.academia.domain.model.Curso;
import com.academia.academia.domain.model.SolicitudClasePrueba;
import com.academia.academia.domain.port.out.ClasePruebaRepositorioPuerto;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ClasePruebaRepositorioAdapter implements ClasePruebaRepositorioPuerto {

    private final SpringDataProspectoRepository prospectoRepository;
    private final SpringDataClasePruebaRepository clasePruebaRepository;

    public ClasePruebaRepositorioAdapter(SpringDataProspectoRepository prospectoRepository,
                                         SpringDataClasePruebaRepository clasePruebaRepository) {
        this.prospectoRepository = prospectoRepository;
        this.clasePruebaRepository = clasePruebaRepository;
    }

    @Override
    @Transactional
    public ClasePruebaRegistrada guardar(SolicitudClasePrueba solicitud, Curso curso) {
        ProspectoJpaEntity prospecto = new ProspectoJpaEntity();
        prospecto.setNombreCompleto(solicitud.nombreCompleto());
        prospecto.setTelefono(solicitud.telefono());
        prospecto.setCorreo(solicitud.correo());
        prospecto.setInstrumentoInteres(curso.nombre());
        prospecto.setEstadoProspecto("NUEVO");
        prospecto.setObservaciones("Solicitud hecha desde la página web.");
        ProspectoJpaEntity prospectoGuardado = prospectoRepository.save(prospecto);

        ClasePruebaJpaEntity clase = new ClasePruebaJpaEntity();
        clase.setIdProspecto(prospectoGuardado.getId());
        clase.setIdCurso(curso.id());
        clase.setFechaHora(solicitud.fecha().atStartOfDay());
        clase.setEstadoClase("PROGRAMADA");
        clase.setObservaciones("Fecha preferida pedida desde la web; la hora se coordina con recepción.");
        ClasePruebaJpaEntity claseGuardada = clasePruebaRepository.save(clase);

        return new ClasePruebaRegistrada(claseGuardada.getId(), curso.nombre(), solicitud.fecha());
    }
}
