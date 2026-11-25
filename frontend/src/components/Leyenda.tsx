import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Posicion = { x: number; y: number; abajo: boolean };

const ESPERA_MS = 500;

export function useLeyenda(texto: string) {
  const [pos, setPos] = useState<Posicion | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const ocultar = () => {
    window.clearTimeout(temporizador.current);
    setPos(null);
  };

  const mostrar = (el: HTMLElement, alInstante = false) => {
    window.clearTimeout(temporizador.current);
    const poner = () => {
      const r = el.getBoundingClientRect();
      const abajo = r.top < 48;
      setPos({ x: r.left + r.width / 2, y: abajo ? r.bottom + 8 : r.top - 8, abajo });
    };
    if (alInstante) poner();
    else temporizador.current = window.setTimeout(poner, ESPERA_MS);
  };

  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", ocultar, true);
    window.addEventListener("resize", ocultar);
    return () => {
      window.removeEventListener("scroll", ocultar, true);
      window.removeEventListener("resize", ocultar);
    };
  }, [pos]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const burbuja =
    pos &&
    createPortal(
      <span
        role="tooltip"
        className={`leyenda ${pos.abajo ? "abajo" : ""}`}
        style={{ left: pos.x, top: pos.y }}
      >
        {texto}
      </span>,
      document.body,
    );

  const eventos = {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => mostrar(e.currentTarget),
    onMouseLeave: ocultar,
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (e.currentTarget.matches(":focus-visible")) mostrar(e.currentTarget, true);
    },
    onBlur: ocultar,
    onMouseDown: ocultar,
  };

  return { eventos, burbuja };
}

type Props = {
  texto: string;
  icono: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tono?: "normal" | "peligro" | "exito";
  type?: "button" | "submit";
};

export default function BotonIcono({ texto, icono, onClick, disabled, tono = "normal", type = "button" }: Props) {
  const { eventos, burbuja } = useLeyenda(texto);
  return (
    <>
      <button
        type={type}
        className={`boton-icono ${tono}`}
        aria-label={texto}
        disabled={disabled}
        onClick={onClick}
        {...eventos}
      >
        {icono}
      </button>
      {burbuja}
    </>
  );
}

export function ConLeyenda({ texto, children }: { texto: string; children: ReactNode }) {
  const { eventos, burbuja } = useLeyenda(texto);
  return (
    <span className="con-leyenda" {...eventos}>
      {children}
      {burbuja}
    </span>
  );
}
