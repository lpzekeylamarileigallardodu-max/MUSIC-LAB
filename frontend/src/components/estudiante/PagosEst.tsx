import { Fragment, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { NoAutenticadoError, estCuotas, estEnviarComprobante, estSubirComprobante, type CuotaEstudiante, type EstadoCuota } from "../../api";
import Estado from "../admin/Estado";
import { useCarga } from "../admin/useCarga";
import { bs, fecha, nombreMes } from "../admin/util";

type Props = { onExpira: () => void };

const ESTADO: Record<EstadoCuota, { texto: string; clase: string }> = {
  PENDIENTE: { texto: "Pendiente", clase: "pill warn" },
  VENCIDA: { texto: "Vencida", clase: "pill bad" },
  PAGADA: { texto: "Pagada", clase: "pill ok" },
  ANULADA: { texto: "Anulada", clase: "pill off" },
};

function FormComprobante({ cuota, onEnviado, onCancelar, onExpira }: {
  cuota: CuotaEstudiante;
  onEnviado: (texto: string) => void;
  onCancelar: () => void;
  onExpira: () => void;
}) {
  const [metodo, setMetodo] = useState<"QR" | "TRANSFERENCIA">("QR");
  const [nro, setNro] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!foto) return setVista(null);
    const url = URL.createObjectURL(foto);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const elegir = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    if (f && !["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setError("La foto debe ser PNG, JPG o WEBP");
      return setFoto(null);
    }
    if (f && f.size > 5 * 1024 * 1024) {
      setError("La foto pesa más de 5 MB. Toma una captura o redúcela.");
      return setFoto(null);
    }
    setFoto(f);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!foto) return setError("Sube la foto del comprobante");
    setEnviando(true);
    setError(null);
    try {
      const url = await estSubirComprobante(foto);
      await estEnviarComprobante(cuota.idCuota, metodo, nro.trim() || null, url);
      onEnviado(`Comprobante enviado. Secretaría lo revisará y la cuota de ${nombreMes(cuota.mes)} quedará pagada.`);
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setError(err instanceof Error ? err.message : "No se pudo enviar el comprobante");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="pago-qr" onSubmit={enviar}>
      <div className="pago-qr-codigo">
        <img src="/qr-pago.png" alt="Código QR de pago de la academia" width={180} height={180} />
        <strong>{bs(cuota.monto)}</strong>
        <span>Escanéalo con la app de tu banco y en la glosa pon tu nombre o CI.</span>
      </div>
      <div className="pago-qr-datos">
        <label>
          MÉTODO
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as "QR" | "TRANSFERENCIA")}>
            <option value="QR">QR de la academia</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
          </select>
        </label>
        <label>
          FOTO DEL COMPROBANTE
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={elegir} required />
        </label>
        {vista && <img className="pago-qr-vista" src={vista} alt="Vista previa del comprobante" />}
        <label>
          N.º DE OPERACIÓN (OPCIONAL)
          <input value={nro} onChange={(e) => setNro(e.target.value)} placeholder="Ej.: QR-20261113-0001" maxLength={100} />
        </label>
        <div className="acciones-pie">
          <button className="btn-primary" type="submit" disabled={enviando || !foto}>{enviando ? "Enviando…" : `Enviar comprobante (${bs(cuota.monto)})`}</button>
          <button className="btn-ghost" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
        {error && <p className="notice error">{error}</p>}
      </div>
    </form>
  );
}

export default function PagosEst({ onExpira }: Props) {
  const { datos, error, cargando, recargar } = useCarga(estCuotas, onExpira);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!datos) return <Estado cargando={cargando} error={error} onReintentar={recargar} />;

  const porPagar = datos.filter((c) => c.estado === "PENDIENTE" || c.estado === "VENCIDA");
  const total = porPagar.reduce((suma, c) => suma + c.monto, 0);

  return (
    <>
      <p className="notice info">
        Para pagar, usa <strong>Pagar con QR</strong> en la cuota: escanea el código, paga desde tu banco y sube la foto del
        comprobante. Secretaría lo revisa y la cuota pasa a pagada. También puedes pagar en efectivo en ventanilla.
      </p>
      {aviso && <p className="notice ok" role="status" style={{ marginTop: 12 }}>{aviso}</p>}

      <section className="panel-bloque" style={{ marginTop: 24 }}>
        <h2>Resumen</h2>
        <dl className="cifras">
          <div><dt>Cuotas por pagar</dt><dd>{porPagar.length}</dd></div>
          <div><dt>Total por pagar</dt><dd>{bs(total)}</dd></div>
        </dl>
      </section>

      <section className="panel-bloque">
        <h2>Todas mis cuotas</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cuota</th>
                <th>Monto</th>
                <th>Vence</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {datos.map((c) => {
                const pagable = (c.estado === "PENDIENTE" || c.estado === "VENCIDA") && !c.comprobanteEnRevision;
                return (
                  <Fragment key={c.idCuota}>
                    <tr className={c.estado === "ANULADA" ? "fila-inactiva" : ""}>
                      <td>
                        <strong>{nombreMes(c.mes)} {c.anio}</strong>
                        <div className="sub">{c.curso}</div>
                      </td>
                      <td>{bs(c.monto)}</td>
                      <td>{fecha(`${c.fechaVencimiento}T00:00:00`)}</td>
                      <td>
                        <span className={ESTADO[c.estado].clase}>{ESTADO[c.estado].texto}</span>
                        {c.comprobanteEnRevision && <div className="sub">Comprobante en revisión</div>}
                      </td>
                      <td className="acciones">
                        {pagable && abierta !== c.idCuota && (
                          <button className="btn-ghost chico" onClick={() => { setAbierta(c.idCuota); setAviso(null); }}>
                            Pagar con QR
                          </button>
                        )}
                      </td>
                    </tr>
                    {abierta === c.idCuota && (
                      <tr className="fila-formulario">
                        <td colSpan={5}>
                          <FormComprobante
                            cuota={c}
                            onExpira={onExpira}
                            onCancelar={() => setAbierta(null)}
                            onEnviado={(texto) => {
                              setAbierta(null);
                              setAviso(texto);
                              recargar();
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {datos.length === 0 && (
                <tr>
                  <td colSpan={5} className="vacio">Todavía no tienes cuotas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
