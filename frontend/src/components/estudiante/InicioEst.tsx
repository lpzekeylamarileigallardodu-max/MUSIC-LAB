import { estResumen } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { bs, diaCorto } from "../admin/util";
import type { SeccionEst } from "./PanelEstudiante";

type Props = { onExpira: () => void; irA: (s: SeccionEst) => void };

type Aviso = { texto: string; destino: SeccionEst; accion: string; urgente: boolean };

export default function InicioEst({ onExpira, irA }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estResumen, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  // Lo que necesita su atención, primero
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
    <>
      {clase && (
        <section className="panel-bloque">
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
        <h2>Tu progreso</h2>
        <dl className="cifras">
          <div><dt>Cursos activos</dt><dd>{datos.cursosActivos}</dd></div>
          <div>
            <dt>Asistencia</dt>
            <dd>{datos.asistenciaPorcentaje === null ? "—" : `${datos.asistenciaPorcentaje}%`}</dd>
          </div>
          <div>
            <dt>Promedio de notas</dt>
            <dd>{datos.promedioNotas === null ? "—" : datos.promedioNotas}</dd>
          </div>
          <div><dt>Por pagar</dt><dd>{bs(datos.montoPorPagar)}</dd></div>
        </dl>
      </section>
    </>
  );
}
