import type { Bloque, Dia } from "../../api";

export const APERTURA = 7 * 60;
export const CIERRE = 22 * 60;
export const PASO = 15;
export const DURACION_MIN = 30;
export const DURACION_MAX = 240;

export const DIA_LARGO: Record<Dia, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves",
  VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};
export const DIA_CORTO: Record<Dia, string> = {
  LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié", JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom",
};

export const aMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const aHora = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const redondear = (min: number, paso = PASO): number => Math.round(min / paso) * paso;

export const limitar = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

export const duracion = (b: { horaInicio: string; horaFin: string }): number => aMinutos(b.horaFin) - aMinutos(b.horaInicio);

export const textoDuracion = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
};

export const opcionesHora = (desde = APERTURA, hasta = CIERRE): string[] => {
  const lista: string[] = [];
  for (let t = desde; t <= hasta; t += PASO) lista.push(aHora(t));
  return lista;
};

export type Candidato = {
  id: number | null;
  idCurso: number;
  idAula: number;
  idDocente: number;
  dia: Dia;
  inicio: number;
  fin: number;
};

export type ChoqueLocal = { bloque: Bloque; motivo: "AULA" | "DOCENTE" | "MISMO_CURSO" };

export function choquesLocales(bloques: Bloque[], c: Candidato): ChoqueLocal[] {
  const lista: ChoqueLocal[] = [];
  for (const b of bloques) {
    if (b.id === c.id || b.dia !== c.dia) continue;
    const ini = aMinutos(b.horaInicio);
    const fin = aMinutos(b.horaFin);
    const seCruzan = ini < c.fin && fin > c.inicio;
    if (b.activo && seCruzan && b.idAula === c.idAula) lista.push({ bloque: b, motivo: "AULA" });
    else if (b.activo && seCruzan && b.idDocente === c.idDocente) lista.push({ bloque: b, motivo: "DOCENTE" });
    else if (b.idCurso === c.idCurso && ini === c.inicio) lista.push({ bloque: b, motivo: "MISMO_CURSO" });
  }
  return lista;
}

export const MOTIVO_TEXTO: Record<ChoqueLocal["motivo"], string> = {
  AULA: "misma aula",
  DOCENTE: "mismo docente",
  MISMO_CURSO: "mismo curso a la misma hora",
};

const TONOS = [212, 145, 330, 35, 268, 186, 4, 95, 300, 55, 240, 165];

export const tono = (id: number): number => TONOS[(((id * 5) % 12) + 12) % 12];
