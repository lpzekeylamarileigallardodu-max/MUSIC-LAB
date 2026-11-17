import { useState, type ReactNode } from "react";
import type { Sesion, TipoUsuario } from "../../api";
import { IconCalendario, IconDinero, IconInicio, IconLibro, IconMusica, IconReloj, IconUsuario } from "../Icons";
import { TIPO_LEGIBLE } from "./util";
import Resumen from "./Resumen";
import UsuariosAdmin from "./UsuariosAdmin";
import ClasesPruebaAdmin from "./ClasesPruebaAdmin";
import CursosAdmin from "./CursosAdmin";
import PagosAdmin from "./PagosAdmin";
import ReportesAdmin from "./ReportesAdmin";
import HorariosAdmin from "../horario/HorariosAdmin";
import "./admin.css";

export type Seccion = "resumen" | "usuarios" | "clases" | "cursos" | "horarios" | "pagos" | "reportes";

type Props = {
  sesion: Sesion;

  onSesionExpirada: () => void;
};

type ItemMenu = { id: Seccion; titulo: string; icono: ReactNode; permitidos: TipoUsuario[] };

const TODOS: TipoUsuario[] = ["DIRECTOR", "SECRETARIA", "RECEPCIONISTA"];
const DIRECCION_Y_SECRETARIA: TipoUsuario[] = ["DIRECTOR", "SECRETARIA"];

const MENU: ItemMenu[] = [
  { id: "resumen", titulo: "Resumen", icono: <IconInicio size={18} />, permitidos: TODOS },
  { id: "usuarios", titulo: "Usuarios", icono: <IconUsuario size={18} />, permitidos: DIRECCION_Y_SECRETARIA },
  { id: "clases", titulo: "Clases de prueba", icono: <IconCalendario size={18} />, permitidos: TODOS },
  { id: "cursos", titulo: "Cursos", icono: <IconMusica size={18} />, permitidos: TODOS },
  { id: "horarios", titulo: "Horarios", icono: <IconReloj size={18} />, permitidos: TODOS },
  { id: "pagos", titulo: "Pagos y cuotas", icono: <IconDinero size={18} />, permitidos: DIRECCION_Y_SECRETARIA },
  { id: "reportes", titulo: "Reportes", icono: <IconLibro size={18} />, permitidos: TODOS },
];

export default function PanelAdmin({ sesion, onSesionExpirada }: Props) {
  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const menu = MENU.filter((m) => m.permitidos.includes(sesion.tipoUsuario));
  const actual = menu.find((m) => m.id === seccion) ?? menu[0];

  const props = { onExpira: onSesionExpirada, tipoUsuario: sesion.tipoUsuario };

  return (
    <div className="panel">
      <aside className="panel-menu">
        <div className="panel-quien">
          <strong>{sesion.nombre}</strong>
          <span>{TIPO_LEGIBLE[sesion.tipoUsuario]}</span>
        </div>
        <nav aria-label="Secciones del panel">
          {menu.map((m) => (
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
        <h1>{actual.titulo}</h1>
        {actual.id === "resumen" && <Resumen {...props} irA={setSeccion} />}
        {actual.id === "usuarios" && <UsuariosAdmin {...props} />}
        {actual.id === "clases" && <ClasesPruebaAdmin {...props} />}
        {actual.id === "cursos" && <CursosAdmin {...props} />}
        {actual.id === "horarios" && <HorariosAdmin {...props} />}
        {actual.id === "pagos" && <PagosAdmin {...props} />}
        {actual.id === "reportes" && <ReportesAdmin {...props} />}
      </main>
    </div>
  );
}
