import { estEventos, type EventoEstudiante } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fechaHora } from "../admin/util";

type Props = { onExpira: () => void };

const TIPO: Record<string, string> = {
  RECITAL: "Recital",
  CONCIERTO: "Concierto",
  TALLER: "Taller",
  AUDICION: "Audición",
  OTRO: "Evento",
};

const PARTICIPACION: Record<string, string> = {
  INSCRITO: "Inscrito",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  ASISTIO: "Asististe",
};

function Tarjeta({ e }: { e: EventoEstudiante }) {
  return (
    <article className="tarjeta">
      <header>
        <div>
          <h2>{e.nombre}</h2>
          <div className="sub">
            {TIPO[e.tipo] ?? e.tipo} · {fechaHora(e.inicio)}
            {e.lugar ? ` · ${e.lugar}` : ""}
          </div>
        </div>
        {e.miParticipacion && <span className="pill ok">{PARTICIPACION[e.miParticipacion] ?? e.miParticipacion}</span>}
      </header>
      {e.descripcion && <p className="muted">{e.descripcion}</p>}
    </article>
  );
}

export default function EventosEst({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estEventos, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const ahora = Date.now();
  const proximos = datos
    .filter((e) => new Date(e.inicio).getTime() >= ahora)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const pasados = datos.filter((e) => new Date(e.inicio).getTime() < ahora);

  return (
    <>
      <section className="panel-bloque">
        <h2>Próximos eventos</h2>
        {proximos.length === 0 ? (
          <p className="muted">No hay eventos próximos por ahora.</p>
        ) : (
          <div className="tarjetas">{proximos.map((e) => <Tarjeta key={e.id} e={e} />)}</div>
        )}
      </section>

      {pasados.length > 0 && (
        <section className="panel-bloque">
          <h2>Eventos pasados</h2>
          <div className="tarjetas">{pasados.map((e) => <Tarjeta key={e.id} e={e} />)}</div>
        </section>
      )}
    </>
  );
}
