import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';
import { FaGraduationCap, FaUserTie, FaSave, FaClipboardList, FaAward } from 'react-icons/fa';

export default function Notas() {
    const ses = obtenerSesion();
    const rolSesion = ses?.rol ? String(ses.rol).trim().toUpperCase() : '';

    const esAdmin = rolSesion.includes('ADMIN') || rolSesion.includes('DIRECTOR');
    const esDocente = rolSesion.includes('DOCENTE') || rolSesion.includes('PROFESOR');
    const esEstudiante = !esAdmin && !esDocente;

    const [misCursos, setMisCursos] = useState<any[]>([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<any>(null);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);

    const [tituloEvaluacion, setTituloEvaluacion] = useState('Parcial 1');
    const [notasEstado, setNotasEstado] = useState<{ [key: number]: { nota: number | string; observacion: string } }>({});
    const [misNotasEstudiante, setMisNotasEstudiante] = useState<any[]>([]);

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
                const notasRes = await fetch(
                    `http://localhost:4000/api/mis-notas?id_usuario=${userId}&correo=${encodeURIComponent(userCorreo)}`
                );
                const notasData = await notasRes.json();
                if (Array.isArray(notasData)) {
                    setMisNotasEstudiante(notasData);
                }
            }
        } catch (err) {
            console.error('Error al cargar cursos o notas:', err);
        }
        setCargando(false);
    };

    const cargarEstudiantesYNotas = async () => {
        if (!cursoSeleccionado || esEstudiante) return;

        try {
            const estRes = await fetch(`http://localhost:4000/api/cursos/${cursoSeleccionado.id_curso}/estudiantes`);
            const estData = await estRes.json();

            const evRes = await fetch(`http://localhost:4000/api/evaluaciones?id_curso=${cursoSeleccionado.id_curso}&titulo=${encodeURIComponent(tituloEvaluacion)}`);
            const evData = await evRes.json();

            const mapNotas: { [key: number]: { nota: number | string; observacion: string } } = {};

            if (Array.isArray(estData)) {
                setEstudiantes(estData);
                estData.forEach((e: any) => {
                    const existente = Array.isArray(evData) ? evData.find((a: any) => a.id_inscripcion === e.id_inscripcion) : null;
                    mapNotas[e.id_inscripcion] = {
                        nota: existente ? existente.nota : 0,
                        observacion: existente ? existente.observacion || '' : ''
                    };
                });
                setNotasEstado(mapNotas);
            }
        } catch (err) {
            console.error('Error al cargar alumnos y evaluaciones:', err);
        }
    };

    useEffect(() => {
        cargarCursos();
    }, []);

    useEffect(() => {
        if (cursoSeleccionado && !esEstudiante) {
            cargarEstudiantesYNotas();
        }
    }, [cursoSeleccionado, tituloEvaluacion]);

    const handleNotaChange = (id_inscripcion: number, valor: string) => {
        setNotasEstado(prev => ({
            ...prev,
            [id_inscripcion]: { ...prev[id_inscripcion], nota: valor }
        }));
    };

    const handleObservacionChange = (id_inscripcion: number, observacion: string) => {
        setNotasEstado(prev => ({
            ...prev,
            [id_inscripcion]: { ...prev[id_inscripcion], observacion }
        }));
    };

    const guardarNotas = async () => {
        setGuardando(true);
        setMensajeFeedback('');
        try {
            const payload = Object.keys(notasEstado).map(idInsc => ({
                id_inscripcion: parseInt(idInsc),
                nota: parseFloat(String(notasEstado[parseInt(idInsc)].nota)) || 0,
                observacion: notasEstado[parseInt(idInsc)].observacion
            }));

            const res = await fetch('http://localhost:4000/api/evaluaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: tituloEvaluacion,
                    notas: payload
                })
            });

            const data = await res.json();
            if (data.ok) {
                setMensajeFeedback('Calificaciones guardadas exitosamente.');
                setTimeout(() => setMensajeFeedback(''), 4000);
            } else {
                setMensajeFeedback('Error al guardar las calificaciones.');
            }
        } catch (err) {
            console.error('Error al guardar notas:', err);
            setMensajeFeedback('Error de conexión al guardar.');
        }
        setGuardando(false);
    };

    const getEstadoNota = (nota: number) => {
        if (nota >= 51) return { text: 'APROBADO', bg: '#dcfce7', color: '#15803d' };
        return { text: 'REPROBADO', bg: '#fee2e2', color: '#b91c1c' };
    };

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
            <Navbar />
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaGraduationCap /> Registro de Calificaciones
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.3rem' }}>
                        {esEstudiante ? 'Consulta tu boletín académico y notas por asignatura' : 'Asigna y administra las calificaciones de los estudiantes inscritos'}
                    </p>
                </div>

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Cargando información académica...</div>
                ) : misCursos.length === 0 ? (
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#94a3b8' }}>
                        No hay asignaturas asociadas para gestionar calificaciones.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
                        {/* Panel Izquierdo: Cursos */}
                        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '10px', height: 'fit-content', border: '1px solid #334155' }}>
                            <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginTop: 0, marginBottom: '1rem' }}>Asignaturas</h3>
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
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Panel Derecho */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* VISTA DOCENTE / ADMIN: Cargar Calificaciones */}
                            {!esEstudiante && (
                                <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '10px', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>
                                            Calificaciones - {cursoSeleccionado?.nombre_curso}
                                        </h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <FaClipboardList /> Tipo de Evaluación:
                                            </label>
                                            <select
                                                value={tituloEvaluacion}
                                                onChange={(e) => setTituloEvaluacion(e.target.value)}
                                                style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold' }}
                                            >
                                                <option value="Parcial 1">Parcial 1</option>
                                                <option value="Parcial 2">Parcial 2</option>
                                                <option value="Examen Final">Examen Final</option>
                                                <option value="Evaluación Continua">Evaluación Continua</option>
                                            </select>
                                        </div>
                                    </div>

                                    {mensajeFeedback && (
                                        <div style={{ padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', backgroundColor: mensajeFeedback.includes('exitosamente') ? '#064e3b' : '#7f1d1d', color: '#fff', fontSize: '0.85rem' }}>
                                            {mensajeFeedback}
                                        </div>
                                    )}

                                    {estudiantes.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                                            No hay estudiantes inscritos en este curso.
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#fff' }}>
                                                    <thead>
                                                    <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                                                        <th style={{ padding: '0.6rem' }}>Estudiante</th>
                                                        <th style={{ padding: '0.6rem', width: '120px' }}>Nota (0 - 100)</th>
                                                        <th style={{ padding: '0.6rem', width: '130px' }}>Estado</th>
                                                        <th style={{ padding: '0.6rem' }}>Observaciones</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {estudiantes.map((e) => {
                                                        const actual = notasEstado[e.id_inscripcion] || { nota: 0, observacion: '' };
                                                        const numNota = parseFloat(String(actual.nota)) || 0;
                                                        const estObj = getEstadoNota(numNota);
                                                        return (
                                                            <tr key={e.id_usuario} style={{ borderBottom: '1px solid #334155' }}>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{e.nombre_completo}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CI: {e.ci}</div>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={actual.nota}
                                                                        onChange={(ev) => handleNotaChange(e.id_inscripcion, ev.target.value)}
                                                                        style={{ width: '80px', backgroundColor: '#0f172a', border: '1px solid #38bdf8', color: '#fff', padding: '0.4rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                        <span style={{ backgroundColor: estObj.bg, color: estObj.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                                            {estObj.text}
                                                                        </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 0.6rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Nota u observación del docente..."
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
                                                    onClick={guardarNotas}
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
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    <FaSave /> {guardando ? 'Guardando...' : 'Guardar Calificaciones'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* VISTA ESTUDIANTE: Boletín de Notas */}
                            {esEstudiante && (
                                <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '10px', border: '1px solid #334155' }}>
                                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaAward /> Mi Boletín Académico
                                    </h3>

                                    {misNotasEstudiante.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                                            No tienes calificaciones registradas en el sistema por el momento.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#fff' }}>
                                                <thead>
                                                <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                                                    <th style={{ padding: '0.6rem' }}>Asignatura</th>
                                                    <th style={{ padding: '0.6rem' }}>Evaluación</th>
                                                    <th style={{ padding: '0.6rem' }}>Calificación</th>
                                                    <th style={{ padding: '0.6rem' }}>Estado</th>
                                                    <th style={{ padding: '0.6rem' }}>Observación</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {misNotasEstudiante.map((n) => {
                                                    const numNota = parseFloat(n.nota) || 0;
                                                    const estObj = getEstadoNota(numNota);
                                                    return (
                                                        <tr key={n.id_evaluacion} style={{ borderBottom: '1px solid #334155' }}>
                                                            <td style={{ padding: '0.65rem', fontWeight: 'bold' }}>{n.nombre_curso}</td>
                                                            <td style={{ padding: '0.65rem', color: '#38bdf8' }}>{n.titulo}</td>
                                                            <td style={{ padding: '0.65rem', fontSize: '1rem', fontWeight: 'bold' }}>{n.nota} / 100</td>
                                                            <td style={{ padding: '0.65rem' }}>
                                                                    <span style={{ backgroundColor: estObj.bg, color: estObj.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                                        {estObj.text}
                                                                    </span>
                                                            </td>
                                                            <td style={{ padding: '0.65rem', color: '#94a3b8' }}>
                                                                {n.observacion || '-'}
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