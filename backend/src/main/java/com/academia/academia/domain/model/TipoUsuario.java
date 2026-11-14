package com.academia.academia.domain.model;

/**
 * Tipo de usuario del sistema. Combina el rol de la base de datos con el cargo
 * de los administrativos (rol ADMINISTRATIVO + cargo DIRECTOR / SECRETARIA / RECEPCIONISTA).
 * INVITADO es quien se registró en la web pero todavía no está inscrito: pasa a ESTUDIANTE cuando la academia lo inscribe.
 */
public enum TipoUsuario {
    DIRECTOR, SECRETARIA, RECEPCIONISTA, DOCENTE, ESTUDIANTE, INVITADO
}
