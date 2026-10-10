import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { esDirector, obtenerSesion } from '../services/userService';

export default function Navbar() {
    const nav = useNavigate();
    const loc = useLocation();
    const ses = obtenerSesion();
    const r = ses?.rol ?? '';
    const [hovIdx, setHovIdx] = useState<number | null>(null);

    const getMods = () => {
        const mods = [{ nom: 'Inicio', ruta: '/inicio' }];

        if (esDirector(r)) {
            mods.push({ nom: 'Usuarios', ruta: '/usuarios' });
            mods.push({ nom: 'Horarios', ruta: '/horarios' });
            mods.push({ nom: 'Notas', ruta: '/notas' });
            mods.push({ nom: 'Reportes Administrativos', ruta: '/reportes' });
        } else if (r === 'DOCENTE' || r === 'ESTUDIANTE') {
            mods.push({ nom: 'Horarios', ruta: '/horarios' });
            mods.push({ nom: 'Notas', ruta: '/notas' });
        }

        return mods;
    };

    const logout = () => {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        nav('/');
    };

    return (
        <header style={st.hdr}>
            <div>
                <h1 style={st.tit}>ACADEMIA JAIME GALLARDO</h1>
                <p style={st.sub}>Gestión Administrativa</p>
            </div>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
                {getMods().map((m, i) => {
                    const act = loc.pathname === m.ruta;
                    const isHov = hovIdx === i;
                    return (
                        <button
                            key={m.ruta}
                            onClick={() => nav(m.ruta)}
                            onMouseEnter={() => setHovIdx(i)}
                            onMouseLeave={() => setHovIdx(null)}
                            style={{
                                ...st.btnNav,
                                backgroundColor: act ? '#0284c7' : 'transparent',
                                color: act ? '#ffffff' : isHov ? '#38bdf8' : '#cbd5e1',
                                fontWeight: act || isHov ? 'bold' : 'normal',
                                transform: isHov ? 'scale(1.08)' : 'scale(1)',
                            }}
                        >
                            {m.nom}
                        </button>
                    );
                })}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={st.bdg}>{r || 'INVITADO'}</span>
                <button onClick={logout} style={st.btnOut}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

const st: { [key: string]: React.CSSProperties } = {
    hdr: {
        width: '100%',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        boxSizing: 'border-box',
    },
    tit: { margin: 0, fontSize: '1.2rem', color: '#38bdf8' },
    sub: { margin: 0, fontSize: '0.75rem', color: '#94a3b8' },
    btnNav: {
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    bdg: {
        padding: '0.25rem 0.75rem',
        border: '1px solid #0284c7',
        borderRadius: '0.375rem',
        color: '#38bdf8',
        fontSize: '0.85rem',
        fontWeight: 'bold',
    },
    btnOut: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};