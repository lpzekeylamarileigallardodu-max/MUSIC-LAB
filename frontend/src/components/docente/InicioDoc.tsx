import { docResumen } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { diaCorto } from "../admin/util";
import { diaDeFecha, hoy } from "./util";
import type { SeccionDoc } from "./PanelDocente";

type Props = { onExpira: () => void; irA: (s: SeccionDoc) => void };

type Aviso = { texto: string; destino: SeccionDoc; accion: string; urgente: boolean };

/** "Hoy", "Mañana" o el día de la semana. */
function etiquetaDia(fecha: string, dia: string): string {
  const hoyD = diaDeFecha(hoy());
  const dif = Math.round((diaDeFecha(fecha).getTime() - hoyD.getTime()) / 86_400_000);
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Mañana";
  return diaCorto(dia);
}

export default function InicioDoc({ onExpira, irA }: Props) {
  const { datos, error, cargando, recargar } = useCarga(docResumen, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const avisos: Aviso[] = [];
  if (datos.clasesHoy > 0) {
    avisos.push({
      texto: `Hoy tienes ${datos.clasesHoy} ${datos.clasesHoy === 1 ? "clase" : "clases"}. No olvides registrar la asistencia.`,
      destino: "asistencia",
      accion: "Tomar asistencia",
      urgente: false,
    });
  }
  if (datos.evaluacionesSinCalificar > 0) {
    avisos.push({
      texto: `Tienes ${datos.evaluacionesSinCalificar} ${datos.evaluacionesSinCalificar === 1 ? "evaluación" : "evaluaciones"} sin calificar.`,
      destino: "evaluaciones",
      accion: "Calificar",
      urgente: true,
    });
  }

  const clase = datos.proximaClase;

  return (
    <>
      {clase && (
        <section className="panel-bloque">
          <h2>Tu próxima clase</h2>
          <div className="proxima-clase">
            <div className="proxima-dia">{etiquetaDia(clase.fecha, clase.dia)}</div>
            <div>
              <strong>{clase.curso}</strong>
              <div className="sub">
                {clase.horaInicio}–{clase.horaFin} · {clase.aula}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="panel-bloque">
        <h2>Requiere tu atención</h2>
        {avisos.length === 0 ? (
          <p className="muted">Estás al día. No tienes pendientes.</p>
        ) : (
          <ul className="pendientes">
            {avisos.map((a) => (
              <li key={a.texto} className={a.urgente ? "con-pendiente" : ""} style={{ gridTemplateColumns: "1fr auto" }}>
                <span className="pendiente-texto">{a.texto}</span>
                <button className="btn-ghost chico" onClick={() => irA(a.destino)}>
                  {a.accion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-bloque">
        <h2>Tus cursos en números</h2>
        <dl className="cifras">
          <div><dt>Cursos activos</dt><dd>{datos.cursosActivos}</dd></div>
          <div><dt>Alumnos activos</dt><dd>{datos.alumnosActivos}</dd></div>
          <div><dt>Clases hoy</dt><dd>{datos.clasesHoy}</dd></div>
          <div>
            <dt>Asistencia de tus alumnos</dt>
            <dd>{datos.asistenciaPorcentaje === null ? "—" : `${datos.asistenciaPorcentaje}%`}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
