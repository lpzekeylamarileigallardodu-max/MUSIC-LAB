import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SearchCard from "./components/SearchCard";
import AuthModal, { type AuthTab } from "./components/AuthModal";
import PanelAdmin from "./components/admin/PanelAdmin";
import PanelEstudiante from "./components/estudiante/PanelEstudiante";
import PanelDocente from "./components/docente/PanelDocente";
import { cerrarSesionServidor, esAdministrativo, esDocente, esEstudiante, obtenerSesion, type Sesion } from "./api";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [motivo, setMotivo] = useState<string | undefined>(undefined);
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Al cargar la página, el servidor dice si todavía hay una sesión abierta
  useEffect(() => {
    obtenerSesion().then(setSesion);
  }, []);

  /** Botón "Iniciar Sesión" de la barra superior. */
  const abrirLogin = () => {
    setMotivo(undefined);
    setAuthTab("login");
    setAuthOpen(true);
  };

  /** Un visitante intentó usar algo que pide cuenta (horarios, clase de prueba): se le lleva al registro. */
  const pedirRegistro = (texto: string) => {
    setSesion(null);
    setMotivo(texto);
    setAuthTab("register");
    setAuthOpen(true);
  };

  const alIniciarSesion = (nueva: Sesion) => {
    setSesion(nueva);
    setAuthOpen(false);
  };

  const cerrarSesion = async () => {
    await cerrarSesionServidor();
    setSesion(null);
  };

  // El personal administrativo ve su panel en lugar de la página de inicio
  if (sesion && esAdministrativo(sesion)) {
    return (
      <>
        <Navbar
          theme={theme}
          sesion={sesion}
          modoPanel
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          onLogin={abrirLogin}
          onLogout={cerrarSesion}
        />
        <PanelAdmin sesion={sesion} onSesionExpirada={() => setSesion(null)} />
      </>
    );
  }

  // Los estudiantes ven su panel en lugar de la página de inicio
  if (sesion && esEstudiante(sesion)) {
    return (
      <>
        <Navbar
          theme={theme}
          sesion={sesion}
          modoPanel
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          onLogin={abrirLogin}
          onLogout={cerrarSesion}
        />
        <PanelEstudiante sesion={sesion} onSesionExpirada={() => setSesion(null)} />
      </>
    );
  }

  // Los docentes ven su panel en lugar de la página de inicio
  if (sesion && esDocente(sesion)) {
    return (
      <>
        <Navbar
          theme={theme}
          sesion={sesion}
          modoPanel
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          onLogin={abrirLogin}
          onLogout={cerrarSesion}
        />
        <PanelDocente sesion={sesion} onSesionExpirada={() => setSesion(null)} />
      </>
    );
  }

  return (
    <>
      <Navbar
        theme={theme}
        sesion={sesion}
        onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        onLogin={abrirLogin}
        onLogout={cerrarSesion}
      />
      <Hero />
      <SearchCard sesion={sesion} authAbierto={authOpen} onRequiereAuth={pedirRegistro} />
      <AuthModal
        open={authOpen}
        tab={authTab}
        motivo={motivo}
        onTabChange={setAuthTab}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={alIniciarSesion}
      />
    </>
  );
}
