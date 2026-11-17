import { useCallback, useEffect, useState } from "react";
import { NoAutenticadoError } from "../../api";

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

  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, setDatos, error, cargando, recargar };
}
