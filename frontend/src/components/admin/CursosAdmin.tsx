import { adminCursos, descargarReporteAdmin, type TipoUsuario } from "../../api";
import BotonExcel from "../BotonExcel";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { bs, diaCorto } from "./util";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };

export default function CursosAdmin({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(adminCursos, onExpira);

  return (
    <>
      <div className="encabezado-seccion">
        <p className="muted" style={{ margin: 0 }}>Los horarios se mueven y editan en la sección <strong>Horarios</strong>.</p>
        <BotonExcel descargar={() => descargarReporteAdmin("cursos")} onExpira={onExpira} />
      </div>
      <Estado cargando={!datos && cargando} error={error} onReintentar={recargar} />

      {datos && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Docente</th>
                <th>Costo mensual</th>
                <th>Inscritos</th>
                <th>Horarios</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((c) => (
                <tr key={c.id} className={c.activo ? "" : "fila-inactiva"}>
                  <td>
                    <strong>{c.nombre}</strong>
                    {c.nivel && <div className="sub">{c.nivel}</div>}
                  </td>
                  <td>{c.docente}</td>
                  <td>{bs(c.costoMensual)}</td>
                  <td>{c.inscritos}</td>
                  <td>
                    {c.horarios.length === 0 ? (
                      <span className="muted">Sin horarios</span>
                    ) : (
                      <ul className="lista-simple">
                        {c.horarios.map((h, i) => (
                          <li key={i}>
                            {diaCorto(h.dia)} {h.horaInicio}–{h.horaFin} <span className="sub">{h.aula}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <span className={c.activo ? "pill ok" : "pill off"}>{c.activo ? "Activo" : "Inactivo"}</span>
                  </td>
                </tr>
              ))}
              {datos.length === 0 && (
                <tr>
                  <td colSpan={6} className="vacio">
                    Todavía no hay cursos registrados.
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
