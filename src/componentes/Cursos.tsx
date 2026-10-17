import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';
import { FaBook, FaUserTie, FaCheck, FaTimes, FaClock, FaExclamationTriangle, FaCalendarAlt, FaSave } from 'react-icons/fa';

export default function Cursos() {
    const ses = obtenerSesion();
    const rolSesion = ses?.rol ? String(ses.rol).trim().toUpperCase() : '';

    const esAdmin = rolSesion.includes('ADMIN');
    const esDocente = rolSesion.includes('DOCENTE') || rolSesion.includes('PROFESOR');
    const esEstudiante = !esAdmin && !esDocente;

    const [misCursos, setMisCursos] = useState<any[]>([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<any>(null);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [asistenciasEstado, setAsistenciasEstado] = useState<{ [key: number]: { estado: string; observacion: string } }>({});

    const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
    const [miHistorialAsistencia, setMiHistorialAsistencia] = useState<any[]>([]);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensajeFeedback, setMensajeFeedback] = useState('');

    const cargarCursos = async () => {
        setCargando(true);
        try {
            const userId = ses?.id || ses?.id_usuario || '';
            const userCorreo = ses?.correo || '';

            const res = await fetch(
                `http://localhost:4000/api/mis-cursos?id_usuario=${userId}&correo=${encodeURIComponent(userCorreo)}&rol=${rolSesion}`
            );
            const data = await res.json();

            if (Array.isArray(data)) {
                setMisCursos(data);
                if (data.length > 0) {
                    setCursoSeleccionado(data[0]);
                }
            }

            if (esEstudiante) {
                const astRes = await fetch(
                    `http://localhost:4000/api/mi-asistencia?id_usuario=${userId}&correo=${encodeURIComponent(userCorreo)}`
                );
                const astData = await astRes.json();
                if (Array.isArray(astData)) {
                    setMiHistorialAsistencia(astData);
                }
            }
        } catch (err) {
            console.error('Error al cargar cursos:', err);
        }
        setCargando(false);
    };

    const cargarEstudiantesYAsistencia = async () => {
        if (!cursoSeleccionado || esEstudiante) return;

        try {
            const estRes = await fetch(`http://localhost:4000/api/cursos/${cursoSeleccionado.id_curso}/estudiantes`);
            const estData = await estRes.json();

            const astRes = await fetch(`http://localhost:4000/api/asistencia?id_curso=${cursoSeleccionado.id_curso}&fecha=${fechaHoy}`);
            const astData = await astRes.json();

            const mapAst: { [key: number]: { estado: string; observacion: string } } = {};

            if (Array.isArray(estData)) {
                setEstudiantes(estData);
                estData.forEach((e: any) => {
                    const existente = Array.isArray(astData) ? astData.find((a: any) => a.id_inscripcion === e.id_inscripcion) : null;
                    mapAst[e.id_inscripcion] = {
                        estado: existente ? existente.estado_asistencia : 'PRESENTE',
                        observacion: existente ? existente.observacion || '' : ''
                    };
                });
                setAsistenciasEstado(mapAst);
            }
        } catch (err) {
            console.error('Error al cargar lista de estudiantes:', err);
        }
    };

    useEffect(() => {
        cargarCursos();
    }, []);

    useEffect(() => {
        if (cursoSeleccionado && !esEstudiante) {
            cargarEstudiantesYAsistencia();
        }
    }, [cursoSeleccionado, fechaHoy]);

    const handleEstadoChange = (id_inscripcion: number, estado: string) => {
        setAsistenciasEstado(prev => ({
            ...prev,
            [id_inscripcion]: { ...prev[id_inscripcion], estado }
        }));
    };

    const handleObservacionChange = (id_inscripcion: number, observacion: string) => {
        setAsistenciasEstado(prev => ({
            ...prev,
            [id_inscripcion]: { ...prev[id_inscripcion], observacion }
        }));
    };

    const guardarAsistencia = async () => {
        setGuardando(true);
        setMensajeFeedback('');
        try {
            const payload = Object.keys(asistenciasEstado).map(idInsc => ({
                id_inscripcion: parseInt(idInsc),
                estado_asistencia: asistenciasEstado[parseInt(idInsc)].estado,
                observacion: asistenciasEstado[parseInt(idInsc)].observacion
            }));

            const res = await fetch('http://localhost:4000/api/asistencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: fechaHoy,
                    asistencias: payload
                })
            });

            const data = await res.json();
            if (data.ok) {
                setMensajeFeedback('Asistencia guardada correctamente.');
                setTimeout(() => setMensajeFeedback(''), 4000);
            } else {
                setMensajeFeedback('Error al guardar la asistencia.');
            }
        } catch (err) {
            console.error('Error al guardar asistencia:', err);
            setMensajeFeedback('Error de conexión al guardar.');
        }
        setGuardando(false);
    };

    const getBadgeColor = (estado: string) => {
        switch (estado) {
            case 'PRESENTE': return { bg: '#dcfce7', text: '#15803d', icon: <FaCheck /> };
            case 'AUSENTE': return { bg: '#fee2e2', text: '#b91c1c', icon: <FaTimes /> };
            case 'TARDANZA': return { bg: '#fef3c7', text: '#b45309', icon: <FaClock /> };
            case 'LICENCIA': return { bg: '#e0e7ff', text: '#4338ca', icon: <FaExclamationTriangle /> };
            default: return { bg: '#f1f5f9', text: '#475569', icon: null };
        }
    };

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
            <Navbar />
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaBook /> Mis Asignaturas y Asistencia
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.3rem' }}>
                        {esEstudiante ? 'Consulta tus cursos matriculados y tu historial de asistencias' : 'Gestiona tus cursos y registra el control de asistencia diario'}
                    </p>
                </div>

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Cargando asignaturas...</div>
                ) : misCursos.length === 0 ? (
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#94a3b8' }}>
                        No tienes asignaturas o cursos activos registrados por el momento.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
                        {/* Panel Izquierdo: Lista de Cursos Únicos */}
                        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '10px', height: 'fit-content', border: '1px solid #334155' }}>
                            <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginTop: 0, marginBottom: '1rem' }}>Cursos Asignados</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {misCursos.map((c) => {
                                    const activo = cursoSeleccionado?.id_curso === c.id_curso;
                                    return (
                                        <button
                                            key={c.id_curso}
                                            onClick={() => setCursoSeleccionado(c)}
                                            style={{
                                                textAlign: 'left',
                                                backgroundColor: activo ? '#0284c7' : '#0f172a',
                                                color: '#ffffff',
                                                border: activo ? '1px solid #38bdf8' : '1px solid #334155',
                                                padding: '0.8rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{c.nombre_curso}</div>
                                            <div style={{ fontSize: '0.75rem', color: activo ? '#e0f2fe' : '#94a3b8', marginTop: '0.2rem' }}>
                                                <FaUserTie /> {c.docente || 'Sin docente'}
                                            </div>
                                            <span style={{ fontSize: '0.65rem', backgroundColor: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.4rem', display: 'inline-block' }}>
                                                {c.nivel || 'Básico'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Panel Derecho */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {cursoSeleccionado && (
                                <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '10px', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: '#38bdf8' }}>{cursoSeleccionado.nombre_curso}</h2>
                                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
                                                {cursoSeleccionado.descripcion || 'Sin descripción disponible.'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.8rem', backgroundColor: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#fff' }}>
                                                Nivel: {cursoSeleccionado.nivel || 'BÁSICO'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                        <div><strong>Docente:</strong> {cursoSeleccionado.docente || 'Por asignar'}</div>
                                        <div><strong>Costo Mensual:</strong> Bs. {cursoSeleccionado.costo_mensual || '0.00'}</div>
                                    </div>
                                </div>
                            )}

                            {/* VISTA DOCENTE / ADMIN: Tomar Asistencia a los Alumnos */}
                            {!esEstudiante && (
                                <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '10px', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Control de Asistencia del Día</h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <FaCalendarAlt /> Fecha:
                                            </label>
                                            <input
                                                type="date"
                                                value={fechaHoy}
                                                onChange={(e) => setFechaHoy(e.target.value)}
                                                style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                                            />
                                        </div>
                                    </div>

                                    {mensajeFeedback && (
                                        <div style={{ padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', backgroundColor: mensajeFeedback.includes('correctamente') ? '#064e3b' : '#7f1d1d', color: '#fff', fontSize: '0.85rem' }}>
                                            {mensajeFeedback}
                                        </div>
                                    )}

                                    {estudiantes.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                                            No hay estudiantes inscritos en este curso actualmente.
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#fff' }}>
                                                    <thead>
                                                    <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                                                        <th style={{ padding: '0.6rem' }}>Estudiante</th>
                                                        <th style={{ padding: '0.6rem' }}>Estado de Asistencia</th>
                                                        <th style={{ padding: '0.6rem' }}>Observaciones</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {estudiantes.map((e) => {
                                                        const actual = asistenciasEstado[e.id_inscripcion] || { estado: 'PRESENTE', observacion: '' };
                                                        return (
                                                            <tr key={e.id_usuario} style={{ borderBottom: '1px solid #334155' }}>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{e.nombre_completo}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CI: {e.ci}</div>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                        {['PRESENTE', 'AUSENTE', 'TARDANZA', 'LICENCIA'].map((est) => {
                                                                            const sel = actual.estado === est;
                                                                            const col = getBadgeColor(est);
                                                                            return (
                                                                                <button
                                                                                    key={est}
                                                                                    type="button"
                                                                                    onClick={() => handleEstadoChange(e.id_inscripcion, est)}
                                                                                    style={{
                                                                                        padding: '0.3rem 0.6rem',
                                                                                        borderRadius: '4px',
                                                                                        border: 'none',
                                                                                        cursor: 'pointer',
                                                                                        fontSize: '0.75rem',
                                                                                        fontWeight: 'bold',
                                                                                        backgroundColor: sel ? col.bg : '#0f172a',
                                                                                        color: sel ? col.text : '#64748b',
                                                                                        boxShadow: sel ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                                                                                    }}
                                                                                >
                                                                                    {est}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Añadir nota u observación..."
                                                                        value={actual.observacion}
                                                                        onChange={(ev) => handleObservacionChange(e.id_inscripcion, ev.target.value)}
                                                                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                                                <button
                                                    onClick={guardarAsistencia}
                                                    disabled={guardando}
                                                    style={{
                                                        backgroundColor: '#0284c7',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        padding: '0.63rem 1.3rem',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    <FaSave /> {guardando ? 'Guardando...' : 'Guardar Asistencia'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* VISTA ESTUDIANTE: Historial Propio */}
                            {esEstudiante && (
                                <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '10px', border: '1px solid #334155' }}>
                                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                        Mi Historial de Asistencias
                                    </h3>

                                    {miHistorialAsistencia.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                                            No hay llamadas de asistencia registradas aún para tus cursos.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#fff' }}>
                                                <thead>
                                                <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                                                    <th style={{ padding: '0.6rem' }}>Fecha</th>
                                                    <th style={{ padding: '0.6rem' }}>Curso</th>
                                                    <th style={{ padding: '0.6rem' }}>Estado</th>
                                                    <th style={{ padding: '0.6rem' }}>Observación</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {miHistorialAsistencia.map((ast) => {
                                                    const badge = getBadgeColor(ast.estado_asistencia);
                                                    return (
                                                        <tr key={ast.id_asistencia} style={{ borderBottom: '1px solid #334155' }}>
                                                            <td style={{ padding: '0.65rem' }}>{ast.fecha}</td>
                                                            <td style={{ padding: '0.65rem', fontWeight: 'bold' }}>{ast.nombre_curso}</td>
                                                            <td style={{ padding: '0.65rem' }}>
                                                                    <span style={{
                                                                        backgroundColor: badge.bg,
                                                                        color: badge.text,
                                                                        padding: '0.2rem 0.6rem',
                                                                        borderRadius: '12px',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.75rem',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem'
                                                                    }}>
                                                                        {badge.icon} {ast.estado_asistencia}
                                                                    </span>
                                                            </td>
                                                            <td style={{ padding: '0.65rem', color: '#94a3b8' }}>
                                                                {ast.observacion || '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}