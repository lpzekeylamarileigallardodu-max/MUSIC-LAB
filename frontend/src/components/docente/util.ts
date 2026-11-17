import type { EstadoAsistencia, TipoMaterial } from "../../api";

export const hoy = (): string => new Date().toLocaleDateString("en-CA");

export const diaDeFecha = (aaaammdd: string): Date => new Date(`${aaaammdd}T00:00:00`);

export const ASISTENCIA: Record<EstadoAsistencia, { texto: string; clase: string }> = {
  PRESENTE: { texto: "Presente", clase: "pill ok" },
  TARDANZA: { texto: "Tardanza", clase: "pill warn" },
  AUSENTE: { texto: "Ausente", clase: "pill bad" },
  LICENCIA: { texto: "Licencia", clase: "pill off" },
};

export const ESTADOS_ASISTENCIA = Object.keys(ASISTENCIA) as EstadoAsistencia[];

export const TIPO_MATERIAL: Record<TipoMaterial, string> = {
  PARTITURA: "Partitura",
  GUIA: "Guía",
  AUDIO: "Audio",
  VIDEO: "Video",
  ENLACE: "Enlace",
  OTRO: "Otro",
};

export function enlaceSeguro(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export const claseAsistencia = (pct: number): string => (pct >= 85 ? "pill ok" : pct >= 70 ? "pill warn" : "pill bad");
