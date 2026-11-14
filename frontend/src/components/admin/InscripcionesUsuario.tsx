import { useState, type FormEvent } from "react";
import {
  NoAutenticadoError, adminCursos, adminInscribir, adminInscripcionesDe, adminRetirar, type UsuarioAdmin,
} from "../../api";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { bs, fecha } from "./util";

type Props = {
  usuario: UsuarioAdmin;
  onCerrar: (huboCambios: boolean) => void;
  onExpira: () => void;
};

const ESTADO_CLASE: Record<string, string> = { ACTIVA: "pill ok", RETIRADA: "pill bad", INACTIVA: "pill off", FINALIZADA: "pill off" };

/**
 * Inscripciones de un usuario. Inscribir a un invitado lo pasa a estudiante y le genera la cuota del mes;
 * retirar anula sus cuotas que todavía no vencieron.
 */
export default function InscripcionesUsuario({ usuario, onCerrar, onExpira }: Props) {
  const inscripciones = useCarga(() => adminInscripcionesDe(usuario.id), onExpira);
  const cursos = useCarga(adminCursos, onExpira);
  const [idCurso, setIdCurso] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ clase: "ok" | "error"; texto: string } | null>(null);
  const [cambios, setCambios] = useState(false);

  const yaInscrito = new Set((inscripciones.datos ?? []).filter((i) => i.estado === "ACTIVA").map((i) => i.idCurso));
  const disponibles = (cursos.datos ?? []).filter((c) => c.activo && !yaInscrito.has(c.id));

  const ejecutar = async (accion: () => Promise<string>) => {
    setOcupado(true);
    setAviso(null);
    try {
      setAviso({ clase: "ok", texto: await accion() });
      setCambios(true);
      inscripciones.recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo completar la acción" });
    } finally {
      setOcupado(false);
    }
  };

  const inscribir = (e: FormEvent) => {
    e.preventDefault();
    if (!idCurso) return;
    ejecutar(async () => {
      const r = await adminInscribir(usuario.id, idCurso);
      setIdCurso(0);
      return [
        `${r.estudiante} quedó ${r.reactivada ? "reinscrito" : "inscrito"} en ${r.curso}.`,
        r.pasoAEstudiante ? "Su cuenta pasó de invitado a estudiante." : "",
        r.cuotasGeneradas ? "Se generó la cuota de este mes." : "",
      ].filter(Boolean).join(" ");
    });
  };

  return (
    <div className="overlay" onClick={() => onCerrar(cambios)}>
      <div className="modal modal-ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-insc" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="titulo-insc">Inscripciones</h2>
          <p>{usuario.nombre} · {usuario.correo}</p>
          <button className="close-btn" onClick={() => onCerrar(cambios)} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          {usuario.tipoUsuario === "INVITADO" && (
            <p className="notice info">Es invitado: al inscribirlo pasa a ser estudiante y se le genera la cuota del mes.</p>
          )}

          <form className="form-linea" onSubmit={inscribir}>
            <label style={{ flex: 1 }}>
              INSCRIBIR EN
              <select value={idCurso} onChange={(e) => setIdCurso(Number(e.target.value))} disabled={!cursos.datos}>
                <option value={0} disabled>{cursos.datos ? "Elige un curso" : "Cargando cursos…"}</option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.docente} · {bs(c.costoMensual)}/mes · {c.inscritos} inscritos
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-primary" type="submit" disabled={ocupado || !idCurso}>Inscribir</button>
          </form>

          {aviso && <p className={`notice ${aviso.clase}`} role="status">{aviso.texto}</p>}

          <Estado cargando={!inscripciones.datos && inscripciones.cargando} error={inscripciones.error} onReintentar={inscripciones.recargar} />
          {inscripciones.datos && (
            inscripciones.datos.length === 0 ? (
              <p className="muted">Todavía no tiene inscripciones.</p>
            ) : (
              <ul className="lista-inscripciones">
                {inscripciones.datos.map((i) => (
                  <li key={i.id}>
                    <div>
                      <strong>{i.curso}</strong> <span className={ESTADO_CLASE[i.estado] ?? "pill off"}>{i.estado.toLowerCase()}</span>
                      <div className="sub">
                        {i.docente} · desde {fecha(i.fecha)}
                        {i.cuotasPorPagar > 0 && <> · <span className="alerta">{i.cuotasPorPagar} cuota(s) por pagar</span></>}
                      </div>
                    </div>
                    {i.estado === "ACTIVA" && (
                      <button
                        className="btn-ghost chico btn-peligro"
                        disabled={ocupado}
                        onClick={() => {
                          if (!window.confirm(`¿Retirar a ${usuario.nombre} de ${i.curso}? Las cuotas que aún no vencieron se anulan.`)) return;
                          ejecutar(async () => {
                            const r = await adminRetirar(i.id);
                            return `Retirado de ${i.curso}. ${r.cuotasAnuladas} cuota(s) anulada(s).`;
                          });
                        }}
                      >
                        Retirar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
}
