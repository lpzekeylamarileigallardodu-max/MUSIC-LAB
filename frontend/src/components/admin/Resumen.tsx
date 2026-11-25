import { adminResumen, type TipoUsuario } from "../../api";
import type { Seccion } from "./PanelAdmin";
import Cifras from "../Cifras";
import { IconCalendario, IconDinero, IconEscuela, IconMusica, IconUsuario, IconUsuarioMas } from "../Icons";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { bs } from "./util";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario; irA: (s: Seccion) => void };

type Pendiente = { texto: string; cantidad: number | null; destino?: Seccion; accion?: string };

export default function Resumen({ onExpira, irA }: Props) {
  const { datos, error, cargando, recargar } = useCarga(adminResumen, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const todos: Pendiente[] = [
    { texto: "Comprobantes de pago por verificar", cantidad: datos.pagosPorVerificar, destino: "pagos", accion: "Ver pagos" },
    { texto: "Cuotas vencidas", cantidad: datos.cuotasVencidas, destino: "pagos", accion: "Ver cuotas" },
    { texto: "Clases de prueba programadas", cantidad: datos.clasesPruebaProgramadas, destino: "clases", accion: "Ver clases" },
    { texto: "Prospectos nuevos sin contactar", cantidad: datos.prospectosNuevos },
    { texto: "Instrumentos prestados con devolución atrasada", cantidad: datos.prestamosAtrasados },
  ];
  const pendientes = todos.filter((p) => p.cantidad !== null);

  return (
    <div className="inicio-grid">
      <section className="tarjeta">
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

      <aside className="inicio-lado">
        <h2>La academia hoy</h2>
        <Cifras
          items={[
            { etiqueta: "Estudiantes activos", valor: datos.estudiantes, icono: <IconEscuela size={22} />, tono: "azul" },
            { etiqueta: "Docentes", valor: datos.docentes, icono: <IconUsuario size={22} />, tono: "morado" },
            { etiqueta: "Invitados por inscribir", valor: datos.invitados, icono: <IconUsuarioMas size={22} />, tono: "naranja" },
            { etiqueta: "Cursos activos", valor: datos.cursosActivos, icono: <IconMusica size={22} />, tono: "verde" },
            { etiqueta: "Inscripciones activas", valor: datos.inscripcionesActivas, icono: <IconCalendario size={22} />, tono: "azul" },
            ...(datos.ingresosMes !== null
              ? [{ etiqueta: "Ingresos aprobados este mes", valor: bs(datos.ingresosMes), icono: <IconDinero size={22} />, tono: "verde" as const }]
              : []),
          ]}
        />
      </aside>
    </div>
  );
}
