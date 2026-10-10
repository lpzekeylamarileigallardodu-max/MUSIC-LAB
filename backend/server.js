import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academia_jaime_gallardo',
});

pool
    .connect()
    .then((client) => {
        console.log('✅ Conectado a PostgreSQL correctamente');
        client.release();
    })
    .catch((err) => {
        console.error(' Error al conectar con PostgreSQL:', err.message);
    });

app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ ok: false, mensaje: 'Correo y contraseña son obligatorios' });
    }

    try {
        const consulta = `
            SELECT u.id_usuario, u.nombre_completo, u.correo, u.contrasena, r.nombre_rol
            FROM usuario u
            JOIN rol r ON r.id_rol = u.id_rol
            WHERE lower(trim(u.correo)) = lower(trim($1))
        `;
        const resultado = await pool.query(consulta, [correo]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos' });
        }

        const usuario = resultado.rows[0];
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos' });
        }

        return res.json({
            ok: true,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.nombre_rol,
            },
        });
    } catch (error) {
        console.error('Error en /api/login:', error.message);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ ok: true, mensaje: 'Backend funcionando' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});