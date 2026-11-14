# Academia Jaime Gallardo

Sistema de gestión de una academia de música: inscripciones, cuotas y pagos, horarios, asistencia, notas, material, préstamos de instrumentos y reportes en Excel.

- **Backend:** Spring Boot 4 (Java 21), arquitectura hexagonal, JPA (sin SQL nativo), Apache POI.
- **Frontend:** React 18 + TypeScript + Vite.
- **Base de datos:** PostgreSQL 16 en Docker.

## Cómo levantarlo

1. Instalar Docker Desktop, Java 21 y Node (o doble clic en `INSTALAR_TODO.bat`, que instala lo que falte).
2. Doble clic en `INICIAR.bat`: levanta la base en Docker (`localhost:5433`), el backend (`localhost:8080`) y el frontend (`localhost:5173`).
3. Usuarios de prueba en `perfiles_prueba.txt` (clave `clave123`).

Para comprobar que todo responde: doble clic en `PROBAR.bat` (resultado en `pruebas/probar.log`).

Correo de bienvenida (opcional): copiar `backend/src/main/resources/secretos.ejemplo.yaml` como `secretos.yaml` y poner la clave de aplicación de Gmail.

## Documentación
- `CAMBIOS_OBSERVACIONES.md`: qué se hizo por cada observación del ingeniero.
- `CAMBIOS_PANEL_DOCENTE.md`: cambios del panel docente.
