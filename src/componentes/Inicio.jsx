import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Inicio = () => {
    const nav = useNavigate();

    const [btnHover, setBtnHover] = useState(null);
    const [cardHover, setCardHover] = useState(null);

    const itemsMenu = [
        { id: 'inicio', nombre: 'Inicio', activo: true },
        { id: 'usuarios', nombre: 'Usuarios' },
        { id: 'horarios', nombre: 'Horarios' },
        { id: 'notas', nombre: 'Notas' },
        { id: 'reportes', nombre: 'Reportes' }
    ];

    const modulos = [
        {
            id: 'usuarios',
            titulo: 'Gestión de Usuarios',
            desc: 'Administración de cuentas, asignación de roles y control de accesos al sistema.'
        },
        {
            id: 'horarios',
            titulo: 'Gestión de Horarios',
            desc: 'Consulta y asignación de clases programadas, distribución de aulas y horarios'
        },
        {
            id: 'notas',
            titulo: 'Notas',
            desc: 'Supervisión general del rendimiento, estado académico general y control de evaluaciones por docente.'
        },
        {
            id: 'reportes',
            titulo: 'Reportes Administrativos',
            desc: 'Generación de reportes ejecutivos de asistencia, estados generales para la toma de decisiones.'
        }
    ];

    const s = {
        inicio: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflowY: 'auto',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            padding: 0,
            color: '#ffffff',
            boxSizing: 'border-box'
        },
        navbar: {
            backgroundColor: '#1e293b',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
        },
        logosec: {
            display: 'flex',
            flexDirection: 'column'
        },
        logoTitulo: {
            margin: 0,
            fontSize: '20px',
            color: '#38bdf8'
        },
        logoSub: {
            fontSize: '11px',
            color: '#94a3b8'
        },
        menu: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
        },
        btnlink: {
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            fontSize: '14px',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s ease-in-out'
        },
        btnact: {
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 'bold'
        },
        uinfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        rolBadge: {
            fontSize: '13px',
            color: '#38bdf8',
            backgroundColor: '#0f172a',
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #0284c7',
            fontWeight: 'bold'
        },
        btnsalir: {
            backgroundColor: '#e11d48',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
        },
        banner: {
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '35px 20px',
            textAlign: 'center',
            borderBottom: '1px solid #334155',
            width: '100%',
            boxSizing: 'border-box'
        },
        bannertxtH1: {
            marginTop: 0,
            fontSize: '26px',
            color: '#f8fafc'
        },
        bannertxtP: {
            color: '#94a3b8',
            fontSize: '15px',
            maxWidth: '600px',
            margin: '10px auto 0 auto'
        },
        content: {
            maxWidth: '950px',
            margin: '30px auto',
            padding: '0 20px',
            flex: 1,
            width: '100%',
            boxSizing: 'border-box'
        },
        contentH3: {
            color: '#38bdf8',
            borderBottom: '2px solid #0284c7',
            paddingBottom: '8px',
            marginBottom: '25px',
            textAlign: 'center'
        },
        gridc: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            alignItems: 'start'
        },
        card: {
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80px',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        },
        cardH4: {
            margin: 0,
            color: '#38bdf8',
            fontSize: '17px',
            transition: 'color 0.2s ease'
        },
        cardP: {
            fontSize: '13px',
            color: '#cbd5e1',
            lineHeight: '1.4',
            margin: 0,
            transition: 'all 0.3s ease'
        },
        footer: {
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            textAlign: 'center',
            padding: '12px',
            fontSize: '12px',
            color: '#64748b',
            marginTop: 'auto',
            width: '100%',
            boxSizing: 'border-box'
        }
    };

    return (
        <div style={s.inicio}>
            <header style={s.navbar}>
                <div style={s.logosec}>
                    <h2 style={s.logoTitulo}>ACADEMIA JAIME GALLARDO</h2>
                    <span style={s.logoSub}>Gestión Administrativa</span>
                </div>

                <nav style={s.menu}>
                    {itemsMenu.map((item) => {
                        const estaHover = btnHover === item.id;
                        const esActivo = item.activo;

                        let estiloBoton = { ...s.btnlink };

                        if (esActivo) {
                            estiloBoton = { ...estiloBoton, ...s.btnact };
                        }

                        if (estaHover && !esActivo) {
                            estiloBoton = {
                                ...estiloBoton,
                                fontSize: '15px',
                                color: '#38bdf8',
                                transform: 'scale(1.05)'
                            };
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={(e) => e.preventDefault()}
                                onMouseEnter={() => setBtnHover(item.id)}
                                onMouseLeave={() => setBtnHover(null)}
                                style={estiloBoton}
                            >
                                {item.nombre}
                            </button>
                        );
                    })}
                </nav>

                <div style={s.uinfo}>
                    <span style={s.rolBadge}>Director</span>
                    <button onClick={() => nav('/')} style={s.btnsalir}>Cerrar sesión</button>
                </div>
            </header>

            <section style={s.banner}>
                <div>
                    <h1 style={s.bannertxtH1}>Bienvenido a la Academia Jaime Gallardo</h1>
                    <p style={s.bannertxtP}>Plataforma para el seguimiento académico y control directivo.</p>
                </div>
            </section>

            <main style={s.content}>
                <h3 style={s.contentH3}>Módulos del Sistema</h3>

                <div style={s.gridc}>
                    {modulos.map((mod) => {
                        const estaHover = cardHover === mod.id;

                        const estiloTarjeta = {
                            ...s.card,
                            borderColor: estaHover ? '#38bdf8' : '#334155',
                            transform: estaHover ? 'scale(1.03)' : 'scale(1)',
                            minHeight: estaHover ? '150px' : '80px',
                            backgroundColor: estaHover ? '#24334a' : '#1e293b',
                            boxShadow: estaHover ? '0 8px 16px rgba(56, 189, 248, 0.2)' : '0 4px 6px rgba(0,0,0,0.2)'
                        };

                        return (
                            <div
                                key={mod.id}
                                style={estiloTarjeta}
                                onMouseEnter={() => setCardHover(mod.id)}
                                onMouseLeave={() => setCardHover(null)}
                                onClick={(e) => e.preventDefault()}
                            >
                                <h4 style={{ ...s.cardH4, color: estaHover ? '#7dd3fc' : '#38bdf8', marginBottom: estaHover ? '12px' : '0px' }}>
                                    {mod.titulo}
                                </h4>

                                <div
                                    style={{
                                        maxHeight: estaHover ? '100px' : '0px',
                                        opacity: estaHover ? 1 : 0,
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease-in-out'
                                    }}
                                >
                                    <p style={s.cardP}>
                                        {mod.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <footer style={s.footer}>
                <p style={{ margin: '2px 0' }}>Academia Jaime Gallardo - La Paz Bolivia</p>

            </footer>
        </div>
    );
};

export default Inicio;