import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DIAS, NoAutenticadoError, descargarReporteAdmin, horActualizar, horCrear, horDuplicar, horEliminar, horEstado,
  horMover, horTablero, type Bloque, type DatosBloque, type Dia, type Tablero, type TipoUsuario,
} from "../../api";
import Estado from "../admin/Estado";
import { IconBasura, IconCopiar, IconDescargar, IconEditar, IconMas, IconPausa, IconPlay } from "../Icons";
import { useCarga } from "../admin/useCarga";
import EditorBloque from "./EditorBloque";
import TableroSemanal, { type ColorPor } from "./TableroSemanal";
import { DIA_LARGO, aMinutos, duracion, textoDuracion, tono } from "./tiempo";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };

type Aviso = { texto: string; error?: boolean; deshacer?: () => Promise<unknown> };
type Editor = { id: number | null; datos: DatosBloque; activo: boolean };

const datosDe = (b: Bloque): DatosBloque => ({
  idCurso: b.idCurso, idAula: b.idAula, dia: b.dia, horaInicio: b.horaInicio, horaFin: b.horaFin,
});

const siguienteDia = (d: Dia): Dia => DIAS[(DIAS.indexOf(d) + 1) % DIAS.length];

export default function HorariosAdmin({ onExpira, tipoUsuario }: Props) {
  const { datos, setDatos, error, cargando, recargar } = useCarga(horTablero, onExpira);
  const editable = tipoUsuario === "DIRECTOR" || tipoUsuario === "SECRETARIA";

  const [filtroAula, setFiltroAula] = useState(0);
  const [filtroDocente, setFiltroDocente] = useState(0);
  const [filtroCurso, setFiltroCurso] = useState(0);
  const [colorPor, setColorPor] = useState<ColorPor>("curso");
  const [verInactivos, setVerInactivos] = useState(true);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [diaCopia, setDiaCopia] = useState<Dia>("MARTES");
  const [ocupado, setOcupado] = useState(false);

  const bloques = datos?.bloques ?? [];
  const elegido = bloques.find((b) => b.id === seleccion) ?? null;

  useEffect(() => {
    if (elegido) setDiaCopia(siguienteDia(elegido.dia));
  }, [elegido?.id]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.deshacer ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const visibles = useMemo(
    () => bloques.filter((b) =>
      (verInactivos || (b.activo && b.cursoActivo))
      && (!filtroAula || b.idAula === filtroAula)
      && (!filtroDocente || b.idDocente === filtroDocente)
      && (!filtroCurso || b.idCurso === filtroCurso)),
    [bloques, verInactivos, filtroAula, filtroDocente, filtroCurso],
  );

  const docentes = useMemo(() => {
    const m = new Map<number, string>();
    datos?.cursos.forEach((c) => m.set(c.idDocente, c.docente));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [datos]);

  const ocupacion = useMemo(() => {
    if (!datos) return [];
    const lista = datos.aulas.map((a) => ({
      aula: a,
      minutos: bloques.filter((b) => b.idAula === a.id && b.activo && b.cursoActivo).reduce((s, b) => s + duracion(b), 0),
    }));
    const max = Math.max(1, ...lista.map((x) => x.minutos));
    return lista.map((x) => ({ ...x, porcentaje: Math.round((x.minutos / max) * 100) }));
  }, [datos, bloques]);

  const leyenda = useMemo(() => {
    const m = new Map<number, { nombre: string; h: number }>();
    visibles.forEach((b) => {
      if (colorPor === "aula") m.set(b.idAula, { nombre: b.aula, h: tono(b.idAula * 3 + 1) });
      else if (colorPor === "docente") m.set(b.idDocente, { nombre: b.docente, h: tono(b.idDocente * 5 + 2) });
      else m.set(b.idCurso, { nombre: b.curso, h: tono(b.idCurso) });
    });
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [visibles, colorPor]);

  const fallo = useCallback((err: unknown) => {
    if (err instanceof NoAutenticadoError) return onExpira();
    setAviso({ texto: err instanceof Error ? err.message : "No se pudo completar la acción", error: true });
  }, [onExpira]);

  const reemplazar = (b: Bloque) =>
    setDatos((t: Tablero | null) => (t ? { ...t, bloques: t.bloques.map((x) => (x.id === b.id ? b : x)) } : t));

  const cambioOptimista = async (antes: Bloque, despues: Partial<Bloque>, llamada: () => Promise<Bloque>, texto: string) => {
    reemplazar({ ...antes, ...despues });
    try {
      const nuevo = await llamada();
      reemplazar(nuevo);
      setAviso({ texto, deshacer: () => horActualizar(antes.id, datosDe(antes)) });
    } catch (err) {
      reemplazar(antes);
      fallo(err);
    }
  };

  const mover = (b: Bloque, dia: Dia, inicio: string) => {
    const fin = aMinutos(inicio) + duracion(b);
    const horaFin = `${String(Math.floor(fin / 60)).padStart(2, "0")}:${String(fin % 60).padStart(2, "0")}`;
    cambioOptimista(b, { dia, horaInicio: inicio, horaFin }, () => horMover(b.id, dia, inicio),
      `${b.curso} movido a ${DIA_LARGO[dia]} ${inicio}`);
  };

  const redimensionar = (b: Bloque, fin: string) =>
    cambioOptimista(b, { horaFin: fin }, () => horActualizar(b.id, { ...datosDe(b), horaFin: fin }),
      `${b.curso} ahora dura ${textoDuracion(aMinutos(fin) - aMinutos(b.horaInicio))}`);

  const guardarEditor = async (d: DatosBloque) => {
    if (!editor) return;
    if (editor.id === null) {
      const nuevo = await horCrear(d);
      setDatos((t: Tablero | null) => (t ? { ...t, bloques: [...t.bloques, nuevo] } : t));
      setSeleccion(nuevo.id);
      setAviso({ texto: `Clase de ${nuevo.curso} creada`, deshacer: () => horEliminar(nuevo.id) });
    } else {
      const antes = bloques.find((b) => b.id === editor.id)!;
      const nuevo = await horActualizar(editor.id, d);
      reemplazar(nuevo);
      setAviso({ texto: "Cambios guardados", deshacer: () => horActualizar(antes.id, datosDe(antes)) });
    }
    setEditor(null);
  };

  const accion = async (llamada: () => Promise<void>) => {
    setOcupado(true);
    try {
      await llamada();
    } catch (err) {
      fallo(err);
    } finally {
      setOcupado(false);
    }
  };

  const duplicar = (b: Bloque, dia: Dia) => accion(async () => {
    const copia = await horDuplicar(b.id, dia, b.horaInicio);
    setDatos((t: Tablero | null) => (t ? { ...t, bloques: [...t.bloques, copia] } : t));
    setSeleccion(copia.id);
    setAviso({ texto: `${b.curso} copiado al ${DIA_LARGO[dia]}`, deshacer: () => horEliminar(copia.id) });
  });

  const cambiarEstado = (b: Bloque) => accion(async () => {
    const nuevo = await horEstado(b.id, !b.activo);
    reemplazar(nuevo);
    setAviso({ texto: nuevo.activo ? "Clase activada" : "Clase desactivada (ya no ocupa el aula)",
      deshacer: () => horEstado(b.id, b.activo) });
  });

  const eliminar = (b: Bloque) => {
    if (!window.confirm(`¿Eliminar la clase de ${b.curso} del ${DIA_LARGO[b.dia]} ${b.horaInicio}–${b.horaFin}?`)) return;
    accion(async () => {
      await horEliminar(b.id);
      setDatos((t: Tablero | null) => (t ? { ...t, bloques: t.bloques.filter((x) => x.id !== b.id) } : t));
      setSeleccion(null);
      setAviso({
        texto: "Clase eliminada",
        deshacer: async () => {
          const r = await horCrear(datosDe(b));
          if (!b.activo) await horEstado(r.id, false);
        },
      });
    });
  };

  const deshacer = useCallback(async () => {
    if (!aviso?.deshacer) return;
    const fn = aviso.deshacer;
    setAviso(null);
    try {
      await fn();
      recargar();
      setAviso({ texto: "Cambio deshecho" });
    } catch (err) {
      fallo(err);
      recargar();
    }
  }, [aviso, recargar, fallo]);

  useEffect(() => {
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (editor) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && aviso?.deshacer) {
        e.preventDefault();
        deshacer();
      } else if (e.key === "Escape") {
        setSeleccion(null);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aviso, deshacer, editor]);

  const nuevaClase = (dia: Dia = "LUNES", ini = "15:00", fin = "16:30") => {
    const curso = filtroCurso || datos?.cursos.find((c) => c.activo)?.id || 0;
    const aula = filtroAula || datos?.aulas.find((a) => a.activo)?.id || 0;
    setEditor({ id: null, activo: true, datos: { idCurso: curso, idAula: aula, dia, horaInicio: ini, horaFin: fin } });
  };

  const excel = () => accion(() => descargarReporteAdmin("horarios"));

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const activas = bloques.filter((b) => b.activo && b.cursoActivo);
  const horasSemana = activas.reduce((s, b) => s + duracion(b), 0);

  return (
    <>
      <div className="barra-horario">
        <select value={filtroAula} onChange={(e) => setFiltroAula(Number(e.target.value))} aria-label="Filtrar por aula">
          <option value={0}>Todas las aulas</option>
          {datos.aulas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select value={filtroDocente} onChange={(e) => setFiltroDocente(Number(e.target.value))} aria-label="Filtrar por docente">
          <option value={0}>Todos los docentes</option>
          {docentes.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
        </select>
        <select value={filtroCurso} onChange={(e) => setFiltroCurso(Number(e.target.value))} aria-label="Filtrar por curso">
          <option value={0}>Todos los cursos</option>
          {datos.cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={colorPor} onChange={(e) => setColorPor(e.target.value as ColorPor)} aria-label="Colorear por">
          <option value="curso">Color por curso</option>
          <option value="aula">Color por aula</option>
          <option value="docente">Color por docente</option>
        </select>
        <label className="check-linea">
          <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} />
          Ver inactivas
        </label>
        <span className="separador" />
        <button className="btn-ghost chico" onClick={excel} disabled={ocupado}><IconDescargar size={16} />Descargar Excel</button>
        {editable && <button className="btn-primary" onClick={() => nuevaClase()}><IconMas size={16} />Nueva clase</button>}
      </div>

      <ul className="ocupacion" aria-label="Uso de cada aula por semana">
        <li><strong>{activas.length}</strong>clases por semana · {textoDuracion(horasSemana)}</li>
        {ocupacion.map(({ aula, minutos, porcentaje }) => (
          <li key={aula.id} title={`${aula.nombre}: ${textoDuracion(minutos)} por semana`}>
            <strong>{(minutos / 60).toLocaleString("es-BO", { maximumFractionDigits: 1 })} h</strong>{aula.nombre}
            <span className="barra-ocupacion"><span style={{ width: `${porcentaje}%` }} /></span>
          </li>
        ))}
      </ul>

      <ul className="leyenda">
        {leyenda.map((l) => (
          <li key={l.nombre}><i style={{ ["--h" as string]: l.h }} />{l.nombre}</li>
        ))}
      </ul>

      <div className={`horarios-layout ${elegido ? "" : "sin-detalle"}`}>
        <div>
          <TableroSemanal
            bloques={visibles}
            bloquesParaChoques={bloques}
            editable={editable}
            colorPor={colorPor}
            seleccionado={seleccion}
            onSeleccionar={(b) => setSeleccion(b.id === seleccion ? null : b.id)}
            onMover={mover}
            onRedimensionar={redimensionar}
            onCrear={(dia, ini, fin) => nuevaClase(dia, ini, fin)}
            onEliminar={eliminar}
          />
          <p className="ayuda-tablero">
            {editable ? (
              <>
                <strong>Arrastra</strong> una clase para cambiarla de día u hora · estira su <strong>borde inferior</strong> para
                cambiar la duración · <strong>dibuja</strong> en un hueco para crear una · clic para ver opciones ·
                con el teclado: <kbd>↑</kbd><kbd>↓</kbd> 15 min, <kbd>←</kbd><kbd>→</kbd> otro día,
                <kbd>Shift</kbd>+<kbd>↑</kbd><kbd>↓</kbd> duración, <kbd>Supr</kbd> eliminar, <kbd>Ctrl</kbd>+<kbd>Z</kbd> deshacer.
                Mientras arrastras, el recuadro se pone <strong>rojo</strong> si choca con otra clase.
              </>
            ) : (
              "Solo lectura: dirección y secretaría pueden modificar los horarios. Haz clic en una clase para ver sus datos."
            )}
          </p>
        </div>

        {elegido && (
          <aside className="detalle-bloque" style={{ ["--h" as string]: tono(elegido.idCurso) }} aria-label="Clase elegida">
            <h2>{elegido.curso}</h2>
            <span className={elegido.activo ? "pill ok" : "pill off"}>{elegido.activo ? "Activa" : "Inactiva"}</span>
            <dl>
              <dt>Día</dt><dd>{DIA_LARGO[elegido.dia]}</dd>
              <dt>Horario</dt><dd>{elegido.horaInicio}–{elegido.horaFin} ({textoDuracion(duracion(elegido))})</dd>
              <dt>Aula</dt><dd>{elegido.aula}</dd>
              <dt>Docente</dt><dd>{elegido.docente}</dd>
            </dl>
            {editable && (
              <div className="detalle-acciones">
                <button className="btn-ghost chico" disabled={ocupado}
                  onClick={() => setEditor({ id: elegido.id, activo: elegido.activo, datos: datosDe(elegido) })}>
                  <IconEditar size={16} />Editar
                </button>
                <div className="duplicar-fila">
                  <select value={diaCopia} onChange={(e) => setDiaCopia(e.target.value as Dia)} aria-label="Día de la copia">
                    {DIAS.map((d) => <option key={d} value={d}>{DIA_LARGO[d]}</option>)}
                  </select>
                  <button className="btn-ghost chico" disabled={ocupado} onClick={() => duplicar(elegido, diaCopia)}><IconCopiar size={16} />Duplicar</button>
                </div>
                <button className="btn-ghost chico" disabled={ocupado} onClick={() => cambiarEstado(elegido)}>
                  {elegido.activo ? <><IconPausa size={16} />Desactivar</> : <><IconPlay size={16} />Activar</>}
                </button>
                <button className="btn-ghost chico btn-peligro" disabled={ocupado} onClick={() => eliminar(elegido)}>
                  <IconBasura size={16} />Eliminar
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {editor && (
        <EditorBloque
          idBloque={editor.id}
          inicial={editor.datos}
          activo={editor.activo}
          aulas={datos.aulas}
          cursos={datos.cursos}
          onGuardar={guardarEditor}
          onCerrar={() => setEditor(null)}
          onExpira={onExpira}
        />
      )}

      {aviso && (
        <div className={`toast ${aviso.error ? "error" : ""}`} role="status" aria-live="polite">
          <span>{aviso.texto}</span>
          {aviso.deshacer && <button onClick={deshacer}>Deshacer</button>}
          <button onClick={() => setAviso(null)} aria-label="Cerrar aviso">✕</button>
        </div>
      )}
    </>
  );
}
