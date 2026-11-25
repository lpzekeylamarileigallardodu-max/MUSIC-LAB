import { estResumen } from "../../api";
import Estado from "../admin/Estado";
import Cifras from "../Cifras";
import { IconCheck, IconDinero, IconGrafico, IconMusica } from "../Icons";
import { useCarga } from "../admin/useCarga";
import { bs, diaCorto } from "../admin/util";
import type { SeccionEst } from "./PanelEstudiante";

type Props = { onExpira: () => void; irA: (s: SeccionEst) => void };

type Aviso = { texto: string; destino: SeccionEst; accion: string; urgente: boolean };

export default function InicioEst({ onExpira, irA }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estResumen, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const avisos: Aviso[] = [];
  if (datos.cuotasVencidas > 0) {
    avisos.push({
      texto: `Tienes ${datos.cuotasVencidas} ${datos.cuotasVencidas === 1 ? "cuota vencida" : "cuotas vencidas"}.`,
      destino: "pagos",
      accion: "Ver cuotas",
      urgente: true,
    });
  }
  if (datos.cuotasPendientes > 0) {
    avisos.push({
      texto: `Tienes ${datos.cuotasPendientes} ${datos.cuotasPendientes === 1 ? "cuota pendiente" : "cuotas pendientes"} por pagar.`,
      destino: "pagos",
      accion: "Ver cuotas",
      urgente: false,
    });
  }
  if (datos.comprobantesEnRevision > 0) {
    avisos.push({
      texto: `${datos.comprobantesEnRevision} ${datos.comprobantesEnRevision === 1 ? "comprobante está" : "comprobantes están"} en revisión por secretaría.`,
      destino: "pagos",
      accion: "Ver detalle",
      urgente: false,
    });
  }
  if (datos.prestamosActivos > 0) {
    avisos.push({
      texto: `Tienes ${datos.prestamosActivos} ${datos.prestamosActivos === 1 ? "instrumento prestado" : "instrumentos prestados"}.`,
      destino: "prestamos",
      accion: "Ver préstamos",
      urgente: false,
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
            <div className="proxima-dia">{diaCorto(clase.dia)}</div>
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
        <h2>Tu progreso</h2>
        <Cifras
          items={[
            { etiqueta: "Cursos activos", valor: datos.cursosActivos, icono: <IconMusica size={22} />, tono: "azul" },
            {
              etiqueta: "Asistencia",
              valor: datos.asistenciaPorcentaje === null ? "—" : `${datos.asistenciaPorcentaje}%`,
              icono: <IconCheck size={22} />,
              tono: "verde",
            },
            { etiqueta: "Promedio de notas", valor: datos.promedioNotas === null ? "—" : datos.promedioNotas, icono: <IconGrafico size={22} />, tono: "morado" },
            { etiqueta: "Por pagar", valor: bs(datos.montoPorPagar), icono: <IconDinero size={22} />, tono: datos.montoPorPagar > 0 ? "rojo" : "verde" },
          ]}
        />
      </aside>
    </div>
  );
}
