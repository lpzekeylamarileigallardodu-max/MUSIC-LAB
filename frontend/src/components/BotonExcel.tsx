import { useState } from "react";
import { NoAutenticadoError } from "../api";

type Props = {
  descargar: () => Promise<void>;
  onExpira: () => void;
  texto?: string;
  className?: string;
};

export default function BotonExcel({ descargar, onExpira, texto = "Descargar Excel", className = "btn-ghost chico" }: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clic = async () => {
    setGenerando(true);
    setError(null);
    try {
      await descargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setError(err instanceof Error ? err.message : "No se pudo generar el reporte");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <span className="boton-excel">
      <button type="button" className={className} onClick={clic} disabled={generando}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="m9 13 4 5M13 13l-4 5" />
        </svg>
        {generando ? "Generando…" : texto}
      </button>
      {error && <span className="sub alerta" role="alert">{error}</span>}
    </span>
  );
}
