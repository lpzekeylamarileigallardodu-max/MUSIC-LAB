import { useMemo, useState } from "react";
import { descargarLibreta, estAsistencia, estEvaluaciones, type EstadoAsistencia } from "../../api";
import BotonExcel from "../BotonExcel";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { fecha } from "../admin/util";

type Props = { onExpira: () => void };

const ESTADO: Record<EstadoAsistencia, { texto: string; clase: string }> = {
  PRESENTE: { texto: "Presente", clase: "pill ok" },
  TARDANZA: { texto: "Tardanza", clase: "pill warn" },
  AUSENTE: { texto: "Ausente", clase: "pill bad" },
  LICENCIA: { texto: "Licencia", clase: "pill off" },
};

const dia = (aaaammdd: string) => fecha(`${aaaammdd}T00:00:00`);

export default function AcademicoEst({ onExpira }: Props) {
  const asistencia = useCarga(estAsistencia, onExpira);
  const notas = useCarga(estEvaluaciones, onExpira);
  const [curso, setCurso] = useState("TODOS");

  // Cursos que aparecen en alguno de los dos listados, para el filtro
  const cursos = useMemo(() => {
    const nombres = new Set<string>();
    asistencia.datos?.forEach((a) => nombres.add(a.curso));
    notas.datos?.forEach((n) => nombres.add(n.curso));
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
  }, [asistencia.datos, notas.datos]);

  const asistencias = (asistencia.datos ?? []).filter((a) => curso === "TODOS" || a.curso === curso);
  const evaluaciones = (notas.datos ?? []).filter((n) => curso === "TODOS" || n.curso === curso);

  // Presente y tardanza cuentan como asistidas; la licencia no pesa en el porcentaje
  const validas = asistencias.filter((a) => a.estado !== "LICENCIA");
  const asistidas = validas.filter((a) => a.estado === "PRESENTE" || a.estado === "TARDANZA").length;
  const porcentaje = validas.length === 0 ? null : Math.round((asistidas * 100) / validas.length);

  const conNota = evaluaciones.filter((n) => n.nota !== null);
  const promedio = conNota.length === 0 ? null : conNota.reduce((s, n) => s + (n.nota ?? 0), 0) / conNota.length;

  return (
    <>
      {cursos.length > 1 && (
        <div className="barra-filtros">
          <select className="select-chico" value={curso} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso">
            <option value="TODOS">Todos mis cursos</option>
            {cursos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{ flex: 1 }} />
          <BotonExcel descargar={descargarLibreta} onExpira={onExpira} texto="Descargar mi libreta (Excel)" />
        </div>
      )}

      <section className="panel-bloque">
        <h2>Notas</h2>
        <Estado cargando={!notas.datos && notas.cargando} error={notas.error} onReintentar={notas.recargar} />
        {notas.datos && (
          <>
            <dl className="cifras" style={{ marginBottom: 16 }}>
              <div><dt>Promedio</dt><dd>{promedio === null ? "—" : promedio.toFixed(1)}</dd></div>
              <div><dt>Evaluaciones</dt><dd>{evaluaciones.length}</dd></div>
            </dl>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Evaluación</th>
                    <th>Nota</th>
                    <th>Fecha</th>
                    <th>Comentario del docente</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluaciones.map((n, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{n.nombre}</strong>
                        <div className="sub">{n.curso}</div>
                      </td>
                      <td>{n.nota === null ? <span className="muted">Sin calificar</span> : <strong>{n.nota}</strong>}</td>
                      <td>{n.fecha ? dia(n.fecha) : "—"}</td>
                      <td className="texto-largo">{n.comentario ?? "—"}</td>
                    </tr>
                  ))}
                  {evaluaciones.length === 0 && (
                    <tr>
                      <td colSpan={4} className="vacio">Todavía no tienes evaluaciones registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel-bloque">
        <h2>Asistencia</h2>
        <Estado cargando={!asistencia.datos && asistencia.cargando} error={asistencia.error} onReintentar={asistencia.recargar} />
        {asistencia.datos && (
          <>
            <dl className="cifras" style={{ marginBottom: 16 }}>
              <div><dt>Asistencia</dt><dd>{porcentaje === null ? "—" : `${porcentaje}%`}</dd></div>
              <div><dt>Clases registradas</dt><dd>{asistencias.length}</dd></div>
            </dl>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th>Estado</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a, i) => (
                    <tr key={i}>
                      <td>{dia(a.fecha)}</td>
                      <td>{a.curso}</td>
                      <td><span className={ESTADO[a.estado].clase}>{ESTADO[a.estado].texto}</span></td>
                      <td className="texto-largo">{a.observacion ?? "—"}</td>
                    </tr>
                  ))}
                  {asistencias.length === 0 && (
                    <tr>
                      <td colSpan={4} className="vacio">Todavía no hay asistencia registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
