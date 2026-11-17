type Props = { cargando: boolean; error: string | null; onReintentar: () => void };

export default function Estado({ cargando, error, onReintentar }: Props) {
  if (error) {
    return (
      <div className="notice error estado-error">
        <span>{error}</span>
        <button className="btn-ghost chico" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    );
  }
  if (cargando) return <p className="muted">Cargando…</p>;
  return null;
}
