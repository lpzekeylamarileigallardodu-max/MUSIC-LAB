import { docResumen } from "../../api";
import Estado from "../admin/Estado";
import Cifras from "../Cifras";
import { IconCalendario, IconCheck, IconMusica, IconUsuario } from "../Icons";
import { useCarga } from "../admin/useCarga";
import { diaCorto } from "../admin/util";
import { diaDeFecha, hoy } from "./util";
import type { SeccionDoc } from "./PanelDocente";

type Props = { onExpira: () => void; irA: (s: SeccionDoc) => void };

type Aviso = { texto: string; destino: SeccionDoc; accion: string; urgente: boolean };

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
    <div className="inicio-grid">
      <div className="inicio-principal">
      {clase && (
        <section className="tarjeta">
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

      <section className="tarjeta">
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

      </div>

      <aside className="inicio-lado">
        <h2>Tus cursos en números</h2>
        <Cifras
          items={[
            { etiqueta: "Cursos activos", valor: datos.cursosActivos, icono: <IconMusica size={22} />, tono: "azul" },
            { etiqueta: "Alumnos activos", valor: datos.alumnosActivos, icono: <IconUsuario size={22} />, tono: "morado" },
            { etiqueta: "Clases hoy", valor: datos.clasesHoy, icono: <IconCalendario size={22} />, tono: "naranja" },
            {
              etiqueta: "Asistencia de tus alumnos",
              valor: datos.asistenciaPorcentaje === null ? "—" : `${datos.asistenciaPorcentaje}%`,
              icono: <IconCheck size={22} />,
              tono: "verde",
            },
          ]}
        />
      </aside>
    </div>
  );
}
