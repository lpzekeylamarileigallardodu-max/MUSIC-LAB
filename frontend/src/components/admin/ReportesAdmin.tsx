import { descargarReporteAdmin, type ReporteAdmin, type TipoUsuario } from "../../api";
import type { ReactNode } from "react";
import BotonExcel from "../BotonExcel";
import { IconDinero, IconGrafico, IconMusica, IconReloj, IconUsuario } from "../Icons";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };

const ICONO: Record<ReporteAdmin, ReactNode> = {
  horarios: <IconReloj size={24} />,
  cursos: <IconMusica size={24} />,
  usuarios: <IconUsuario size={24} />,
  cuotas: <IconGrafico size={24} />,
  pagos: <IconDinero size={24} />,
};

const REPORTES: { tipo: ReporteAdmin; titulo: string; detalle: string; finanzas: boolean }[] = [
  { tipo: "horarios", titulo: "Horarios", detalle: "Cuadrícula semanal de toda la academia, una hoja por aula y la lista de clases.", finanzas: false },
  { tipo: "cursos", titulo: "Cursos e inscripciones", detalle: "Inscritos por curso, ingreso mensual esperado y la lista de inscripciones.", finanzas: false },
  { tipo: "usuarios", titulo: "Usuarios", detalle: "Todas las cuentas con su tipo y estado, y el total por tipo.", finanzas: true },
  { tipo: "cuotas", titulo: "Cuotas y morosidad", detalle: "Todas las cuotas, quién debe y cuánto, y el resumen por estado.", finanzas: true },
  { tipo: "pagos", titulo: "Pagos", detalle: "Historial de transacciones e ingresos aprobados por mes y método.", finanzas: true },
];

export default function ReportesAdmin({ onExpira, tipoUsuario }: Props) {
  const veFinanzas = tipoUsuario === "DIRECTOR" || tipoUsuario === "SECRETARIA";
  return (
    <ul className="lista-reportes">
      {REPORTES.filter((r) => veFinanzas || !r.finanzas).map((r) => (
        <li key={r.tipo} className={`reporte-${r.tipo}`}>
          <span className="reporte-icono">{ICONO[r.tipo]}</span>
          <div className="reporte-texto">
            <strong>{r.titulo}</strong>
            <p className="muted">{r.detalle}</p>
          </div>
          <BotonExcel descargar={() => descargarReporteAdmin(r.tipo)} onExpira={onExpira} texto="Descargar .xlsx" />
        </li>
      ))}
    </ul>
  );
}
