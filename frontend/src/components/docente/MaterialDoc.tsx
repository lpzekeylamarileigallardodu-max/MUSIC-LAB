import { useState, type FormEvent } from "react";
import {
  docAgregarMaterial,
  docCursos,
  docEstadoMaterial,
  docMaterial,
  docSubirArchivoMaterial,
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
  const [archivo, setArchivo] = useState<File | null>(null);
  const [claveArchivo, setClaveArchivo] = useState(0);   // para vaciar el input después de publicar

  const listaCursos = cursos.datos ?? [];
  const cursoElegido = idCurso ?? listaCursos.find((c) => c.activo)?.idCurso ?? listaCursos[0]?.idCurso ?? null;

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    if (cursoElegido === null || !archivo) return;
    if (archivo.size > 20 * 1024 * 1024) {
      return setAviso({ clase: "error", texto: "El archivo pesa más de 20 MB" });
    }
    setEnviando(true);
    setAviso(null);
    try {
      const url = await docSubirArchivoMaterial(archivo);
      await docAgregarMaterial({
        idCurso: cursoElegido,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        url,
      });
      setAviso({ clase: "ok", texto: `«${titulo.trim()}» ya está disponible para los alumnos del curso.` });
      setTitulo("");
      setDescripcion("");
      setArchivo(null);
      setClaveArchivo((k) => k + 1);
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
              Archivo (PDF, imagen, audio, video, Word, PowerPoint, Excel o ZIP · hasta 20 MB)
              <input
                key={claveArchivo}
                className="input-chico"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg,.mp4,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.mid,.midi,.mscz"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setArchivo(f);
                  if (f && titulo.trim() === "") setTitulo(f.name.replace(/\.[^.]+$/, ""));
                }}
              />
            </label>
            <label className="ancho-completo">
              Descripción (opcional)
              <textarea className="input-chico" rows={2} maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </label>
            <div className="ancho-completo">
              <button className="btn-primary" type="submit" disabled={enviando || cursoElegido === null || titulo.trim() === "" || !archivo}>
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
