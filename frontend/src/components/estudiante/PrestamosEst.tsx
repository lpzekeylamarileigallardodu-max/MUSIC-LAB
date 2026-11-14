import { estPrestamos, type PrestamoEstudiante } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha } from "../admin/util";

type Props = { onExpira: () => void };

const ESTADO: Record<PrestamoEstudiante["estado"], { texto: string; clase: string }> = {
  ACTIVO: { texto: "En préstamo", clase: "pill warn" },
  ATRASADO: { texto: "Atrasado", clase: "pill bad" },
  DEVUELTO: { texto: "Devuelto", clase: "pill ok" },
  PERDIDO: { texto: "Perdido", clase: "pill off" },
};

export default function PrestamosEst({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estPrestamos, onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Instrumento</th>
            <th>Prestado</th>
            <th>Devolver antes del</th>
            <th>Devuelto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.instrumento}</strong>
                <div className="sub">{p.codigo}</div>
              </td>
              <td>{fecha(p.fechaPrestamo)}</td>
              <td>{fecha(`${p.fechaDevolucionPrevista}T00:00:00`)}</td>
              <td>{p.fechaDevolucionReal ? fecha(p.fechaDevolucionReal) : "—"}</td>
              <td><span className={ESTADO[p.estado].clase}>{ESTADO[p.estado].texto}</span></td>
            </tr>
          ))}
          {datos.length === 0 && (
            <tr>
              <td colSpan={5} className="vacio">No has pedido instrumentos prestados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
