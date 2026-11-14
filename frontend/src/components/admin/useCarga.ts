import { useCallback, useEffect, useState } from "react";
import { NoAutenticadoError } from "../../api";

/**
 * Carga datos del servidor al abrir la sección. Si la sesión venció (401) avisa con onExpira;
 * cualquier otro error se muestra en la pantalla con la opción de reintentar.
 */
export function useCarga<T>(cargar: () => Promise<T>, onExpira: () => void) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(() => {
    setCargando(true);
    setError(null);
    cargar()
      .then(setDatos)
      .catch((err) => {
        if (err instanceof NoAutenticadoError) onExpira();
        else setError(err instanceof Error ? err.message : "No se pudo cargar la información");
      })
      .finally(() => setCargando(false));
    // cargar y onExpira son estables mientras la sección esté abierta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, setDatos, error, cargando, recargar };
}
