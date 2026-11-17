import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DIAS, type Bloque, type Dia } from "../../api";
import {
  APERTURA, CIERRE, DIA_CORTO, DIA_LARGO, DURACION_MAX, DURACION_MIN, PASO, aHora, aMinutos, choquesLocales,
  limitar, redondear, tono, MOTIVO_TEXTO,
} from "./tiempo";
import "./horario.css";

const PX = 1;

const UMBRAL = 4;

export type ColorPor = "curso" | "aula" | "docente";

type Props = {
  bloques: Bloque[];

  bloquesParaChoques?: Bloque[];
  editable?: boolean;
  colorPor?: ColorPor;
  seleccionado?: number | null;
  mostrarAula?: boolean;
  mostrarDocente?: boolean;

  dias?: Dia[];
  onSeleccionar?: (b: Bloque) => void;
  onMover?: (b: Bloque, dia: Dia, inicio: string) => void;
  onRedimensionar?: (b: Bloque, fin: string) => void;
  onCrear?: (dia: Dia, inicio: string, fin: string) => void;
  onEliminar?: (b: Bloque) => void;
};

type Arrastre =
  | { modo: "mover"; bloque: Bloque; x0: number; y0: number; dia: Dia; inicio: number; fin: number; movido: boolean }
  | { modo: "redimensionar"; bloque: Bloque; y0: number; dia: Dia; inicio: number; fin: number; movido: boolean }
  | { modo: "crear"; dia: Dia; ancla: number; inicio: number; fin: number; movido: boolean };

function carriles(lista: Bloque[]): Map<number, { carril: number; total: number }> {
  const orden = [...lista].sort((a, b) => aMinutos(a.horaInicio) - aMinutos(b.horaInicio) || aMinutos(b.horaFin) - aMinutos(a.horaFin));
  const res = new Map<number, { carril: number; total: number }>();
  let grupo: Bloque[] = [];
  let finGrupo = -1;
  let finesCarril: number[] = [];
  const cerrar = () => {
    grupo.forEach((b) => res.set(b.id, { carril: res.get(b.id)!.carril, total: finesCarril.length }));
    grupo = [];
    finesCarril = [];
  };
  for (const b of orden) {
    const ini = aMinutos(b.horaInicio);
    const fin = aMinutos(b.horaFin);
    if (ini >= finGrupo) {
      cerrar();
      finGrupo = fin;
    }
    let carril = finesCarril.findIndex((f) => f <= ini);
    if (carril === -1) {
      carril = finesCarril.length;
      finesCarril.push(fin);
    } else {
      finesCarril[carril] = fin;
    }
    res.set(b.id, { carril, total: 0 });
    grupo.push(b);
    finGrupo = Math.max(finGrupo, fin);
  }
  cerrar();
  return res;
}

function claveColor(b: Bloque, por: ColorPor): number {
  return por === "aula" ? b.idAula * 3 + 1 : por === "docente" ? b.idDocente * 5 + 2 : b.idCurso;
}

const hoyDia = (): Dia => DIAS[(new Date().getDay() + 6) % 7];

export default function TableroSemanal({
  bloques, bloquesParaChoques, editable = false, colorPor = "curso", seleccionado = null,
  mostrarAula = true, mostrarDocente = true, dias = DIAS,
  onSeleccionar, onMover, onRedimensionar, onCrear, onEliminar,
}: Props) {
  const columnas = useRef<Partial<Record<Dia, HTMLDivElement | null>>>({});
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const paraChoques = bloquesParaChoques ?? bloques;

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const porDia = useMemo(() => {
    const m = new Map<Dia, Bloque[]>();
    dias.forEach((d) => m.set(d, []));
    bloques.forEach((b) => m.get(b.dia)?.push(b));
    return m;
  }, [bloques, dias]);

  const lanes = useMemo(() => {
    const m = new Map<number, { carril: number; total: number }>();
    porDia.forEach((lista) => carriles(lista).forEach((v, k) => m.set(k, v)));
    return m;
  }, [porDia]);

  const horas: number[] = [];
  for (let t = APERTURA; t < CIERRE; t += 60) horas.push(t);

  const diaBajo = (x: number, actual: Dia): Dia => {
    for (const d of dias) {
      const r = columnas.current[d]?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right) return d;
    }
    return actual;
  };

  const minutoEn = (dia: Dia, y: number): number => {
    const r = columnas.current[dia]?.getBoundingClientRect();
    return r ? APERTURA + (y - r.top) / PX : APERTURA;
  };

  const empezarMover = (e: PointerEvent<HTMLDivElement>, b: Bloque) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ modo: "mover", bloque: b, x0: e.clientX, y0: e.clientY, dia: b.dia,
      inicio: aMinutos(b.horaInicio), fin: aMinutos(b.horaFin), movido: false });
  };

  const empezarRedimensionar = (e: PointerEvent<HTMLDivElement>, b: Bloque) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ modo: "redimensionar", bloque: b, y0: e.clientY, dia: b.dia,
      inicio: aMinutos(b.horaInicio), fin: aMinutos(b.horaFin), movido: false });
  };

  const empezarCrear = (e: PointerEvent<HTMLDivElement>, dia: Dia) => {
    if (!editable || !onCrear || e.button !== 0 || e.target !== e.currentTarget) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ancla = limitar(Math.floor(minutoEn(dia, e.clientY) / PASO) * PASO, APERTURA, CIERRE - DURACION_MIN);
    setArrastre({ modo: "crear", dia, ancla, inicio: ancla, fin: ancla + DURACION_MIN, movido: false });
  };

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (!arrastre) return;
    e.stopPropagation();
    if (arrastre.modo === "mover") {
      const b = arrastre.bloque;
      const largo = aMinutos(b.horaFin) - aMinutos(b.horaInicio);
      const movido = arrastre.movido || Math.abs(e.clientX - arrastre.x0) + Math.abs(e.clientY - arrastre.y0) > UMBRAL;
      const inicio = limitar(aMinutos(b.horaInicio) + redondear((e.clientY - arrastre.y0) / PX), APERTURA, CIERRE - largo);
      setArrastre({ ...arrastre, movido, dia: diaBajo(e.clientX, arrastre.dia), inicio, fin: inicio + largo });
    } else if (arrastre.modo === "redimensionar") {
      const ini = aMinutos(arrastre.bloque.horaInicio);
      const fin = limitar(aMinutos(arrastre.bloque.horaFin) + redondear((e.clientY - arrastre.y0) / PX),
        ini + DURACION_MIN, Math.min(ini + DURACION_MAX, CIERRE));
      setArrastre({ ...arrastre, movido: true, fin });
    } else {
      const m = limitar(redondear(minutoEn(arrastre.dia, e.clientY)), APERTURA, CIERRE);
      const inicio = Math.min(arrastre.ancla, m);
      const fin = Math.max(Math.max(arrastre.ancla, m), inicio + DURACION_MIN);
      setArrastre({ ...arrastre, movido: arrastre.movido || m !== arrastre.ancla, inicio,
        fin: Math.min(fin, inicio + DURACION_MAX, CIERRE) });
    }
  };

  const soltar = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const a = arrastre;
    setArrastre(null);
    if (!a) return;
    if (a.modo === "crear") {

      const fin = a.movido ? a.fin : Math.min(a.inicio + 90, CIERRE);
      onCrear?.(a.dia, aHora(a.inicio), aHora(fin));
      return;
    }
    if (!a.movido) {
      onSeleccionar?.(a.bloque);
      return;
    }
    if (a.modo === "mover" && (a.dia !== a.bloque.dia || aHora(a.inicio) !== a.bloque.horaInicio)) {
      onMover?.(a.bloque, a.dia, aHora(a.inicio));
    } else if (a.modo === "redimensionar" && aHora(a.fin) !== a.bloque.horaFin) {
      onRedimensionar?.(a.bloque, aHora(a.fin));
    }
  };

  const teclado = (e: KeyboardEvent<HTMLDivElement>, b: Bloque) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSeleccionar?.(b);
      return;
    }
    if (!editable) return;
    const ini = aMinutos(b.horaInicio);
    const fin = aMinutos(b.horaFin);
    const idx = DIAS.indexOf(b.dia);
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onEliminar?.(b);
    } else if (e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const nuevo = fin + (e.key === "ArrowDown" ? PASO : -PASO);
      if (nuevo - ini >= DURACION_MIN && nuevo - ini <= DURACION_MAX && nuevo <= CIERRE) onRedimensionar?.(b, aHora(nuevo));
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? PASO : -PASO;
      if (ini + delta >= APERTURA && fin + delta <= CIERRE) onMover?.(b, b.dia, aHora(ini + delta));
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      onMover?.(b, DIAS[idx - 1], b.horaInicio);
    } else if (e.key === "ArrowRight" && idx < DIAS.length - 1) {
      e.preventDefault();
      onMover?.(b, DIAS[idx + 1], b.horaInicio);
    }
  };

  let fantasma: { dia: Dia; inicio: number; fin: number; choques: string[]; texto: string } | null = null;
  if (arrastre && arrastre.movido) {
    const b = arrastre.modo === "crear" ? null : arrastre.bloque;
    const choques = b
      ? choquesLocales(paraChoques, { id: b.id, idCurso: b.idCurso, idAula: b.idAula, idDocente: b.idDocente,
          dia: arrastre.dia, inicio: arrastre.inicio, fin: arrastre.fin })
          .map((c) => `${c.bloque.curso} (${MOTIVO_TEXTO[c.motivo]})`)
      : [];
    fantasma = {
      dia: arrastre.dia, inicio: arrastre.inicio, fin: arrastre.fin, choques,
      texto: `${b ? b.curso + " · " : "Nueva clase · "}${aHora(arrastre.inicio)}–${aHora(arrastre.fin)}`,
    };
  }

  const diaHoy = hoyDia();
  const minutoAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const alto = (CIERRE - APERTURA) * PX;

  return (
    <div className={`tablero ${editable ? "editable" : ""} ${arrastre?.movido ? "arrastrando" : ""}`}>
      <div className="tablero-grid" style={{ gridTemplateColumns: `56px repeat(${dias.length}, minmax(118px, 1fr))` }}>
        <div className="tablero-esquina" />
        {dias.map((d) => (
          <div key={d} className={`tablero-dia ${d === diaHoy ? "hoy" : ""}`} title={DIA_LARGO[d]}>
            <span className="dia-largo">{DIA_LARGO[d]}</span>
            <span className="dia-corto">{DIA_CORTO[d]}</span>
          </div>
        ))}

        <div className="tablero-horas" style={{ height: alto }}>
          {horas.map((t) => (
            <span key={t} style={{ top: (t - APERTURA) * PX }}>{aHora(t)}</span>
          ))}
        </div>

        {dias.map((d) => (
          <div
            key={d}
            ref={(el) => { columnas.current[d] = el; }}
            className={`tablero-col ${d === diaHoy ? "hoy" : ""}`}
            style={{ height: alto }}
            onPointerDown={(e) => empezarCrear(e, d)}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={() => setArrastre(null)}
            aria-label={`Columna del ${DIA_LARGO[d]}`}
          >
            {(porDia.get(d) ?? []).map((b) => {
              const ini = aMinutos(b.horaInicio);
              const fin = aMinutos(b.horaFin);
              const lane = lanes.get(b.id) ?? { carril: 0, total: 1 };
              const ancho = 100 / Math.max(lane.total, 1);
              const enArrastre = arrastre && arrastre.modo !== "crear" && arrastre.bloque.id === b.id && arrastre.movido;
              const altoBloque = (fin - ini) * PX;
              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${b.curso}, ${DIA_LARGO[b.dia]} de ${b.horaInicio} a ${b.horaFin}, ${b.aula}, ${b.docente}${b.activo ? "" : ", inactivo"}`}
                  className={[
                    "bloque",
                    b.activo && b.cursoActivo ? "" : "inactivo",
                    seleccionado === b.id ? "seleccionado" : "",
                    enArrastre ? "origen" : "",
                    altoBloque < 45 ? "compacto" : "",
                    lane.total > 1 ? "estrecho" : "",
                  ].join(" ")}
                  style={{
                    top: (ini - APERTURA) * PX,
                    height: altoBloque,
                    left: `calc(${lane.carril * ancho}% + 2px)`,
                    width: `calc(${ancho}% - 4px)`,
                    ["--h" as string]: tono(claveColor(b, colorPor)),
                  }}
                  onPointerDown={(e) => (editable ? empezarMover(e, b) : undefined)}
                  onPointerMove={mover}
                  onPointerUp={editable ? soltar : undefined}
                  onClick={editable ? undefined : () => onSeleccionar?.(b)}
                  onKeyDown={(e) => teclado(e, b)}
                  title={`${b.curso}\n${b.horaInicio}–${b.horaFin} · ${b.aula}\n${b.docente}${editable ? "\nArrastra para mover · borde inferior para cambiar la duración" : ""}`}
                >
                  <strong className="bloque-curso">{b.curso}</strong>
                  <span className="bloque-hora">{b.horaInicio}–{b.horaFin}</span>
                  {altoBloque >= 60 && mostrarAula && lane.total < 3 && <span className="bloque-extra">{b.aula}</span>}
                  {altoBloque >= 75 && mostrarDocente && lane.total < 2 && <span className="bloque-extra">{b.docente}</span>}
                  {!b.activo && <span className="bloque-etiqueta">Inactivo</span>}
                  {editable && (
                    <div
                      className="bloque-asa"
                      aria-hidden="true"
                      onPointerDown={(e) => empezarRedimensionar(e, b)}
                      onPointerMove={mover}
                      onPointerUp={soltar}
                    />
                  )}
                </div>
              );
            })}

            {fantasma && fantasma.dia === d && (
              <div
                className={`fantasma ${fantasma.choques.length ? "choca" : "libre"}`}
                style={{ top: (fantasma.inicio - APERTURA) * PX, height: (fantasma.fin - fantasma.inicio) * PX }}
              >
                <span>{fantasma.texto}</span>
                {fantasma.choques.length > 0 && <small>Choca con {fantasma.choques.join(", ")}</small>}
              </div>
            )}

            {d === diaHoy && minutoAhora >= APERTURA && minutoAhora <= CIERRE && (
              <div className="linea-ahora" style={{ top: (minutoAhora - APERTURA) * PX }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
