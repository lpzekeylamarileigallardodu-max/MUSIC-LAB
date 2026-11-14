package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.NuevoRegistro;
import com.academia.academia.domain.model.Usuario;

public interface RegistroCasosDeUso {

    /** Crea una cuenta de INVITADO activa (todavía no es estudiante). Lanza ReglaDeNegocioException si el correo o el CI ya existen. */
    Usuario registrarInvitado(NuevoRegistro datos);
}
