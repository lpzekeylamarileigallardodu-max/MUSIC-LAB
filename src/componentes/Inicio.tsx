import React, { useState } from 'react';
import Navbar from './Navbar';
import { obtenerSesion } from '../services/userService';

interface ModuloInfo {
    id: string;
    nom: string;
    desc: string;
}

export default function Inicio() {
    const ses = obtenerSesion();
    const r = ses?.rol ?? '';
    const [activeId, setActiveId] = useState<string | null>(null);

    const getModulosPorRol = (): ModuloInfo[] => {
        if (r === 'DIRECTOR') {
            return [
                {
                    id: 'mod_usuarios',
                    nom: 'Gestión de Usuarios',
                    desc: 'Administración de cuentas, asignación de roles y control de acceso del personal y estudiantes.'
                },
                {
                    id: 'mod_horarios',
                    nom: 'Horarios',
                    desc: 'Planificación, asignación de aulas y programación de horarios para los cursos académicos.'
                },
                {
                    id: 'mod_notas',
                    nom: 'Notas',
                    desc: 'Supervisión general del registro de calificaciones y rendimiento académico global.'
                },
                {
                    id: 'mod_reportes',
                    nom: 'Reportes Administrativos',
                    desc: 'Generación de estadísticas, informes institucionales y métricas de desempeño.'
                }
            ];
        } else if (r === 'DOCENTE') {
            return [
                {
                    id: 'mod_horarios',
                    nom: 'Horarios',
                    desc: 'Consulta de la programación de clases, aulas asignadas y horarios docentes.'
                },
                {
                    id: 'mod_notas',
                    nom: 'Notas',
                    desc: 'Registro, modificación y evaluación de las calificaciones de las materias asignadas.'
                }
            ];
        } else if (r === 'ESTUDIANTE') {
            return [
                {
                    id: 'mod_horarios',
                    nom: 'Horarios',
                    desc: 'Consulta de horarios de clases, materias inscritas y asignación de aulas.'
                },
                {
                    id: 'mod_notas',
                    nom: 'Notas',
                    desc: 'Consulta de calificaciones personales, boletines de notas y seguimiento académico.'
                }
            ];
        }
        return [];
    };

    const mods = getModulosPorRol();

    return (
        <div style={st.wrapPage}>
            <Navbar />

            <main style={st.mainCont}>
                <h2 style={st.tituloHead}>
                    Bienvenido a la Academia Jaime Gallardo
                </h2>
                <p style={st.subHead}>
                    Plataforma para el seguimiento académico y control directivo.
                </p>

                <h3 style={st.subBarra}>
                    Módulos del Sistema
                </h3>

                <div style={st.gridCards}>
                    {mods.map((m) => {
                        const isHovered = activeId === m.id;
                        return (
                            <div
                                key={m.id}
                                onMouseEnter={() => setActiveId(m.id)}
                                onMouseLeave={() => setActiveId(null)}
                                style={{
                                    ...st.card,
                                    borderColor: isHovered ? '#38bdf8' : '#334155',
                                    transform: isHovered ? 'translateY(-4px)' : 'none',
                                    boxShadow: isHovered ? '0 8px 20px -4px rgba(56, 189, 248, 0.25)' : 'none',
                                }}
                            >
                                <div style={st.cardNom}>{m.nom}</div>
                                <div
                                    style={{
                                        ...st.cardDescWrap,
                                        maxHeight: isHovered ? '100px' : '0px',
                                        opacity: isHovered ? 1 : 0,
                                        marginTop: isHovered ? '0.75rem' : '0px',
                                    }}
                                >
                                    <p style={st.cardDesc}>{m.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

const st: { [key: string]: React.CSSProperties } = {
    wrapPage: {
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
    },
    mainCont: {
        width: '100%',
        padding: '3rem 2rem',
        textAlign: 'center',
        color: '#ffffff',
        boxSizing: 'border-box',
    },
    tituloHead: {
        fontSize: '2.2rem',
        color: '#ffffff',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
    },
    subHead: {
        color: '#94a3b8',
        fontSize: '1.1rem',
        marginBottom: '3rem',
    },
    subBarra: {
        color: '#38bdf8',
        borderBottom: '1px solid #0284c7',
        paddingBottom: '0.6rem',
        maxWidth: '900px',
        margin: '0 auto 3rem auto',
        fontSize: '1.3rem',
    },
    gridCards: {
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    card: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '260px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.5s ease-in-out',
        boxSizing: 'border-box',
        cursor: 'pointer',
        overflow: 'hidden',
    },
    cardNom: {
        color: '#38bdf8',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardDescWrap: {
        transition: 'all 0.5s ease-in-out',
        overflow: 'hidden',
        width: '100%',
    },
    cardDesc: {
        color: '#cbd5e1',
        fontSize: '0.85rem',
        margin: 0,
        lineHeight: '1.4',
        textAlign: 'center',
    },
};