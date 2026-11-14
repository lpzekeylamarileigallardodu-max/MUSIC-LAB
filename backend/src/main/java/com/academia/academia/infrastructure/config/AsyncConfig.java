package com.academia.academia.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Activa @Async (se usa para enviar correos sin hacer esperar al usuario). */
@Configuration
@EnableAsync
public class AsyncConfig {
}
