import { useEffect, useRef, useState, type DragEvent } from "react";
import { IconArchivo, IconCerrar, IconImagen, IconSubir } from "./Icons";

type Props = {
  archivo: File | null;
  onCambio: (archivo: File | null) => void;
  extensiones: string[];
  maxMB: number;
  titulo?: string;
  detalle?: string;
  vistaPrevia?: boolean;
  disabled?: boolean;
};

const extensionDe = (nombre: string) => (nombre.includes(".") ? nombre.slice(nombre.lastIndexOf(".") + 1).toLowerCase() : "");

export const tamano = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

export default function ZonaArchivo({
  archivo,
  onCambio,
  extensiones,
  maxMB,
  titulo = "Arrastra tu archivo aquí",
  detalle,
  vistaPrevia = false,
  disabled = false,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miniatura, setMiniatura] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo || !vistaPrevia || !archivo.type.startsWith("image/")) {
      setMiniatura(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setMiniatura(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo, vistaPrevia]);

  useEffect(() => {
    if (!archivo && input.current) input.current.value = "";
  }, [archivo]);

  const elegir = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    if (!extensiones.includes(extensionDe(f.name))) {
      setError(`Ese tipo de archivo no se acepta. Usa: ${extensiones.map((e) => e.toUpperCase()).join(", ")}.`);
      return;
    }
    if (f.size > maxMB * 1024 * 1024) {
      setError(`El archivo pesa ${tamano(f.size)}. El máximo es ${maxMB} MB.`);
      return;
    }
    onCambio(f);
  };

  const soltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEncima(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 1) {
      setError("Suelta un solo archivo.");
      return;
    }
    elegir(e.dataTransfer.files[0]);
  };

  const quitar = () => {
    setError(null);
    onCambio(null);
  };

  return (
    <div className="zona-archivo-envoltura">
      <input
        ref={input}
        type="file"
        hidden
        accept={extensiones.map((e) => "." + e).join(",")}
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      {archivo ? (
        <div className="archivo-elegido">
          {miniatura ? (
            <img src={miniatura} alt="Vista previa" className="archivo-miniatura" />
          ) : (
            <span className="archivo-icono">{archivo.type.startsWith("image/") ? <IconImagen size={26} /> : <IconArchivo size={26} />}</span>
          )}
          <div className="archivo-datos">
            <strong title={archivo.name}>{archivo.name}</strong>
            <span>{tamano(archivo.size)} · {extensionDe(archivo.name).toUpperCase()}</span>
          </div>
          <div className="archivo-acciones">
            <button type="button" className="btn-ghost chico" disabled={disabled} onClick={() => input.current?.click()}>
              Cambiar
            </button>
            <button type="button" className="archivo-quitar" aria-label="Quitar archivo" disabled={disabled} onClick={quitar}>
              <IconCerrar size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`zona-archivo ${encima ? "encima" : ""} ${disabled ? "desactivada" : ""}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${titulo}. O presiona para elegir un archivo.`}
          onClick={() => !disabled && input.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              input.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setEncima(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = disabled ? "none" : "copy";
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setEncima(false);
          }}
          onDrop={soltar}
        >
          <span className="zona-icono"><IconSubir size={30} /></span>
          <strong>{encima ? "Suelta el archivo aquí" : titulo}</strong>
          <span className="zona-o">o</span>
          <span className="zona-boton">Elegir archivo</span>
          <small>{detalle ?? `${extensiones.map((e) => e.toUpperCase()).join(", ")} · hasta ${maxMB} MB`}</small>
        </div>
      )}
      {error && <p className="notice error zona-error">{error}</p>}
    </div>
  );
}
