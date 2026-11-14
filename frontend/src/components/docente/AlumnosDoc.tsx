import { descargarReporteCurso, docAlumnos } from "../../api";
import BotonExcel from "../BotonExcel";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import ConCurso from "./ConCurso";
import { claseAsistencia } from "./util";

type Props = { onExpira: () => void };

function ListaAlumnos({ idCurso, onExpira }: { idCurso: number; onExpira: () => void }) {
  const { datos, error, cargando, recargar } = useCarga(() => docAlumnos(idCurso), onExpira);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Asistencia</th>
            <th>Promedio de notas</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((a) => (
            <tr key={a.idInscripcion}>
              <td>
                <strong>{a.nombre}</strong>
                <div className="sub">{a.correo}</div>
              </td>
              <td>
                {a.asistenciaPorcentaje === null ? (
                  <span className="muted">Sin clases registradas</span>
                ) : (
                  <span className={claseAsistencia(a.asistenciaPorcentaje)}>{a.asistenciaPorcentaje}%</span>
                )}
              </td>
              <td>{a.promedio === null ? <span className="muted">Sin notas</span> : a.promedio}</td>
            </tr>
          ))}
          {datos.length === 0 && (
            <tr>
              <td colSpan={3} className="vacio">Este curso no tiene alumnos activos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AlumnosDoc({ onExpira }: Props) {
  return (
    <ConCurso
      onExpira={onExpira}
      barra={(c) => (
        <BotonExcel descargar={() => descargarReporteCurso(c.idCurso)} onExpira={onExpira}
          texto="Excel del curso (alumnos, notas y asistencia)" />
      )}
    >
      {(c) => <ListaAlumnos idCurso={c.idCurso} onExpira={onExpira} />}
    </ConCurso>
  );
}
