import { useState, type FormEvent } from "react";
import { iniciarSesion, registrarse, type Sesion } from "../api";
import CampoPassword from "./CampoPassword";
import { IconCerrar, IconNota } from "./Icons";

export type AuthTab = "login" | "register";

type Props = {
  open: boolean;
  tab: AuthTab;
  motivo?: string;
  onTabChange: (tab: AuthTab) => void;
  onClose: () => void;
  onLoginSuccess: (sesion: Sesion) => void;
};

/** Lee un campo del formulario; devuelve undefined si está vacío. */
function campo(form: FormData, nombre: string): string | undefined {
  const valor = String(form.get(nombre) ?? "").trim();
  return valor === "" ? undefined : valor;
}

export default function AuthModal({ open, tab, motivo, onTabChange, onClose, onLoginSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!open) return null;

  const cambiarTab = (t: AuthTab) => {
    setError(null);
    onTabChange(t);
  };

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setEnviando(true);

    try {
      if (tab === "login") {
        const sesion = await iniciarSesion(campo(form, "correo") ?? "", String(form.get("password") ?? ""));
        onLoginSuccess(sesion);
        return;
      }

      const password = String(form.get("password") ?? "");
      if (password !== String(form.get("password2") ?? "")) {
        setError("Las contraseñas no coinciden");
        return;
      }

      // El servidor crea la cuenta, envía el correo de bienvenida y deja la sesión iniciada
      const sesion = await registrarse({
        nombres: campo(form, "nombres") ?? "",
        apPat: campo(form, "apPat") ?? "",
        apMat: campo(form, "apMat"),
        ci: campo(form, "ci") ?? "",
        telefono: campo(form, "telefono"),
        direccion: campo(form, "direccion"),
        correo: campo(form, "correo") ?? "",
        password,
      });
      onLoginSuccess(sesion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <IconNota size={22} /> Academia Jaime Gallardo
          </h2>
          <p>Tu espacio para aprender música</p>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <IconCerrar size={16} />
          </button>
        </div>

        <div className="modal-tabs">
          <button className={tab === "login" ? "active" : ""} onClick={() => cambiarTab("login")}>
            Iniciar Sesión
          </button>
          <button className={tab === "register" ? "active" : ""} onClick={() => cambiarTab("register")}>
            Crear Cuenta
          </button>
        </div>

        {/* key={tab}: al cambiar de pestaña se crea un formulario nuevo y vacío */}
        <form className="modal-body" key={tab} onSubmit={enviar}>
          {motivo && <p className="notice info">{motivo}</p>}

          {tab === "login" ? (
            <>
              <label>
                CORREO
                <input name="correo" type="email" placeholder="correo@ejemplo.com" autoComplete="off" required />
              </label>
              <label>
                CONTRASEÑA
                <CampoPassword name="password" placeholder="••••••••" />
              </label>
              <button className="btn-primary big full" type="submit" disabled={enviando}>
                {enviando ? "Ingresando..." : "Ingresar"}
              </button>
            </>
          ) : (
            <>
              <div className="grid-2">
                <label>
                  NOMBRES
                  <input name="nombres" autoComplete="off" placeholder="Juan" maxLength={60} required />
                </label>
                <label>
                  APELLIDO PATERNO
                  <input name="apPat" autoComplete="off" placeholder="Pérez" maxLength={40} required />
                </label>
                <label>
                  APELLIDO MATERNO
                  <input name="apMat" autoComplete="off" placeholder="López" maxLength={40} />
                </label>
                <label>
                  CI
                  <input name="ci" autoComplete="off" placeholder="12345678" maxLength={20} required />
                </label>
                <label>
                  TELÉFONO
                  <input name="telefono" autoComplete="off" placeholder="+591 700 00000" maxLength={30} />
                </label>
                <label>
                  DIRECCIÓN
                  <input name="direccion" autoComplete="off" placeholder="Zona, calle, nro." maxLength={200} />
                </label>
              </div>
              <label>
                CORREO
                <input
                  name="correo"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  maxLength={150}
                  autoComplete="off"
                  required
                />
              </label>
              <div className="grid-2">
                <label>
                  CONTRASEÑA
                  <CampoPassword name="password" minLength={8} maxLength={64} />
                </label>
                <label>
                  REPETIR CONTRASEÑA
                  <CampoPassword name="password2" minLength={8} maxLength={64} />
                </label>
              </div>
              <button className="btn-primary big full" type="submit" disabled={enviando}>
                {enviando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </>
          )}

          {error && <p className="notice error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
