import { useState } from "react";
import { estMaterial, type MaterialEstudiante } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha } from "../admin/util";

type Props = { onExpira: () => void };

const TIPO: Record<MaterialEstudiante["tipo"], string> = {
  PARTITURA: "Partitura",
  GUIA: "Guía",
  AUDIO: "Audio",
  VIDEO: "Video",
  ENLACE: "Enlace",
  OTRO: "Otro",
};

/** Solo se abren enlaces http(s) o rutas del propio sitio; cualquier otra cosa (p. ej. javascript:) se descarta. */
function enlaceSeguro(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export default function MaterialEst({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estMaterial, onExpira);
  const [curso, setCurso] = useState("TODOS");

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  if (datos.length === 0) {
    return <p className="muted">Tus docentes todavía no han subido material para tus cursos.</p>;
  }

  const cursos = [...new Set(datos.map((m) => m.curso))].sort((a, b) => a.localeCompare(b, "es"));
  const visibles = datos.filter((m) => curso === "TODOS" || m.curso === curso);

  return (
    <>
      {cursos.length > 1 && (
        <div className="barra-filtros">
          <select className="select-chico" value={curso} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso">
            <option value="TODOS">Todos mis cursos</option>
            {cursos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <ul className="lista-material">
        {visibles.map((m) => {
          const href = enlaceSeguro(m.url);
          return (
            <li key={m.id}>
              <div>
                <span className="pill off">{TIPO[m.tipo]}</span>
                <strong className="material-titulo">{m.titulo}</strong>
                {m.descripcion && <p className="muted">{m.descripcion}</p>}
                <div className="sub">
                  {m.curso} · {m.docente} · {fecha(m.fechaSubida)}
                </div>
              </div>
              {href ? (
                <a className="btn-ghost chico" href={href} target="_blank" rel="noopener noreferrer">
                  Abrir
                </a>
              ) : (
                <span className="sub">Enlace no disponible</span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
