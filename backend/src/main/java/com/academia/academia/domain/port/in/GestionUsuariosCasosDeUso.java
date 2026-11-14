package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.Usuario;

public interface GestionUsuariosCasosDeUso {

    /**
     * Convierte a un INVITADO en ESTUDIANTE (se usa cuando la academia lo inscribe).
     * Lanza RecursoNoEncontradoException si no existe y ReglaDeNegocioException si no era invitado.
     */
    Usuario promoverAEstudiante(Integer idUsuario);
}
