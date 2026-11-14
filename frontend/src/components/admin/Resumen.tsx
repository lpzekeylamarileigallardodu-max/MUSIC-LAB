import { adminResumen, type TipoUsuario } from "../../api";
import type { Seccion } from "./PanelAdmin";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { bs } from "./util";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario; irA: (s: Seccion) => void };

type Pendiente = { texto: string; cantidad: number | null; destino?: Seccion; accion?: string };

export default function Resumen({ onExpira, irA }: Props) {
  const { datos, error, cargando, recargar } = useCarga(adminResumen, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  // Lo que requiere una acción del personal, primero. null = este cargo no ve ese dato.
  const todos: Pendiente[] = [
    { texto: "Comprobantes de pago por verificar", cantidad: datos.pagosPorVerificar, destino: "pagos", accion: "Ver pagos" },
    { texto: "Cuotas vencidas", cantidad: datos.cuotasVencidas, destino: "pagos", accion: "Ver cuotas" },
    { texto: "Clases de prueba programadas", cantidad: datos.clasesPruebaProgramadas, destino: "clases", accion: "Ver clases" },
    { texto: "Prospectos nuevos sin contactar", cantidad: datos.prospectosNuevos },
    { texto: "Instrumentos prestados con devolución atrasada", cantidad: datos.prestamosAtrasados },
  ];
  const pendientes = todos.filter((p) => p.cantidad !== null);

  return (
    <>
      <section className="panel-bloque">
        <h2>Requiere tu atención</h2>
        <ul className="pendientes">
          {pendientes.map((p) => (
            <li key={p.texto} className={p.cantidad ? "con-pendiente" : ""}>
              <span className="pendiente-num">{p.cantidad}</span>
              <span className="pendiente-texto">{p.texto}</span>
              {p.cantidad && p.destino ? (
                <button className="btn-ghost chico" onClick={() => irA(p.destino!)}>
                  {p.accion}
                </button>
              ) : (
                <span className="muted pendiente-ok">{p.cantidad ? "" : "Al día"}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-bloque">
        <h2>La academia hoy</h2>
        <dl className="cifras">
          <div><dt>Estudiantes activos</dt><dd>{datos.estudiantes}</dd></div>
          <div><dt>Docentes</dt><dd>{datos.docentes}</dd></div>
          <div><dt>Invitados por inscribir</dt><dd>{datos.invitados}</dd></div>
          <div><dt>Cursos activos</dt><dd>{datos.cursosActivos}</dd></div>
          <div><dt>Inscripciones activas</dt><dd>{datos.inscripcionesActivas}</dd></div>
          {datos.ingresosMes !== null && (
            <div><dt>Ingresos aprobados este mes</dt><dd>{bs(datos.ingresosMes)}</dd></div>
          )}
        </dl>
      </section>
    </>
  );
}
