import { useState, type ReactNode } from "react";
import type { Bloque } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import TableroSemanal from "./TableroSemanal";
import { DIA_LARGO, duracion, textoDuracion } from "./tiempo";

type Props = {
  cargar: () => Promise<Bloque[]>;
  onExpira: () => void;
  mostrarDocente: boolean;
  vacio: string;

  acciones?: ReactNode;
};

export default function MiHorario({ cargar, onExpira, mostrarDocente, vacio, acciones }: Props) {
  const { datos, error, cargando, recargar } = useCarga(cargar, onExpira);
  const [elegido, setElegido] = useState<Bloque | null>(null);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;
  if (datos.length === 0) return <p className="muted">{vacio}</p>;

  const total = datos.reduce((s, b) => s + duracion(b), 0);
  return (
    <>
      <div className="encabezado-seccion">
        <p className="muted" style={{ margin: 0 }}>
          {datos.length} clases por semana · {textoDuracion(total)}
        </p>
        {acciones}
      </div>
      <TableroSemanal
        bloques={datos}
        mostrarDocente={mostrarDocente}
        seleccionado={elegido?.id ?? null}
        onSeleccionar={(b) => setElegido(elegido?.id === b.id ? null : b)}
      />
      {elegido && (
        <p className="notice info" style={{ marginTop: 12 }}>
          <strong>{elegido.curso}</strong> · {DIA_LARGO[elegido.dia]} {elegido.horaInicio}–{elegido.horaFin} · {elegido.aula}
          {mostrarDocente ? ` · ${elegido.docente}` : ""}
        </p>
      )}
    </>
  );
}
