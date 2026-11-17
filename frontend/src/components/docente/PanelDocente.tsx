import { useState, type ReactNode } from "react";
import type { Sesion } from "../../api";
import { IconCalendario, IconInicio, IconLibro, IconMusica, IconNota, IconReloj, IconUsuario } from "../Icons";
import { TIPO_LEGIBLE } from "../admin/util";
import "../admin/admin.css";
import "../estudiante/estudiante.css";
import "./docente.css";
import InicioDoc from "./InicioDoc";
import CursosDoc from "./CursosDoc";
import AlumnosDoc from "./AlumnosDoc";
import AsistenciaDoc from "./AsistenciaDoc";
import EvaluacionesDoc from "./EvaluacionesDoc";
import MaterialDoc from "./MaterialDoc";
import MiHorario from "../horario/MiHorario";
import { docHorario } from "../../api";

export type SeccionDoc = "inicio" | "cursos" | "horario" | "alumnos" | "asistencia" | "evaluaciones" | "material";

type Props = {
  sesion: Sesion;

  onSesionExpirada: () => void;
};

const MENU: { id: SeccionDoc; titulo: string; icono: ReactNode }[] = [
  { id: "inicio", titulo: "Inicio", icono: <IconInicio size={18} /> },
  { id: "cursos", titulo: "Mis cursos", icono: <IconMusica size={18} /> },
  { id: "horario", titulo: "Mi horario", icono: <IconReloj size={18} /> },
  { id: "alumnos", titulo: "Mis alumnos", icono: <IconUsuario size={18} /> },
  { id: "asistencia", titulo: "Asistencia", icono: <IconCalendario size={18} /> },
  { id: "evaluaciones", titulo: "Evaluaciones", icono: <IconNota size={18} /> },
  { id: "material", titulo: "Material de apoyo", icono: <IconLibro size={18} /> },
];

export default function PanelDocente({ sesion, onSesionExpirada }: Props) {
  const [seccion, setSeccion] = useState<SeccionDoc>("inicio");
  const actual = MENU.find((m) => m.id === seccion) ?? MENU[0];

  const props = { onExpira: onSesionExpirada };

  return (
    <div className="panel">
      <aside className="panel-menu">
        <div className="panel-quien">
          <strong>{sesion.nombre}</strong>
          <span>{TIPO_LEGIBLE[sesion.tipoUsuario]}</span>
        </div>
        <nav aria-label="Secciones del panel del docente">
          {MENU.map((m) => (
            <button
              key={m.id}
              className={m.id === actual.id ? "panel-item activo" : "panel-item"}
              aria-current={m.id === actual.id ? "page" : undefined}
              onClick={() => setSeccion(m.id)}
            >
              {m.icono}
              {m.titulo}
            </button>
          ))}
        </nav>
      </aside>

      <main className="panel-contenido">
        <h1>{actual.id === "inicio" ? `Hola, ${sesion.nombre.split(" ")[0]}` : actual.titulo}</h1>
        {actual.id === "inicio" && <InicioDoc {...props} irA={setSeccion} />}
        {actual.id === "cursos" && <CursosDoc {...props} />}
        {actual.id === "horario" && (
          <MiHorario cargar={docHorario} onExpira={onSesionExpirada} mostrarDocente={false}
            vacio="Tus cursos todavía no tienen horarios asignados." />
        )}
        {actual.id === "alumnos" && <AlumnosDoc {...props} />}
        {actual.id === "asistencia" && <AsistenciaDoc {...props} />}
        {actual.id === "evaluaciones" && <EvaluacionesDoc {...props} />}
        {actual.id === "material" && <MaterialDoc {...props} />}
      </main>
    </div>
  );
}
