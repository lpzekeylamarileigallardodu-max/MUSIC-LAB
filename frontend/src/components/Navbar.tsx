import type { Sesion } from "../api";
import { IconCampana, IconEngranaje, IconLuna, IconSol, IconUsuario, IconNota } from "./Icons";
import { ConLeyenda } from "./Leyenda";

type Props = {
  theme: "light" | "dark";
  sesion: Sesion | null;

  modoPanel?: boolean;
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
};

export default function Navbar({ theme, sesion, onToggleTheme, onLogin, onLogout }: Props) {
  return (
    <header className="navbar">
      <div className="logo">
        <span className="logo-icon">
          <IconNota size={28} />
        </span>
        <div>
          <strong>Jaime Gallardo</strong>
          <small>ACADEMIA DE MÚSICA</small>
        </div>
      </div>

      <div className="nav-actions">
        <ConLeyenda texto={theme === "light" ? "Modo oscuro" : "Modo claro"}>
          <button className="theme-btn" onClick={onToggleTheme} aria-label="Cambiar tema">
            {theme === "light" ? <IconLuna size={20} /> : <IconSol size={20} />}
          </button>
        </ConLeyenda>

        {sesion ? (
          <>
            <ConLeyenda texto="Configuración">
              <button className="square-btn" aria-label="Configuración">
                <IconEngranaje size={20} />
              </button>
            </ConLeyenda>
            <ConLeyenda texto="Notificaciones">
              <button className="square-btn" aria-label="Notificaciones">
                <IconCampana size={20} />
              </button>
            </ConLeyenda>
            <span className="user-name">{sesion.nombre}</span>
            <button className="btn-ghost" onClick={onLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={onLogin}>
            <IconUsuario size={16} /> Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
