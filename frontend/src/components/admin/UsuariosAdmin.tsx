import { useMemo, useState } from "react";
import {
  adminCambiarEstadoUsuario,
  adminEliminarUsuario,
  adminUsuarios,
  descargarReporteAdmin,
  NoAutenticadoError,
  type TipoUsuario,
  type UsuarioAdmin,
} from "../../api";
import BotonExcel from "../BotonExcel";
import EditarUsuario from "./EditarUsuario";
import Estado from "./Estado";
import InscripcionesUsuario from "./InscripcionesUsuario";
import { useCarga } from "./useCarga";
import { fecha, TIPO_LEGIBLE } from "./util";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };
type Aviso = { clase: "ok" | "error"; texto: string };

export default function UsuariosAdmin({ onExpira, tipoUsuario }: Props) {
  const { datos, error, cargando, recargar } = useCarga(adminUsuarios, onExpira);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [inscribiendo, setInscribiendo] = useState<UsuarioAdmin | null>(null);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);

  const esDirector = tipoUsuario === "DIRECTOR";

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos ?? []).filter(
      (u) =>
        (tipo === "TODOS" || u.tipoUsuario === tipo) &&
        (q === "" || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || u.ci.includes(q)),
    );
  }, [datos, busqueda, tipo]);

  const ejecutar = async (u: UsuarioAdmin, accion: () => Promise<unknown>, textoOk: string) => {
    setOcupado(u.id);
    setAviso(null);
    try {
      await accion();
      setAviso({ clase: "ok", texto: textoOk });
      recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo completar la acción" });
    } finally {
      setOcupado(null);
    }
  };

  const cambiarActivo = (u: UsuarioAdmin) => {
    const activar = !u.activo;
    if (!activar && !window.confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión hasta que lo actives de nuevo.`)) return;
    ejecutar(
      u,
      () => adminCambiarEstadoUsuario(u.id, activar),
      activar ? `${u.nombre} fue activado.` : `${u.nombre} fue desactivado.`,
    );
  };

  const eliminar = (u: UsuarioAdmin) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre}? Esto no se puede deshacer.\n\nSi tiene inscripciones, pagos o cursos a cargo no se podrá borrar: en ese caso desactívalo.`)) return;
    ejecutar(u, () => adminEliminarUsuario(u.id), `${u.nombre} fue eliminado.`);
  };

  return (
    <>
      <div className="barra-filtros">
        <input
          type="search"
          placeholder="Buscar por nombre, correo o CI"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar usuarios"
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="TODOS">Todos los tipos</option>
          {Object.entries(TIPO_LEGIBLE).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
        {datos && (
          <span className="muted contador">
            {visibles.length} de {datos.length}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <BotonExcel descargar={() => descargarReporteAdmin("usuarios")} onExpira={onExpira} />
      </div>

      {aviso && <p className={`notice ${aviso.clase}`}>{aviso.texto}</p>}
      <Estado cargando={!datos && cargando} error={error} onReintentar={recargar} />

      {datos && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CI</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
                <tr key={u.id} className={u.activo ? "" : "fila-inactiva"}>
                  <td>
                    <strong>{u.nombre}</strong>
                    <div className="sub">{u.correo}</div>
                  </td>
                  <td>{u.ci}</td>
                  <td>{TIPO_LEGIBLE[u.tipoUsuario] ?? u.tipoUsuario}</td>
                  <td>
                    {esDirector ? (
                      <label className="interruptor" title={u.activo ? "Clic para desactivar" : "Clic para activar"}>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={u.activo}
                          disabled={ocupado === u.id}
                          onChange={() => cambiarActivo(u)}
                          aria-label={`${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}`}
                        />
                        <span className="interruptor-pista" aria-hidden="true" />
                        <span className="interruptor-texto">{u.activo ? "Activo" : "Inactivo"}</span>
                      </label>
                    ) : (
                      <span className={u.activo ? "pill ok" : "pill off"}>{u.activo ? "Activo" : "Inactivo"}</span>
                    )}
                  </td>
                  <td>{fecha(u.fechaRegistro)}</td>
                  <td className="acciones">
                    {(u.tipoUsuario === "INVITADO" || u.tipoUsuario === "ESTUDIANTE") && (
                      <button className="btn-ghost chico" disabled={ocupado === u.id || !u.activo} onClick={() => setInscribiendo(u)}>
                        {u.tipoUsuario === "INVITADO" ? "Inscribir" : "Inscripciones"}
                      </button>
                    )}
                    {esDirector && (
                      <>
                        <button className="btn-ghost chico" disabled={ocupado === u.id} onClick={() => setEditando(u)}>
                          Editar
                        </button>
                        <button className="btn-ghost chico btn-peligro" disabled={ocupado === u.id} onClick={() => eliminar(u)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="vacio">
                    Ningún usuario coincide con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editando && (
        <EditarUsuario
          usuario={editando}
          onExpira={onExpira}
          onCerrar={(guardado) => {
            setEditando(null);
            if (guardado) {
              setAviso({ clase: "ok", texto: `Datos de ${guardado.nombre} guardados.` });
              recargar();
            }
          }}
        />
      )}
      {inscribiendo && (
        <InscripcionesUsuario
          usuario={inscribiendo}
          onExpira={onExpira}
          onCerrar={(huboCambios) => {
            setInscribiendo(null);
            if (huboCambios) recargar();
          }}
        />
      )}
    </>
  );
}
