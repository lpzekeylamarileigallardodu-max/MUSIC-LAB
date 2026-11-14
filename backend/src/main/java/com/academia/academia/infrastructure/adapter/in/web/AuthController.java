package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.LoginResultado;
import com.academia.academia.domain.model.NuevoRegistro;
import com.academia.academia.domain.model.Usuario;
import com.academia.academia.domain.port.in.AutenticacionCasosDeUso;
import com.academia.academia.domain.port.in.RegistroCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.LoginDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.LoginRespuestaDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.RegistroDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.RegistroRespuestaDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AutenticacionCasosDeUso autenticacion;
    private final RegistroCasosDeUso registro;
    private final SesionWeb sesionWeb;

    public AuthController(AutenticacionCasosDeUso autenticacion,
                          RegistroCasosDeUso registro,
                          SesionWeb sesionWeb) {
        this.autenticacion = autenticacion;
        this.registro = registro;
        this.sesionWeb = sesionWeb;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginRespuestaDto> login(@Valid @RequestBody LoginDto dto,
                                                   HttpServletRequest request,
                                                   HttpServletResponse response) {
        LoginResultado resultado = autenticacion.login(dto.correo(), dto.password());

        LoginRespuestaDto cuerpo = new LoginRespuestaDto(
                resultado.autenticado(),
                resultado.tipoUsuario() == null ? null : resultado.tipoUsuario().name(),
                resultado.nombre(),
                resultado.mensaje());

        if (!resultado.autenticado()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(cuerpo);
        }

        sesionWeb.iniciar(
                new SesionUsuario(
                        dto.correo().trim().toLowerCase(Locale.ROOT),
                        resultado.nombre(),
                        resultado.tipoUsuario().name()),
                request, response);
        return ResponseEntity.ok(cuerpo);
    }

    /** Crea la cuenta como INVITADO y deja la sesión iniciada (no tiene que volver a ingresar). */
    @PostMapping("/register")
    public ResponseEntity<RegistroRespuestaDto> registrar(@Valid @RequestBody RegistroDto dto,
                                                          HttpServletRequest request,
                                                          HttpServletResponse response) {
        Usuario usuario = registro.registrarInvitado(new NuevoRegistro(
                dto.nombres(), dto.apPat(), dto.apMat(), dto.ci(),
                dto.direccion(), dto.correo(), dto.telefono(), dto.password()));

        sesionWeb.iniciar(
                new SesionUsuario(usuario.getCorreo(), usuario.getNombreCompleto(), usuario.getTipoUsuario().name()),
                request, response);

        return ResponseEntity.status(HttpStatus.CREATED).body(new RegistroRespuestaDto(
                usuario.getNombreCompleto(),
                usuario.getCorreo(),
                usuario.getTipoUsuario().name(),
                "Cuenta creada. Te enviamos un correo de bienvenida."));
    }

    /** Devuelve quién tiene la sesión abierta, con su tipo actual (401 si nadie). */
    @GetMapping("/me")
    public ResponseEntity<LoginRespuestaDto> me(Authentication authentication, HttpServletRequest request) {
        Optional<LoginResultado> actual = autenticacion.sesionDe(authentication.getName());
        if (actual.isEmpty()) {
            sesionWeb.cerrar(request);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        LoginResultado resultado = actual.get();
        return ResponseEntity.ok(new LoginRespuestaDto(true, resultado.tipoUsuario().name(), resultado.nombre(), null));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        sesionWeb.cerrar(request);
        return ResponseEntity.noContent().build();
    }
}
