import React from 'react';
import Navbar from './Navbar';
import { esDirector, obtenerSesion } from '../services/userService';

export default function GestionUsuarios() {
    const ses = obtenerSesion();
    const r = ses?.rol ?? '';
    const ok = esDirector(r);

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', color: '#ffffff' }}>
                {!ok ? (
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginTop: '2rem' }}>
                        <p style={{ color: '#f87171', fontWeight: 'bold' }}>
                            No puedes acceder a este módulo.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: '#38bdf8', margin: 0 }}>Gestion de Usuarios</h2>

                    </div>
                )}
            </main>
        </div>
    );
}