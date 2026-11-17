import { useState, type ReactNode } from "react";
import type { Sesion } from "../../api";
import { IconCalendario, IconDinero, IconInicio, IconLibro, IconMicrofono, IconMusica, IconNota, IconReloj } from "../Icons";
import { TIPO_LEGIBLE } from "../admin/util";
import "../admin/admin.css";
import "./estudiante.css";
import InicioEst from "./InicioEst";
import CursosEst from "./CursosEst";
import PagosEst from "./PagosEst";
import AcademicoEst from "./AcademicoEst";
import MaterialEst from "./MaterialEst";
import PrestamosEst from "./PrestamosEst";
import EventosEst from "./EventosEst";
import MiHorario from "../horario/MiHorario";
import BotonExcel from "../BotonExcel";
import { descargarLibreta, estHorario } from "../../api";

export type SeccionEst = "inicio" | "cursos" | "horario" | "pagos" | "academico" | "material" | "prestamos" | "eventos";

type Props = {
  sesion: Sesion;

  onSesionExpirada: () => void;
};

const MENU: { id: SeccionEst; titulo: string; icono: ReactNode }[] = [
  { id: "inicio", titulo: "Inicio", icono: <IconInicio size={18} /> },
  { id: "cursos", titulo: "Mis cursos", icono: <IconMusica size={18} /> },
  { id: "horario", titulo: "Mi horario", icono: <IconReloj size={18} /> },
  { id: "pagos", titulo: "Pagos y cuotas", icono: <IconDinero size={18} /> },
  { id: "academico", titulo: "Asistencia y notas", icono: <IconNota size={18} /> },
  { id: "material", titulo: "Material de apoyo", icono: <IconLibro size={18} /> },
  { id: "prestamos", titulo: "Instrumentos", icono: <IconMicrofono size={18} /> },
  { id: "eventos", titulo: "Eventos", icono: <IconCalendario size={18} /> },
];

export default function PanelEstudiante({ sesion, onSesionExpirada }: Props) {
  const [seccion, setSeccion] = useState<SeccionEst>("inicio");
  const actual = MENU.find((m) => m.id === seccion) ?? MENU[0];

  const props = { onExpira: onSesionExpirada };

  return (
    <div className="panel">
      <aside className="panel-menu">
        <div className="panel-quien">
          <strong>{sesion.nombre}</strong>
          <span>{TIPO_LEGIBLE[sesion.tipoUsuario]}</span>
        </div>
        <nav aria-label="Secciones del panel del estudiante">
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
        {actual.id === "inicio" && <InicioEst {...props} irA={setSeccion} />}
        {actual.id === "cursos" && <CursosEst {...props} />}
        {actual.id === "horario" && (
          <MiHorario
            cargar={estHorario}
            onExpira={onSesionExpirada}
            mostrarDocente
            vacio="Todavía no tienes clases: cuando secretaría te inscriba en un curso, tu horario aparecerá aquí."
            acciones={<BotonExcel descargar={descargarLibreta} onExpira={onSesionExpirada} texto="Descargar mi libreta (Excel)" />}
          />
        )}
        {actual.id === "pagos" && <PagosEst {...props} />}
        {actual.id === "academico" && <AcademicoEst {...props} />}
        {actual.id === "material" && <MaterialEst {...props} />}
        {actual.id === "prestamos" && <PrestamosEst {...props} />}
        {actual.id === "eventos" && <EventosEst {...props} />}
      </main>
    </div>
  );
}
