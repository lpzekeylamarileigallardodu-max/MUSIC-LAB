package com.academia.academia.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private static final String DIRECTOR = "DIRECTOR";
    private static final String SECRETARIA = "SECRETARIA";
    private static final String RECEPCIONISTA = "RECEPCIONISTA";

    @Value("${academia.cors.origenes:http://localhost:*,http://127.0.0.1:*}")
    private List<String> origenesPermitidos;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository) throws Exception {
        http
                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf.disable())
                .securityContext(contexto -> contexto.securityContextRepository(securityContextRepository))

                .exceptionHandling(errores -> errores.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/health", "/api/cursos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/", "/index.html", "/assets/**", "/imagenes/**", "/favicon.ico").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/admin/horarios").hasAnyRole(DIRECTOR, SECRETARIA, RECEPCIONISTA)
                        .requestMatchers(HttpMethod.POST, "/api/admin/horarios/verificar").hasAnyRole(DIRECTOR, SECRETARIA, RECEPCIONISTA)
                        .requestMatchers("/api/admin/horarios/**").hasAnyRole(DIRECTOR, SECRETARIA)

                        .requestMatchers(HttpMethod.PATCH, "/api/admin/usuarios/*/estado").hasRole(DIRECTOR)
                        .requestMatchers(HttpMethod.PUT, "/api/admin/usuarios/*").hasRole(DIRECTOR)
                        .requestMatchers(HttpMethod.DELETE, "/api/admin/usuarios/*").hasRole(DIRECTOR)
                        .requestMatchers("/api/admin/vencimientos/**").hasRole(DIRECTOR)
                        .requestMatchers("/api/admin/reportes/horarios.xlsx", "/api/admin/reportes/cursos.xlsx")
                                .hasAnyRole(DIRECTOR, SECRETARIA, RECEPCIONISTA)
                        .requestMatchers("/api/admin/usuarios/**", "/api/admin/pagos-pendientes", "/api/admin/cuotas-vencidas",
                                "/api/admin/inscripciones/**", "/api/admin/cuotas/**", "/api/admin/pagos/**",
                                "/api/admin/reportes/**")
                                .hasAnyRole(DIRECTOR, SECRETARIA)
                        .requestMatchers("/api/admin/**").hasAnyRole(DIRECTOR, SECRETARIA, RECEPCIONISTA)

                        .requestMatchers("/api/archivos/comprobantes/**").hasAnyRole(DIRECTOR, SECRETARIA, "ESTUDIANTE")

                        .requestMatchers("/api/estudiante/**").hasRole("ESTUDIANTE")

                        .requestMatchers("/api/docente/**").hasRole("DOCENTE")
                        .requestMatchers("/api/usuarios/**").hasAnyRole(DIRECTOR, SECRETARIA)
                        .anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(origenesPermitidos);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
