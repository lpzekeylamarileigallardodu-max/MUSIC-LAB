import { useState } from "react";
import {
  CODIGOS_RECHAZO, NoAutenticadoError, adminAprobarPago, adminCobrarEfectivo, adminCuotasVencidas, adminGenerarCuotas,
  adminPagosPendientes, adminRechazarPago, descargarReporteAdmin, type PagoPendienteAdmin, type TipoUsuario,
} from "../../api";
import BotonExcel from "../BotonExcel";
import Estado from "./Estado";
import { useCarga } from "./useCarga";
import { bs, fecha, fechaHora, nombreMes } from "./util";
import BotonIcono from "../Leyenda";
import { IconCerrar, IconCheck, IconDinero } from "../Icons";

type Props = { onExpira: () => void; tipoUsuario: TipoUsuario };
type Aviso = { clase: "ok" | "error"; texto: string };

const MS_DIA = 86_400_000;

function FilaComprobante({ p, ocupado, onAprobar, onRechazar }: {
  p: PagoPendienteAdmin;
  ocupado: boolean;
  onAprobar: (monto: number) => void;
  onRechazar: (codigo: string, obs: string | null) => void;
}) {
  const esperado = p.montoCuota ?? p.monto;
  const [modo, setModo] = useState<"ver" | "aprobar" | "rechazar">("ver");
  const [monto, setMonto] = useState(String(esperado));
  const [codigo, setCodigo] = useState("NO_ENCONTRADO_EN_BANCO");
  const [obs, setObs] = useState("");
  const [viendoFoto, setViendoFoto] = useState(false);

  const fotoPropia = p.urlComprobante?.startsWith("/api/archivos/") ?? false;

  return (
    <tr>
      <td>{fechaHora(p.fecha)}</td>
      <td>
        <strong>{p.estudiante}</strong>
        <div className="sub">{p.curso}</div>
      </td>
      <td className="texto-largo">{p.concepto ?? "—"}</td>
      <td>{bs(esperado)}</td>
      <td>
        {p.metodoPago}
        <div className="sub">{p.nroComprobante ?? "Sin número"}</div>
        {p.urlComprobante && fotoPropia && (
          <button type="button" className="miniatura-comprobante" onClick={() => setViendoFoto(true)} title="Ver comprobante">
            <img src={p.urlComprobante} alt={`Comprobante de ${p.estudiante}`} loading="lazy" />
          </button>
        )}
        {p.urlComprobante && !fotoPropia && (
          <a className="sub enlace" href={p.urlComprobante} target="_blank" rel="noreferrer">Ver comprobante</a>
        )}
        {viendoFoto && p.urlComprobante && (
          <div className="overlay" onClick={() => setViendoFoto(false)}>
            <div className="modal modal-foto" role="dialog" aria-modal="true" aria-label="Comprobante de pago" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Comprobante de pago</h2>
                <p>{p.estudiante} · {p.curso} · debe {bs(esperado)}</p>
                <button className="close-btn" onClick={() => setViendoFoto(false)} aria-label="Cerrar">✕</button>
              </div>
              <div className="modal-body">
                <a href={p.urlComprobante} target="_blank" rel="noreferrer" title="Abrir en tamaño completo">
                  <img className="foto-comprobante" src={p.urlComprobante} alt={`Comprobante de ${p.estudiante}`} />
                </a>
                <p className="sub">{p.metodoPago} · {p.nroComprobante ?? "Sin número"} · enviado el {fechaHora(p.fecha)}</p>
                <div className="grupo">
                  <button className="btn-primary" disabled={ocupado} onClick={() => { setViendoFoto(false); setModo("aprobar"); }}>Sí pagó: aprobar</button>
                  <button className="btn-ghost btn-peligro" disabled={ocupado} onClick={() => { setViendoFoto(false); setModo("rechazar"); }}>No pagó: rechazar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </td>
      <td className="acciones">
        {modo === "ver" && (
          <>
            <div className="grupo-iconos">
              <BotonIcono texto="Aprobar pago" icono={<IconCheck size={18} />} tono="exito" disabled={ocupado} onClick={() => setModo("aprobar")} />
              <BotonIcono texto="Rechazar pago" icono={<IconCerrar size={18} />} tono="peligro" disabled={ocupado} onClick={() => setModo("rechazar")} />
            </div>
          </>
        )}
        {modo === "aprobar" && (
          <form className="form-accion" onSubmit={(e) => { e.preventDefault(); onAprobar(Number(monto)); }}>
            <label>
              Monto que llegó (Bs)
              <input className="input-chico" type="number" min="0" step="0.01" value={monto}
                onChange={(e) => setMonto(e.target.value)} required autoFocus />
            </label>
            <div className="grupo">
              <button type="submit" className="btn-ghost chico" disabled={ocupado}>Confirmar</button>
              <button type="button" className="btn-ghost chico" onClick={() => setModo("ver")}>Cancelar</button>
            </div>
          </form>
        )}
        {modo === "rechazar" && (
          <form className="form-accion" onSubmit={(e) => { e.preventDefault(); onRechazar(codigo, obs.trim() || null); }}>
            <label>
              Motivo
              <select className="input-chico" value={codigo} onChange={(e) => setCodigo(e.target.value)}>
                {Object.entries(CODIGOS_RECHAZO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <input className="input-chico" placeholder={codigo === "OTRO" ? "Explica el motivo" : "Observación (opcional)"}
              value={obs} onChange={(e) => setObs(e.target.value)} required={codigo === "OTRO"} maxLength={500} />
            <div className="grupo">
              <button type="submit" className="btn-ghost chico btn-peligro" disabled={ocupado}>Rechazar</button>
              <button type="button" className="btn-ghost chico" onClick={() => setModo("ver")}>Cancelar</button>
            </div>
          </form>
        )}
      </td>
    </tr>
  );
}

export default function PagosAdmin({ onExpira }: Props) {
  const pagos = useCarga(adminPagosPendientes, onExpira);
  const cuotas = useCarga(adminCuotasVencidas, onExpira);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const hoy = new Date();
  const [mesGen, setMesGen] = useState("");

  const meses = [-1, 0, 1, 2].map((d) => {
    const f = new Date(hoy.getFullYear(), hoy.getMonth() + d, 1);
    return { valor: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`, texto: `${nombreMes(f.getMonth() + 1)} ${f.getFullYear()}` };
  });
  const mesValido = meses.some((m) => m.valor === mesGen) ? mesGen : meses[2].valor;

  const ejecutar = async (accion: () => Promise<string>) => {
    setOcupado(true);
    setAviso(null);
    try {
      setAviso({ clase: "ok", texto: await accion() });
      pagos.recargar();
      cuotas.recargar();
    } catch (err) {
      if (err instanceof NoAutenticadoError) return onExpira();
      setAviso({ clase: "error", texto: err instanceof Error ? err.message : "No se pudo completar la acción" });
    } finally {
      setOcupado(false);
    }
  };

  const generar = () => {
    const [anio, mes] = mesValido.split("-").map(Number);
    if (!window.confirm(`¿Generar las cuotas de ${nombreMes(mes)} ${anio} para todas las inscripciones activas?`)) return;
    ejecutar(async () => {
      const r = await adminGenerarCuotas(mes, anio);
      return r.cuotasCreadas === 0
        ? `Todas las inscripciones ya tenían su cuota de ${nombreMes(mes)}.`
        : `Se crearon ${r.cuotasCreadas} cuotas de ${nombreMes(mes)} ${anio}` + (r.yaExistian ? ` (${r.yaExistian} ya existían).` : ".");
    });
  };

  return (
    <>
      <div className="barra-filtros">
        <label className="campo-linea">
          Generar cuotas de
          <select className="select-chico" value={mesValido} onChange={(e) => setMesGen(e.target.value)}>
            {meses.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
          </select>
        </label>
        <button className="btn-ghost chico" disabled={ocupado} onClick={generar}>Generar</button>
        <span className="separador" style={{ flex: 1 }} />
        <BotonExcel descargar={() => descargarReporteAdmin("cuotas")} onExpira={onExpira} texto="Excel de cuotas" />
        <BotonExcel descargar={() => descargarReporteAdmin("pagos")} onExpira={onExpira} texto="Excel de pagos" />
      </div>

      {aviso && <p className={`notice ${aviso.clase}`} role="status">{aviso.texto}</p>}

      <section className="panel-bloque" style={{ marginTop: 20 }}>
        <h2>Comprobantes por verificar</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Revisa en la app del banco que el depósito exista. Al aprobar, la cuota queda pagada; al rechazar, el estudiante
          puede enviar otro comprobante.
        </p>
        <Estado cargando={!pagos.datos && pagos.cargando} error={pagos.error} onReintentar={pagos.recargar} />
        {pagos.datos && (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Recibido</th>
                  <th>Estudiante</th>
                  <th>Concepto</th>
                  <th>Cuota</th>
                  <th>Método / comprobante</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.datos.map((p) => (
                  <FilaComprobante
                    key={p.idTransaccion}
                    p={p}
                    ocupado={ocupado}
                    onAprobar={(monto) => ejecutar(async () => {
                      await adminAprobarPago(p.idTransaccion, monto);
                      return `Pago de ${p.estudiante} aprobado: la cuota quedó pagada.`;
                    })}
                    onRechazar={(codigo, obs) => ejecutar(async () => {
                      await adminRechazarPago(p.idTransaccion, codigo, obs);
                      return `Comprobante de ${p.estudiante} rechazado (${CODIGOS_RECHAZO[codigo]}).`;
                    })}
                  />
                ))}
                {pagos.datos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="vacio">No hay comprobantes esperando verificación.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel-bloque">
        <h2>Cuotas vencidas</h2>
        <Estado cargando={!cuotas.datos && cuotas.cargando} error={cuotas.error} onReintentar={cuotas.recargar} />
        {cuotas.datos && (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Cuota</th>
                  <th>Monto</th>
                  <th>Venció</th>
                  <th>Cobro en ventanilla</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.datos.map((c) => {
                  const dias = Math.max(0, Math.floor((hoy.getTime() - new Date(`${c.fechaVencimiento}T00:00:00`).getTime()) / MS_DIA));
                  return (
                    <tr key={c.idCuota}>
                      <td>
                        <strong>{c.estudiante}</strong>
                        <div className="sub">{c.telefono ?? "Sin teléfono"}</div>
                      </td>
                      <td>
                        {nombreMes(c.mes)} {c.anio}
                        <div className="sub">{c.curso}</div>
                      </td>
                      <td>{bs(c.monto)}</td>
                      <td>
                        {fecha(`${c.fechaVencimiento}T00:00:00`)}
                        <div className="sub alerta">{dias === 1 ? "hace 1 día" : `hace ${dias} días`}</div>
                      </td>
                      <td>
                        <BotonIcono
                          texto="Cobrar en efectivo"
                          icono={<IconDinero size={18} />}
                          tono="exito"
                          disabled={ocupado}
                          onClick={() => {
                            if (!window.confirm(`¿Registrar el pago en efectivo de ${bs(c.monto)} de ${c.estudiante}?`)) return;
                            ejecutar(async () => {
                              await adminCobrarEfectivo(c.idCuota);
                              return `Cobro en efectivo registrado: ${c.estudiante}, ${nombreMes(c.mes)} ${c.anio}.`;
                            });
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
                {cuotas.datos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="vacio">Ningún estudiante tiene cuotas vencidas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
