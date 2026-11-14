import { useMemo, useState } from "react";
import {
  adminCambiarEstadoUsuario,
  adminUsuarios,
  descargarReporteAdmin,
  NoAutenticadoError,
  type TipoUsuario,
  type UsuarioAdmin,
} from "../../api";
import BotonExcel from "../BotonExcel";
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

  const esDirector = tipoUsuario === "DIRECTOR";

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos ?? []).filter(
      (u) =>
        (tipo === "TODOS" || u.tipoUsuario === tipo) &&
        (q === "" || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || u.ci.includes(q)),
    );
  }, [datos, busqueda, tipo]);

  /** Ejecuta una acción sobre un usuario, avisa el resultado y vuelve a cargar la lista. */
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
                    <span className={u.activo ? "pill ok" : "pill off"}>{u.activo ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td>{fecha(u.fechaRegistro)}</td>
                  <td className="acciones">
                    {(u.tipoUsuario === "INVITADO" || u.tipoUsuario === "ESTUDIANTE") && (
                      <button className="btn-ghost chico" disabled={ocupado === u.id || !u.activo} onClick={() => setInscribiendo(u)}>
                        {u.tipoUsuario === "INVITADO" ? "Inscribir" : "Inscripciones"}
                      </button>
                    )}
                    {esDirector && (
                      <button className="btn-ghost chico" disabled={ocupado === u.id} onClick={() => cambiarActivo(u)}>
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
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
