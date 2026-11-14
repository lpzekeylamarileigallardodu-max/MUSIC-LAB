import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DIAS, horVerificar, NoAutenticadoError, type AulaItem, type Choque, type CursoItem, type DatosBloque } from "../../api";
import { APERTURA, CIERRE, DIA_LARGO, DURACION_MAX, DURACION_MIN, aMinutos, opcionesHora, textoDuracion } from "./tiempo";

type Props = {
  /** null = clase nueva */
  idBloque: number | null;
  inicial: DatosBloque;
  activo?: boolean;
  aulas: AulaItem[];
  cursos: CursoItem[];
  onGuardar: (datos: DatosBloque) => Promise<void>;
  onCerrar: () => void;
  onExpira: () => void;
};

const MOTIVO: Record<Choque["motivo"], string> = {
  AULA: "la misma aula",
  DOCENTE: "el mismo docente",
  MISMO_CURSO: "el mismo curso a la misma hora",
};

/** Ventana para crear o editar una clase. Revisa choques en el servidor mientras se escribe. */
export default function EditorBloque({ idBloque, inicial, activo = true, aulas, cursos, onGuardar, onCerrar, onExpira }: Props) {
  const [datos, setDatos] = useState<DatosBloque>(inicial);
  const [choques, setChoques] = useState<Choque[] | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minutos = aMinutos(datos.horaFin) - aMinutos(datos.horaInicio);
  const errorLocal =
    minutos <= 0 ? "La hora de fin debe ser posterior a la de inicio"
      : minutos < DURACION_MIN ? `Una clase dura como mínimo ${DURACION_MIN} minutos`
        : minutos > DURACION_MAX ? `Una clase dura como máximo ${DURACION_MAX / 60} horas`
          : null;

  const curso = cursos.find((c) => c.id === datos.idCurso);
  const aula = aulas.find((a) => a.id === datos.idAula);

  // Revisión de choques con una pequeña espera para no llamar al servidor en cada tecla
  useEffect(() => {
    if (errorLocal || !datos.idCurso || !datos.idAula) {
      setChoques(null);
      return;
    }
    let vigente = true;
    setRevisando(true);
    const t = setTimeout(() => {
      horVerificar(idBloque, datos)
        .then((c) => vigente && setChoques(c))
        .catch((e) => {
          if (e instanceof NoAutenticadoError) onExpira();
          else if (vigente) setChoques(null);
        })
        .finally(() => vigente && setRevisando(false));
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, idBloque, errorLocal]);

  const horasInicio = useMemo(() => opcionesHora(APERTURA, CIERRE - DURACION_MIN), []);
  const horasFin = useMemo(() => opcionesHora(APERTURA + DURACION_MIN, CIERRE), []);

  const cambiar = <K extends keyof DatosBloque>(k: K, v: DatosBloque[K]) => setDatos((d) => ({ ...d, [k]: v }));

  /** Al cambiar la hora de inicio se conserva la duración. */
  const cambiarInicio = (ini: string) => {
    const dur = Math.max(minutos, DURACION_MIN);
    const fin = Math.min(aMinutos(ini) + dur, CIERRE);
    setDatos((d) => ({ ...d, horaInicio: ini, horaFin: `${String(Math.floor(fin / 60)).padStart(2, "0")}:${String(fin % 60).padStart(2, "0")}` }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (errorLocal) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(datos);
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const hayChoques = activo && (choques?.length ?? 0) > 0;

  return (
    <div className="overlay" onClick={onCerrar}>
      <div className="modal modal-ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="titulo-editor">{idBloque ? "Editar clase" : "Nueva clase"}</h2>
          <p>{curso ? `${curso.nombre} · ${curso.docente}` : "Elige el curso, el aula y el horario"}</p>
          <button className="close-btn" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <form className="modal-body" onSubmit={enviar}>
          <div className="editor-horario">
            <label className="ancho-completo">
              CURSO
              <select value={datos.idCurso || ""} onChange={(e) => cambiar("idCurso", Number(e.target.value))} required autoFocus>
                <option value="" disabled>Elige un curso</option>
                {cursos.filter((c) => c.activo || c.id === datos.idCurso).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.docente}{c.activo ? "" : " (inactivo)"}</option>
                ))}
              </select>
            </label>
            <label>
              AULA
              <select value={datos.idAula || ""} onChange={(e) => cambiar("idAula", Number(e.target.value))} required>
                <option value="" disabled>Elige un aula</option>
                {aulas.filter((a) => a.activo || a.id === datos.idAula).map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}{a.capacidad ? ` (${a.capacidad} personas)` : ""}</option>
                ))}
              </select>
            </label>
            <label>
              DÍA
              <select value={datos.dia} onChange={(e) => cambiar("dia", e.target.value as DatosBloque["dia"])}>
                {DIAS.map((d) => <option key={d} value={d}>{DIA_LARGO[d]}</option>)}
              </select>
            </label>
            <label>
              INICIO
              <select value={datos.horaInicio} onChange={(e) => cambiarInicio(e.target.value)}>
                {horasInicio.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label>
              FIN
              <select value={datos.horaFin} onChange={(e) => cambiar("horaFin", e.target.value)}>
                {horasFin.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          </div>

          {errorLocal ? (
            <p className="notice error">{errorLocal}</p>
          ) : !activo ? (
            <p className="notice info">Esta clase está inactiva: no ocupa el aula hasta que la actives.</p>
          ) : revisando && choques === null ? (
            <p className="notice info">Revisando choques…</p>
          ) : hayChoques ? (
            <div className="notice error" role="alert">
              <strong>No se puede guardar: hay choques.</strong>
              <ul className="lista-choques">
                {choques!.map((c, i) => (
                  <li key={i}>{c.curso} · {DIA_LARGO[c.dia]} {c.horaInicio}–{c.horaFin} (usa {MOTIVO[c.motivo]})</li>
                ))}
              </ul>
            </div>
          ) : choques ? (
            <p className="notice ok">
              Sin choques · {textoDuracion(minutos)}{aula ? ` en ${aula.nombre}` : ""}
            </p>
          ) : null}

          {error && <p className="notice error">{error}</p>}

          <div className="modal-pie">
            <button type="button" className="btn-ghost" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={guardando || !!errorLocal || hayChoques}>
              {guardando ? "Guardando…" : idBloque ? "Guardar cambios" : "Crear clase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
