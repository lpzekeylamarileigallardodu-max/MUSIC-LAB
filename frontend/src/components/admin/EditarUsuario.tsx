import { useState, type FormEvent } from "react";
import { NoAutenticadoError, adminEditarUsuario, type DatosUsuario, type UsuarioAdmin } from "../../api";
import { TIPO_LEGIBLE } from "./util";

type Props = {
  usuario: UsuarioAdmin;
  onExpira: () => void;
  onCerrar: (guardado: UsuarioAdmin | null) => void;
};

/** Ventana para editar nombre, CI, correo, teléfono y dirección de un usuario (solo director). */
export default function EditarUsuario({ usuario, onExpira, onCerrar }: Props) {
  // Usuarios antiguos pueden tener solo el nombre completo: se reparte en nombres y apellido
  const partes = usuario.nombre.split(" ");
  const [datos, setDatos] = useState<DatosUsuario>({
    nombres: usuario.nombres ?? partes.slice(0, Math.max(1, partes.length - 2)).join(" "),
    apPat: usuario.apPat ?? partes[partes.length - 2] ?? "",
    apMat: usuario.apMat ?? (usuario.nombres ? "" : partes[partes.length - 1] ?? ""),
    ci: usuario.ci,
    correo: usuario.correo,
    telefono: usuario.telefono ?? "",
    direccion: usuario.direccion ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campo = (k: keyof DatosUsuario) => ({
    value: datos[k],
    onChange: (e: { target: { value: string } }) => setDatos({ ...datos, [k]: e.target.value }),
  });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      onCerrar(await adminEditarUsuario(usuario.id, datos));
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="overlay" onClick={() => onCerrar(null)}>
      <div className="modal modal-ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-editar" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="titulo-editar">Editar usuario</h2>
          <p>{TIPO_LEGIBLE[usuario.tipoUsuario] ?? usuario.tipoUsuario} · registrado con {usuario.correo}</p>
          <button className="close-btn" onClick={() => onCerrar(null)} aria-label="Cerrar">✕</button>
        </div>
        <form className="modal-body form-usuario" onSubmit={guardar}>
          <label className="ancho-completo">
            NOMBRES
            <input {...campo("nombres")} required minLength={2} maxLength={100} autoFocus />
          </label>
          <label>
            APELLIDO PATERNO
            <input {...campo("apPat")} required minLength={2} maxLength={50} />
          </label>
          <label>
            APELLIDO MATERNO
            <input {...campo("apMat")} maxLength={50} placeholder="Opcional" />
          </label>
          <label>
            CI
            <input {...campo("ci")} required minLength={4} maxLength={20} pattern="[0-9A-Za-z\-]+" title="Números, letras o guion" />
          </label>
          <label>
            TELÉFONO
            <input {...campo("telefono")} maxLength={30} placeholder="Opcional" />
          </label>
          <label className="ancho-completo">
            CORREO
            <input type="email" {...campo("correo")} required maxLength={150} />
          </label>
          <label className="ancho-completo">
            DIRECCIÓN
            <input {...campo("direccion")} maxLength={200} placeholder="Opcional" />
          </label>
          {error && <p className="notice error ancho-completo">{error}</p>}
          <div className="modal-pie ancho-completo">
            <span />
            <div className="grupo">
              <button type="button" className="btn-ghost" onClick={() => onCerrar(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
