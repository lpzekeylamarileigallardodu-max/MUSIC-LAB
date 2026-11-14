# Observaciones del ingeniero — qué se hizo

| Observación | Estado |
|---|---|
| Queries nativas → 0, pasar a JPA | ✅ Cero `JdbcTemplate`, cero `nativeQuery`. Todo con entidades + JPQL / Spring Data |
| Flujo completo | ✅ Inscripción → cuotas → pago con comprobante → verificación → vencimientos automáticos |
| Docentes, estudiantes, flujo del sistema | ✅ Docente: mi horario + Excel del curso. Estudiante: mi horario, informar pago, libreta en Excel |
| Sistema distinto a CRUD | ✅ Procesos con reglas de negocio (ver abajo) + tablero de horarios con arrastrar y soltar |
| Generar Excel (Jasper o Apache POI) | ✅ Apache POI 5.4.1: 7 reportes .xlsx |
| Base de datos dockerizada | ✅ `docker-compose.yml` con PostgreSQL 16 (solo la base; la app corre en la PC) |

## Base de datos
- Se revisó `database/academia_jaime_gallardo_db.sql`: carga sin errores en PostgreSQL 16 (23 tablas, 9 triggers, índices y datos de ejemplo).
- El archivo `academia_jaime_gallardo2` (en `Desktop/universidad`) es una **versión vieja** (11 tablas, sin aulas, cuotas, eventos…). El que vale es el de `database/`.
- No hizo falta cambiar el esquema: todo lo nuevo usa las tablas que ya existían.

## 1. JPA en lugar de SQL nativo
- Entidades nuevas (`infrastructure/adapter/out/persistence`): Docente, Inscripcion, Cuota, Pago, Transaccion, Asistencia,
  Evaluacion, Instrumento, PrestamoInstrumento, Bitacora, MaterialApoyo, Evento, ParticipacionEvento. Curso, Aula y Horario se completaron.
- Repositorios Spring Data con consultas JPQL (`join fetch`, `left join ... on`, subconsultas `exists`, `group by`).
- Reescritos: `AdminRepositorioAdapter`, `DocenteRepositorioAdapter`, `EstudianteRepositorioAdapter` y el insert nativo de
  `SpringDataEstudianteRepository`. Se comparó la respuesta de los 21 endpoints antes y después: idéntica.
- Lo que antes hacía SQL (`FILTER`, `array_position`, `ON CONFLICT`) ahora se resuelve en Java (`Apoyo.java`).

## 2. Horarios: tablero con bloques que se mueven (Panel → Horarios)
Flujos distintos (no solo editar/eliminar):
1. **Arrastrar** un bloque a otro día u hora (pasos de 15 min).
2. **Estirar** el borde inferior para cambiar la duración.
3. **Dibujar** en un hueco vacío para crear una clase.
4. **Editar** en una ventana que revisa choques en vivo contra el servidor.
5. **Duplicar** a otro día.
6. **Activar / desactivar** (una clase inactiva no ocupa el aula).
7. **Eliminar** (con confirmación).
8. **Deshacer** la última acción (botón o Ctrl+Z).
9. **Teclado**: ↑↓ mueve 15 min, ←→ cambia de día, Shift+↑↓ duración, Supr elimina.
- Mientras arrastras, el recuadro se pone **verde** (libre) o **rojo** (choca) y dice con qué.
- Filtros por aula, docente y curso; colorear por curso/aula/docente; horas por semana de cada aula.
- Reglas en el backend (`GestionHorariosServiceImpl`): 07:00–22:00, 30 min a 4 h, pasos de 15 min,
  sin choque de aula, sin choque de docente, curso y aula activos. Todo queda en la bitácora.
- Recepción solo ve; dirección y secretaría modifican.
- Docente y estudiante tienen **Mi horario** (el mismo tablero, solo lectura).

## 3. Procesos (lo que va más allá del CRUD) — `GestionAcademicaServiceImpl`
- **Inscribir** (Usuarios → Inscribir): si es invitado pasa a estudiante, crea la inscripción (o reactiva una retirada)
  y genera la cuota del mes (vence el 20; si se inscribe después del 20, a los 10 días).
- **Retirar**: la inscripción pasa a RETIRADA y se anulan las cuotas que aún no vencieron (las vencidas quedan como deuda).
- **Generar cuotas del mes** para todas las inscripciones activas (no duplica).
- **Pago con comprobante**: el estudiante informa el pago (QR o transferencia, n.º de operación) → queda en revisión →
  secretaría **aprueba** (con el monto que llegó; si es menor, no deja) o **rechaza** con motivo → el estudiante puede reenviar.
  No se acepta el mismo n.º de comprobante dos veces.
- **Cobro en efectivo** en ventanilla: la cuota queda pagada al instante.
- **Tarea programada** (cada madrugada y al arrancar): cuotas vencidas → VENCIDA, préstamos fuera de plazo → ATRASADO.

## 4. Reportes Excel (Apache POI) — `ApachePoiExcelAdapter`
Encabezados con color, filtros, paneles inmovilizados, formatos de Bs/fecha/% y totales con fórmulas `SUM`.
- Administración (Panel → Reportes, y botones en cada sección): **Horarios** (cuadrícula semanal con colores, una hoja por aula),
  **Cursos e inscripciones**, **Usuarios**, **Cuotas y morosidad**, **Pagos** (ingresos por mes y método).
- Docente (Mis alumnos): libro del curso con alumnos, notas por evaluación y asistencia por fecha.
- Estudiante (Mi horario / Asistencia y notas): su libreta.

## 5. Base de datos en Docker
```
docker compose up -d      # o doble clic en INICIAR.bat, que la levanta solo
```
- Solo la base va en Docker: PostgreSQL 16 en `localhost:5433` (para no chocar con un PostgreSQL de Windows en 5432).
- La base se carga sola con `database/academia_jaime_gallardo_db.sql` la primera vez.
- `INICIAR.bat` levanta el contenedor, espera a que la base responda y arranca backend (8080) y frontend (5173).
- `docker compose down -v` borra la base para empezar de cero.
- La clave de Gmail ya no está en `application.yaml`: va en `backend/src/main/resources/secretos.yaml` (no se sube a GitHub; ver `secretos.ejemplo.yaml`).

## 6. Arreglos
- En celular el panel se salía de la pantalla (el menú horizontal estiraba la página). Corregido en `admin.css`.
- Errores de los triggers de PostgreSQL ahora llegan al usuario como mensaje claro (409) en vez de error 500.

## Endpoints nuevos
| Método | Ruta | Quién |
|---|---|---|
| GET | /api/admin/horarios | administrativos |
| POST | /api/admin/horarios · /verificar | dir./secr. (verificar: todos) |
| PUT | /api/admin/horarios/{id} | dir./secr. |
| PATCH | /api/admin/horarios/{id}/mover · /estado | dir./secr. |
| POST | /api/admin/horarios/{id}/duplicar | dir./secr. |
| DELETE | /api/admin/horarios/{id} | dir./secr. |
| GET | /api/admin/usuarios/{id}/inscripciones | dir./secr. |
| POST | /api/admin/inscripciones · PATCH /{id}/retirar | dir./secr. |
| POST | /api/admin/cuotas/generar · /cuotas/{id}/cobrar | dir./secr. |
| POST | /api/admin/pagos/{id}/aprobar · /rechazar | dir./secr. |
| POST | /api/admin/vencimientos/actualizar | director |
| GET | /api/admin/reportes/{usuarios,cursos,horarios,cuotas,pagos}.xlsx | horarios/cursos: todos; resto dir./secr. |
| GET | /api/docente/horario · /api/docente/cursos/{id}/reporte.xlsx | docente |
| GET | /api/estudiante/horario · /api/estudiante/reporte.xlsx | estudiante |
| POST | /api/estudiante/cuotas/{id}/comprobante | estudiante |
