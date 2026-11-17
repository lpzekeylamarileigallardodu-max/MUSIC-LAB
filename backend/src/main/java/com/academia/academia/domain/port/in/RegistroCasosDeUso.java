package com.academia.academia.domain.port.in;

import com.academia.academia.domain.model.NuevoRegistro;
import com.academia.academia.domain.model.Usuario;

public interface RegistroCasosDeUso {

    Usuario registrarInvitado(NuevoRegistro datos);
}
