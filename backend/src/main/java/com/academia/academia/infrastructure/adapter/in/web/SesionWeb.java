package com.academia.academia.infrastructure.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/** Abre y cierra la sesión (cookie JSESSIONID) del usuario en el servidor. */
@Component
public class SesionWeb {

    private final SecurityContextRepository securityContextRepository;

    public SesionWeb(SecurityContextRepository securityContextRepository) {
        this.securityContextRepository = securityContextRepository;
    }

    public void iniciar(SesionUsuario usuario, HttpServletRequest request, HttpServletResponse response) {
        // Si ya había una sesión, se le cambia el identificador (evita la fijación de sesión)
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        UsernamePasswordAuthenticationToken autenticacion = UsernamePasswordAuthenticationToken.authenticated(
                usuario, null, List.of(new SimpleGrantedAuthority("ROLE_" + usuario.tipoUsuario())));

        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticacion);
        SecurityContextHolder.setContext(contexto);
        securityContextRepository.saveContext(contexto, request, response);
    }

    public void cerrar(HttpServletRequest request) {
        HttpSession sesion = request.getSession(false);
        if (sesion != null) {
            sesion.invalidate();
        }
        SecurityContextHolder.clearContext();
    }
}
