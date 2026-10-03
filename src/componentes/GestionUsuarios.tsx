import React from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';

export default function GestionUsuarios() {
    const ses = obtenerSesion();
    const r = ses?.rol ?? '';
    const ok = r === 'DIRECTOR';

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', color: '#ffffff' }}>
                {!ok ? (
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginTop: '2rem' }}>
                        <p style={{ color: '#f87171', fontWeight: 'bold' }}>
                            No tienes permisos para acceder a este módulo.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: '#38bdf8', margin: 0 }}>Gestión de Usuarios</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            Sesión: <strong>{ses?.nom}</strong> — Rol: <strong>{r}</strong>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}