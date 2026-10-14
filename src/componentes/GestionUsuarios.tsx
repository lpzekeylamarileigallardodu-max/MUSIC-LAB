import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';
import { FaSearch } from 'react-icons/fa';

export default function GestionUsuarios() {
    const ses = obtenerSesion();
    const rolSesion = (ses?.rol ?? '').trim().toUpperCase();
    const esDocente = rolSesion.includes('DOCENTE');

    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarBuscador, setMostrarBuscador] = useState(false);
    const [filtroInstrumento, setFiltroInstrumento] = useState('Todos');
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        fetch('http://localhost:4000/api/usuarios')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const formateados = data.map((u: any) => ({
                        id: u.id,
                        nombre: u.nombre || 'Usuario',
                        correo: u.correo || 'Sin correo',
                        rol: (u.rol || 'ESTUDIANTE').trim().toUpperCase(),
                        instrumento: u.instrumento || 'Sin curso asignado'
                    }));
                    setUsuarios(formateados);
                }
                setCargando(false);
            })
            .catch((err) => {
                console.error('Error al conectar con la API de usuarios:', err);
                setCargando(false);
            });
    }, []);

    const instrumentosDisponibles = ['Todos', ...Array.from(new Set(
        usuarios
            .filter(u => !esDocente || u.rol === 'ESTUDIANTE')
            .map(u => u.instrumento)
    ))];

    // 1. Filtrar según rol (Docente solo ve estudiantes)
    let usuariosVisibles = usuarios.filter((u) => {
        if (esDocente) {
            return u.rol === 'ESTUDIANTE';
        }
        return true;
    });

    // 2. Filtrar por búsqueda de texto
    if (busqueda.trim() !== '') {
        usuariosVisibles = usuariosVisibles.filter((u) =>
            u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.instrumento.toLowerCase().includes(busqueda.toLowerCase())
        );
    }

    // 3. Filtrar por curso seleccionado
    if (filtroInstrumento !== 'Todos') {
        usuariosVisibles = usuariosVisibles.filter((u) =>
            u.instrumento.toLowerCase().includes(filtroInstrumento.toLowerCase())
        );
    }

    // 4. Orden jerárquico estricto (Admin 1, Docente 2, Estudiante 3)
    const jerarquiaRol: { [key: string]: number } = {
        ADMINISTRADOR: 1,
        DOCENTE: 2,
        ESTUDIANTE: 3
    };

    usuariosVisibles.sort((a, b) => {
        const rolA = (a.rol || '').trim().toUpperCase();
        const rolB = (b.rol || '').trim().toUpperCase();

        const ordenA = jerarquiaRol[rolA] || 99;
        const ordenB = jerarquiaRol[rolB] || 99;

        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }
        return a.nombre.localeCompare(b.nombre);
    });

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div>
                    <h2 style={{ color: '#38bdf8', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                        {esDocente ? 'Lista de Estudiantes' : 'Gestión de Usuarios'}
                    </h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>

                        {/* DESPLEGABLE */}
                        <div style={{ position: 'relative', width: '280px' }}>
                            <div
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                style={{
                                    backgroundColor: '#1e293b',
                                    padding: '0.8rem 1.2rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    color: '#38bdf8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    userSelect: 'none'
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Filtrar: {filtroInstrumento}
                                </span>
                                <span style={{ transition: 'transform 0.3s ease', transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '105%',
                                    left: 0,
                                    width: '100%',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    maxHeight: menuAbierto ? '250px' : '0px',
                                    opacity: menuAbierto ? 1 : 0,
                                    overflowY: 'auto',
                                    transition: 'all 0.5s ease-in-out',
                                    zIndex: 10,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                {instrumentosDisponibles.map((inst) => (
                                    <div
                                        key={inst}
                                        onClick={() => {
                                            setFiltroInstrumento(inst);
                                            setMenuAbierto(false);
                                        }}
                                        style={{
                                            padding: '0.7rem 1.2rem',
                                            cursor: 'pointer',
                                            color: filtroInstrumento === inst ? '#38bdf8' : '#f8fafc',
                                            backgroundColor: filtroInstrumento === inst ? '#0f172a' : 'transparent',
                                            fontSize: '0.9rem',
                                            borderBottom: '1px solid #334155',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                    >
                                        {inst}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BUSCADOR */}
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.6rem 1rem', borderRadius: '25px', border: '1px solid #334155', transition: 'all 0.5s ease-in-out' }}>
                            <button
                                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '1.1rem',
                                    padding: '0.2rem 0.4rem'
                                }}
                                title="Buscar usuario"
                            >
                                <FaSearch />
                            </button>

                            <div
                                style={{
                                    width: mostrarBuscador ? '280px' : '0px',
                                    opacity: mostrarBuscador ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.5s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Escriba el nombre a buscar..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: '#ffffff',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        width: '100%',
                                        paddingLeft: '0.5rem'
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* TABLA */}
                    <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#0f172a', color: '#38bdf8', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '1rem' }}>ID</th>
                                <th style={{ padding: '1rem' }}>Usuario</th>
                                <th style={{ padding: '1rem' }}>Correo</th>
                                <th style={{ padding: '1rem' }}>Rol</th>
                                <th style={{ padding: '1rem' }}>Instrumento / Sección</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        Cargando datos...
                                    </td>
                                </tr>
                            ) : usuariosVisibles.length > 0 ? (
                                usuariosVisibles.map((u) => (
                                    <tr key={u.id + '-' + u.instrumento} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '1rem', color: '#94a3b8' }}>#{u.id}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.nombre}</td>
                                        <td style={{ padding: '1rem', color: '#94a3b8' }}>{u.correo}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: u.rol === 'ADMINISTRADOR' ? '#0284c7' : u.rol === 'DOCENTE' ? '#16a34a' : '#64748b',
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
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}