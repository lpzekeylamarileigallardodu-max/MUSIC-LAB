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

  useEffect(() => {
    obtenerSesion().then(setSesion);
  }, []);

  const abrirLogin = () => {
    setMotivo(undefined);
    setAuthTab("login");
    setAuthOpen(true);
  };

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
