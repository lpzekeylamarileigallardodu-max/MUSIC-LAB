import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';
import { FaMapMarkerAlt, FaUserTie, FaEdit, FaPlus } from 'react-icons/fa';

export default function Horarios() {
    const ses = obtenerSesion();
    const rolSesion = ses?.rol ? String(ses.rol).trim().toUpperCase() : '';
    const esAdmin = rolSesion.includes('ADMIN');
    const esDocente = rolSesion.includes('DOCENTE');

    const idUsuarioActual = ses?.id || ses?.id_usuario;

    const [horarios, setHorarios] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [horarioSeleccionado, setHorarioSeleccionado] = useState<any>(null);

    const [formIdCurso, setFormIdCurso] = useState('');
    const [formIdDocente, setFormIdDocente] = useState('');
    const [formAula, setFormAula] = useState('Aula 1');
    const [formDia, setFormDia] = useState('LUNES');
    const [formInicio, setFormInicio] = useState('09:00');
    const [formFin, setFormFin] = useState('10:30');

    const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

    const bloquesHoras = [
        { inicio: '09:00', fin: '10:30' },
        { inicio: '10:00', fin: '11:30' },
        { inicio: '15:00', fin: '16:30' },
        { inicio: '16:00', fin: '17:30' },
        { inicio: '17:00', fin: '18:30' },
        { inicio: '18:00', fin: '19:30' }
    ];

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const hRes = await fetch('http://localhost:4000/api/horarios').catch(() => null);
            const hData = hRes ? await hRes.json().catch(() => []) : [];

            const cRes = await fetch('http://localhost:4000/api/cursos').catch(() => null);
            const cData = cRes ? await cRes.json().catch(() => []) : [];

            const dRes = await fetch('http://localhost:4000/api/docentes').catch(() => null);
            let dData = dRes ? await dRes.json().catch(() => []) : [];

            if (!Array.isArray(dData) || dData.length === 0) {
                const uRes = await fetch('http://localhost:4000/api/usuarios').catch(() => null);
                const uData = uRes ? await uRes.json().catch(() => []) : [];
                dData = uData.map((u: any) => ({ id_usuario: u.id || u.id_usuario, nombre_completo: u.nombre_completo || u.nombre }));
            }

            if (Array.isArray(cData) && cData.length > 0) {
                setCursos(cData);
                setFormIdCurso(String(cData[0].id_curso || ''));
            }

            if (Array.isArray(dData) && dData.length > 0) {
                setDocentes(dData);
                setFormIdDocente(String(dData[0].id_usuario || ''));
            }

            if (Array.isArray(hData)) {
                let filtrados = hData;

                if (!esAdmin && ses) {
                    if (esDocente) {
                        filtrados = hData.filter((h: any) =>
                            String(h?.docente || '').toLowerCase().trim() === String(ses.nombre || '').toLowerCase().trim()
                        );
                    } else {
                        let misCursosNombres: string[] = [];

                        if (idUsuarioActual) {
                            const misCursosRes = await fetch(`http://localhost:4000/api/usuarios/${idUsuarioActual}/cursos`).catch(() => null);
                            const misCursosData = misCursosRes ? await misCursosRes.json().catch(() => []) : [];
                            if (Array.isArray(misCursosData) && misCursosData.length > 0) {
                                misCursosNombres = misCursosData.map((c: any) => String(c.nombre_curso).toLowerCase().trim());
                            }
                        }

                        if (misCursosNombres.length === 0) {
                            const uRes = await fetch('http://localhost:4000/api/usuarios').catch(() => null);
                            const uData = uRes ? await uRes.json().catch(() => []) : [];
                            if (Array.isArray(uData)) {
                                misCursosNombres = uData
                                    .filter((u: any) =>
                                        (idUsuarioActual && (u?.id === idUsuarioActual || u?.id_usuario === idUsuarioActual)) ||
                                        (ses?.correo && String(u?.correo).toLowerCase() === String(ses.correo).toLowerCase())
                                    )
                                    .map((u: any) => String(u?.instrumento || '').toLowerCase().trim())
                                    .filter(Boolean);
                            }
                        }

                        // FILTRADO ESTRICTO: Solo mostrar lo que coincide con los cursos del estudiante
                        if (misCursosNombres.length > 0) {
                            filtrados = hData.filter((h: any) =>
                                misCursosNombres.includes(String(h?.instrumento || '').toLowerCase().trim())
                            );
                        } else {
                            // Si no tiene cursos o inscripciones, se queda totalmente vacío
                            filtrados = [];
                        }
                    }
                }

                setHorarios(filtrados);
            }
        } catch (err) {
            console.error('Error al cargar datos:', err);
        }
        setCargando(false);
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const coloresCurso: { [key: string]: { bg: string; border: string; text: string } } = {
        'Guitarra Básico': { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
        'Guitarra Intermedio': { bg: '#bae6fd', border: '#0369a1', text: '#0c4a6e' },
        'Piano Inicial': { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
        'Piano Avanzado': { bg: '#bbf7d0', border: '#15803d', text: '#052e16' },
        'Canto y Técnica Vocal': { bg: '#f3e8ff', border: '#9333ea', text: '#581c87' },
        'Batería Básico': { bg: '#ffedd5', border: '#ea580c', text: '#7c2d12' }
    };

    const abrirCreacion = (dia: string, bloque: { inicio: string; fin: string }) => {
        if (!esAdmin) return;
        setModoEdicion(false);
        setHorarioSeleccionado(null);
        if (cursos.length > 0) setFormIdCurso(String(cursos[0].id_curso));
        if (docentes.length > 0) setFormIdDocente(String(docentes[0].id_usuario));
        setFormAula('Aula 1');
        setFormDia(dia);
        setFormInicio(bloque.inicio);
        setFormFin(bloque.fin);
        setModalAbierto(true);
    };

    const abrirEdicion = (h: any) => {
        if (!esAdmin) return;
        setModoEdicion(true);
        setHorarioSeleccionado(h);
        setFormIdCurso(String(h.id_curso || ''));
        setFormAula(h.aula || 'Aula 1');
        setFormInicio(h.hora_inicio || '09:00');
        setFormFin(h.hora_fin || '10:30');

        const docEncontrado = docentes.find((d) => d.nombre_completo === h.docente || d.docente === h.docente);
        if (docEncontrado) {
            setFormIdDocente(String(docEncontrado.id_usuario));
        } else if (docentes.length > 0) {
            setFormIdDocente(String(docentes[0].id_usuario));
        }

        setModalAbierto(true);
    };

    const guardarModal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modoEdicion && horarioSeleccionado) {
                const res = await fetch(`http://localhost:4000/api/horarios/${horarioSeleccionado.id_horario}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_curso: formIdCurso,
                        id_docente: formIdDocente,
                        aula: formAula,
                        hora_inicio: formInicio,
                        hora_fin: formFin
                    })
                });
                if (res.ok) {
                    setModalAbierto(false);
                    cargarDatos();
                } else {
                    alert('Error al actualizar el horario');
                }
            } else {
                const res = await fetch('http://localhost:4000/api/horarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_curso: formIdCurso,
                        id_docente: formIdDocente,
                        dia: formDia,
                        aula: formAula,
                        hora_inicio: formInicio,
                        hora_fin: formFin
                    })
                });
                if (res.ok) {
                    setModalAbierto(false);
                    cargarDatos();
                } else {
                    alert('Error al registrar el horario');
                }
            }
        } catch (err) {
            console.error('Error al guardar:', err);
        }
    };

    const handleDragStart = (e: React.DragEvent, h: any) => {
        if (!esAdmin) return;
        e.dataTransfer.setData('application/json', JSON.stringify(h));
    };

    const handleDrop = async (e: React.DragEvent, nuevoDia: string, bloque: any) => {
        if (!esAdmin) return;
        e.preventDefault();
        const dataJson = e.dataTransfer.getData('application/json');
        if (!dataJson) return;

        const hArrastrado = JSON.parse(dataJson);
        if (hArrastrado.dia === nuevoDia && hArrastrado.hora_inicio === bloque.inicio) return;

        try {
            const res = await fetch(`http://localhost:4000/api/horarios/${hArrastrado.id_horario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_curso: hArrastrado.id_curso,
                    id_docente: hArrastrado.id_docente,
                    dia: nuevoDia,
                    aula: hArrastrado.aula,
                    hora_inicio: bloque.inicio,
                    hora_fin: bloque.fin
                })
            });
            if (res.ok) cargarDatos();
        } catch (err) {
            console.error('Error al mover:', err);
        }
    };

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
            <Navbar />
            <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem 1rem' }}>

                {esAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button
                            onClick={() => abrirCreacion('LUNES', bloquesHoras[0])}
                            style={{
                                backgroundColor: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
                            }}
                        >
                            <FaPlus /> Añadir Nueva Clase
                        </button>
                    </div>
                )}

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Cargando horarios...</div>
                ) : (
                    <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a', fontSize: '0.85rem' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                                <th style={{ padding: '0.75rem', border: '1px solid #334155', width: '120px' }}>Hora</th>
                                {diasSemana.map((d) => (
                                    <th key={d} style={{ padding: '0.75rem', border: '1px solid #334155', textAlign: 'center' }}>{d}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {bloquesHoras.map((bloque) => (
                                <tr key={bloque.inicio} style={{ height: '85px' }}>
                                    <td style={{ border: '1px solid #cbd5e1', fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', color: '#334155' }}>
                                        {bloque.inicio} - {bloque.fin}
                                    </td>
                                    {diasSemana.map((dia) => {
                                        const clases = Array.isArray(horarios) ? horarios.filter((h) => String(h?.dia).toUpperCase().trim() === dia && h?.hora_inicio === bloque.inicio) : [];
                                        return (
                                            <td
                                                key={dia}
                                                onDragOver={(e) => esAdmin && e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, dia, bloque)}
                                                onClick={(e) => {
                                                    if (clases.length === 0 && esAdmin && e.target === e.currentTarget) {
                                                        abrirCreacion(dia, bloque);
                                                    }
                                                }}
                                                style={{ border: '1px solid #cbd5e1', verticalAlign: 'top', padding: '0.3rem', backgroundColor: clases.length ? '#fff' : '#f8fafc', cursor: esAdmin && clases.length === 0 ? 'pointer' : 'default' }}
                                                title={esAdmin && clases.length === 0 ? "Haz clic para agregar clase aquí" : ""}
                                            >
                                                {clases.map((h) => {
                                                    const col = coloresCurso[h?.instrumento] || { bg: '#e2e8f0', border: '#64748b', text: '#0f172a' };
                                                    return (
                                                        <div
                                                            key={h?.id_horario}
                                                            draggable={esAdmin}
                                                            onDragStart={(e) => handleDragStart(e, h)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                abrirEdicion(h);
                                                            }}
                                                            style={{
                                                                backgroundColor: col.bg,
                                                                borderLeft: `4px solid ${col.border}`,
                                                                color: col.text,
                                                                padding: '0.4rem',
                                                                borderRadius: '4px',
                                                                cursor: esAdmin ? 'grab' : 'default',
                                                                marginBottom: '0.3rem',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>{h?.instrumento || 'Clase'}</span>
                                                                {esAdmin && <FaEdit style={{ fontSize: '0.7rem' }} />}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}><FaUserTie /> {h?.docente || 'Sin asignar'}</div>
                                                            <div style={{ fontSize: '0.75rem' }}><FaMapMarkerAlt /> {h?.aula || 'N/A'}</div>
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {modalAbierto && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '400px', color: '#fff' }}>
                        <h3 style={{ color: '#38bdf8', marginTop: 0 }}>
                            {modoEdicion ? 'Editar Clase y Docente' : 'Añadir Nueva Clase'}
                        </h3>
                        <form onSubmit={guardarModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Curso / Instrumento:</label>
                                <select value={formIdCurso} onChange={(e) => setFormIdCurso(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
                                    {Array.isArray(cursos) && cursos.map((c) => (
                                        <option key={c?.id_curso} value={c?.id_curso}>{c?.nombre_curso}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Docente Asignado:</label>
                                <select value={formIdDocente} onChange={(e) => setFormIdDocente(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
                                    {Array.isArray(docentes) && docentes.length > 0 ? (
                                        docentes.map((d) => (
                                            <option key={d?.id_usuario} value={d?.id_usuario}>
                                                {d?.nombre_completo || d?.docente}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No hay docentes disponibles</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Aula:</label>
                                <input type="text" value={formAula} onChange={(e) => setFormAula(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', boxSizing: 'border-box' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setModalAbierto(false)} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}