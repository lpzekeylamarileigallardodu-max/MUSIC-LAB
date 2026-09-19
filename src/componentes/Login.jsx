import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    // ------------ variables ------------
    const [usr, setUsr] = useState('');
    const [pass, setPass] = useState('');
    const [hoverEnlace, setHoverEnlace] = useState(false);
    const nav = useNavigate();

    // ------------ funcion enviar ------------
    const enm = (e) => {
        e.preventDefault();
        if (usr !== '' && pass !== '') {
            nav('/inicio');
        } else {
            alert('Ingresa correo y contraseña');
        }
    };

    // ------------ estilos ------------
    const est = {
        cont: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box'
        },
        caja: {
            backgroundColor: '#1e293b',
            padding: '2.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: '380px',
            color: '#ffffff'
        },
        tit: {
            textAlign: 'center',
            margin: '0 0 0.5rem 0',
            fontSize: '1.8rem',
            color: '#38bdf8'
        },
        sub: {
            textAlign: 'center',
            margin: '0 0 2rem 0',
            fontSize: '0.9rem',
            color: '#94a3b8'
        },
        grp: {
            marginBottom: '1.2rem'
        },
        etq: {
            display: 'block',
            marginBottom: '0.4rem',
            fontSize: '0.85rem',
            color: '#cbd5e1'
        },
        ent: {
            width: '100%',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #334155',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '0.95rem',
            boxSizing: 'border-box'
        },
        btn: {
            width: '100%',
            padding: '0.8rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '1rem'
        },
        enlace: {
            display: 'block',
            textAlign: 'center',
            marginTop: '1.2rem',
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '0.85rem'
        }
    };

    return (
        <div style={est.cont}>
            <div style={est.caja}>
                <h1 style={est.tit}>Academia Jaime Gallardo</h1>
                <p style={est.sub}>Ingresa tus datos para acceder</p>

                <form onSubmit={enm}>
                    <div style={est.grp}>
                        <label style={est.etq}>Correo</label>
                        <input
                            type="email"
                            value={usr}
                            onChange={(e) => setUsr(e.target.value)}
                            placeholder="234@gmail.com"
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

                    <button type="submit" style={est.btn}>
                        Iniciar Sesión
                    </button>

                    <Link
                        to="/registro"
                        style={{
                            ...est.enlace,
                            color: hoverEnlace ? '#7dd3fc' : '#38bdf8',
                            textDecoration: hoverEnlace ? 'underline' : 'none'
                        }}
                        onMouseEnter={() => setHoverEnlace(true)}
                        onMouseLeave={() => setHoverEnlace(false)}
                    >
                        ¿No tienes cuenta? Regístrate aquí
                    </Link>
                </form>
            </div>
        </div>
    );
}