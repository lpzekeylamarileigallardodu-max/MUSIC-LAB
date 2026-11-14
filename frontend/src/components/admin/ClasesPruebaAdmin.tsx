import { useState } from "react";
import {
  adminCambiarEstadoClase,
  adminClasesPrueba,
  NoAutenticadoError,
  type ClasePruebaAdmin,
  type EstadoClase,
  type TipoUsuario,
} from "../../api";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { ESTADO_CLASE_LEGIBLE, fechaHora } from "./util";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };
type Aviso = { clase: "ok" | "error"; texto: string };

const ESTADOS = Object.keys(ESTADO_CLASE_LEGIBLE) as EstadoClase[];

export default function ClasesPruebaAdmin({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(adminClasesPrueba, onExpira);
  const [filtro, setFiltro] = useState<"TODAS" | EstadoClase>("TODAS");
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const visibles = (datos ?? []).filter((c) => filtro === "TODAS" || c.estado === filtro);
  const ahora = Date.now();

  const cambiarEstado = async (c: ClasePruebaAdmin, estado: EstadoClase) => {
    setOcupado(c.id);
    setAviso(null);
    try {
      await adminCambiarEstadoClase(c.id, estado);
      setAviso({ clase: "ok", texto: `La clase de ${c.prospecto} quedó como «${ESTADO_CLASE_LEGIBLE[estado]}».` });
      recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo cambiar el estado" });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      <div className="barra-filtros">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as "TODAS" | EstadoClase)} aria-label="Filtrar por estado">
          <option value="TODAS">Todas las clases</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_CLASE_LEGIBLE[e]}
            </option>
          ))}
        </select>
        {datos && (
          <span className="muted contador">
            {visibles.length} de {datos.length}
          </span>
        )}
      </div>

      {aviso && <p className={`notice ${aviso.clase}`}>{aviso.texto}</p>}
      <Estado cargando={!datos && cargando} error={error} onReintentar={recargar} />

      {datos && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Prospecto</th>
                <th>Curso</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => {
                const sinResultado = c.estado === "PROGRAMADA" && new Date(c.fechaHora).getTime() < ahora;
                return (
                  <tr key={c.id}>
                    <td>
                      {fechaHora(c.fechaHora)}
                      {sinResultado && <div className="sub alerta">La fecha ya pasó: registra qué ocurrió</div>}
                    </td>
                    <td>
                      <strong>{c.prospecto}</strong>
                      <div className="sub">{[c.telefono, c.correo].filter(Boolean).join(" · ") || "Sin datos de contacto"}</div>
                    </td>
                    <td>{c.curso}</td>
                    <td>
                      <select
                        className="select-chico"
                        value={c.estado}
                        disabled={ocupado === c.id}
                        onChange={(e) => cambiarEstado(c, e.target.value as EstadoClase)}
                        aria-label={`Estado de la clase de ${c.prospecto}`}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {ESTADO_CLASE_LEGIBLE[e]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="texto-largo">{c.observaciones ?? "—"}</td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="vacio">
                    No hay clases de prueba en este estado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
