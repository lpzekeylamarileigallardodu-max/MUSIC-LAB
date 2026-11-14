import { useMemo, useState, type FormEvent } from "react";
import {
  docCalificar,
  docCrearEvaluacion,
  docEvaluaciones,
  NoAutenticadoError,
  type EvaluacionDocente,
} from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha as fechaCorta } from "../admin/util";
import ConCurso from "./ConCurso";
import { hoy } from "./util";

type Props = { onExpira: () => void };
type Aviso = { clase: "ok" | "error"; texto: string };

const textoNota = (n: number | null) => (n === null ? "" : String(n));

type FilaProps = {
  ev: EvaluacionDocente;
  onGuardada: (ev: EvaluacionDocente) => void;
  onAviso: (a: Aviso) => void;
  onExpira: () => void;
};

function FilaEvaluacion({ ev, onGuardada, onAviso, onExpira }: FilaProps) {
  const [nota, setNota] = useState(textoNota(ev.nota));
  const [comentario, setComentario] = useState(ev.comentario ?? "");
  const [guardando, setGuardando] = useState(false);
  const [errorFila, setErrorFila] = useState<string | null>(null);

  const sucio = nota.trim() !== textoNota(ev.nota) || comentario.trim() !== (ev.comentario ?? "");

  const guardar = async () => {
    const texto = nota.trim().replace(",", ".");
    let valor: number | null = null;
    if (texto !== "") {
      valor = Number(texto);
      if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
        setErrorFila("La nota debe estar entre 0 y 100");
        return;
      }
    }
    setErrorFila(null);
    setGuardando(true);
    try {
      const guardada = await docCalificar(ev.idEvaluacion, valor, comentario.trim() || null);
      setNota(textoNota(guardada.nota));
      setComentario(guardada.comentario ?? "");
      onGuardada(guardada);
      onAviso({ clase: "ok", texto: `Guardado: «${ev.nombre}» de ${ev.alumno}.` });
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setErrorFila(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <tr>
      <td><strong>{ev.alumno}</strong></td>
      <td>
        {ev.nombre}
        {ev.fecha && <div className="sub">{fechaCorta(`${ev.fecha}T00:00:00`)}</div>}
      </td>
      <td>
        <input
          className="input-chico input-nota"
          type="text"
          inputMode="decimal"
          placeholder="0–100"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          aria-label={`Nota de ${ev.alumno}`}
        />
        {ev.nota === null && <div className="sub">Sin calificar</div>}
      </td>
      <td>
        <input
          className="input-chico input-obs"
          type="text"
          maxLength={500}
          placeholder="Comentario para el alumno (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          aria-label={`Comentario para ${ev.alumno}`}
        />
        {errorFila && <div className="sub alerta">{errorFila}</div>}
      </td>
      <td className="acciones">
        <button className="btn-ghost chico" disabled={!sucio || guardando} onClick={guardar}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

function ListaEvaluaciones({ idCurso, onExpira }: { idCurso: number; onExpira: () => void }) {
  const { datos, setDatos, error, cargando, recargar } = useCarga(() => docEvaluaciones(idCurso), onExpira);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [filtro, setFiltro] = useState("TODAS");
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [creando, setCreando] = useState(false);

  const nombres = useMemo(() => [...new Set((datos ?? []).map((e) => e.nombre))], [datos]);
  const visibles = (datos ?? []).filter((e) => filtro === "TODAS" || e.nombre === filtro);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setAviso(null);
    try {
      const r = await docCrearEvaluacion(idCurso, nombre.trim(), fecha || null);
      setAviso({ clase: "ok", texto: `«${nombre.trim()}» creada para ${r.cantidad} ${r.cantidad === 1 ? "alumno" : "alumnos"}. Ahora puedes poner las notas.` });
      setNombre("");
      setFiltro(nombre.trim());
      recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo crear la evaluación" });
    } finally {
      setCreando(false);
    }
  };

  const reemplazar = (nueva: EvaluacionDocente) =>
    setDatos((prev) => (prev ? prev.map((e) => (e.idEvaluacion === nueva.idEvaluacion ? nueva : e)) : prev));

  return (
    <>
      <section className="panel-bloque">
        <h2>Nueva evaluación</h2>
        <form className="form-linea" onSubmit={crear}>
          <label>
            Nombre
            <input
              className="input-chico"
              type="text"
              maxLength={100}
              required
              placeholder="Ej.: Evaluación 3 - Escalas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label>
            Fecha
            <input className="input-chico" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <button className="btn-primary" type="submit" disabled={creando || nombre.trim() === ""}>
            {creando ? "Creando…" : "Crear para todos los alumnos"}
          </button>
        </form>
      </section>

      {aviso && <p className={`notice ${aviso.clase}`}>{aviso.texto}</p>}
      <Estado cargando={!datos && cargando} error={error} onReintentar={recargar} />

      {datos && (
        <>
          {nombres.length > 1 && (
            <div className="barra-filtros">
              <select className="select-chico" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por evaluación">
                <option value="TODAS">Todas las evaluaciones</option>
                {nombres.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Evaluación</th>
                  <th>Nota</th>
                  <th>Comentario</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((ev) => (
                  <FilaEvaluacion
                    key={ev.idEvaluacion}
                    ev={ev}
                    onGuardada={reemplazar}
                    onAviso={setAviso}
                    onExpira={onExpira}
                  />
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="vacio">Todavía no hay evaluaciones en este curso.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function EvaluacionesDoc({ onExpira }: Props) {
  return (
    <ConCurso onExpira={onExpira}>
      {(c) => <ListaEvaluaciones idCurso={c.idCurso} onExpira={onExpira} />}
    </ConCurso>
  );
}
