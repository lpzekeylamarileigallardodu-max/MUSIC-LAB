import { Fragment, useState, type ReactNode } from "react";
import { docCursos, type CursoDocente } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";

type Props = {
  onExpira: () => void;

  barra?: ReactNode | ((curso: CursoDocente) => ReactNode);

  children: (curso: CursoDocente) => ReactNode;
};

export default function ConCurso({ onExpira, barra, children }: Props) {
  const { datos, error, cargando, recargar } = useCarga(docCursos, onExpira);
  const [elegido, setElegido] = useState<number | null>(null);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;
  if (datos.length === 0) return <p className="muted">Todavía no tienes cursos asignados.</p>;

  const actual = datos.find((c) => c.idCurso === elegido) ?? datos.find((c) => c.activo) ?? datos[0];

  return (
    <>
      <div className="barra-filtros">
        <select
          className="select-chico"
          value={actual.idCurso}
          onChange={(e) => setElegido(Number(e.target.value))}
          aria-label="Curso"
        >
          {datos.map((c) => (
            <option key={c.idCurso} value={c.idCurso}>
              {c.curso}
              {c.activo ? "" : " (inactivo)"}
            </option>
          ))}
        </select>
        {typeof barra === "function" ? barra(actual) : barra}
      </div>
      <Fragment key={actual.idCurso}>{children(actual)}</Fragment>
    </>
  );
}
