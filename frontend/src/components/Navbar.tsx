import type { Sesion } from "../api";
import { IconCampana, IconEngranaje, IconLuna, IconSol, IconUsuario, IconNota } from "./Icons";

type Props = {
  theme: "light" | "dark";
  sesion: Sesion | null;
  /** En el panel de administración se ocultan los enlaces de la página de inicio. */
  modoPanel?: boolean;
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
};

export default function Navbar({ theme, sesion, modoPanel = false, onToggleTheme, onLogin, onLogout }: Props) {
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

      {!modoPanel && (
        <nav className="nav-links">
          <a href="#cursos">Cursos</a>
          <a href="#docentes">Docentes</a>
          <a href="#eventos">Eventos</a>
          <a href="#contacto">Contacto</a>
        </nav>
      )}

      <div className="nav-actions">
        <button className="theme-btn" onClick={onToggleTheme} aria-label="Cambiar tema">
          {theme === "light" ? <IconLuna size={20} /> : <IconSol size={20} />}
        </button>

        {sesion ? (
          <>
            <button className="square-btn" aria-label="Configuración">
              <IconEngranaje size={20} />
            </button>
            <button className="square-btn" aria-label="Notificaciones">
              <IconCampana size={20} />
            </button>
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
