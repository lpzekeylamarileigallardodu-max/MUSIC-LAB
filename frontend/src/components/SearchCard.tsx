import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  agendarClasePrueba,
  consultarHorarios,
  listarCursos,
  NoAutenticadoError,
  type Curso,
  type Horario,
  type Sesion,
} from "../api";
import { IconFlecha, IconLibro, IconMicrofono, IconMusica, IconNota, IconReloj } from "./Icons";

type TabId = "historia" | "prueba" | "horarios" | "eventos";
type Accion = "horarios" | "prueba";
type Aviso = { tipo: "ok" | "error"; texto: string };

const tabs: { id: TabId; icono: ReactNode; label: string }[] = [
  { id: "historia", icono: <IconLibro size={19} />, label: "Nuestra historia" },
  { id: "prueba", icono: <IconMusica size={19} />, label: "Clase de prueba" },
  { id: "horarios", icono: <IconReloj size={19} />, label: "Horarios" },
  { id: "eventos", icono: <IconMicrofono size={19} />, label: "Eventos" },
];

// El valor es el que guarda la base de datos (MAYÚSCULAS, sin tilde)
const DIAS = [
  { valor: "LUNES", etiqueta: "Lunes" },
  { valor: "MARTES", etiqueta: "Martes" },
  { valor: "MIERCOLES", etiqueta: "Miércoles" },
  { valor: "JUEVES", etiqueta: "Jueves" },
  { valor: "VIERNES", etiqueta: "Viernes" },
  { valor: "SABADO", etiqueta: "Sábado" },
  { valor: "DOMINGO", etiqueta: "Domingo" },
];

const MOTIVOS: Record<Accion, string> = {
  horarios: "Crea tu cuenta para consultar los horarios de los cursos.",
  prueba: "Crea tu cuenta para pedir tu clase de prueba.",
};

const PRUEBA_VACIA = { nombres: "", apPat: "", apMat: "", telefono: "", cursoId: "", fecha: "" };

function etiquetaDia(valor: string): string {
  return DIAS.find((d) => d.valor === valor)?.etiqueta ?? valor;
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado";
}

/** Fecha de hoy en formato aaaa-mm-dd (hora local), para el mínimo del selector de fecha. */
function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function Boton({ onClick, deshabilitado, children }: { onClick?: () => void; deshabilitado?: boolean; children: ReactNode }) {
  return (
    <button className="btn-primary big" onClick={onClick} disabled={deshabilitado}>
      {children} <IconFlecha size={18} />
    </button>
  );
}

type Props = {
  sesion: Sesion | null;
  authAbierto: boolean;
  onRequiereAuth: (motivo: string) => void;
};

export default function SearchCard({ sesion, authAbierto, onRequiereAuth }: Props) {
  const [tab, setTab] = useState<TabId>("historia");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosError, setCursosError] = useState(false);

  // Horarios
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroDia, setFiltroDia] = useState("");
  const [horarios, setHorarios] = useState<Horario[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [avisoHorarios, setAvisoHorarios] = useState<Aviso | null>(null);

  // Clase de prueba
  const [prueba, setPrueba] = useState(PRUEBA_VACIA);
  const [enviando, setEnviando] = useState(false);
  const [avisoPrueba, setAvisoPrueba] = useState<Aviso | null>(null);

  // Acción que el visitante quiso hacer antes de registrarse: se ejecuta apenas tenga sesión
  const pendiente = useRef<Accion | null>(null);

  useEffect(() => {
    listarCursos()
      .then(setCursos)
      .catch(() => setCursosError(true));
  }, []);

  const consultar = async () => {
    setCargando(true);
    setAvisoHorarios(null);
    try {
      const lista = await consultarHorarios(
        filtroCurso === "" ? undefined : Number(filtroCurso),
        filtroDia === "" ? undefined : filtroDia,
      );
      setHorarios(lista);
    } catch (error) {
      if (error instanceof NoAutenticadoError) {
        pendiente.current = "horarios";
        onRequiereAuth(MOTIVOS.horarios);
      } else {
        setAvisoHorarios({ tipo: "error", texto: mensajeDe(error) });
      }
    } finally {
      setCargando(false);
    }
  };

  const agendar = async () => {
    setAvisoPrueba(null);
    if (!prueba.nombres.trim() || !prueba.apPat.trim() || !prueba.telefono.trim() || !prueba.cursoId || !prueba.fecha) {
      setAvisoPrueba({ tipo: "error", texto: "Completa nombres, apellido paterno, teléfono, curso y fecha." });
      return;
    }

    setEnviando(true);
    try {
      const mensaje = await agendarClasePrueba({
        nombres: prueba.nombres.trim(),
        apPat: prueba.apPat.trim(),
        apMat: prueba.apMat.trim() || undefined,
        telefono: prueba.telefono.trim(),
        cursoId: Number(prueba.cursoId),
        fecha: prueba.fecha,
      });
      setAvisoPrueba({ tipo: "ok", texto: mensaje });
      setPrueba(PRUEBA_VACIA);
    } catch (error) {
      if (error instanceof NoAutenticadoError) {
        pendiente.current = "prueba";
        onRequiereAuth(MOTIVOS.prueba);
      } else {
        setAvisoPrueba({ tipo: "error", texto: mensajeDe(error) });
      }
    } finally {
      setEnviando(false);
    }
  };

  /** Si no hay sesión, el visitante va al registro; al terminar, la acción se ejecuta sola. */
  const intentar = (accion: Accion) => {
    if (!sesion) {
      pendiente.current = accion;
      onRequiereAuth(MOTIVOS[accion]);
      return;
    }
    if (accion === "horarios") void consultar();
    else void agendar();
  };

  // Si el visitante cierra la ventana sin registrarse, se olvida lo que quería hacer
  useEffect(() => {
    if (!authAbierto && !sesion) pendiente.current = null;
  }, [authAbierto, sesion]);

  // Cuando aparece la sesión (registro o ingreso), se ejecuta la acción pendiente
  useEffect(() => {
    if (!sesion || !pendiente.current) return;
    const accion = pendiente.current;
    pendiente.current = null;
    if (accion === "horarios") void consultar();
    else void agendar();
  }, [sesion]);

  const cambiarPrueba = (campo: keyof typeof PRUEBA_VACIA, valor: string) =>
    setPrueba((anterior) => ({ ...anterior, [campo]: valor }));

  const opcionesCursos = cursos.map((c) => (
    <option key={c.id} value={c.id}>
      {c.nombre}
    </option>
  ));

  return (
    <section className="card">
      <div className="card-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={t.id === tab ? "card-tab active" : "card-tab"} onClick={() => setTab(t.id)}>
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      <div className="card-body">
        {tab === "historia" && (
          <article className="historia-marco">
            <IconNota size={36} className="historia-icono" />
            <h2>Nuestra historia</h2>
            <p className="historia-lema">Donde la música se aprende, se comparte y se vive.</p>
            <p>
              La Academia de Música Jaime Gallardo nació del amor por la música y de una convicción sencilla: todas las
              personas pueden aprender a tocar, cantar y disfrutar de un instrumento, sin importar su edad ni su punto de
              partida.
            </p>
            <p>
              Con el tiempo, nuestras aulas se convirtieron en un lugar de encuentro: niños que dan sus primeras notas,
              jóvenes que descubren su voz y adultos que retoman un sueño pendiente, siempre acompañados por docentes
              cercanos y comprometidos con cada estudiante.
            </p>
            <p>
              Hoy seguimos fieles a ese espíritu, con clases personalizadas, recitales y audiciones que ayudan a perder
              el miedo al escenario, y una comunidad que crece al ritmo de cada uno de sus alumnos.
            </p>
          </article>
        )}

        {tab === "prueba" && (
          <>
            <div className="grid-3">
              <label>
                NOMBRES
                <input
                  placeholder="Tus nombres"
                  maxLength={60}
                  value={prueba.nombres}
                  onChange={(e) => cambiarPrueba("nombres", e.target.value)}
                />
              </label>
              <label>
                APELLIDO PATERNO
                <input
                  placeholder="Apellido paterno"
                  maxLength={40}
                  value={prueba.apPat}
                  onChange={(e) => cambiarPrueba("apPat", e.target.value)}
                />
              </label>
              <label>
                APELLIDO MATERNO
                <input
                  placeholder="Apellido materno"
                  maxLength={40}
                  value={prueba.apMat}
                  onChange={(e) => cambiarPrueba("apMat", e.target.value)}
                />
              </label>
              <label>
                TELÉFONO
                <input
                  placeholder="+591 700 00000"
                  maxLength={30}
                  value={prueba.telefono}
                  onChange={(e) => cambiarPrueba("telefono", e.target.value)}
                />
              </label>
              <label>
                CURSO DE INTERÉS
                <select value={prueba.cursoId} onChange={(e) => cambiarPrueba("cursoId", e.target.value)}>
                  <option value="" disabled>
                    {cursosError ? "No se pudieron cargar los cursos" : "Elige un curso"}
                  </option>
                  {opcionesCursos}
                </select>
              </label>
              <label>
                FECHA PREFERIDA
                <input
                  type="date"
                  min={hoyISO()}
                  value={prueba.fecha}
                  onChange={(e) => cambiarPrueba("fecha", e.target.value)}
                />
              </label>
            </div>
            {avisoPrueba && <p className={`notice ${avisoPrueba.tipo} aviso-card`}>{avisoPrueba.texto}</p>}
            <div className="card-actions">
              <Boton onClick={() => intentar("prueba")} deshabilitado={enviando}>
                {enviando ? "Enviando..." : "Agendar clase de prueba"}
              </Boton>
            </div>
          </>
        )}

        {tab === "horarios" && (
          <>
            <div className="grid-2">
              <label>
                CURSO
                <select value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}>
                  <option value="">{cursosError ? "No se pudieron cargar los cursos" : "Todos los cursos"}</option>
                  {opcionesCursos}
                </select>
              </label>
              <label>
                DÍA
                <select value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)}>
                  <option value="">Todos los días</option>
                  {DIAS.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="card-actions">
              <Boton onClick={() => intentar("horarios")} deshabilitado={cargando}>
                {cargando ? "Buscando..." : "Consultar horarios"}
              </Boton>
            </div>

            {avisoHorarios && <p className={`notice ${avisoHorarios.tipo} aviso-card`}>{avisoHorarios.texto}</p>}

            {horarios && horarios.length === 0 && <p className="muted resultado-vacio">No hay horarios para esa búsqueda.</p>}

            {horarios && horarios.length > 0 && (
              <div className="tabla-scroll">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Día</th>
                      <th>Horario</th>
                      <th>Docente</th>
                      <th>Aula</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h.id}>
                        <td>{h.curso}</td>
                        <td>{etiquetaDia(h.dia)}</td>
                        <td>
                          {h.horaInicio} - {h.horaFin}
                        </td>
                        <td>{h.docente}</td>
                        <td>{h.aula}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "eventos" && (
          <>
            <p className="muted">
              Recitales, audiciones y talleres de la academia. Aquí se mostrarán los próximos eventos aprobados.
            </p>
            <div className="card-actions">
              <Boton>Ver próximos eventos</Boton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
