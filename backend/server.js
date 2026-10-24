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
        console.log('Conectado a PostgreSQL correctamente');
        client.release();
    })
    .catch((err) => {
        console.error('Error al conectar con PostgreSQL:', err.message);
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
        const resultado = await pool.query('SELECT id_curso, nombre_curso FROM curso ORDER BY nombre_curso ASC;');
        res.json(resultado.rows);
    } catch (error) {
        try {
            const resultadoAlt = await pool.query('SELECT * FROM curso;');
            res.json(resultadoAlt.rows.map(c => ({ id_curso: c.id_curso || c.id, nombre_curso: c.nombre_curso || c.nombre || c.descripcion })));
        } catch (errAlt) {
            console.error('Error al obtener cursos:', errAlt.message);
            res.status(500).json({ error: 'Error interno al obtener cursos' });
        }
    }
});

// OBTENER DOCENTES
app.get('/api/docentes', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT u.id_usuario, u.nombre_completo
            FROM usuario u
                     JOIN rol r ON u.id_rol = r.id_rol
            WHERE LOWER(r.nombre_rol) LIKE '%docente%'
               OR LOWER(r.nombre_rol) LIKE '%profesor%'
            ORDER BY u.nombre_completo ASC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener docentes:', error.message);
        res.status(500).json({ error: 'Error al obtener docentes' });
    }
});

// OBTENER HORARIOS
app.get('/api/horarios', async (req, res) => {
    try {
        const query = `
            SELECT
                h.id_horario,
                h.id_curso,
                c.nombre_curso AS instrumento,
                h.dia,
                h.aula,
                TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
                TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
                u.nombre_completo AS docente,
                u.id_usuario AS id_docente
            FROM horario h
                     JOIN curso c ON h.id_curso = c.id_curso
                     LEFT JOIN docente d ON c.id_usuario = d.id_usuario
                     LEFT JOIN usuario u ON d.id_usuario = u.id_usuario
            ORDER BY h.dia, h.hora_inicio;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener horarios:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// CREAR HORARIO
app.post('/api/horarios', async (req, res) => {
    const { id_curso, id_docente, dia, aula, hora_inicio, hora_fin } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (id_docente && id_curso) {
            await client.query('UPDATE curso SET id_usuario = $1 WHERE id_curso = $2', [id_docente, id_curso]);
        }

        const query = `
            INSERT INTO horario (id_curso, dia, aula, hora_inicio, hora_fin)
            VALUES ($1, $2, $3, $4, $5)
                RETURNING id_horario;
        `;
        const resultado = await client.query(query, [id_curso, dia, aula, hora_inicio, hora_fin]);

        await client.query('COMMIT');
        res.json({ ok: true, id_horario: resultado.rows[0].id_horario, mensaje: 'Horario creado exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear horario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al registrar el horario en la BD' });
    } finally {
        client.release();
    }
});

// ACTUALIZAR HORARIO
app.put('/api/horarios/:id', async (req, res) => {
    const { id } = req.params;
    const { id_curso, id_docente, dia, aula, hora_inicio, hora_fin } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (id_docente && id_curso) {
            await client.query('UPDATE curso SET id_usuario = $1 WHERE id_curso = $2', [id_docente, id_curso]);
        }

        const queryHorario = `
            UPDATE horario
            SET id_curso = COALESCE($1, id_curso),
                aula = COALESCE($2, aula),
                hora_inicio = COALESCE($3, hora_inicio),
                hora_fin = COALESCE($4, hora_fin),
                dia = COALESCE($5, dia)
            WHERE id_horario = $6;
        `;
        await client.query(queryHorario, [id_curso, aula, hora_inicio, hora_fin, dia, id]);

        await client.query('COMMIT');
        res.json({ ok: true, mensaje: 'Horario actualizado correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar horario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar horario en la BD' });
    } finally {
        client.release();
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

// OBTENER ASIGNATURAS UNICAS SIN DUPLICADOS
app.get('/api/mis-cursos', async (req, res) => {
    const { id_usuario, correo, rol } = req.query;

    try {
        let userId = id_usuario;

        if ((!userId || userId === 'undefined' || userId === 'null') && correo) {
            const userRes = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)', [correo]);
            if (userRes.rows.length > 0) {
                userId = userRes.rows[0].id_usuario;
            }
        }

        const rolUpper = String(rol || '').toUpperCase().trim();

        if (rolUpper.includes('ADMIN') || rolUpper.includes('DIRECTOR')) {
            const query = `
                SELECT DISTINCT c.id_curso, c.nombre_curso, c.descripcion, c.nivel, c.costo_mensual,
                                u.nombre_completo AS docente
                FROM curso c
                         LEFT JOIN docente d ON c.id_usuario = d.id_usuario
                         LEFT JOIN usuario u ON d.id_usuario = u.id_usuario
                ORDER BY c.nombre_curso ASC;
            `;
            const resultado = await pool.query(query);
            return res.json(resultado.rows);
        } else if (rolUpper.includes('DOCENTE')) {
            const query = `
                SELECT DISTINCT c.id_curso, c.nombre_curso, c.descripcion, c.nivel, c.costo_mensual,
                                u.nombre_completo AS docente
                FROM curso c
                         JOIN docente d ON c.id_usuario = d.id_usuario
                         JOIN usuario u ON d.id_usuario = u.id_usuario
                WHERE d.id_usuario = $1 OR LOWER(u.correo) = LOWER($2)
                ORDER BY c.nombre_curso ASC;
            `;
            const resultado = await pool.query(query, [userId || 0, correo || '']);
            return res.json(resultado.rows);
        } else {
            const query = `
                SELECT DISTINCT c.id_curso, c.nombre_curso, c.descripcion, c.nivel, c.costo_mensual,
                                u_doc.nombre_completo AS docente
                FROM inscripcion i
                         JOIN curso c ON i.id_curso = c.id_curso
                         LEFT JOIN docente d ON c.id_usuario = d.id_usuario
                         LEFT JOIN usuario u_doc ON d.id_usuario = u_doc.id_usuario
                         JOIN usuario u_est ON i.id_usuario = u_est.id_usuario
                WHERE (i.id_usuario = $1 OR LOWER(u_est.correo) = LOWER($2))
                ORDER BY c.nombre_curso ASC;
            `;
            const resultado = await pool.query(query, [userId || 0, correo || '']);
            return res.json(resultado.rows);
        }
    } catch (error) {
        console.error('Error al obtener mis cursos:', error.message);
        res.status(500).json({ error: 'Error al obtener mis cursos' });
    }
});

// OBTENER ESTUDIANTES INSCRITOS EN UN CURSO
app.get('/api/cursos/:id_curso/estudiantes', async (req, res) => {
    const { id_curso } = req.params;
    try {
        const query = `
            SELECT DISTINCT i.id_inscripcion, u.id_usuario, u.nombre_completo, u.correo, u.ci, i.fecha_inscripcion
            FROM inscripcion i
                     JOIN usuario u ON i.id_usuario = u.id_usuario
            WHERE i.id_curso = $1 AND (LOWER(i.estado_inscripcion) LIKE 'activ%' OR i.estado_inscripcion IS NULL)
            ORDER BY u.nombre_completo ASC;
        `;
        const resultado = await pool.query(query, [id_curso]);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener estudiantes del curso:', error.message);
        res.status(500).json({ error: 'Error al obtener estudiantes' });
    }
});

// OBTENER ASISTENCIA
app.get('/api/asistencia', async (req, res) => {
    const { id_curso, fecha } = req.query;
    try {
        const query = `
            SELECT a.id_asistencia, a.id_inscripcion, TO_CHAR(a.fecha, 'YYYY-MM-DD') AS fecha,
                   a.estado_asistencia, a.observacion
            FROM asistencia a
                     JOIN inscripcion i ON a.id_inscripcion = i.id_inscripcion
            WHERE i.id_curso = $1 AND a.fecha = $2;
        `;
        const resultado = await pool.query(query, [id_curso, fecha]);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener asistencias:', error.message);
        res.status(500).json({ error: 'Error al obtener asistencias' });
    }
});

// MARCAR ASISTENCIA
app.post('/api/asistencia', async (req, res) => {
    const { asistencias, fecha } = req.body;

    if (!Array.isArray(asistencias) || !fecha) {
        return res.status(400).json({ ok: false, mensaje: 'Datos insuficientes' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const ast of asistencias) {
            const query = `
                INSERT INTO asistencia (id_inscripcion, fecha, estado_asistencia, observacion)
                VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id_inscripcion, fecha) 
                DO UPDATE SET estado_asistencia = EXCLUDED.estado_asistencia,
                                           observacion = EXCLUDED.observacion;
            `;
            await client.query(query, [
                ast.id_inscripcion,
                fecha,
                ast.estado_asistencia || 'PRESENTE',
                ast.observacion || ''
            ]);
        }

        await client.query('COMMIT');
        res.json({ ok: true, mensaje: 'Asistencia registrada correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al guardar asistencia:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al guardar la asistencia' });
    } finally {
        client.release();
    }
});

// HISTORIAL PROPIO DE ASISTENCIA
app.get('/api/mi-asistencia', async (req, res) => {
    const { id_usuario, correo } = req.query;
    try {
        let userId = id_usuario;

        if ((!userId || userId === 'undefined') && correo) {
            const userRes = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)', [correo]);
            if (userRes.rows.length > 0) {
                userId = userRes.rows[0].id_usuario;
            }
        }

        const query = `
            SELECT a.id_asistencia, TO_CHAR(a.fecha, 'YYYY-MM-DD') AS fecha,
                   a.estado_asistencia, a.observacion, c.nombre_curso
            FROM asistencia a
                     JOIN inscripcion i ON a.id_inscripcion = i.id_inscripcion
                     JOIN curso c ON i.id_curso = c.id_curso
            WHERE i.id_usuario = $1 OR LOWER((SELECT correo FROM usuario WHERE id_usuario = i.id_usuario)) = LOWER($2)
            ORDER BY a.fecha DESC;
        `;
        const resultado = await pool.query(query, [userId || 0, correo || '']);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener mi asistencia:', error.message);
        res.status(500).json({ error: 'Error al obtener asistencia' });
    }
});

// OBTENER EVALUACIONES (NOTAS) DE UN CURSO
app.get('/api/evaluaciones', async (req, res) => {
    const { id_curso, titulo } = req.query;
    try {
        const query = `
            SELECT e.id_evaluacion, i.id_inscripcion, e.titulo, e.nota, e.observacion,
                   TO_CHAR(e.fecha, 'YYYY-MM-DD') AS fecha
            FROM evaluacion e
                     JOIN inscripcion i ON e.id_inscripcion = i.id_inscripcion
            WHERE i.id_curso = $1 AND ($2::text IS NULL OR e.titulo = $2);
        `;
        const resultado = await pool.query(query, [id_curso, titulo || null]);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener evaluaciones:', error.message);
        res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
});

// REGISTRAR / ACTUALIZAR NOTAS (MANEJO ROBUSTO PARA UPDATE / INSERT)
app.post('/api/evaluaciones', async (req, res) => {
    const { notas, titulo } = req.body;

    if (!Array.isArray(notas) || !titulo) {
        return res.status(400).json({ ok: false, mensaje: 'Datos insuficientes' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const item of notas) {
            const notaValida = Math.min(Math.max(parseFloat(item.nota) || 0, 0), 100);

            try {
                const queryUpsert = `
                    INSERT INTO evaluacion (id_inscripcion, titulo, nota, observacion)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id_inscripcion, titulo) 
                    DO UPDATE SET nota = EXCLUDED.nota,
                                  observacion = EXCLUDED.observacion,
                                  fecha = CURRENT_TIMESTAMP;
                `;
                await client.query(queryUpsert, [
                    item.id_inscripcion,
                    titulo,
                    notaValida,
                    item.observacion || ''
                ]);
            } catch (errConflict) {
                const check = await client.query(
                    `SELECT id_evaluacion FROM evaluacion WHERE id_inscripcion = $1 AND titulo = $2`,
                    [item.id_inscripcion, titulo]
                );

                if (check.rows.length > 0) {
                    await client.query(
                        `UPDATE evaluacion
                         SET nota = $1, observacion = $2, fecha = CURRENT_TIMESTAMP
                         WHERE id_evaluacion = $3`,
                        [notaValida, item.observacion || '', check.rows[0].id_evaluacion]
                    );
                } else {
                    await client.query(
                        `INSERT INTO evaluacion (id_inscripcion, titulo, nota, observacion)
                         VALUES ($1, $2, $3, $4)`,
                        [item.id_inscripcion, titulo, notaValida, item.observacion || '']
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ ok: true, mensaje: 'Notas registradas correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al guardar notas:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al guardar las notas: ' + error.message });
    } finally {
        client.release();
    }
});

// BOLETÍN DE NOTAS PERSONAL (ESTUDIANTE)
app.get('/api/mis-notas', async (req, res) => {
    const { id_usuario, correo } = req.query;
    try {
        let userId = id_usuario;

        if ((!userId || userId === 'undefined') && correo) {
            const userRes = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)', [correo]);
            if (userRes.rows.length > 0) {
                userId = userRes.rows[0].id_usuario;
            }
        }

        const query = `
            SELECT e.id_evaluacion, e.titulo, e.nota, e.observacion,
                   TO_CHAR(e.fecha, 'YYYY-MM-DD') AS fecha, c.nombre_curso
            FROM evaluacion e
                     JOIN inscripcion i ON e.id_inscripcion = i.id_inscripcion
                     JOIN curso c ON i.id_curso = c.id_curso
                     JOIN usuario u ON i.id_usuario = u.id_usuario
            WHERE u.id_usuario = $1 OR LOWER(u.correo) = LOWER($2)
            ORDER BY c.nombre_curso ASC, e.fecha DESC;
        `;
        const resultado = await pool.query(query, [userId || 0, correo || '']);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener mis notas:', error.message);
        res.status(500).json({ error: 'Error al obtener notas' });
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