import type { ReactNode } from "react";

export type Cifra = { etiqueta: string; valor: ReactNode; icono: ReactNode; tono?: "azul" | "verde" | "naranja" | "rojo" | "morado" };

export default function Cifras({ items }: { items: Cifra[] }) {
  return (
    <dl className="tarjetas-cifra">
      {items.map((c) => (
        <div key={c.etiqueta} className={`tarjeta-cifra ${c.tono ?? "azul"}`}>
          <span className="cifra-icono">{c.icono}</span>
          <div>
            <dt>{c.etiqueta}</dt>
            <dd>{c.valor}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
