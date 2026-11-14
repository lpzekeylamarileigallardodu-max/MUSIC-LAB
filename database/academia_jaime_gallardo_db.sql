-- ============================================================
-- ACADEMIA JAIME GALLARDO - BASE DE DATOS (PostgreSQL)
-- Roles: ADMINISTRATIVO (DIRECTOR / SECRETARIA / RECEPCIONISTA),
--        DOCENTE, ESTUDIANTE, INVITADO
-- Estado ACTIVO / INACTIVO en usuario, curso, horario y aula
-- Incluye: aulas, cuotas, prospectos, inventario de instrumentos,
--          bitácora, recuperación de contraseña, material de apoyo
--          y eventos.
--
-- ⚠ SOLO PARA DESARROLLO: los DROP TABLE ... CASCADE de abajo borran
--   todos los datos cada vez que se ejecuta el script.
--
-- Para empezar de cero (conectado a la base 'postgres', con el backend apagado):
--   DROP DATABASE IF EXISTS academia_jaime_gallardo WITH (FORCE);
--   CREATE DATABASE academia_jaime_gallardo ENCODING 'UTF8';
-- Luego abre una consulta sobre academia_jaime_gallardo y ejecuta este script completo.
--
-- CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR
--   1) bcrypt con costo 10 (el mismo que usa Spring Security por defecto).
--   2) Días de la semana SIN tilde (MIERCOLES, SABADO); el backend usa
--      un enum DayOfWeek. Se simplificó el trigger de choque de horario.
--   3) transaccion.id_usuario = quién verificó/registró el pago. Solo puede
--      ser NULL mientras la transacción está PENDIENTE (a la espera de que
--      la secretaria revise el comprobante).
--   4) Pago con el QR fijo de la academia + verificación manual del
--      comprobante: nro_comprobante (único, evita reutilizar un comprobante),
--      url_comprobante, monto_recibido y fecha_confirmacion.
--   5) Se eliminó el trigger de bitácora de usuario: la bitácora la
--      registra el backend (puerto/adaptador de auditoría).
--   6) Las cuotas VENCIDA del ejemplo usan CURRENT_DATE. En el backend,
--      una tarea @Scheduled actualizará cuotas VENCIDA y préstamos
--      ATRASADO.
--   7) Rol INVITADO: quien se registra en la web queda como INVITADO y pasa a
--      ESTUDIANTE cuando la academia lo inscribe (el backend cambia el rol y
--      crea su fila en estudiante).
--   8) prospecto.id_usuario_registro y clase_prueba.id_usuario_registro aceptan
--      NULL: las solicitudes hechas desde la web no las registra un administrativo.
--
-- NOTA DE DISEÑO: los triggers de abajo son una segunda línea de defensa.
-- La validación principal de las reglas de negocio debe estar en el
-- dominio (Java); el backend traduce los errores de PostgreSQL a
-- mensajes claros.
-- ============================================================

DROP TABLE IF EXISTS participacion_evento CASCADE;
DROP TABLE IF EXISTS evento               CASCADE;
DROP TABLE IF EXISTS material_apoyo       CASCADE;
DROP TABLE IF EXISTS token_recuperacion   CASCADE;
DROP TABLE IF EXISTS bitacora             CASCADE;
DROP TABLE IF EXISTS prestamo_instrumento CASCADE;
DROP TABLE IF EXISTS instrumento          CASCADE;
DROP TABLE IF EXISTS clase_prueba         CASCADE;
DROP TABLE IF EXISTS prospecto            CASCADE;
DROP TABLE IF EXISTS evaluacion           CASCADE;
DROP TABLE IF EXISTS asistencia           CASCADE;
DROP TABLE IF EXISTS transaccion          CASCADE;
DROP TABLE IF EXISTS pago                 CASCADE;
DROP TABLE IF EXISTS cuota                CASCADE;
DROP TABLE IF EXISTS inscripcion          CASCADE;
DROP TABLE IF EXISTS horario              CASCADE;
DROP TABLE IF EXISTS aula                 CASCADE;
DROP TABLE IF EXISTS curso                CASCADE;
DROP TABLE IF EXISTS estudiante           CASCADE;
DROP TABLE IF EXISTS docente              CASCADE;
DROP TABLE IF EXISTS administrativo       CASCADE;
DROP TABLE IF EXISTS usuario              CASCADE;
DROP TABLE IF EXISTS rol                  CASCADE;

DROP FUNCTION IF EXISTS fn_validar_rol_docente();
DROP FUNCTION IF EXISTS fn_validar_rol_estudiante();
DROP FUNCTION IF EXISTS fn_validar_rol_administrativo();
DROP FUNCTION IF EXISTS fn_validar_inscripcion_activa();
DROP FUNCTION IF EXISTS fn_validar_choque_horario();
DROP FUNCTION IF EXISTS fn_validar_prestamo_disponible();
DROP FUNCTION IF EXISTS fn_sync_estado_instrumento();
DROP FUNCTION IF EXISTS fn_validar_material_docente();
DROP FUNCTION IF EXISTS fn_validar_aprobador_evento();
DROP FUNCTION IF EXISTS fn_bitacora_usuario_activo();   -- ya no se usa (versión anterior)

-- pgcrypto: permite generar y verificar hashes bcrypt para las contraseñas
-- (sin pgcrypto: las claves de ejemplo van ya hasheadas con bcrypt costo 10 = 'clave123')

-- ============================================================
-- ROL Y USUARIO
-- ============================================================

CREATE TABLE rol (
    id_rol     SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuario (
    id_usuario      SERIAL PRIMARY KEY,
    id_rol          INTEGER      NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    nombres         VARCHAR(100),
    ap_pat          VARCHAR(50),
    ap_mat          VARCHAR(50),
    ci              VARCHAR(20)  NOT NULL UNIQUE,
    direccion       VARCHAR(200),
    correo          VARCHAR(150) NOT NULL UNIQUE,
    telefono        VARCHAR(30),
    contrasena      VARCHAR(255) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,   -- TRUE = activo, FALSE = inactivo
    fecha_registro  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_usuario_correo
        CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

    CONSTRAINT chk_usuario_telefono
        CHECK (telefono IS NULL OR telefono ~ '^[0-9+() -]{6,30}$')
);

-- ============================================================
-- TABLAS POR TIPO DE USUARIO
-- ============================================================

CREATE TABLE administrativo (
    id_usuario INTEGER PRIMARY KEY,
    cargo      VARCHAR(30) NOT NULL,

    CONSTRAINT fk_administrativo_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT chk_administrativo_cargo
        CHECK (cargo IN ('DIRECTOR','SECRETARIA','RECEPCIONISTA'))
);

CREATE TABLE docente (
    id_usuario INTEGER PRIMARY KEY,

    CONSTRAINT fk_docente_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE estudiante (
    id_usuario INTEGER PRIMARY KEY,

    CONSTRAINT fk_estudiante_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

-- ============================================================
-- CURSOS, AULAS Y HORARIOS
-- ============================================================

CREATE TABLE curso (
    id_curso      SERIAL PRIMARY KEY,
    id_usuario    INTEGER      NOT NULL,              -- docente que dicta el curso
    nombre_curso  VARCHAR(100) NOT NULL,
    descripcion   TEXT,
    costo_mensual NUMERIC(10,2),
    nivel         VARCHAR(50),
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_curso_docente
        FOREIGN KEY (id_usuario)
        REFERENCES docente(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_curso_costo
        CHECK (costo_mensual IS NULL OR costo_mensual >= 0)
);

CREATE TABLE aula (
    id_aula     SERIAL PRIMARY KEY,
    nombre_aula VARCHAR(50) NOT NULL UNIQUE,
    capacidad   INTEGER,
    activo      BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_aula_capacidad
        CHECK (capacidad IS NULL OR capacidad > 0)
);

-- El día se guarda en MAYÚSCULAS y SIN TILDE (coincide con el enum de Java).
CREATE TABLE horario (
    id_horario  SERIAL PRIMARY KEY,
    id_curso    INTEGER     NOT NULL,
    id_aula     INTEGER     NOT NULL,
    dia         VARCHAR(10) NOT NULL,
    hora_inicio TIME        NOT NULL,
    hora_fin    TIME        NOT NULL,
    activo      BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_horario_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON DELETE CASCADE,

    CONSTRAINT fk_horario_aula
        FOREIGN KEY (id_aula)
        REFERENCES aula(id_aula)
        ON DELETE RESTRICT,

    CONSTRAINT chk_horario_horas
        CHECK (hora_fin > hora_inicio),

    CONSTRAINT chk_horario_dia
        CHECK (dia IN ('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO')),

    CONSTRAINT uq_horario_curso_dia_inicio
        UNIQUE (id_curso, dia, hora_inicio)
);

-- ============================================================
-- INSCRIPCIÓN (MATRÍCULA)
-- ============================================================

CREATE TABLE inscripcion (
    id_inscripcion     SERIAL PRIMARY KEY,
    id_usuario         INTEGER     NOT NULL,
    id_curso           INTEGER     NOT NULL,
    estado_inscripcion VARCHAR(30) NOT NULL DEFAULT 'ACTIVA',
    fecha_inscripcion  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inscripcion_estudiante
        FOREIGN KEY (id_usuario)
        REFERENCES estudiante(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inscripcion_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON DELETE RESTRICT,

    CONSTRAINT uq_inscripcion_estudiante_curso
        UNIQUE (id_usuario, id_curso),

    CONSTRAINT uq_inscripcion_id_usuario
        UNIQUE (id_inscripcion, id_usuario),

    CONSTRAINT chk_inscripcion_estado
        CHECK (estado_inscripcion IN ('ACTIVA','INACTIVA','RETIRADA','FINALIZADA'))
);

-- ============================================================
-- CUOTAS (mensualidades que debe cada inscripción)
-- Permite saber quién está al día, quién debe y qué meses.
-- ============================================================

CREATE TABLE cuota (
    id_cuota          SERIAL PRIMARY KEY,
    id_inscripcion    INTEGER       NOT NULL,
    mes               SMALLINT      NOT NULL,
    anio              SMALLINT      NOT NULL,
    monto             NUMERIC(10,2) NOT NULL,
    fecha_vencimiento DATE          NOT NULL,
    estado_cuota      VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT fk_cuota_inscripcion
        FOREIGN KEY (id_inscripcion)
        REFERENCES inscripcion(id_inscripcion)
        ON DELETE CASCADE,

    CONSTRAINT uq_cuota_inscripcion_mes
        UNIQUE (id_inscripcion, mes, anio),

    CONSTRAINT chk_cuota_mes
        CHECK (mes BETWEEN 1 AND 12),

    CONSTRAINT chk_cuota_monto
        CHECK (monto >= 0),

    CONSTRAINT chk_cuota_estado
        CHECK (estado_cuota IN ('PENDIENTE','PAGADA','VENCIDA','ANULADA'))
);

-- ============================================================
-- PAGOS Y TRANSACCIONES
-- ============================================================

CREATE TABLE pago (
    id_pago        SERIAL PRIMARY KEY,
    id_usuario     INTEGER       NOT NULL,
    id_inscripcion INTEGER       NOT NULL,
    id_cuota       INTEGER,                      -- cuota que cubre este pago
    monto_total    NUMERIC(10,2) NOT NULL,
    fecha_pago     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concepto       VARCHAR(150),

    CONSTRAINT fk_pago_estudiante
        FOREIGN KEY (id_usuario)
        REFERENCES estudiante(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pago_inscripcion
        FOREIGN KEY (id_inscripcion, id_usuario)
        REFERENCES inscripcion(id_inscripcion, id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_pago_cuota
        FOREIGN KEY (id_cuota)
        REFERENCES cuota(id_cuota)
        ON DELETE SET NULL,

    CONSTRAINT uq_pago_cuota
        UNIQUE (id_cuota),

    CONSTRAINT chk_pago_monto
        CHECK (monto_total >= 0)
);

-- Detalle de cada intento de cobro de un pago.
-- Un pago puede tener varias transacciones (ej.: un comprobante rechazado y luego otro válido).
--
-- FLUJO DE PAGO CON EL QR FIJO DE LA ACADEMIA (verificación manual):
--   1) El estudiante paga escaneando el QR de la academia (el mismo para todos,
--      generado en el banco) y escribe su nombre o CI en la glosa.
--   2) Muestra el comprobante a secretaría (o lo sube desde la web): se crea
--      una transaccion PENDIENTE con nro_comprobante y, si lo subió, url_comprobante.
--   3) La secretaria verifica en la app o estado de cuenta del banco que el
--      depósito exista y que el monto coincida con la cuota.
--   4) Si todo está bien: transaccion APROBADA y cuota PAGADA (en una sola
--      transacción de base de datos). Si no: RECHAZADA con su codigo_error.
CREATE TABLE transaccion (
    id_transaccion     SERIAL PRIMARY KEY,
    id_pago            INTEGER      NOT NULL,
    id_usuario         INTEGER,                        -- quién la verificó/registró; NULL solo si está PENDIENTE
    fecha_hora         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago        VARCHAR(50)  NOT NULL,
    estado_transaccion VARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE',
    codigo_error       VARCHAR(50),
    observaciones      TEXT,
    nro_comprobante    VARCHAR(100) UNIQUE,            -- nro de operación del banco (evita usar el mismo comprobante dos veces)
    url_comprobante    VARCHAR(500),                   -- foto o captura del comprobante, si se guardó
    monto_recibido     NUMERIC(10,2),                  -- monto que verificó la secretaria
    fecha_confirmacion TIMESTAMP(3),                   -- cuándo se aprobó

    CONSTRAINT fk_transaccion_pago
        FOREIGN KEY (id_pago)
        REFERENCES pago(id_pago)
        ON DELETE CASCADE,

    CONSTRAINT fk_transaccion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transaccion_estado
        CHECK (estado_transaccion IN ('PENDIENTE','APROBADA','RECHAZADA','ANULADA')),

    CONSTRAINT chk_transaccion_metodo
        CHECK (metodo_pago IN ('EFECTIVO','QR','TRANSFERENCIA','TARJETA')),

    CONSTRAINT chk_transaccion_error
        CHECK (
            (estado_transaccion = 'RECHAZADA' AND codigo_error IS NOT NULL)
            OR (estado_transaccion <> 'RECHAZADA')
        ),

    -- Toda decisión (aprobar, rechazar, anular) la toma una persona de la academia
    CONSTRAINT chk_transaccion_procesador
        CHECK (estado_transaccion = 'PENDIENTE' OR id_usuario IS NOT NULL),

    -- Un pago por QR aprobado debe tener el número de comprobante del banco
    CONSTRAINT chk_transaccion_qr_comprobante
        CHECK (NOT (metodo_pago = 'QR' AND estado_transaccion = 'APROBADA')
               OR nro_comprobante IS NOT NULL),

    CONSTRAINT chk_transaccion_monto_recibido
        CHECK (monto_recibido IS NULL OR monto_recibido >= 0)
);

-- ============================================================
-- ASISTENCIA Y EVALUACIÓN
-- ============================================================

CREATE TABLE asistencia (
    id_asistencia     SERIAL PRIMARY KEY,
    id_inscripcion    INTEGER     NOT NULL,
    fecha             DATE        NOT NULL,
    observacion       TEXT,
    estado_asistencia VARCHAR(30) NOT NULL,

    CONSTRAINT fk_asistencia_inscripcion
        FOREIGN KEY (id_inscripcion)
        REFERENCES inscripcion(id_inscripcion)
        ON DELETE CASCADE,

    CONSTRAINT uq_asistencia_inscripcion_fecha
        UNIQUE (id_inscripcion, fecha),

    CONSTRAINT chk_asistencia_estado
        CHECK (estado_asistencia IN ('PRESENTE','AUSENTE','TARDANZA','LICENCIA'))
);

CREATE TABLE evaluacion (
    id_evaluacion     SERIAL PRIMARY KEY,
    id_inscripcion    INTEGER      NOT NULL,
    nombre_evaluacion VARCHAR(100) NOT NULL,
    nota              NUMERIC(5,2),
    fecha_evaluacion  DATE,
    comentario        TEXT,

    CONSTRAINT fk_evaluacion_inscripcion
        FOREIGN KEY (id_inscripcion)
        REFERENCES inscripcion(id_inscripcion)
        ON DELETE CASCADE,

    CONSTRAINT chk_nota
        CHECK (nota IS NULL OR (nota >= 0 AND nota <= 100))
);

-- ============================================================
-- PROSPECTOS Y CLASES DE PRUEBA (funciones de la recepcionista)
-- ============================================================

CREATE TABLE prospecto (
    id_prospecto        SERIAL PRIMARY KEY,
    nombre_completo     VARCHAR(150) NOT NULL,
    telefono            VARCHAR(30),
    correo              VARCHAR(150),
    instrumento_interes VARCHAR(100),
    estado_prospecto    VARCHAR(30)  NOT NULL DEFAULT 'NUEVO',
    observaciones       TEXT,
    fecha_registro      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro INTEGER,                 -- administrativo que lo registró (NULL = solicitud desde la web)

    CONSTRAINT fk_prospecto_administrativo
        FOREIGN KEY (id_usuario_registro)
        REFERENCES administrativo(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_prospecto_estado
        CHECK (estado_prospecto IN ('NUEVO','CONTACTADO','MATRICULADO','DESCARTADO'))
);

CREATE TABLE clase_prueba (
    id_clase_prueba     SERIAL PRIMARY KEY,
    id_prospecto        INTEGER      NOT NULL,
    id_curso            INTEGER      NOT NULL,
    fecha_hora          TIMESTAMP    NOT NULL,
    estado_clase        VARCHAR(30)  NOT NULL DEFAULT 'PROGRAMADA',
    observaciones       TEXT,
    id_usuario_registro INTEGER,                 -- NULL = solicitud desde la web

    CONSTRAINT fk_clase_prueba_prospecto
        FOREIGN KEY (id_prospecto)
        REFERENCES prospecto(id_prospecto)
        ON DELETE CASCADE,

    CONSTRAINT fk_clase_prueba_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON DELETE RESTRICT,

    CONSTRAINT fk_clase_prueba_administrativo
        FOREIGN KEY (id_usuario_registro)
        REFERENCES administrativo(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_clase_prueba_estado
        CHECK (estado_clase IN ('PROGRAMADA','REALIZADA','CANCELADA','NO_ASISTIO'))
);

-- ============================================================
-- INVENTARIO: INSTRUMENTOS Y PRÉSTAMOS
-- ============================================================

CREATE TABLE instrumento (
    id_instrumento      SERIAL PRIMARY KEY,
    codigo_inventario   VARCHAR(30)  NOT NULL UNIQUE,
    nombre_instrumento  VARCHAR(100) NOT NULL,
    tipo_instrumento    VARCHAR(50),               -- cuerda, teclado, percusión, etc.
    marca               VARCHAR(50),
    fecha_adquisicion   DATE,
    estado_instrumento  VARCHAR(30)  NOT NULL DEFAULT 'DISPONIBLE',
    observaciones       TEXT,

    CONSTRAINT chk_instrumento_estado
        CHECK (estado_instrumento IN ('DISPONIBLE','PRESTADO','EN_MANTENIMIENTO','DADO_DE_BAJA'))
);

CREATE TABLE prestamo_instrumento (
    id_prestamo               SERIAL PRIMARY KEY,
    id_instrumento            INTEGER      NOT NULL,
    id_usuario_prestatario    INTEGER      NOT NULL,   -- estudiante o docente que lo recibe
    id_usuario_registro       INTEGER      NOT NULL,   -- administrativo que registró el préstamo
    fecha_prestamo            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_prevista DATE         NOT NULL,
    fecha_devolucion_real     TIMESTAMP(3),
    estado_prestamo           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    observaciones             TEXT,

    CONSTRAINT fk_prestamo_instrumento
        FOREIGN KEY (id_instrumento)
        REFERENCES instrumento(id_instrumento)
        ON DELETE RESTRICT,

    CONSTRAINT fk_prestamo_prestatario
        FOREIGN KEY (id_usuario_prestatario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_prestamo_registro
        FOREIGN KEY (id_usuario_registro)
        REFERENCES administrativo(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_prestamo_estado
        CHECK (estado_prestamo IN ('ACTIVO','DEVUELTO','ATRASADO','PERDIDO')),

    CONSTRAINT chk_prestamo_devolucion
        CHECK (estado_prestamo <> 'DEVUELTO' OR fecha_devolucion_real IS NOT NULL),

    CONSTRAINT chk_prestamo_fechas
        CHECK (fecha_devolucion_real IS NULL OR fecha_devolucion_real >= fecha_prestamo)
);

-- ============================================================
-- BITÁCORA (AUDITORÍA) Y RECUPERACIÓN DE CONTRASEÑA
-- La bitácora la registra el backend (no hay trigger).
-- ============================================================

CREATE TABLE bitacora (
    id_bitacora    BIGSERIAL PRIMARY KEY,
    id_usuario     INTEGER,                         -- quién hizo la acción (NULL si se desconoce)
    accion         VARCHAR(30)  NOT NULL,
    tabla_afectada VARCHAR(50),
    id_registro    VARCHAR(50),
    descripcion    TEXT,
    ip_origen      VARCHAR(45),
    fecha_hora     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_bitacora_accion
        CHECK (accion IN ('LOGIN','LOGOUT','LOGIN_FALLIDO','CREAR','ACTUALIZAR',
                          'ELIMINAR','ACTIVAR','DESACTIVAR','ANULAR'))
);

-- Se guarda el HASH del token, nunca el token en texto plano.
CREATE TABLE token_recuperacion (
    id_token         SERIAL PRIMARY KEY,
    id_usuario       INTEGER      NOT NULL,
    token_hash       VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP(3) NOT NULL,
    usado            BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_uso        TIMESTAMP(3),

    CONSTRAINT fk_token_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT chk_token_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT chk_token_uso
        CHECK (usado = TRUE OR fecha_uso IS NULL)
);

-- ============================================================
-- MATERIAL DE APOYO (lo sube el docente de cada curso)
-- Se guarda la ruta o URL del archivo, no el archivo en sí.
-- ============================================================

CREATE TABLE material_apoyo (
    id_material   SERIAL PRIMARY KEY,
    id_curso      INTEGER      NOT NULL,
    id_usuario    INTEGER      NOT NULL,               -- docente que lo subió
    titulo        VARCHAR(150) NOT NULL,
    descripcion   TEXT,
    tipo_material VARCHAR(20)  NOT NULL,
    url_archivo   VARCHAR(500) NOT NULL,
    fecha_subida  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_material_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id_curso)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_docente
        FOREIGN KEY (id_usuario)
        REFERENCES docente(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_material_tipo
        CHECK (tipo_material IN ('PARTITURA','GUIA','AUDIO','VIDEO','ENLACE','OTRO'))
);

-- ============================================================
-- EVENTOS Y PARTICIPACIÓN
-- Los eventos los propone cualquier usuario y los aprueba el director.
-- ============================================================

CREATE TABLE evento (
    id_evento              SERIAL PRIMARY KEY,
    nombre_evento          VARCHAR(150) NOT NULL,
    descripcion            TEXT,
    tipo_evento            VARCHAR(20)  NOT NULL,
    fecha_hora_inicio      TIMESTAMP    NOT NULL,
    fecha_hora_fin         TIMESTAMP,
    id_aula                INTEGER,                    -- si es dentro de la academia
    lugar_externo          VARCHAR(150),               -- si es fuera de la academia
    estado_evento          VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    id_usuario_creador     INTEGER      NOT NULL,
    id_usuario_aprobador   INTEGER,                    -- debe ser DIRECTOR
    fecha_aprobacion       TIMESTAMP(3),

    CONSTRAINT fk_evento_aula
        FOREIGN KEY (id_aula)
        REFERENCES aula(id_aula)
        ON DELETE SET NULL,

    CONSTRAINT fk_evento_creador
        FOREIGN KEY (id_usuario_creador)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_evento_aprobador
        FOREIGN KEY (id_usuario_aprobador)
        REFERENCES administrativo(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_evento_tipo
        CHECK (tipo_evento IN ('RECITAL','CONCIERTO','TALLER','AUDICION','OTRO')),

    CONSTRAINT chk_evento_estado
        CHECK (estado_evento IN ('PENDIENTE','APROBADO','REALIZADO','CANCELADO')),

    CONSTRAINT chk_evento_fechas
        CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin > fecha_hora_inicio),

    CONSTRAINT chk_evento_aprobacion
        CHECK (estado_evento IN ('PENDIENTE','CANCELADO') OR id_usuario_aprobador IS NOT NULL)
);

CREATE TABLE participacion_evento (
    id_participacion     SERIAL PRIMARY KEY,
    id_evento            INTEGER      NOT NULL,
    id_usuario           INTEGER      NOT NULL,        -- estudiante o docente
    rol_participacion    VARCHAR(30)  NOT NULL,
    detalle              VARCHAR(200),                 -- ej.: pieza que interpreta
    estado_participacion VARCHAR(20)  NOT NULL DEFAULT 'INSCRITO',

    CONSTRAINT fk_participacion_evento
        FOREIGN KEY (id_evento)
        REFERENCES evento(id_evento)
        ON DELETE CASCADE,

    CONSTRAINT fk_participacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT uq_participacion_evento_usuario
        UNIQUE (id_evento, id_usuario),

    CONSTRAINT chk_participacion_rol
        CHECK (rol_participacion IN ('INTERPRETE','DOCENTE_A_CARGO','ACOMPANANTE','ASISTENTE')),

    CONSTRAINT chk_participacion_estado
        CHECK (estado_participacion IN ('INSCRITO','CONFIRMADO','CANCELADO','ASISTIO'))
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_usuario_rol          ON usuario(id_rol);
CREATE INDEX idx_usuario_activo       ON usuario(activo);
CREATE INDEX idx_curso_docente        ON curso(id_usuario);
CREATE INDEX idx_curso_activo         ON curso(activo);
CREATE INDEX idx_horario_curso        ON horario(id_curso);
CREATE INDEX idx_horario_aula         ON horario(id_aula);
CREATE INDEX idx_inscripcion_curso    ON inscripcion(id_curso);
CREATE INDEX idx_cuota_inscripcion    ON cuota(id_inscripcion);
CREATE INDEX idx_cuota_estado         ON cuota(estado_cuota);
CREATE INDEX idx_pago_inscripcion     ON pago(id_inscripcion);
CREATE INDEX idx_pago_usuario         ON pago(id_usuario);
CREATE INDEX idx_evaluacion_inscrip   ON evaluacion(id_inscripcion);
CREATE INDEX idx_transaccion_pago     ON transaccion(id_pago);
CREATE INDEX idx_transaccion_usuario  ON transaccion(id_usuario);
CREATE INDEX idx_transaccion_estado   ON transaccion(estado_transaccion);
CREATE INDEX idx_prospecto_estado     ON prospecto(estado_prospecto);
CREATE INDEX idx_clase_prueba_fecha   ON clase_prueba(fecha_hora);
CREATE INDEX idx_instrumento_estado   ON instrumento(estado_instrumento);
CREATE INDEX idx_prestamo_instrumento ON prestamo_instrumento(id_instrumento);
CREATE INDEX idx_prestamo_prestatario ON prestamo_instrumento(id_usuario_prestatario);
CREATE INDEX idx_bitacora_usuario     ON bitacora(id_usuario);
CREATE INDEX idx_bitacora_fecha       ON bitacora(fecha_hora);
CREATE INDEX idx_token_usuario        ON token_recuperacion(id_usuario);
CREATE INDEX idx_material_curso       ON material_apoyo(id_curso);
CREATE INDEX idx_evento_fecha         ON evento(fecha_hora_inicio);
CREATE INDEX idx_participacion_usuario ON participacion_evento(id_usuario);

-- Un instrumento solo puede tener UN préstamo vigente a la vez
CREATE UNIQUE INDEX uq_prestamo_vigente
    ON prestamo_instrumento(id_instrumento)
    WHERE estado_prestamo IN ('ACTIVO','ATRASADO');

-- ============================================================
-- TRIGGERS: validar que el usuario tenga el rol correcto
-- ============================================================

CREATE FUNCTION fn_validar_rol_administrativo()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = NEW.id_usuario
          AND r.nombre_rol = 'ADMINISTRATIVO'
    ) THEN
        RAISE EXCEPTION 'El usuario % no tiene el rol ADMINISTRATIVO', NEW.id_usuario;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_administrativo_rol
    BEFORE INSERT OR UPDATE ON administrativo
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_administrativo();

CREATE FUNCTION fn_validar_rol_docente()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = NEW.id_usuario
          AND r.nombre_rol = 'DOCENTE'
    ) THEN
        RAISE EXCEPTION 'El usuario % no tiene el rol DOCENTE', NEW.id_usuario;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_docente_rol
    BEFORE INSERT OR UPDATE ON docente
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_docente();

CREATE FUNCTION fn_validar_rol_estudiante()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = NEW.id_usuario
          AND r.nombre_rol = 'ESTUDIANTE'
    ) THEN
        RAISE EXCEPTION 'El usuario % no tiene el rol ESTUDIANTE', NEW.id_usuario;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estudiante_rol
    BEFORE INSERT OR UPDATE ON estudiante
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_estudiante();

-- ============================================================
-- TRIGGERS: reglas de negocio
-- ============================================================

-- Solo se puede inscribir (INSERT) a un estudiante activo en un curso activo
CREATE FUNCTION fn_validar_inscripcion_activa()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = NEW.id_usuario AND activo = TRUE) THEN
        RAISE EXCEPTION 'El estudiante % está inactivo y no puede inscribirse', NEW.id_usuario;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM curso WHERE id_curso = NEW.id_curso AND activo = TRUE) THEN
        RAISE EXCEPTION 'El curso % está inactivo y no admite inscripciones', NEW.id_curso;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inscripcion_activa
    BEFORE INSERT ON inscripcion
    FOR EACH ROW EXECUTE FUNCTION fn_validar_inscripcion_activa();

-- Evita choques de horario: mismo aula o mismo docente, mismo día, horas que se cruzan
CREATE FUNCTION fn_validar_choque_horario()
RETURNS TRIGGER AS $$
DECLARE
    v_docente INTEGER;
BEGIN
    IF NEW.activo = FALSE THEN
        RETURN NEW;
    END IF;

    SELECT id_usuario INTO v_docente FROM curso WHERE id_curso = NEW.id_curso;

    -- Choque de aula
    IF EXISTS (
        SELECT 1
        FROM horario h
        WHERE h.id_horario <> COALESCE(NEW.id_horario, -1)
          AND h.activo = TRUE
          AND h.id_aula = NEW.id_aula
          AND h.dia = NEW.dia
          AND h.hora_inicio < NEW.hora_fin
          AND h.hora_fin    > NEW.hora_inicio
    ) THEN
        RAISE EXCEPTION 'El aula % ya está ocupada el % en ese horario', NEW.id_aula, NEW.dia;
    END IF;

    -- Choque de docente
    IF EXISTS (
        SELECT 1
        FROM horario h
        JOIN curso c ON c.id_curso = h.id_curso
        WHERE h.id_horario <> COALESCE(NEW.id_horario, -1)
          AND h.activo = TRUE
          AND c.id_usuario = v_docente
          AND h.dia = NEW.dia
          AND h.hora_inicio < NEW.hora_fin
          AND h.hora_fin    > NEW.hora_inicio
    ) THEN
        RAISE EXCEPTION 'El docente % ya tiene otra clase el % en ese horario', v_docente, NEW.dia;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_horario_choque
    BEFORE INSERT OR UPDATE ON horario
    FOR EACH ROW EXECUTE FUNCTION fn_validar_choque_horario();

-- Solo se presta un instrumento que esté DISPONIBLE
CREATE FUNCTION fn_validar_prestamo_disponible()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_prestamo IN ('ACTIVO','ATRASADO') AND NOT EXISTS (
        SELECT 1 FROM instrumento
        WHERE id_instrumento = NEW.id_instrumento
          AND estado_instrumento = 'DISPONIBLE'
    ) THEN
        RAISE EXCEPTION 'El instrumento % no está disponible para préstamo', NEW.id_instrumento;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prestamo_disponible
    BEFORE INSERT ON prestamo_instrumento
    FOR EACH ROW EXECUTE FUNCTION fn_validar_prestamo_disponible();

-- Mantiene sincronizado el estado del instrumento con su préstamo
CREATE FUNCTION fn_sync_estado_instrumento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_prestamo IN ('ACTIVO','ATRASADO') THEN
        UPDATE instrumento SET estado_instrumento = 'PRESTADO'
        WHERE id_instrumento = NEW.id_instrumento;
    ELSIF NEW.estado_prestamo = 'DEVUELTO' THEN
        UPDATE instrumento SET estado_instrumento = 'DISPONIBLE'
        WHERE id_instrumento = NEW.id_instrumento
          AND estado_instrumento = 'PRESTADO';
    ELSIF NEW.estado_prestamo = 'PERDIDO' THEN
        UPDATE instrumento SET estado_instrumento = 'DADO_DE_BAJA'
        WHERE id_instrumento = NEW.id_instrumento;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prestamo_sync_instrumento
    AFTER INSERT OR UPDATE OF estado_prestamo ON prestamo_instrumento
    FOR EACH ROW EXECUTE FUNCTION fn_sync_estado_instrumento();

-- El material solo lo puede subir el docente que dicta ese curso
CREATE FUNCTION fn_validar_material_docente()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM curso
        WHERE id_curso = NEW.id_curso
          AND id_usuario = NEW.id_usuario
    ) THEN
        RAISE EXCEPTION 'El docente % no dicta el curso %', NEW.id_usuario, NEW.id_curso;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_material_docente
    BEFORE INSERT OR UPDATE ON material_apoyo
    FOR EACH ROW EXECUTE FUNCTION fn_validar_material_docente();

-- Solo el DIRECTOR puede aprobar eventos
CREATE FUNCTION fn_validar_aprobador_evento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id_usuario_aprobador IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM administrativo
        WHERE id_usuario = NEW.id_usuario_aprobador
          AND cargo = 'DIRECTOR'
    ) THEN
        RAISE EXCEPTION 'Solo el DIRECTOR puede aprobar eventos (usuario %)', NEW.id_usuario_aprobador;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evento_aprobador
    BEFORE INSERT OR UPDATE ON evento
    FOR EACH ROW EXECUTE FUNCTION fn_validar_aprobador_evento();

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

INSERT INTO rol (nombre_rol)
VALUES
    ('ADMINISTRATIVO'),
    ('DOCENTE'),
    ('ESTUDIANTE'),
    ('INVITADO');

-- Las contraseñas se guardan encriptadas con bcrypt (costo 10, compatible con
-- BCryptPasswordEncoder de Spring Security). El texto plano 'clave123' nunca
-- queda almacenado; solo su hash.
INSERT INTO usuario (id_usuario, id_rol, nombre_completo, nombres, ap_pat, ap_mat, ci, direccion, correo, contrasena)
VALUES
    -- Administrativos
    (1,  1, 'Carlos Mamani Quispe',     'Carlos',   'Mamani',   'Quispe',   '4567890', 'Av. Arce 1234, La Paz',           'admin@academiajaimegallardo.com',          '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (13, 1, 'Rosa Choque Villca',       'Rosa',     'Choque',   'Villca',   '4678901', 'Calle Murillo 210, La Paz',       'secretaria@academiajaimegallardo.com',     '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (14, 1, 'Paola Condori Mamani',     'Paola',    'Condori',  'Mamani',   '4789012', 'Av. 6 de Agosto 950, La Paz',     'recepcion@academiajaimegallardo.com',      '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    -- Docentes
    (2,  2, 'Lucía Fernández Rojas',    'Lucía',    'Fernández','Rojas',    '5123456', 'Calle Sucre 456, La Paz',         'lucia.fernandez@academiajaimegallardo.com','$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (3,  2, 'Marco Vargas Choque',      'Marco',    'Vargas',   'Choque',   '5234567', 'Av. Camacho 789, La Paz',         'marco.vargas@academiajaimegallardo.com',   '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (4,  2, 'Andrea Salinas Peña',      'Andrea',   'Salinas',  'Peña',     '5345678', 'Calle Comercio 321, La Paz',      'andrea.salinas@academiajaimegallardo.com', '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    -- Estudiantes
    (5,  3, 'Diego Torrez Condori',     'Diego',    'Torrez',   'Condori',  '9012345', 'Zona Sopocachi, Calle Rosendo Gutiérrez 12', 'diego.torrez@correo.com',    '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (6,  3, 'Valeria Gutiérrez Apaza',  'Valeria',  'Gutiérrez','Apaza',    '9123456', 'Zona Miraflores, Av. Busch 55',   'valeria.gutierrez@correo.com','$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (7,  3, 'Sebastián Flores Mendoza', 'Sebastián','Flores',   'Mendoza',  '9234567', 'Zona Sur, Calle 21 de Calacoto 8','sebastian.flores@correo.com', '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (8,  3, 'Camila Ríos Huanca',       'Camila',   'Ríos',     'Huanca',   '9345678', 'Zona Obrajes, Calle 3 Nro 100',   'camila.rios@correo.com',      '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (9,  3, 'Mateo Cussi Limachi',      'Mateo',    'Cussi',    'Limachi',  '9456789', 'Zona San Pedro, Calle Loayza 77', 'mateo.cussi@correo.com',      '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (10, 3, 'Fernanda Ayala Nina',      'Fernanda', 'Ayala',    'Nina',     '9567890', 'Zona Villa Fátima, Av. Las Américas 9', 'fernanda.ayala@correo.com', '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (11, 3, 'Joaquín Paredes Lima',     'Joaquín',  'Paredes',  'Lima',     '9678901', 'Zona Achumani, Calle 12 Nro 45',  'joaquin.paredes@correo.com',  '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    (12, 3, 'Daniela Bustillos Cruz',   'Daniela',  'Bustillos','Cruz',     '9789012', 'Zona Calacoto, Calle 15 Nro 30',  'daniela.bustillos@correo.com','$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS'),
    -- Invitado (se registró en la web y todavía no está inscrito)
    (15, 4, 'Lucas Mendoza Arce',      'Lucas',    'Mendoza',   'Arce',      '9890123', 'Zona Sopocachi, Calle Belisario Salinas 40', 'invitado@correo.com', '$2a$10$Gof00OtBPkdFm9pC2I/16.hpfeYuotTwq6yi8yK9V84eCBlzjTACS');

-- Teléfonos de ejemplo
UPDATE usuario u
SET telefono = t.tel
FROM (VALUES
    (1,  '+591 70100001'),
    (13, '+591 70100002'),
    (14, '+591 70100003'),
    (2,  '+591 71200001'),
    (3,  '+591 71200002'),
    (4,  '+591 71200003'),
    (5,  '+591 72300001'),
    (6,  '+591 72300002'),
    (7,  '+591 72300003'),
    (8,  '+591 72300004'),
    (9,  '+591 72300005'),
    (10, '+591 72300006'),
    (11, '+591 72300007'),
    (12, '+591 72300008')
) AS t(id, tel)
WHERE u.id_usuario = t.id;

INSERT INTO administrativo (id_usuario, cargo)
VALUES
    (1,  'DIRECTOR'),
    (13, 'SECRETARIA'),
    (14, 'RECEPCIONISTA');

INSERT INTO docente (id_usuario) VALUES (2), (3), (4);

INSERT INTO estudiante (id_usuario) VALUES (5), (6), (7), (8), (9), (10), (11), (12);

INSERT INTO curso (id_curso, id_usuario, nombre_curso, descripcion, costo_mensual, nivel)
VALUES
    (1, 2, 'Guitarra Básico',        'Acordes, ritmo y primeras canciones en guitarra acústica.', 150.00, 'BÁSICO'),
    (2, 2, 'Guitarra Intermedio',    'Escalas, punteos y técnicas de rasgueo avanzadas.',          180.00, 'INTERMEDIO'),
    (3, 3, 'Piano Inicial',          'Lectura de partitura y técnica básica de piano.',            200.00, 'BÁSICO'),
    (4, 3, 'Piano Avanzado',         'Repertorio clásico y popular, improvisación.',               220.00, 'AVANZADO'),
    (5, 4, 'Canto y Técnica Vocal',  'Respiración, afinación y proyección de la voz.',             170.00, 'BÁSICO'),
    (6, 4, 'Batería Básico',         'Coordinación, ritmos básicos y lectura rítmica.',            160.00, 'BÁSICO');

INSERT INTO aula (id_aula, nombre_aula, capacidad)
VALUES
    (1, 'Aula 1',    8),
    (2, 'Aula 2',    6),
    (3, 'Aula 3',    10),
    (4, 'Aula 4',    5),
    (5, 'Auditorio', 80);

-- Nota: el sábado de Batería Básico está a las 08:00 para no chocar
-- con Canto (misma docente, sábado 10:00). Días sin tilde.
INSERT INTO horario (id_curso, id_aula, dia, hora_inicio, hora_fin)
VALUES
    (1, 1, 'LUNES',     '15:00', '16:30'),
    (1, 1, 'MIERCOLES', '15:00', '16:30'),
    (2, 1, 'MARTES',    '17:00', '18:30'),
    (2, 1, 'JUEVES',    '17:00', '18:30'),
    (3, 2, 'LUNES',     '16:00', '17:30'),
    (3, 2, 'VIERNES',   '16:00', '17:30'),
    (4, 2, 'MARTES',    '18:00', '19:30'),
    (4, 2, 'JUEVES',    '18:00', '19:30'),
    (5, 3, 'MIERCOLES', '17:00', '18:30'),
    (5, 3, 'SABADO',    '10:00', '11:30'),
    (6, 4, 'MARTES',    '15:00', '16:30'),
    (6, 4, 'SABADO',    '08:00', '09:30');

INSERT INTO inscripcion (id_inscripcion, id_usuario, id_curso, estado_inscripcion, fecha_inscripcion)
VALUES
    (1,  5,  1, 'ACTIVA',     '2026-08-01 09:12:05.120'),
    (2,  5,  3, 'ACTIVA',     '2026-08-01 09:18:47.340'),
    (3,  6,  1, 'ACTIVA',     '2026-08-02 10:05:33.812'),
    (4,  7,  2, 'ACTIVA',     '2026-08-03 11:40:21.004'),
    (5,  7,  5, 'ACTIVA',     '2026-08-03 11:45:02.550'),
    (6,  8,  3, 'ACTIVA',     '2026-08-04 08:55:10.233'),
    (7,  9,  4, 'ACTIVA',     '2026-08-04 09:30:44.901'),
    (8,  10, 5, 'ACTIVA',     '2026-08-05 14:02:18.670'),
    (9,  10, 6, 'ACTIVA',     '2026-08-05 14:10:52.015'),
    (10, 11, 1, 'ACTIVA',     '2026-08-06 16:25:39.480'),
    (11, 11, 6, 'ACTIVA',     '2026-08-06 16:33:07.264'),
    (12, 12, 2, 'ACTIVA',     '2026-08-07 10:15:00.000'),
    (13, 12, 3, 'INACTIVA',   '2026-08-07 10:20:46.712'),
    (14, 8,  5, 'RETIRADA',   '2026-08-08 12:48:29.390');

INSERT INTO pago (id_pago, id_usuario, id_inscripcion, monto_total, fecha_pago, concepto)
VALUES
    (1,  5,  1,  150.00, '2026-08-05 09:00:12.500', 'Mensualidad agosto - Guitarra Básico'),
    (2,  5,  1,  150.00, '2026-09-05 09:03:47.210', 'Mensualidad septiembre - Guitarra Básico'),
    (3,  5,  2,  200.00, '2026-08-06 10:15:30.880', 'Mensualidad agosto - Piano Inicial'),
    (4,  5,  2,  200.00, '2026-09-06 10:20:05.045', 'Mensualidad septiembre - Piano Inicial'),
    (5,  6,  3,  150.00, '2026-08-05 11:10:00.330', 'Mensualidad agosto - Guitarra Básico'),
    (6,  6,  3,  150.00, '2026-09-05 11:12:41.670', 'Mensualidad septiembre - Guitarra Básico'),
    (7,  7,  4,  180.00, '2026-08-07 08:45:22.900', 'Mensualidad agosto - Guitarra Intermedio'),
    (8,  7,  5,  170.00, '2026-08-07 08:50:11.150', 'Mensualidad agosto - Canto y Técnica Vocal'),
    (9,  8,  6,  200.00, '2026-08-08 13:30:05.400', 'Mensualidad agosto - Piano Inicial'),
    (10, 9,  7,  220.00, '2026-08-08 14:02:48.760', 'Mensualidad agosto - Piano Avanzado'),
    (11, 10, 8,  170.00, '2026-08-09 09:20:33.610', 'Mensualidad agosto - Canto y Técnica Vocal'),
    (12, 10, 9,  160.00, '2026-08-09 09:25:14.095', 'Mensualidad agosto - Batería Básico'),
    (13, 11, 10, 150.00, '2026-08-10 15:40:52.330', 'Mensualidad agosto - Guitarra Básico'),
    (14, 11, 11, 160.00, '2026-09-10 15:44:03.220', 'Mensualidad septiembre - Batería Básico'),
    (15, 12, 12, 180.00, '2026-08-11 12:05:17.880', 'Mensualidad agosto - Guitarra Intermedio'),
    (16, 12, 13, 200.00, '2026-08-11 12:10:40.015', 'Mensualidad agosto - Piano Inicial');

-- Cada pago tiene al menos una transacción.
--  * id_usuario = quien verificó o registró: secretaria (13) o director (1).
--  * Los pagos por QR llevan el nro_comprobante del banco y la foto del comprobante.
--  * El comprobante del pago 6 se rechazó (monto incorrecto) y se pagó en ventanilla.
--  * Pendientes de ejemplo: la del pago 4 (transferencia por confirmar) y la del
--    pago 14 (comprobante enviado por el estudiante que nadie revisó: sin id_usuario).
-- El orden de inserción importa: el id 18 de la bitácora de ejemplo apunta a la última.
INSERT INTO transaccion (id_pago, id_usuario, fecha_hora, metodo_pago, estado_transaccion, codigo_error, observaciones, nro_comprobante, url_comprobante)
VALUES
    (1,  13,   '2026-08-05 09:00:12.500', 'EFECTIVO',      'APROBADA', NULL,               'Pago recibido en caja.',                          NULL,               NULL),
    (2,  13,   '2026-09-05 09:03:47.210', 'QR',            'APROBADA', NULL,               'Comprobante verificado en la app del banco.',     'QR-20260905-0001', '/comprobantes/2026/09/pago-2.jpg'),
    (3,  13,   '2026-08-06 10:15:30.880', 'TRANSFERENCIA', 'APROBADA', NULL,               'Verificado con comprobante bancario.',            NULL,               NULL),
    (4,  13,   '2026-09-06 10:20:05.045', 'TRANSFERENCIA', 'PENDIENTE',NULL,               'A la espera de confirmación del banco.',          NULL,               NULL),
    (5,  13,   '2026-08-05 11:10:00.330', 'EFECTIVO',      'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (6,  13,   '2026-09-05 10:40:55.500', 'QR',            'RECHAZADA','MONTO_INCORRECTO', 'El comprobante muestra Bs 100; la cuota es Bs 150.', 'QR-20260905-0002', '/comprobantes/2026/09/pago-6.jpg'),
    (6,  13,   '2026-09-05 11:12:41.670', 'EFECTIVO',      'PENDIENTE',NULL,               'Reintento en ventanilla.',                        NULL,               NULL),
    (7,  13,   '2026-08-07 08:45:22.900', 'TRANSFERENCIA', 'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (8,  13,   '2026-08-07 08:50:11.150', 'TRANSFERENCIA', 'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (9,  13,   '2026-08-08 13:30:05.400', 'QR',            'APROBADA', NULL,               NULL,                                              'QR-20260808-0001', '/comprobantes/2026/08/pago-9.jpg'),
    (10, 13,   '2026-08-08 14:02:48.760', 'EFECTIVO',      'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (11, 13,   '2026-08-09 09:20:33.610', 'EFECTIVO',      'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (12, 13,   '2026-08-09 09:25:14.095', 'EFECTIVO',      'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (13, 13,   '2026-08-10 15:40:52.330', 'QR',            'APROBADA', NULL,               NULL,                                              'QR-20260810-0001', '/comprobantes/2026/08/pago-13.jpg'),
    (14, NULL, '2026-09-10 15:44:03.220', 'QR',            'PENDIENTE',NULL,               'Comprobante enviado por el estudiante; falta revisar.', 'QR-20260910-0001', '/comprobantes/2026/09/pago-14.jpg'),
    (15, 13,   '2026-08-11 12:05:17.880', 'TRANSFERENCIA', 'APROBADA', NULL,               NULL,                                              NULL,               NULL),
    (16, 13,   '2026-08-11 12:10:40.015', 'TRANSFERENCIA', 'APROBADA', NULL,               'Pago registrado por secretaría.',                 NULL,               NULL),
    (16, 1,    '2026-08-20 17:00:00.000', 'TRANSFERENCIA', 'ANULADA',  NULL,               'Estudiante canceló la inscripción; el director anula el pago.', NULL, NULL);

-- Para las transacciones aprobadas: monto recibido = monto del pago y fecha de confirmación
UPDATE transaccion t
SET monto_recibido     = p.monto_total,
    fecha_confirmacion = t.fecha_hora
FROM pago p
WHERE p.id_pago = t.id_pago
  AND t.estado_transaccion = 'APROBADA';

-- ---------- CUOTAS ----------
-- Cuotas de agosto, septiembre y octubre 2026 para cada inscripción ACTIVA.
-- Vencen el día 20 de cada mes.
INSERT INTO cuota (id_inscripcion, mes, anio, monto, fecha_vencimiento)
SELECT i.id_inscripcion, m.mes, 2026, c.costo_mensual, make_date(2026, m.mes, 20)
FROM inscripcion i
JOIN curso c ON c.id_curso = i.id_curso
CROSS JOIN (VALUES (8), (9), (10)) AS m(mes)
WHERE i.estado_inscripcion = 'ACTIVA';

-- Cuota de la inscripción inactiva (su pago fue anulado)
INSERT INTO cuota (id_inscripcion, mes, anio, monto, fecha_vencimiento, estado_cuota)
VALUES (13, 8, 2026, 200.00, '2026-08-20', 'ANULADA');

-- Enlazar cada pago con su cuota (mismo mes y año del pago)
UPDATE pago p
SET id_cuota = c.id_cuota
FROM cuota c
WHERE c.id_inscripcion = p.id_inscripcion
  AND c.mes  = EXTRACT(MONTH FROM p.fecha_pago)::INT
  AND c.anio = EXTRACT(YEAR  FROM p.fecha_pago)::INT;

-- Cuotas con al menos una transacción APROBADA pasan a PAGADA
UPDATE cuota
SET estado_cuota = 'PAGADA'
WHERE estado_cuota = 'PENDIENTE'
  AND id_cuota IN (
      SELECT p.id_cuota
      FROM pago p
      JOIN transaccion t ON t.id_pago = p.id_pago
      WHERE p.id_cuota IS NOT NULL
        AND t.estado_transaccion = 'APROBADA'
  );

-- Cuotas sin pagar con fecha de vencimiento ya pasada.
-- (En el backend lo hará una tarea programada todos los días.)
UPDATE cuota
SET estado_cuota = 'VENCIDA'
WHERE estado_cuota = 'PENDIENTE'
  AND fecha_vencimiento < CURRENT_DATE;

INSERT INTO asistencia (id_inscripcion, fecha, observacion, estado_asistencia)
VALUES
    (1, '2026-09-07', NULL,                          'PRESENTE'),
    (1, '2026-09-09', NULL,                          'PRESENTE'),
    (1, '2026-09-14', 'Llegó 10 minutos tarde',      'TARDANZA'),
    (1, '2026-09-16', NULL,                          'PRESENTE'),
    (2, '2026-09-07', NULL,                          'PRESENTE'),
    (2, '2026-09-11', 'Faltó por enfermedad',        'LICENCIA'),
    (2, '2026-09-14', NULL,                          'PRESENTE'),
    (3, '2026-09-07', NULL,                          'PRESENTE'),
    (3, '2026-09-09', 'No avisó',                    'AUSENTE'),
    (3, '2026-09-14', NULL,                          'PRESENTE'),
    (4, '2026-09-08', NULL,                          'PRESENTE'),
    (4, '2026-09-10', NULL,                          'PRESENTE'),
    (4, '2026-09-15', NULL,                          'PRESENTE'),
    (5, '2026-09-09', NULL,                          'PRESENTE'),
    (5, '2026-09-12', 'Llegó tarde por transporte',  'TARDANZA'),
    (6, '2026-09-07', NULL,                          'PRESENTE'),
    (6, '2026-09-11', NULL,                          'PRESENTE'),
    (7, '2026-09-08', NULL,                          'PRESENTE'),
    (7, '2026-09-10', NULL,                          'PRESENTE'),
    (8, '2026-09-09', NULL,                          'AUSENTE'),
    (8, '2026-09-12', NULL,                          'PRESENTE'),
    (9, '2026-09-08', NULL,                          'PRESENTE'),
    (9, '2026-09-12', NULL,                          'PRESENTE'),
    (10,'2026-09-07', NULL,                          'PRESENTE'),
    (10,'2026-09-09', NULL,                          'PRESENTE'),
    (12,'2026-09-08', NULL,                          'PRESENTE'),
    (12,'2026-09-10', NULL,                          'TARDANZA');

INSERT INTO evaluacion (id_inscripcion, nombre_evaluacion, nota, fecha_evaluacion, comentario)
VALUES
    (1,  'Evaluación 1 - Acordes básicos',   85.00, '2026-08-25', 'Buen manejo de acordes mayores.'),
    (1,  'Evaluación 2 - Ritmo',             90.00, '2026-09-15', 'Excelente sentido del ritmo.'),
    (2,  'Evaluación 1 - Lectura musical',   78.00, '2026-08-26', 'Debe practicar la lectura en clave de fa.'),
    (3,  'Evaluación 1 - Acordes básicos',   72.00, '2026-08-25', 'Mejorar cambios de acordes.'),
    (4,  'Evaluación 1 - Escalas',           88.00, '2026-08-27', 'Muy buena velocidad y limpieza.'),
    (5,  'Evaluación 1 - Respiración',       80.00, '2026-08-28', 'Buen control del diafragma.'),
    (6,  'Evaluación 1 - Lectura musical',   92.00, '2026-08-26', 'Destacada.'),
    (7,  'Evaluación 1 - Repertorio',        95.00, '2026-08-27', 'Interpretación muy expresiva.'),
    (8,  'Evaluación 1 - Respiración',       70.00, '2026-08-28', NULL),
    (9,  'Evaluación 1 - Coordinación',      83.00, '2026-08-29', 'Buen avance en coordinación de manos y pies.'),
    (10, 'Evaluación 1 - Acordes básicos',   76.00, '2026-08-25', NULL),
    (12, 'Evaluación 1 - Escalas',           81.00, '2026-08-27', 'Constante y dedicada.'),
    (12, 'Evaluación 2 - Punteo',            NULL,  '2026-09-25', 'Pendiente de rendir.');

-- Prospectos registrados por la recepcionista (id 14)
INSERT INTO prospecto (nombre_completo, telefono, correo, instrumento_interes, estado_prospecto, observaciones, id_usuario_registro)
VALUES
    ('Ricardo Mendoza Alanoca', '70123456', 'ricardo.mendoza@correo.com', 'Guitarra', 'CONTACTADO', 'Llamó preguntando por horarios de tarde.', 14),
    ('Sofía Quispe Laura',      '71234567', NULL,                         'Canto',    'NUEVO',      'Visitó la academia con su mamá.',          14),
    ('Luis Apaza Choque',       '72345678', 'luis.apaza@correo.com',      'Batería',  'NUEVO',      NULL,                                       14);

INSERT INTO clase_prueba (id_prospecto, id_curso, fecha_hora, estado_clase, observaciones, id_usuario_registro)
VALUES
    (1, 1, '2026-10-20 15:00', 'PROGRAMADA', 'Clase de prueba de guitarra básico.', 14),
    (2, 5, '2026-10-21 17:00', 'PROGRAMADA', NULL,                                  14);

-- ---------- INSTRUMENTOS Y PRÉSTAMOS ----------
INSERT INTO instrumento (id_instrumento, codigo_inventario, nombre_instrumento, tipo_instrumento, marca, fecha_adquisicion, estado_instrumento, observaciones)
VALUES
    (1, 'INV-GUI-001', 'Guitarra acústica',  'CUERDA',     'Yamaha', '2025-02-10', 'DISPONIBLE',       NULL),
    (2, 'INV-GUI-002', 'Guitarra acústica',  'CUERDA',     'Fender', '2025-02-10', 'DISPONIBLE',       NULL),
    (3, 'INV-TEC-001', 'Teclado',            'TECLADO',    'Casio',  '2025-03-15', 'DISPONIBLE',       NULL),
    (4, 'INV-BAT-001', 'Batería acústica',   'PERCUSION',  'Pearl',  '2024-11-20', 'DISPONIBLE',       'Solo uso interno en Aula 4.'),
    (5, 'INV-MIC-001', 'Micrófono',          'AUDIO',      'Shure',  '2025-06-01', 'DISPONIBLE',       NULL),
    (6, 'INV-VIO-001', 'Violín 4/4',         'CUERDA',     NULL,     '2024-08-05', 'EN_MANTENIMIENTO', 'Cambio de cuerdas y revisión del puente.');

-- Los préstamos activos/atrasados marcan el instrumento como PRESTADO automáticamente (trigger)
INSERT INTO prestamo_instrumento (id_instrumento, id_usuario_prestatario, id_usuario_registro, fecha_prestamo, fecha_devolucion_prevista, fecha_devolucion_real, estado_prestamo, observaciones)
VALUES
    (2, 6, 13, '2026-09-01 10:00:00', '2026-09-30', '2026-09-29 16:30:00', 'DEVUELTO', 'Devuelto en buen estado.'),
    (1, 5, 13, '2026-10-05 15:00:00', '2026-10-30', NULL,                  'ACTIVO',   'Para practicar en casa.'),
    (3, 7, 13, '2026-09-20 17:00:00', '2026-10-05', NULL,                  'ATRASADO', 'Aún no lo devuelve; se contactó al estudiante.');

-- ---------- BITÁCORA ----------
INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro, descripcion, ip_origen, fecha_hora)
VALUES
    (1,  'LOGIN',   'usuario',     '1',  'Inicio de sesión del director',            '190.129.10.5',  '2026-10-15 08:01:12.000'),
    (13, 'CREAR',   'inscripcion', '12', 'Matrícula registrada por secretaría',      '190.129.10.8',  '2026-08-07 10:15:00.000'),
    (1,  'ANULAR',  'transaccion', '18', 'Pago 16 anulado por el director',          '190.129.10.5',  '2026-08-20 17:00:00.000'),
    (14, 'CREAR',   'prospecto',   '1',  'Prospecto registrado por recepción',       '190.129.10.12', '2026-10-12 11:20:00.000'),
    (NULL,'LOGIN_FALLIDO','usuario', NULL, 'Intento de acceso con contraseña incorrecta (diego.torrez@correo.com)', '181.115.44.20', '2026-10-14 19:45:30.000');

-- ---------- TOKEN DE RECUPERACIÓN (ejemplo ya usado) ----------
INSERT INTO token_recuperacion (id_usuario, token_hash, fecha_creacion, fecha_expiracion, usado, fecha_uso)
VALUES
    (5, encode(sha256('token-ejemplo-123'::bytea), 'hex'),
     '2026-10-10 10:00:00', '2026-10-10 10:30:00', TRUE, '2026-10-10 10:12:00');

-- ---------- MATERIAL DE APOYO ----------
INSERT INTO material_apoyo (id_curso, id_usuario, titulo, descripcion, tipo_material, url_archivo)
VALUES
    (1, 2, 'Acordes mayores y menores',     'Diagramas de acordes para principiantes.',  'GUIA',      '/materiales/guitarra-basico/acordes.pdf'),
    (1, 2, 'Pista de práctica - Ritmo 4/4', 'Pista para practicar rasgueo.',             'AUDIO',     '/materiales/guitarra-basico/ritmo-44.mp3'),
    (3, 3, 'Partitura - Para Elisa',        'Versión simplificada para nivel inicial.',  'PARTITURA', '/materiales/piano-inicial/para-elisa.pdf'),
    (5, 4, 'Ejercicios de respiración',     'Rutina diaria de calentamiento vocal.',     'VIDEO',     'https://ejemplo.com/video-respiracion');

-- ---------- EVENTOS ----------
INSERT INTO evento (id_evento, nombre_evento, descripcion, tipo_evento, fecha_hora_inicio, fecha_hora_fin, id_aula, lugar_externo, estado_evento, id_usuario_creador, id_usuario_aprobador, fecha_aprobacion)
VALUES
    (1, 'Recital de fin de año',      'Presentación de estudiantes de todos los cursos.', 'RECITAL',  '2026-12-12 18:00', '2026-12-12 20:30', 5,    NULL, 'APROBADO',  13, 1,    '2026-10-10 09:00:00'),
    (2, 'Audición de guitarra',       'Audición interna para el grupo de guitarra.',      'AUDICION', '2026-11-07 16:00', '2026-11-07 18:00', 1,    NULL, 'PENDIENTE', 2,  NULL, NULL),
    (3, 'Taller de técnica vocal',    'Taller abierto sobre respiración y proyección.',   'TALLER',   '2026-09-26 10:00', '2026-09-26 12:00', 3,    NULL, 'REALIZADO', 4,  1,    '2026-09-10 12:00:00');

INSERT INTO participacion_evento (id_evento, id_usuario, rol_participacion, detalle, estado_participacion)
VALUES
    (1, 2,  'DOCENTE_A_CARGO', 'Coordinación de guitarra',        'CONFIRMADO'),
    (1, 3,  'DOCENTE_A_CARGO', 'Coordinación de piano',           'CONFIRMADO'),
    (1, 5,  'INTERPRETE',      'Guitarra - repertorio popular',   'CONFIRMADO'),
    (1, 6,  'INTERPRETE',      'Guitarra - canción de grupo',     'INSCRITO'),
    (1, 7,  'INTERPRETE',      'Canto - solista',                 'INSCRITO'),
    (2, 2,  'DOCENTE_A_CARGO', NULL,                              'INSCRITO'),
    (2, 5,  'INTERPRETE',      NULL,                              'INSCRITO'),
    (2, 11, 'INTERPRETE',      NULL,                              'INSCRITO'),
    (2, 12, 'INTERPRETE',      NULL,                              'INSCRITO'),
    (3, 4,  'DOCENTE_A_CARGO', NULL,                              'ASISTIO'),
    (3, 7,  'ASISTENTE',       NULL,                              'ASISTIO'),
    (3, 10, 'ASISTENTE',       NULL,                              'ASISTIO');

-- ============================================================
-- AJUSTE DE SECUENCIAS
-- ============================================================

SELECT setval(pg_get_serial_sequence('usuario',      'id_usuario'),      (SELECT MAX(id_usuario)      FROM usuario));
SELECT setval(pg_get_serial_sequence('curso',        'id_curso'),        (SELECT MAX(id_curso)        FROM curso));
SELECT setval(pg_get_serial_sequence('aula',         'id_aula'),         (SELECT MAX(id_aula)         FROM aula));
SELECT setval(pg_get_serial_sequence('inscripcion',  'id_inscripcion'),  (SELECT MAX(id_inscripcion)  FROM inscripcion));
SELECT setval(pg_get_serial_sequence('pago',         'id_pago'),         (SELECT MAX(id_pago)         FROM pago));
SELECT setval(pg_get_serial_sequence('transaccion',  'id_transaccion'),  (SELECT MAX(id_transaccion)  FROM transaccion));
SELECT setval(pg_get_serial_sequence('instrumento',  'id_instrumento'),  (SELECT MAX(id_instrumento)  FROM instrumento));
SELECT setval(pg_get_serial_sequence('evento',       'id_evento'),       (SELECT MAX(id_evento)       FROM evento));

-- ============================================================
-- EJEMPLOS DE USO
-- ============================================================

-- 1) LOGIN: solo entran usuarios ACTIVOS con contraseña correcta
--    (en la app lo hará Spring Security con BCryptPasswordEncoder)
-- SELECT u.id_usuario, u.nombre_completo, r.nombre_rol, a.cargo
-- FROM usuario u
-- JOIN rol r ON r.id_rol = u.id_rol
-- LEFT JOIN administrativo a ON a.id_usuario = u.id_usuario
-- WHERE u.correo = 'diego.torrez@correo.com'
--   AND u.contrasena = crypt('clave123', u.contrasena)
--   AND u.activo = TRUE;

-- 2) DESACTIVAR un usuario (el backend además inserta la acción en la bitácora)
-- UPDATE usuario SET activo = FALSE WHERE id_usuario = 5;
-- INSERT INTO bitacora (id_usuario, accion, tabla_afectada, id_registro, descripcion)
-- VALUES (1, 'DESACTIVAR', 'usuario', '5', 'Usuario desactivado por el director');

-- 3) Estudiantes con cuotas vencidas (reporte de morosos para el director)
-- SELECT u.nombre_completo, cu.nombre_curso, q.mes, q.anio, q.monto
-- FROM cuota q
-- JOIN inscripcion i ON i.id_inscripcion = q.id_inscripcion
-- JOIN usuario u     ON u.id_usuario = i.id_usuario
-- JOIN curso cu      ON cu.id_curso = i.id_curso
-- WHERE q.estado_cuota = 'VENCIDA'
-- ORDER BY u.nombre_completo, q.anio, q.mes;

-- 4) ¿Un estudiante está al día? (consulta de la recepcionista, solo lectura)
-- SELECT NOT EXISTS (
--     SELECT 1 FROM cuota q
--     JOIN inscripcion i ON i.id_inscripcion = q.id_inscripcion
--     WHERE i.id_usuario = 5 AND q.estado_cuota = 'VENCIDA'
-- ) AS al_dia;

-- 5) Cursos activos con su horario y aula
-- SELECT c.nombre_curso, h.dia, h.hora_inicio, h.hora_fin, a.nombre_aula
-- FROM curso c
-- JOIN horario h ON h.id_curso = c.id_curso
-- JOIN aula a    ON a.id_aula = h.id_aula
-- WHERE c.activo = TRUE AND h.activo = TRUE;

-- 6) Devolver un instrumento (el trigger lo deja DISPONIBLE)
-- UPDATE prestamo_instrumento
-- SET estado_prestamo = 'DEVUELTO', fecha_devolucion_real = CURRENT_TIMESTAMP
-- WHERE id_prestamo = 2;

-- 7) Aprobar un evento (solo un usuario con cargo DIRECTOR)
-- UPDATE evento
-- SET estado_evento = 'APROBADO', id_usuario_aprobador = 1, fecha_aprobacion = CURRENT_TIMESTAMP
-- WHERE id_evento = 2;

-- 8) PAGO CON EL QR FIJO (lo que hará el backend, todo en UNA transacción)
--    a) El estudiante (o la secretaria) registra el comprobante: queda PENDIENTE
-- INSERT INTO transaccion (id_pago, metodo_pago, estado_transaccion, nro_comprobante, url_comprobante)
-- VALUES (4, 'QR', 'PENDIENTE', 'QR-20261016-0001', '/comprobantes/2026/10/pago-4.jpg');
--    b) La secretaria verifica en el banco y APRUEBA (la cuota pasa a PAGADA)
-- BEGIN;
--   UPDATE transaccion
--   SET estado_transaccion = 'APROBADA', id_usuario = 13,
--       monto_recibido = 200.00, fecha_confirmacion = CURRENT_TIMESTAMP
--   WHERE nro_comprobante = 'QR-20261016-0001' AND estado_transaccion = 'PENDIENTE';
--   UPDATE cuota SET estado_cuota = 'PAGADA'
--   WHERE id_cuota = (SELECT id_cuota FROM pago WHERE id_pago = 4);
-- COMMIT;
--    c) O la RECHAZA indicando el motivo
-- UPDATE transaccion
-- SET estado_transaccion = 'RECHAZADA', id_usuario = 13, codigo_error = 'MONTO_INCORRECTO',
--     observaciones = 'El monto del comprobante no coincide con la cuota.'
-- WHERE nro_comprobante = 'QR-20261016-0001' AND estado_transaccion = 'PENDIENTE';
--    d) Pantalla de la secretaria: pagos por verificar
-- SELECT t.id_transaccion, u.nombre_completo, p.concepto, p.monto_total, t.nro_comprobante, t.url_comprobante
-- FROM transaccion t
-- JOIN pago p    ON p.id_pago = t.id_pago
-- JOIN usuario u ON u.id_usuario = p.id_usuario
-- WHERE t.estado_transaccion = 'PENDIENTE'
-- ORDER BY t.fecha_hora;

-- ============================================================
-- DE INVITADO A ESTUDIANTE (lo hace el backend; así se vería a mano)
-- El orden importa: primero el rol, porque el trigger trg_estudiante_rol
-- exige que el usuario ya sea ESTUDIANTE al insertar en estudiante.
-- ============================================================
-- BEGIN;
-- UPDATE usuario SET id_rol = (SELECT id_rol FROM rol WHERE nombre_rol = 'ESTUDIANTE')
--  WHERE correo = 'invitado@correo.com';
-- INSERT INTO estudiante (id_usuario) SELECT id_usuario FROM usuario WHERE correo = 'invitado@correo.com';
-- COMMIT;

-- ============================================================
-- RESUMEN DE REGISTROS
-- ============================================================

SELECT 'rol' AS tabla, COUNT(*) AS registros FROM rol
UNION ALL SELECT 'usuario',              COUNT(*) FROM usuario
UNION ALL SELECT 'administrativo',       COUNT(*) FROM administrativo
UNION ALL SELECT 'docente',              COUNT(*) FROM docente
UNION ALL SELECT 'estudiante',           COUNT(*) FROM estudiante
UNION ALL SELECT 'curso',                COUNT(*) FROM curso
UNION ALL SELECT 'aula',                 COUNT(*) FROM aula
UNION ALL SELECT 'horario',              COUNT(*) FROM horario
UNION ALL SELECT 'inscripcion',          COUNT(*) FROM inscripcion
UNION ALL SELECT 'cuota',                COUNT(*) FROM cuota
UNION ALL SELECT 'pago',                 COUNT(*) FROM pago
UNION ALL SELECT 'transaccion',          COUNT(*) FROM transaccion
UNION ALL SELECT 'asistencia',           COUNT(*) FROM asistencia
UNION ALL SELECT 'evaluacion',           COUNT(*) FROM evaluacion
UNION ALL SELECT 'prospecto',            COUNT(*) FROM prospecto
UNION ALL SELECT 'clase_prueba',         COUNT(*) FROM clase_prueba
UNION ALL SELECT 'instrumento',          COUNT(*) FROM instrumento
UNION ALL SELECT 'prestamo_instrumento', COUNT(*) FROM prestamo_instrumento
UNION ALL SELECT 'bitacora',             COUNT(*) FROM bitacora
UNION ALL SELECT 'token_recuperacion',   COUNT(*) FROM token_recuperacion
UNION ALL SELECT 'material_apoyo',       COUNT(*) FROM material_apoyo
UNION ALL SELECT 'evento',               COUNT(*) FROM evento
UNION ALL SELECT 'participacion_evento', COUNT(*) FROM participacion_evento;
