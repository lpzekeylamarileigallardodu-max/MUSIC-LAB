import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const nav = useNavigate();
    const [usr, setUsr] = useState('');
    const [pass, setPass] = useState('');
    const [cargando, setCargando] = useState(false);
    const [err, setErr] = useState('');
    const [hov, setHov] = useState(false);

    const enm = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        if (!usr.trim() || !pass.trim()) {
            setErr('Por favor ingrese su usuario y contraseña');
            return;
        }

        setCargando(true);

        try {
            const res = await fetch('http://localhost:4000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: usr, contrasena: pass }),
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                nav('/inicio');
            } else {
                setErr(data.mensaje || 'correo o contraseña incorrecto');
            }
        } catch (error) {
            console.error('Error de red:', error);
            setErr('Error de conexión con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={est.cont}>
            <div style={est.caja}>
                <h2 style={est.tit}>ACADEMIA JAIME GALLARDO</h2>
                <p style={est.sub}>Iniciar Sesión</p>

                {err && <div style={est.err}>{err}</div>}

                <form onSubmit={enm}>
                    <div style={est.grp}>
                        <label style={est.etq}>Correo Electrónico</label>
                        <input
                            type="email"
                            value={usr}
                            onChange={(e) => setUsr(e.target.value)}
                            placeholder="usuario@correo.com"
                            style={est.ent}
                        />
                    </div>

                    <div style={est.grp}>
                        <label style={est.etq}>Contraseña</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="••••••••"
                            style={est.ent}
                        />
                    </div>

                    <button type="submit" style={est.btn} disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const est: { [key: string]: React.CSSProperties } = {
    cont: {
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
    },
    caja: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    },
    tit: {
        color: '#38bdf8',
        fontSize: '1.4rem',
        textAlign: 'center',
        margin: 0,
        fontWeight: 'bold',
    },
    sub: {
        color: '#94a3b8',
        fontSize: '0.9rem',
        textAlign: 'center',
        marginTop: '0.25rem',
        marginBottom: '1.5rem',
    },
    grp: {
        marginBottom: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    etq: {
        color: '#cbd5e1',
        fontSize: '0.85rem',
        fontWeight: 'bold',
    },
    ent: {
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '0.6rem 0.8rem',
        color: '#ffffff',
        fontSize: '0.9rem',
        outline: 'none',
    },
    btn: {
        width: '100%',
        backgroundColor: '#0284c7',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        padding: '0.75rem',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
        transition: 'background-color 0.2s',
    },
    err: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid #ef4444',
        color: '#f87171',
        borderRadius: '6px',
        padding: '0.6rem',
        fontSize: '0.85rem',
        marginBottom: '1rem',
        textAlign: 'center',
    },
    enlace: {
        textDecoration: 'none',
        fontSize: '0.85rem',
        transition: 'color 0.2s',
    },
};