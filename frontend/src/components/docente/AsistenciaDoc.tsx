import { useState } from "react";
import {
  docAsistencia,
  docGuardarAsistencia,
  NoAutenticadoError,
  type AsistenciaAlumno,
  type EstadoAsistencia,
} from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha as fechaLarga } from "../admin/util";
import ConCurso from "./ConCurso";
import { ASISTENCIA, diaDeFecha, ESTADOS_ASISTENCIA, hoy } from "./util";

type Props = { onExpira: () => void };
type Aviso = { clase: "ok" | "error"; texto: string };
type Fila = { estado: EstadoAsistencia; observacion: string };

function ListaAsistencia({ idCurso, fecha, onExpira }: { idCurso: number; fecha: string; onExpira: () => void }) {
  const { datos, error, cargando, recargar } = useCarga(() => docAsistencia(idCurso, fecha), onExpira);
  // Solo lo que el docente cambió en pantalla; lo demás sale de lo que ya está guardado
  const [cambios, setCambios] = useState<Record<number, Partial<Fila>>>({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  // Un alumno sin registro ese día aparece como Presente: se corrigen solo las excepciones
  const valor = (a: AsistenciaAlumno): Fila => ({
    estado: cambios[a.idInscripcion]?.estado ?? a.estado ?? "PRESENTE",
    observacion: cambios[a.idInscripcion]?.observacion ?? a.observacion ?? "",
  });

  const cambiar = (id: number, parcial: Partial<Fila>) =>
    setCambios((prev) => ({ ...prev, [id]: { ...prev[id], ...parcial } }));

  const marcarTodos = () =>
    setCambios((prev) => {
      const siguiente: Record<number, Partial<Fila>> = { ...prev };
      datos.forEach((a) => {
        siguiente[a.idInscripcion] = { ...prev[a.idInscripcion], estado: "PRESENTE" };
      });
      return siguiente;
    });

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const registros = datos.map((a) => {
        const v = valor(a);
        return { idInscripcion: a.idInscripcion, estado: v.estado, observacion: v.observacion.trim() || null };
      });
      await docGuardarAsistencia(idCurso, fecha, registros);
      setAviso({ clase: "ok", texto: `Asistencia del ${fechaLarga(`${fecha}T00:00:00`)} guardada.` });
      setCambios({});
      recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo guardar la asistencia" });
    } finally {
      setGuardando(false);
    }
  };

  if (datos.length === 0) return <p className="muted">Este curso no tiene alumnos activos.</p>;

  const conteo = ESTADOS_ASISTENCIA.map((e) => ({ e, n: datos.filter((a) => valor(a).estado === e).length }));
  const sinRegistrar = datos.filter((a) => a.estado === null).length;

  return (
    <>
      {aviso && <p className={`notice ${aviso.clase}`}>{aviso.texto}</p>}

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Asistencia</th>
              <th>Observación</th>
              <th>Guardado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((a) => {
              const v = valor(a);
              return (
                <tr key={a.idInscripcion}>
                  <td><strong>{a.nombre}</strong></td>
                  <td>
                    <select
                      className="select-chico"
                      value={v.estado}
                      onChange={(e) => cambiar(a.idInscripcion, { estado: e.target.value as EstadoAsistencia })}
                      aria-label={`Asistencia de ${a.nombre}`}
                    >
                      {ESTADOS_ASISTENCIA.map((e) => (
                        <option key={e} value={e}>{ASISTENCIA[e].texto}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input-chico input-obs"
                      type="text"
                      maxLength={300}
                      placeholder="Opcional"
                      value={v.observacion}
                      onChange={(e) => cambiar(a.idInscripcion, { observacion: e.target.value })}
                      aria-label={`Observación de ${a.nombre}`}
                    />
                  </td>
                  <td>
                    <span className={a.estado === null ? "pill off" : "pill ok"}>
                      {a.estado === null ? "Sin registrar" : "Registrado"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pie-asistencia">
        <p className="muted">
          {conteo.map(({ e, n }) => `${ASISTENCIA[e].texto}: ${n}`).join(" · ")}
          {sinRegistrar > 0 && ` · ${sinRegistrar} sin registrar (aparecen como Presente hasta que guardes)`}
        </p>
        <div className="acciones-pie">
          <button className="btn-ghost" onClick={marcarTodos} disabled={guardando}>
            Marcar todos presentes
          </button>
          <button className="btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar asistencia"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function AsistenciaDoc({ onExpira }: Props) {
  const [fecha, setFecha] = useState(hoy());

  return (
    <ConCurso
      onExpira={onExpira}
      barra={
        <label className="campo-linea">
          Fecha de la clase
          <input
            className="input-chico"
            type="date"
            value={fecha}
            max={hoy()}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
      }
    >
      {(c) =>
        fecha ? (
          <>
            <p className="muted subtitulo-seccion">
              {diaDeFecha(fecha).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <ListaAsistencia key={`${c.idCurso}-${fecha}`} idCurso={c.idCurso} fecha={fecha} onExpira={onExpira} />
          </>
        ) : (
          <p className="muted">Elige la fecha de la clase.</p>
        )
      }
    </ConCurso>
  );
}
