import React, { useState } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';

const USUARIOS_MOCK = [
    { id: 1, nombre: 'Carlos Mamani Quispe', correo: 'carlos.mamani@academia.com', rol: 'DIRECTOR', instrumento: 'Batuta / Dirección' },
    { id: 2, nombre: 'Lucía Fernández', correo: 'lucia.fernandez@academia.com', rol: 'DOCENTE', instrumento: 'Violín' },
    { id: 3, nombre: 'Mateo Morales', correo: 'mateo.m@correo.com', rol: 'ESTUDIANTE', instrumento: 'Violonchelo' },
    { id: 4, nombre: 'Diego Torrez', correo: 'diego.torrez@correo.com', rol: 'ESTUDIANTE', instrumento: 'Flauta Traversa' },
    { id: 5, nombre: 'Elena Rostova', correo: 'elena.r@academia.com', rol: 'DOCENTE', instrumento: 'Trompeta' },
    { id: 6, nombre: 'Gabriel Silva', correo: 'gabriel.s@correo.com', rol: 'ESTUDIANTE', instrumento: 'Timbales' },
    { id: 7, nombre: 'Sofía Vargas', correo: 'sofia.v@correo.com', rol: 'ESTUDIANTE', instrumento: 'Arpa' },
    { id: 8, nombre: 'Andrés Mendoza', correo: 'andres.m@correo.com', rol: 'ESTUDIANTE', instrumento: 'Oboe' },
];

const INSTRUMENTOS_ORQUESTA = [
    'Todos',
    'Violín',
    'Viola',
    'Violonchelo',
    'Contrabajo',
    'Flauta Traversa',
    'Oboe',
    'Clarinete',
    'Fagot',
    'Trompeta',
    'Trompa / Corno',
    'Trombón',
    'Tuba',
    'Timbales',
    'Arpa'
];

export default function GestionUsuarios() {
    const ses = obtenerSesion();
    const r = ses?.rol ?? '';
    const esDirector = r === 'DIRECTOR' || r === 'ADMINISTRADOR';

    const [busqueda, setBusqueda] = useState('');
    const [filtroInstrumento, setFiltroInstrumento] = useState('Todos');

    const usuariosFiltrados = USUARIOS_MOCK.filter((u) => {
        const coincideTexto =
            u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.instrumento.toLowerCase().includes(busqueda.toLowerCase());

        const coincideInstrumento =
            filtroInstrumento === 'Todos' || u.instrumento.toLowerCase().includes(filtroInstrumento.toLowerCase());

        return coincideTexto && coincideInstrumento;
    });

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {!esDirector ? (
                    /* Restricción de acceso para roles no autorizados */
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginTop: '2rem' }}>
                        <p style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
                            No tienes permisos para acceder a este módulo.
                        </p>
                    </div>
                ) : (
                    /* Módulo de Usuarios para DIRECTOR */
                    <div>
                        <h2 style={{ color: '#38bdf8', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
                            Gestión de Usuarios - Secciones de Orquesta
                        </h2>

                        {/* BARRA DE BÚSQUEDA */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Busqueda de usuarios por nombre o instrumento"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1.2rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>


                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Filtrar por Instrumento:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {INSTRUMENTOS_ORQUESTA.map((inst) => {
                                    const activo = filtroInstrumento === inst;
                                    return (
                                        <button
                                            key={inst}
                                            onClick={() => setFiltroInstrumento(inst)}
                                            style={{
                                                padding: '0.4rem 0.9rem',
                                                borderRadius: '20px',
                                                border: 'none',
                                                backgroundColor: activo ? '#38bdf8' : '#334155',
                                                color: activo ? '#0f172a' : '#f8fafc',
                                                fontWeight: activo ? 'bold' : 'normal',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {inst}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0f172a', color: '#38bdf8', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '1rem' }}>Usuario</th>
                                    <th style={{ padding: '1rem' }}>Correo</th>
                                    <th style={{ padding: '1rem' }}>Rol</th>
                                    <th style={{ padding: '1rem' }}>Instrumento Asignado</th>
                                </tr>
                                </thead>
                                <tbody>
                                {usuariosFiltrados.length > 0 ? (
                                    usuariosFiltrados.map((u) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.nombre}</td>
                                            <td style={{ padding: '1rem', color: '#94a3b8' }}>{u.correo}</td>
                                            <td style={{ padding: '1rem' }}>
                          <span
                              style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  backgroundColor: u.rol === 'DIRECTOR' ? '#0284c7' : u.rol === 'DOCENTE' ? '#16a34a' : '#64748b',
                                  color: '#ffffff'
                              }}
                          >
                            {u.rol}
                          </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#38bdf8' }}>{u.instrumento}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No se encontraron usuarios que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}