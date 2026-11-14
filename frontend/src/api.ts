export type TipoUsuario = "DIRECTOR" | "SECRETARIA" | "RECEPCIONISTA" | "DOCENTE" | "ESTUDIANTE" | "INVITADO";

export interface Sesion {
  tipoUsuario: TipoUsuario;
  nombre: string;
}

export interface DatosRegistro {
  nombres: string;
  apPat: string;
  apMat?: string;
  ci: string;
  telefono?: string;
  direccion?: string;
  correo: string;
  password: string;
}

export interface Curso {
  id: number;
  nombre: string;
}

export interface Horario {
  id: number;
  cursoId: number;
  curso: string;
  docente: string;
  aula: string;
  dia: string; // LUNES, MARTES, MIERCOLES...
  horaInicio: string;
  horaFin: string;
}

export interface DatosClasePrueba {
  nombres: string;
  apPat: string;
  apMat?: string;
  telefono: string;
  cursoId: number;
  fecha: string; // aaaa-mm-dd
}

/** El servidor respondió 401: hay que iniciar sesión (o registrarse). */
export class NoAutenticadoError extends Error {
  constructor() {
    super("Debes iniciar sesión para continuar");
  }
}

const SIN_CONEXION = "No se pudo conectar con el servidor. Revisa que el backend esté encendido.";

/** Envía una petición JSON. Si la respuesta no es 2xx, lanza un Error con el "mensaje" del backend. */
async function peticion<T>(metodo: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", url: string, cuerpo?: unknown): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }

  // En el login un 401 significa "credenciales incorrectas" (trae su propio mensaje)
  if (respuesta.status === 401 && !url.startsWith("/api/auth/login")) {
    throw new NoAutenticadoError();
  }

  if (respuesta.status === 403) {
    throw new Error("Tu cuenta no tiene permiso para esta acción");
  }

  let datos: { mensaje?: string } | null = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null; // respuestas sin cuerpo (204)
  }

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje ?? "Ocurrió un error inesperado. Inténtalo de nuevo.");
  }
  return datos as T;
}

// ---------------- Sesión ----------------

export async function iniciarSesion(correo: string, password: string): Promise<Sesion> {
  const r = await peticion<Sesion>("POST", "/api/auth/login", { correo, password });
  return { tipoUsuario: r.tipoUsuario, nombre: r.nombre };
}

/** Crea la cuenta y el servidor deja la sesión iniciada. */
export async function registrarse(datos: DatosRegistro): Promise<Sesion> {
  const r = await peticion<Sesion>("POST", "/api/auth/register", datos);
  return { tipoUsuario: r.tipoUsuario, nombre: r.nombre };
}

/** Pregunta al servidor quién tiene la sesión abierta. Nunca falla: devuelve null si nadie. */
export async function obtenerSesion(): Promise<Sesion | null> {
  try {
    const r = await peticion<Sesion>("GET", "/api/auth/me");
    return { tipoUsuario: r.tipoUsuario, nombre: r.nombre };
  } catch {
    return null;
  }
}

export async function cerrarSesionServidor(): Promise<void> {
  try {
    await peticion<void>("POST", "/api/auth/logout");
  } catch {
    /* si el servidor no responde, igual se cierra la sesión en pantalla */
  }
}

// ---------------- Cursos, horarios y clase de prueba ----------------

export function listarCursos(): Promise<Curso[]> {
  return peticion<Curso[]>("GET", "/api/cursos");
}

export function consultarHorarios(cursoId?: number, dia?: string): Promise<Horario[]> {
  const parametros = new URLSearchParams();
  if (cursoId !== undefined) parametros.set("cursoId", String(cursoId));
  if (dia) parametros.set("dia", dia);
  const texto = parametros.toString();
  return peticion<Horario[]>("GET", texto ? `/api/horarios?${texto}` : "/api/horarios");
}

export async function agendarClasePrueba(datos: DatosClasePrueba): Promise<string> {
  const r = await peticion<{ mensaje: string }>("POST", "/api/clases-prueba", datos);
  return r.mensaje;
}

// ---------------- Panel de administración ----------------

/** Personal administrativo: los únicos que ven el panel. */
export const TIPOS_ADMIN: TipoUsuario[] = ["DIRECTOR", "SECRETARIA", "RECEPCIONISTA"];

export function esAdministrativo(sesion: Sesion | null): boolean {
  return sesion !== null && TIPOS_ADMIN.includes(sesion.tipoUsuario);
}

export interface ResumenAdmin {
  estudiantes: number;
  docentes: number;
  invitados: number;
  cursosActivos: number;
  inscripcionesActivas: number;
  clasesPruebaProgramadas: number;
  prospectosNuevos: number;
  prestamosAtrasados: number;
  /** null para RECEPCIONISTA (no ve finanzas) */
  pagosPorVerificar: number | null;
  cuotasVencidas: number | null;
  ingresosMes: number | null;
}

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  ci: string;
  telefono: string | null;
  tipoUsuario: TipoUsuario;
  activo: boolean;
  fechaRegistro: string; // ISO
}

export type EstadoClase = "PROGRAMADA" | "REALIZADA" | "CANCELADA" | "NO_ASISTIO";

export interface ClasePruebaAdmin {
  id: number;
  prospecto: string;
  telefono: string | null;
  correo: string | null;
  curso: string;
  fechaHora: string; // ISO
  estado: EstadoClase;
  observaciones: string | null;
}

export interface HorarioCurso {
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface CursoAdmin {
  id: number;
  nombre: string;
  docente: string;
  nivel: string | null;
  costoMensual: number | null;
  activo: boolean;
  inscritos: number;
  horarios: HorarioCurso[];
}

export interface PagoPendienteAdmin {
  idTransaccion: number;
  estudiante: string;
  curso: string;
  concepto: string | null;
  monto: number;
  metodoPago: string;
  nroComprobante: string | null;
  fecha: string; // ISO
  urlComprobante: string | null;
  /** lo que debía pagar (null si el pago no está ligado a una cuota) */
  montoCuota: number | null;
}

export interface CuotaVencidaAdmin {
  idCuota: number;
  estudiante: string;
  telefono: string | null;
  curso: string;
  mes: number;
  anio: number;
  monto: number;
  fechaVencimiento: string; // aaaa-mm-dd
}

export const adminResumen = () => peticion<ResumenAdmin>("GET", "/api/admin/resumen");
export const adminUsuarios = () => peticion<UsuarioAdmin[]>("GET", "/api/admin/usuarios");
export const adminCambiarEstadoUsuario = (id: number, activo: boolean) =>
  peticion<UsuarioAdmin>("PATCH", `/api/admin/usuarios/${id}/estado`, { activo });
/** Usa el endpoint que ya existía (solo DIRECTOR y SECRETARIA). */
export const adminPromoverAEstudiante = (id: number) =>
  peticion<{ id: number; nombre: string; correo: string; tipoUsuario: TipoUsuario }>(
    "POST",
    `/api/usuarios/${id}/promover-estudiante`,
  );
export const adminClasesPrueba = () => peticion<ClasePruebaAdmin[]>("GET", "/api/admin/clases-prueba");
export const adminCambiarEstadoClase = (id: number, estado: EstadoClase) =>
  peticion<ClasePruebaAdmin>("PATCH", `/api/admin/clases-prueba/${id}/estado`, { estado });
export const adminCursos = () => peticion<CursoAdmin[]>("GET", "/api/admin/cursos");
export const adminPagosPendientes = () => peticion<PagoPendienteAdmin[]>("GET", "/api/admin/pagos-pendientes");
export const adminCuotasVencidas = () => peticion<CuotaVencidaAdmin[]>("GET", "/api/admin/cuotas-vencidas");

// ---------------- Panel del estudiante ----------------

export function esEstudiante(sesion: Sesion | null): boolean {
  return sesion !== null && sesion.tipoUsuario === "ESTUDIANTE";
}

export interface ProximaClase {
  curso: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface ResumenEstudiante {
  cursosActivos: number;
  cuotasPendientes: number;
  cuotasVencidas: number;
  montoPorPagar: number;
  comprobantesEnRevision: number;
  /** null si todavía no tiene clases registradas */
  asistenciaPorcentaje: number | null;
  /** null si todavía no tiene notas */
  promedioNotas: number | null;
  prestamosActivos: number;
  /** null si sus cursos no tienen horarios */
  proximaClase: ProximaClase | null;
}

export interface HorarioItem {
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface CursoEstudiante {
  idInscripcion: number;
  idCurso: number;
  curso: string;
  nivel: string | null;
  docente: string;
  estadoInscripcion: "ACTIVA" | "INACTIVA" | "RETIRADA" | "FINALIZADA";
  fechaInscripcion: string; // ISO
  costoMensual: number | null;
  horarios: HorarioItem[];
}

export type EstadoCuota = "PENDIENTE" | "VENCIDA" | "PAGADA" | "ANULADA";

export interface CuotaEstudiante {
  idCuota: number;
  curso: string;
  mes: number;
  anio: number;
  monto: number;
  fechaVencimiento: string; // aaaa-mm-dd
  estado: EstadoCuota;
  comprobanteEnRevision: boolean;
}

export type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "TARDANZA" | "LICENCIA";

export interface AsistenciaEstudiante {
  curso: string;
  fecha: string; // aaaa-mm-dd
  estado: EstadoAsistencia;
  observacion: string | null;
}

export interface EvaluacionEstudiante {
  curso: string;
  nombre: string;
  nota: number | null;
  fecha: string | null; // aaaa-mm-dd
  comentario: string | null;
}

export interface MaterialEstudiante {
  id: number;
  curso: string;
  titulo: string;
  descripcion: string | null;
  tipo: "PARTITURA" | "GUIA" | "AUDIO" | "VIDEO" | "ENLACE" | "OTRO";
  url: string;
  docente: string;
  fechaSubida: string; // ISO
}

export interface PrestamoEstudiante {
  id: number;
  instrumento: string;
  codigo: string;
  fechaPrestamo: string; // ISO
  fechaDevolucionPrevista: string; // aaaa-mm-dd
  fechaDevolucionReal: string | null; // ISO
  estado: "ACTIVO" | "ATRASADO" | "DEVUELTO" | "PERDIDO";
}

export interface EventoEstudiante {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  inicio: string; // ISO
  fin: string | null; // ISO
  lugar: string | null;
  estado: "APROBADO" | "REALIZADO";
  /** INSCRITO, CONFIRMADO, CANCELADO, ASISTIO; null si no participa */
  miParticipacion: string | null;
}

export const estResumen = () => peticion<ResumenEstudiante>("GET", "/api/estudiante/resumen");
export const estCursos = () => peticion<CursoEstudiante[]>("GET", "/api/estudiante/cursos");
export const estCuotas = () => peticion<CuotaEstudiante[]>("GET", "/api/estudiante/cuotas");
export const estAsistencia = () => peticion<AsistenciaEstudiante[]>("GET", "/api/estudiante/asistencia");
export const estEvaluaciones = () => peticion<EvaluacionEstudiante[]>("GET", "/api/estudiante/evaluaciones");
export const estMaterial = () => peticion<MaterialEstudiante[]>("GET", "/api/estudiante/material");
export const estPrestamos = () => peticion<PrestamoEstudiante[]>("GET", "/api/estudiante/prestamos");
export const estEventos = () => peticion<EventoEstudiante[]>("GET", "/api/estudiante/eventos");

// ---------------- Panel del docente ----------------

export function esDocente(sesion: Sesion | null): boolean {
  return sesion !== null && sesion.tipoUsuario === "DOCENTE";
}

export interface ProximaClaseDocente {
  curso: string;
  dia: string;
  fecha: string; // aaaa-mm-dd: el día concreto en que ocurre
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface ResumenDocente {
  cursosActivos: number;
  alumnosActivos: number;
  clasesHoy: number;
  evaluacionesSinCalificar: number;
  /** null si todavía no registró asistencia */
  asistenciaPorcentaje: number | null;
  /** null si sus cursos no tienen horarios */
  proximaClase: ProximaClaseDocente | null;
}

export interface CursoDocente {
  idCurso: number;
  curso: string;
  nivel: string | null;
  activo: boolean;
  alumnosActivos: number;
  horarios: HorarioItem[];
}

export interface AlumnoCurso {
  idInscripcion: number;
  nombre: string;
  correo: string;
  asistenciaPorcentaje: number | null;
  promedio: number | null;
}

export interface AsistenciaAlumno {
  idInscripcion: number;
  nombre: string;
  /** null: ese día todavía no se registró */
  estado: EstadoAsistencia | null;
  observacion: string | null;
}

export interface EvaluacionDocente {
  idEvaluacion: number;
  idInscripcion: number;
  alumno: string;
  nombre: string;
  nota: number | null;
  fecha: string | null; // aaaa-mm-dd
  comentario: string | null;
}

export type TipoMaterial = MaterialEstudiante["tipo"];

export interface MaterialDocente {
  id: number;
  idCurso: number;
  curso: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoMaterial;
  url: string;
  fechaSubida: string; // ISO
  activo: boolean;
}

export interface Guardado {
  cantidad: number;
}

export interface EntradaAsistencia {
  idInscripcion: number;
  estado: EstadoAsistencia;
  observacion: string | null;
}

export interface NuevoMaterial {
  idCurso: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoMaterial;
  url: string;
}

export const docResumen = () => peticion<ResumenDocente>("GET", "/api/docente/resumen");
export const docCursos = () => peticion<CursoDocente[]>("GET", "/api/docente/cursos");
export const docAlumnos = (idCurso: number) =>
  peticion<AlumnoCurso[]>("GET", `/api/docente/cursos/${idCurso}/alumnos`);
export const docAsistencia = (idCurso: number, fecha: string) =>
  peticion<AsistenciaAlumno[]>("GET", `/api/docente/cursos/${idCurso}/asistencia?fecha=${encodeURIComponent(fecha)}`);
export const docGuardarAsistencia = (idCurso: number, fecha: string, registros: EntradaAsistencia[]) =>
  peticion<Guardado>("POST", `/api/docente/cursos/${idCurso}/asistencia`, { fecha, registros });
export const docEvaluaciones = (idCurso: number) =>
  peticion<EvaluacionDocente[]>("GET", `/api/docente/cursos/${idCurso}/evaluaciones`);
export const docCrearEvaluacion = (idCurso: number, nombre: string, fecha: string | null) =>
  peticion<Guardado>("POST", `/api/docente/cursos/${idCurso}/evaluaciones`, { nombre, fecha });
export const docCalificar = (idEvaluacion: number, nota: number | null, comentario: string | null) =>
  peticion<EvaluacionDocente>("PATCH", `/api/docente/evaluaciones/${idEvaluacion}`, { nota, comentario });
export const docMaterial = () => peticion<MaterialDocente[]>("GET", "/api/docente/material");
export const docAgregarMaterial = (datos: NuevoMaterial) =>
  peticion<MaterialDocente>("POST", "/api/docente/material", datos);
export const docEstadoMaterial = (id: number, activo: boolean) =>
  peticion<MaterialDocente>("PATCH", `/api/docente/material/${id}/estado`, { activo });

// ---------------- Descargas (Excel) ----------------

/**
 * Descarga un archivo del servidor (los reportes .xlsx) y lo guarda con el nombre que manda el backend.
 * Lanza NoAutenticadoError si la sesión venció.
 */
export async function descargar(url: string, nombrePorDefecto: string): Promise<void> {
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error(SIN_CONEXION);
  }
  if (r.status === 401) throw new NoAutenticadoError();
  if (r.status === 403) throw new Error("Tu cuenta no tiene permiso para este reporte");
  if (!r.ok) {
    let mensaje = "No se pudo generar el reporte";
    try {
      mensaje = (await r.json()).mensaje ?? mensaje;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(mensaje);
  }
  const disposicion = r.headers.get("Content-Disposition") ?? "";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposicion);
  const simple = /filename="?([^";]+)"?/i.exec(disposicion);
  const nombre = utf8 ? decodeURIComponent(utf8[1]) : simple ? simple[1] : nombrePorDefecto;

  const blob = await r.blob();
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

export type ReporteAdmin = "usuarios" | "cursos" | "horarios" | "cuotas" | "pagos";
export const descargarReporteAdmin = (tipo: ReporteAdmin) =>
  descargar(`/api/admin/reportes/${tipo}.xlsx`, `${tipo}.xlsx`);
export const descargarReporteCurso = (idCurso: number) =>
  descargar(`/api/docente/cursos/${idCurso}/reporte.xlsx`, "curso.xlsx");
export const descargarLibreta = () => descargar("/api/estudiante/reporte.xlsx", "mi-libreta.xlsx");

// ---------------- Tablero de horarios ----------------

export type Dia = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";
export const DIAS: Dia[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

/** Un horario semanal de un curso en un aula: se dibuja como un bloque del tablero. */
export interface Bloque {
  id: number;
  idCurso: number;
  curso: string;
  idDocente: number;
  docente: string;
  idAula: number;
  aula: string;
  dia: Dia;
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  activo: boolean;
  cursoActivo: boolean;
}

export interface AulaItem {
  id: number;
  nombre: string;
  capacidad: number | null;
  activo: boolean;
}

export interface CursoItem {
  id: number;
  nombre: string;
  idDocente: number;
  docente: string;
  activo: boolean;
}

export interface Tablero {
  bloques: Bloque[];
  aulas: AulaItem[];
  cursos: CursoItem[];
}

export interface DatosBloque {
  idCurso: number;
  idAula: number;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
}

export interface Choque {
  idHorario: number | null;
  curso: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  motivo: "AULA" | "DOCENTE" | "MISMO_CURSO";
}

export const horTablero = () => peticion<Tablero>("GET", "/api/admin/horarios");
export const horVerificar = (id: number | null, datos: DatosBloque) =>
  peticion<Choque[]>("POST", "/api/admin/horarios/verificar", { id, ...datos });
export const horCrear = (datos: DatosBloque) => peticion<Bloque>("POST", "/api/admin/horarios", datos);
export const horActualizar = (id: number, datos: DatosBloque) =>
  peticion<Bloque>("PUT", `/api/admin/horarios/${id}`, datos);
export const horMover = (id: number, dia: Dia, horaInicio: string, idAula?: number) =>
  peticion<Bloque>("PATCH", `/api/admin/horarios/${id}/mover`, { dia, horaInicio, idAula });
export const horDuplicar = (id: number, dia?: Dia, horaInicio?: string) =>
  peticion<Bloque>("POST", `/api/admin/horarios/${id}/duplicar`, { dia, horaInicio });
export const horEstado = (id: number, activo: boolean) =>
  peticion<Bloque>("PATCH", `/api/admin/horarios/${id}/estado`, { activo });
export const horEliminar = (id: number) => peticion<void>("DELETE", `/api/admin/horarios/${id}`);
export const docHorario = () => peticion<Bloque[]>("GET", "/api/docente/horario");
export const estHorario = () => peticion<Bloque[]>("GET", "/api/estudiante/horario");

// ---------------- Inscripciones, cuotas y pagos ----------------

export interface InscripcionAdmin {
  id: number;
  idCurso: number;
  curso: string;
  docente: string;
  estado: "ACTIVA" | "INACTIVA" | "RETIRADA" | "FINALIZADA";
  fecha: string; // ISO
  cuotasPorPagar: number;
}

export interface ResultadoInscripcion {
  idInscripcion: number;
  estudiante: string;
  curso: string;
  pasoAEstudiante: boolean;
  reactivada: boolean;
  cuotasGeneradas: number;
}

export interface ResultadoPago {
  idTransaccion: number;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  estudiante: string;
  curso: string;
  idCuota: number | null;
  estadoCuota: string | null;
}

export const CODIGOS_RECHAZO: Record<string, string> = {
  COMPROBANTE_ILEGIBLE: "Comprobante ilegible",
  MONTO_INCORRECTO: "Monto incorrecto",
  NO_ENCONTRADO_EN_BANCO: "No figura en el banco",
  COMPROBANTE_DUPLICADO: "Comprobante duplicado",
  OTRO: "Otro motivo",
};

export const adminInscripcionesDe = (idUsuario: number) =>
  peticion<InscripcionAdmin[]>("GET", `/api/admin/usuarios/${idUsuario}/inscripciones`);
export const adminInscribir = (idUsuario: number, idCurso: number) =>
  peticion<ResultadoInscripcion>("POST", "/api/admin/inscripciones", { idUsuario, idCurso });
export const adminRetirar = (idInscripcion: number) =>
  peticion<{ cuotasAnuladas: number }>("PATCH", `/api/admin/inscripciones/${idInscripcion}/retirar`);
export const adminGenerarCuotas = (mes: number, anio: number) =>
  peticion<{ mes: number; anio: number; cuotasCreadas: number; yaExistian: number }>(
    "POST", "/api/admin/cuotas/generar", { mes, anio });
export const adminCobrarEfectivo = (idCuota: number, montoRecibido?: number) =>
  peticion<ResultadoPago>("POST", `/api/admin/cuotas/${idCuota}/cobrar`, { montoRecibido });
export const adminAprobarPago = (idTransaccion: number, montoRecibido?: number) =>
  peticion<ResultadoPago>("POST", `/api/admin/pagos/${idTransaccion}/aprobar`, { montoRecibido });
export const adminRechazarPago = (idTransaccion: number, codigoError: string, observaciones: string | null) =>
  peticion<ResultadoPago>("POST", `/api/admin/pagos/${idTransaccion}/rechazar`, { codigoError, observaciones });
export const estEnviarComprobante = (
  idCuota: number,
  metodoPago: "QR" | "TRANSFERENCIA",
  nroComprobante: string,
  urlComprobante: string | null,
) => peticion<ResultadoPago>("POST", `/api/estudiante/cuotas/${idCuota}/comprobante`, { metodoPago, nroComprobante, urlComprobante });
