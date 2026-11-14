import { docCursos } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { diaCorto } from "../admin/util";

type Props = { onExpira: () => void };

export default function CursosDoc({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(docCursos, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;
  if (datos.length === 0) return <p className="muted">Todavía no tienes cursos asignados.</p>;

  return (
    <div className="tarjetas">
      {datos.map((c) => (
        <article key={c.idCurso} className={c.activo ? "tarjeta" : "tarjeta apagada"}>
          <header>
            <div>
              <h2>{c.curso}</h2>
              <div className="sub">{c.nivel ?? "Sin nivel"}</div>
            </div>
            <span className={c.activo ? "pill ok" : "pill off"}>{c.activo ? "Activo" : "Inactivo"}</span>
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
            {c.alumnosActivos === 1 ? "1 alumno activo" : `${c.alumnosActivos} alumnos activos`}
          </footer>
        </article>
      ))}
    </div>
  );
}
