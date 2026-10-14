import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';
import { FaSearch, FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function GestionUsuarios() {
    const ses = obtenerSesion();
    const rolSesion = (ses?.rol ?? '').trim().toUpperCase();
    const esAdmin = rolSesion.includes('ADMIN');
    const esDocente = rolSesion.includes('DOCENTE');

    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarBuscador, setMostrarBuscador] = useState(false);
    const [filtroInstrumento, setFiltroInstrumento] = useState('Todos');
    const [menuAbierto, setMenuAbierto] = useState(false);

    // ESTADOS PARA MODALES DE EDICIÓN / AÑADIR
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEditar, setIdEditar] = useState<number | null>(null);
    const [formNombre, setFormNombre] = useState('');
    const [formCorreo, setFormCorreo] = useState('');
    const [formCI, setFormCI] = useState('');
    const [formRol, setFormRol] = useState(3);
    const [formCurso, setFormCurso] = useState('');
    const [formContrasena, setFormContrasena] = useState('');

    // ESTADOS PARA MODAL DE ELIMINAR
    const [modalEliminar, setModalEliminar] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState<any>(null);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Intentar obtener cursos de la API
            let listaCursos: any[] = [];
            try {
                const resC = await fetch('http://localhost:4000/api/cursos');
                if (resC.ok) {
                    const dataC = await resC.json();
                    if (Array.isArray(dataC) && dataC.length > 0) {
                        listaCursos = dataC;
                    }
                }
            } catch (e) {
                console.log('Endpoint /api/cursos no disponible, extrayendo dinámicamente');
            }

            const resU = await fetch('http://localhost:4000/api/usuarios');
            const dataU = await resU.json();
            if (Array.isArray(dataU)) {
                const formateados = dataU.map((u: any) => ({
                    id: u.id,
                    nombre: u.nombre || 'Usuario',
                    correo: u.correo || 'Sin correo',
                    ci: u.ci || '',
                    rol: (u.rol || 'ESTUDIANTE').trim().toUpperCase(),
                    id_rol: u.id_rol || 3,
                    id_curso: u.id_curso || '',
                    instrumento: u.instrumento || 'Dirección / Cátedra'
                }));
                setUsuarios(formateados);

                // Si la API de cursos no devolvió nada, extraemos los cursos únicos directamente de los usuarios
                if (listaCursos.length === 0) {
                    const instrumentosUnicos = Array.from(
                        new Set(
                            formateados
                                .map((u: any) => u.instrumento)
                                .filter((inst: string) => inst && inst !== 'Dirección / Cátedra')
                        )
                    );
                    listaCursos = instrumentosUnicos.map((inst, index) => ({
                        id_curso: index + 1,
                        nombre_curso: inst
                    }));
                }
            }
            setCursos(listaCursos);
        } catch (err) {
            console.error('Error al conectar con la API:', err);
        }
        setCargando(false);
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setIdEditar(null);
        setFormNombre('');
        setFormCorreo('');
        setFormCI('');
        setFormRol(3);
        setFormCurso(cursos.length > 0 ? cursos[0].id_curso : '');
        setFormContrasena('clave123');
        setModalAbierto(true);
    };

    const abrirModalEditar = (u: any) => {
        setModoEdicion(true);
        setIdEditar(u.id);
        setFormNombre(u.nombre);
        setFormCorreo(u.correo);
        setFormCI(u.ci);
        setFormRol(u.id_rol);

        // Buscar el id_curso correspondiente o seleccionar por nombre
        const cursoEncontrado = cursos.find(c => c.nombre_curso === u.instrumento || c.id_curso === u.id_curso);
        setFormCurso(cursoEncontrado ? cursoEncontrado.id_curso : '');

        setFormContrasena('');
        setModalAbierto(true);
    };

    const guardarUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            nombre: formNombre,
            correo: formCorreo,
            ci: formCI || '0000000',
            id_rol: Number(formRol),
            id_curso: formCurso ? Number(formCurso) : null,
            contrasena: formContrasena
        };

        try {
            const url = modoEdicion
                ? `http://localhost:4000/api/usuarios/${idEditar}`
                : 'http://localhost:4000/api/usuarios';
            const method = modoEdicion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setModalAbierto(false);
                cargarDatos();
            } else {
                alert(data.mensaje || 'Error al procesar la solicitud');
            }
        } catch (err) {
            console.error('Error guardando usuario:', err);
            alert('Error de conexión con el servidor');
        }
    };

    const confirmarEliminar = (u: any) => {
        setUsuarioAEliminar(u);
        setModalEliminar(true);
    };

    const ejecutarEliminacion = async () => {
        if (!usuarioAEliminar) return;
        try {
            const res = await fetch(`http://localhost:4000/api/usuarios/${usuarioAEliminar.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                setModalEliminar(false);
                setUsuarioAEliminar(null);
                cargarDatos();
            } else {
                alert(data.mensaje || 'No se pudo eliminar el usuario');
            }
        } catch (err) {
            console.error('Error al eliminar usuario:', err);
        }
    };

    const instrumentosDisponibles = ['Todos', ...Array.from(new Set(
        usuarios
            .filter(u => !esDocente || u.rol === 'ESTUDIANTE')
            .map(u => u.instrumento)
    ))];

    let usuariosVisibles = usuarios.filter((u) => {
        if (u.rol === 'ADMINISTRADOR') {
            return false;
        }
        if (esDocente) {
            return u.rol === 'ESTUDIANTE';
        }
        return true;
    });

    if (busqueda.trim() !== '') {
        usuariosVisibles = usuariosVisibles.filter((u) =>
            u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.instrumento.toLowerCase().includes(busqueda.toLowerCase())
        );
    }

    if (filtroInstrumento !== 'Todos') {
        usuariosVisibles = usuariosVisibles.filter((u) =>
            u.instrumento.toLowerCase().includes(filtroInstrumento.toLowerCase())
        );
    }

    const jerarquiaRol: { [key: string]: number } = {
        DOCENTE: 1,
        ESTUDIANTE: 2
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ color: '#38bdf8', fontSize: '1.8rem', margin: 0 }}>
                            {esDocente ? 'Lista de Estudiantes' : 'Gestión de Usuarios'}
                        </h2>

                        {esAdmin && (
                            <button
                                onClick={abrirModalNuevo}
                                style={{
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                                }}
                            >
                                <FaUserPlus /> Añadir nuevo usuario
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
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

                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.6rem 1rem', borderRadius: '25px', border: '1px solid #334155' }}>
                            <button
                                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '1.1rem' }}
                            >
                                <FaSearch />
                            </button>
                            <div style={{ width: mostrarBuscador ? '280px' : '0px', opacity: mostrarBuscador ? 1 : 0, overflow: 'hidden', transition: 'all 0.5s ease-in-out' }}>
                                <input
                                    type="text"
                                    placeholder="Escriba el nombre a buscar..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    style={{ border: 'none', backgroundColor: 'transparent', color: '#ffffff', outline: 'none', width: '100%', paddingLeft: '0.5rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#0f172a', color: '#38bdf8', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '1rem' }}>ID</th>
                                <th style={{ padding: '1rem' }}>Usuario</th>
                                <th style={{ padding: '1rem' }}>Correo</th>
                                <th style={{ padding: '1rem' }}>Rol</th>
                                <th style={{ padding: '1rem' }}>Instrumento / Sección</th>
                                {esAdmin && <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={esAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
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
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: u.rol === 'DOCENTE' ? '#16a34a' : '#64748b', color: '#ffffff' }}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#38bdf8' }}>{u.instrumento}</td>

                                        {esAdmin && (
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
                                                    <button onClick={() => abrirModalEditar(u)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '1rem' }} title="Editar">
                                                        <FaEdit />
                                                    </button>
                                                    <button onClick={() => confirmarEliminar(u)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={esAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* MODAL CREAR / EDITAR */}
            {modalAbierto && (
                <div style={estiloOverlay}>
                    <div style={estiloModal}>
                        <h3 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '1.5rem' }}>
                            {modoEdicion ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
                        </h3>
                        <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={estiloLabel}>Nombre Completo:</label>
                                <input type="text" required value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={estiloInput} />
                            </div>

                            <div>
                                <label style={estiloLabel}>Correo Electrónico:</label>
                                <input type="email" required value={formCorreo} onChange={(e) => setFormCorreo(e.target.value)} style={estiloInput} />
                            </div>

                            <div>
                                <label style={estiloLabel}>Cédula de Identidad (CI):</label>
                                <input type="text" value={formCI} onChange={(e) => setFormCI(e.target.value)} style={estiloInput} />
                            </div>

                            <div>
                                <label style={estiloLabel}>Rol del Usuario:</label>
                                <select value={formRol} onChange={(e) => setFormRol(Number(e.target.value))} style={estiloInput}>
                                    <option value={2}>DOCENTE</option>
                                    <option value={3}>ESTUDIANTE</option>
                                </select>
                            </div>

                            {/* SELECTOR DE INSTRUMENTO / CURSO */}
                            <div>
                                <label style={estiloLabel}>Instrumento / Curso:</label>
                                <select value={formCurso} onChange={(e) => setFormCurso(e.target.value)} style={estiloInput}>
                                    <option value="">Dirección / Cátedra (Sin curso específico)</option>
                                    {cursos.map((c) => (
                                        <option key={c.id_curso} value={c.id_curso}>
                                            {c.nombre_curso}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!modoEdicion && (
                                <div>
                                    <label style={estiloLabel}>Contraseña:</label>
                                    <input type="password" required value={formContrasena} onChange={(e) => setFormContrasena(e.target.value)} style={estiloInput} />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setModalAbierto(false)} style={{ ...estiloBoton, backgroundColor: '#64748b' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ ...estiloBoton, backgroundColor: '#0284c7' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR ELIMINAR */}
            {modalEliminar && usuarioAEliminar && (
                <div style={estiloOverlay}>
                    <div style={{ ...estiloModal, maxWidth: '400px' }}>
                        <h3 style={{ color: '#ef4444', marginTop: 0 }}>¿Confirmar eliminación?</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '1rem 0 1.5rem 0' }}>
                            ¿Estás seguro de que deseas eliminar a <strong>{usuarioAEliminar.nombre}</strong>?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setModalEliminar(false)} style={{ ...estiloBoton, backgroundColor: '#64748b' }}>
                                Cancelar
                            </button>
                            <button onClick={ejecutarEliminacion} style={{ ...estiloBoton, backgroundColor: '#ef4444' }}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const estiloOverlay: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
};

const estiloModal: React.CSSProperties = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '2rem',
    width: '90%',
    maxWidth: '480px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const estiloLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '0.3rem'
};

const estiloInput: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
};

const estiloBoton: React.CSSProperties = {
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    border: 'none',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer'
};