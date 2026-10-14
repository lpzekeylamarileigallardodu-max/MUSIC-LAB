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

// LOGIN
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

// OBTENER CURSOS DISPONIBLES
app.get('/api/cursos', async (req, res) => {
    try {
        // Intentar consultar usando nombres estándar de columnas de cursos
        const resultado = await pool.query('SELECT id_curso, nombre_curso FROM curso ORDER BY nombre_curso ASC;');
        res.json(resultado.rows);
    } catch (error) {
        try {
            // Plan B por si la columna se llama diferente en tu BD
            const resultadoAlt = await pool.query('SELECT * FROM curso;');
            res.json(resultadoAlt.rows.map(c => ({ id_curso: c.id_curso || c.id, nombre_curso: c.nombre_curso || c.nombre || c.descripcion })));
        } catch (errAlt) {
            console.error('Error al obtener cursos:', errAlt.message);
            res.status(500).json({ error: 'Error interno al obtener cursos' });
        }
    }
});

// OBTENER USUARIOS
app.get('/api/usuarios', async (req, res) => {
    try {
        const query = `
            SELECT
                u.id_usuario AS id,
                u.nombre_completo AS nombre,
                u.correo,
                u.ci,
                r.nombre_rol AS rol,
                u.id_rol,
                c.id_curso,
                COALESCE(c.nombre_curso, 'Dirección / Cátedra') AS instrumento
            FROM usuario u
                     JOIN rol r ON u.id_rol = r.id_rol
                     LEFT JOIN inscripcion i ON u.id_usuario = i.id_usuario
                     LEFT JOIN curso c ON i.id_curso = c.id_curso
            ORDER BY u.id_usuario ASC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// CREAR USUARIO NUEVO
app.post('/api/usuarios', async (req, res) => {
    const { nombre, correo, contrasena, ci, id_rol, id_curso } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const passHash = contrasena ? await bcrypt.hash(contrasena, 10) : await bcrypt.hash('clave123', 10);

        const query = `
            INSERT INTO usuario (id_rol, nombre_completo, nombres, ci, correo, contrasena)
            VALUES ($1, $2, $2, $3, $4, $5)
                RETURNING id_usuario AS id, nombre_completo AS nombre, correo;
        `;
        const resUser = await client.query(query, [id_rol || 3, nombre, ci || '0000000', correo, passHash]);
        const nuevoUser = resUser.rows[0];

        const rolNum = parseInt(id_rol);
        if (rolNum === 2) {
            await client.query('INSERT INTO docente (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING', [nuevoUser.id]);
        } else if (rolNum === 3) {
            await client.query('INSERT INTO estudiante (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING', [nuevoUser.id]);
            if (id_curso) {
                await client.query(
                    `INSERT INTO inscripcion (id_usuario, id_curso) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [nuevoUser.id, id_curso]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ ok: true, usuario: nuevoUser });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear usuario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al crear usuario en la BD: ' + error.message });
    } finally {
        client.release();
    }
});

// EDITAR USUARIO
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, id_rol, ci, id_curso } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Actualizar datos básicos (actualizando tanto nombre_completo como nombres para que se refleje en tu BD)
        const queryUsuario = `
            UPDATE usuario
            SET nombre_completo = $1, nombres = $1, correo = $2, id_rol = $3, ci = COALESCE(NULLIF($4, ''), ci)
            WHERE id_usuario = $5;
        `;
        await client.query(queryUsuario, [nombre, correo, id_rol, ci, id]);

        const rolNum = parseInt(id_rol);

        if (rolNum === 2) {
            await client.query('INSERT INTO docente (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING', [id]);
            await client.query(`DELETE FROM inscripcion WHERE id_usuario = $1`, [id]);
        } else if (rolNum === 3) {
            await client.query('INSERT INTO estudiante (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING', [id]);

            // Actualizar el curso/instrumento en la tabla inscripcion
            if (id_curso) {
                await client.query(`DELETE FROM inscripcion WHERE id_usuario = $1`, [id]);
                await client.query(
                    `INSERT INTO inscripcion (id_usuario, id_curso) VALUES ($1, $2)`,
                    [id, id_curso]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ ok: true, mensaje: 'Usuario actualizado correctamente en la base de datos' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar usuario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al editar usuario en la BD: ' + error.message });
    } finally {
        client.release();
    }
});

// ELIMINAR USUARIO
app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM inscripcion WHERE id_usuario = $1', [id]);
        await client.query('DELETE FROM docente WHERE id_usuario = $1', [id]);
        await client.query('DELETE FROM estudiante WHERE id_usuario = $1', [id]);
        await client.query('DELETE FROM usuario WHERE id_usuario = $1', [id]);
        await client.query('COMMIT');
        res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar usuario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'No se puede eliminar el usuario porque tiene registros asociados.' });
    } finally {
        client.release();
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ ok: true, mensaje: 'Backend funcionando' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});