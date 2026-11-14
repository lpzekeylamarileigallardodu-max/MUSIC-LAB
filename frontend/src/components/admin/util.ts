const dinero = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });

export const bs = (valor: number | null | undefined): string => (valor == null ? "—" : dinero.format(valor));

export const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });

export const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-BO", { dateStyle: "medium" });

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombreMes = (mes: number): string => MESES[mes - 1] ?? String(mes);

const DIAS: Record<string, string> = {
  LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié", JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom",
};
export const diaCorto = (dia: string): string => DIAS[dia] ?? dia;

export const TIPO_LEGIBLE: Record<string, string> = {
  DIRECTOR: "Director",
  SECRETARIA: "Secretaría",
  RECEPCIONISTA: "Recepción",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
  INVITADO: "Invitado",
};

export const ESTADO_CLASE_LEGIBLE: Record<string, string> = {
  PROGRAMADA: "Programada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
};
