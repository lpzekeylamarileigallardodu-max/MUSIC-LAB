import { useState, type FormEvent } from "react";
import {
  docAgregarMaterial,
  docCursos,
  docEstadoMaterial,
  docMaterial,
  NoAutenticadoError,
  type MaterialDocente,
  type TipoMaterial,
} from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha } from "../admin/util";
import { enlaceSeguro, TIPO_MATERIAL } from "./util";

type Props = { onExpira: () => void };
type Aviso = { clase: "ok" | "error"; texto: string };

const TIPOS = Object.keys(TIPO_MATERIAL) as TipoMaterial[];

export default function MaterialDoc({ onExpira }: Props) {
  const material = useCarga(docMaterial, onExpira);
  const cursos = useCarga(docCursos, onExpira);

  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [idCurso, setIdCurso] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoMaterial>("GUIA");
  const [url, setUrl] = useState("");

  const listaCursos = cursos.datos ?? [];
  const cursoElegido = idCurso ?? listaCursos.find((c) => c.activo)?.idCurso ?? listaCursos[0]?.idCurso ?? null;

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    if (cursoElegido === null) return;
    setEnviando(true);
    setAviso(null);
    try {
      await docAgregarMaterial({
        idCurso: cursoElegido,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        url: url.trim(),
      });
      setAviso({ clase: "ok", texto: `«${titulo.trim()}» ya está disponible para los alumnos del curso.` });
      setTitulo("");
      setDescripcion("");
      setUrl("");
      material.recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo agregar el material" });
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (m: MaterialDocente) => {
    setOcupado(m.id);
    setAviso(null);
    try {
      await docEstadoMaterial(m.id, !m.activo);
      setAviso({ clase: "ok", texto: m.activo ? `«${m.titulo}» fue retirado.` : `«${m.titulo}» se publicó de nuevo.` });
      material.recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo cambiar el estado" });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      <section className="panel-bloque">
        <h2>Agregar material</h2>
        {cursos.datos && listaCursos.length === 0 ? (
          <p className="muted">Necesitas tener un curso asignado para publicar material.</p>
        ) : (
          <form className="form-material" onSubmit={agregar}>
            <label>
              Curso
              <select className="input-chico" value={cursoElegido ?? ""} onChange={(e) => setIdCurso(Number(e.target.value))}>
                {listaCursos.map((c) => (
                  <option key={c.idCurso} value={c.idCurso}>{c.curso}</option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select className="input-chico" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaterial)}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{TIPO_MATERIAL[t]}</option>
                ))}
              </select>
            </label>
            <label className="ancho-completo">
              Título
              <input className="input-chico" type="text" required maxLength={150} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </label>
            <label className="ancho-completo">
              Enlace
              <input
                className="input-chico"
                type="text"
                required
                maxLength={500}
                placeholder="https://… o /materiales/curso/archivo.pdf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <label className="ancho-completo">
              Descripción (opcional)
              <textarea className="input-chico" rows={2} maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </label>
            <div className="ancho-completo">
              <button className="btn-primary" type="submit" disabled={enviando || cursoElegido === null || titulo.trim() === "" || url.trim() === ""}>
                {enviando ? "Publicando…" : "Publicar material"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel-bloque">
        <h2>Tu material publicado</h2>
        {aviso && <p className={`notice ${aviso.clase}`}>{aviso.texto}</p>}
        <Estado cargando={!material.datos && material.cargando} error={material.error} onReintentar={material.recargar} />

        {material.datos && (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {material.datos.map((m) => {
                  const href = enlaceSeguro(m.url);
                  return (
                    <tr key={m.id} className={m.activo ? "" : "fila-inactiva"}>
                      <td className="texto-largo">
                        <strong>{m.titulo}</strong>
                        {m.descripcion && <div className="sub">{m.descripcion}</div>}
                        <div className="sub">
                          Subido el {fecha(m.fechaSubida)}
                          {href && (
                            <>
                              {" · "}
                              <a href={href} target="_blank" rel="noopener noreferrer">Abrir</a>
                            </>
                          )}
                        </div>
                      </td>
                      <td>{m.curso}</td>
                      <td>{TIPO_MATERIAL[m.tipo]}</td>
                      <td>
                        <span className={m.activo ? "pill ok" : "pill off"}>{m.activo ? "Publicado" : "Retirado"}</span>
                      </td>
                      <td className="acciones">
                        <button className="btn-ghost chico" disabled={ocupado === m.id} onClick={() => cambiarEstado(m)}>
                          {m.activo ? "Retirar" : "Publicar de nuevo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {material.datos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="vacio">Todavía no has publicado material.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
