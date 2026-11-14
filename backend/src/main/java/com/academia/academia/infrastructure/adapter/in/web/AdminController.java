package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.model.ClasePruebaAdmin;
import com.academia.academia.domain.model.CuotaVencidaAdmin;
import com.academia.academia.domain.model.CursoAdmin;
import com.academia.academia.domain.model.PagoPendienteAdmin;
import com.academia.academia.domain.model.ResumenAdmin;
import com.academia.academia.domain.model.UsuarioAdmin;
import com.academia.academia.domain.port.in.AdminCasosDeUso;
import com.academia.academia.infrastructure.adapter.in.web.dto.EstadoClaseDto;
import com.academia.academia.infrastructure.adapter.in.web.dto.EstadoUsuarioDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Panel del personal administrativo. Quién entra a qué se define en SecurityConfig:
 * resumen, clases de prueba y cursos: DIRECTOR, SECRETARIA y RECEPCIONISTA;
 * usuarios y pagos: DIRECTOR y SECRETARIA; activar/desactivar usuarios: solo DIRECTOR.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminCasosDeUso admin;

    public AdminController(AdminCasosDeUso admin) {
        this.admin = admin;
    }

    @GetMapping("/resumen")
    public ResumenAdmin resumen(Authentication authentication) {
        boolean verFinanzas = tieneRol(authentication, "ROLE_DIRECTOR") || tieneRol(authentication, "ROLE_SECRETARIA");
        return admin.resumen(verFinanzas);
    }

    @GetMapping("/usuarios")
    public List<UsuarioAdmin> usuarios() {
        return admin.listarUsuarios();
    }

    @PatchMapping("/usuarios/{id}/estado")
    public UsuarioAdmin cambiarEstadoUsuario(@PathVariable Integer id,
                                             @Valid @RequestBody EstadoUsuarioDto dto,
                                             Authentication authentication,
                                             HttpServletRequest request) {
        return admin.cambiarEstadoUsuario(id, dto.activo(), authentication.getName(), request.getRemoteAddr());
    }

    @GetMapping("/clases-prueba")
    public List<ClasePruebaAdmin> clasesPrueba() {
        return admin.listarClasesPrueba();
    }

    @PatchMapping("/clases-prueba/{id}/estado")
    public ClasePruebaAdmin cambiarEstadoClase(@PathVariable Integer id,
                                               @Valid @RequestBody EstadoClaseDto dto,
                                               Authentication authentication,
                                               HttpServletRequest request) {
        return admin.cambiarEstadoClasePrueba(id, dto.estado(), authentication.getName(), request.getRemoteAddr());
    }

    @GetMapping("/cursos")
    public List<CursoAdmin> cursos() {
        return admin.listarCursos();
    }

    @GetMapping("/pagos-pendientes")
    public List<PagoPendienteAdmin> pagosPendientes() {
        return admin.listarPagosPendientes();
    }

    @GetMapping("/cuotas-vencidas")
    public List<CuotaVencidaAdmin> cuotasVencidas() {
        return admin.listarCuotasVencidas();
    }

    private boolean tieneRol(Authentication authentication, String rol) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(rol));
    }
}
