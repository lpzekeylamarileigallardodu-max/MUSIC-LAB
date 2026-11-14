# Panel del docente — qué se agregó

Misma estructura que tus zips (`backend/` y `frontend/`): copia encima y acepta reemplazar.

## NUEVOS — backend/src/main/java/com/academia/academia/
- domain/model/DocentePanel.java
- domain/port/in/DocenteCasosDeUso.java
- domain/port/out/DocenteRepositorioPuerto.java
- application/service/DocenteServiceImpl.java
- infrastructure/adapter/in/web/DocenteController.java
- infrastructure/adapter/in/web/dto/DocenteDto.java
- infrastructure/adapter/out/persistence/DocenteRepositorioAdapter.java

## NUEVOS — frontend/src/components/docente/
PanelDocente, InicioDoc, CursosDoc, AlumnosDoc, AsistenciaDoc, EvaluacionesDoc, MaterialDoc (.tsx),
ConCurso.tsx, util.ts, docente.css

## MODIFICADOS (partí de TUS versiones actuales)
- backend/.../infrastructure/config/SecurityConfig.java  (+ `/api/docente/**` solo rol DOCENTE)
- frontend/src/api.ts   (+ tipos y funciones del docente al final)
- frontend/src/App.tsx  (+ rama: si la sesión es DOCENTE, muestra su panel)

## Qué puede hacer el docente
| Sección | Ver | Modificar |
|---|---|---|
| Inicio | próxima clase, clases de hoy, evaluaciones sin calificar, asistencia | — |
| Mis cursos | horarios, alumnos activos | — |
| Mis alumnos | alumnos activos por curso, % asistencia, promedio | — |
| Asistencia | lista por curso y fecha | guardar/corregir asistencia del día |
| Evaluaciones | notas por curso | crear evaluación para todo el curso, poner nota y comentario |
| Material de apoyo | su material | publicar (enlace), retirar / publicar de nuevo |

## Reglas
- Solo ve y modifica SUS cursos; un curso/evaluación/material ajeno responde "no encontrado".
- El id del docente sale de la sesión, nunca de la petición.
- Asistencia: no admite fechas futuras ni alumnos que no sean del curso; estados válidos
  PRESENTE/AUSENTE/TARDANZA/LICENCIA; si repite el día, corrige (no duplica).
- Nota entre 0 y 100 (o vacía). No se repite el nombre de una evaluación en el mismo curso.
- Material: enlace http(s):// o ruta del sitio (/materiales/...). No se suben archivos.
- Todo cambio queda en `bitacora`.

## Probar
Entra con `lucia.fernandez@academiajaimegallardo.com` / `clave123` (Guitarra),
`marco.vargas@...` (Piano) o `andrea.salinas@...` (Canto y Batería).
