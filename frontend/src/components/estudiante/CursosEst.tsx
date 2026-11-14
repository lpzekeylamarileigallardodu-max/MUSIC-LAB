import { estCursos, type CursoEstudiante } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { bs, diaCorto, fecha } from "../admin/util";

type Props = { onExpira: () => void };

const ESTADO_LEGIBLE: Record<CursoEstudiante["estadoInscripcion"], string> = {
  ACTIVA: "Activa",
  INACTIVA: "Inactiva",
  RETIRADA: "Retirada",
  FINALIZADA: "Finalizada",
};

export default function CursosEst({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estCursos, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  if (datos.length === 0) {
    return <p className="muted">Todavía no estás inscrito en ningún curso.</p>;
  }

  return (
    <div className="tarjetas">
      {datos.map((c) => (
        <article key={c.idInscripcion} className={c.estadoInscripcion === "ACTIVA" ? "tarjeta" : "tarjeta apagada"}>
          <header>
            <div>
              <h2>{c.curso}</h2>
              <div className="sub">{c.nivel ?? "Sin nivel"} · Docente: {c.docente}</div>
            </div>
            <span className={c.estadoInscripcion === "ACTIVA" ? "pill ok" : "pill off"}>
              {ESTADO_LEGIBLE[c.estadoInscripcion]}
            </span>
          </header>

          {c.horarios.length === 0 ? (
            <p className="muted">Este curso todavía no tiene horarios.</p>
          ) : (
            <ul className="lista-simple horarios">
              {c.horarios.map((h, i) => (
                <li key={i}>
                  <strong>{diaCorto(h.dia)}</strong> {h.horaInicio}–{h.horaFin} <span className="sub">{h.aula}</span>
                </li>
              ))}
            </ul>
          )}

          <footer className="sub">
            Inscrito el {fecha(c.fechaInscripcion)} · Mensualidad {bs(c.costoMensual)}
          </footer>
        </article>
      ))}
    </div>
  );
}
