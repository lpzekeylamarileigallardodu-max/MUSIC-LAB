export interface SesionUsr {
    id_usuario?: number;
    nom: string;
    correo: string;
    rol: string;
}

export function obtenerSesion(): SesionUsr | null {
    const d = localStorage.getItem('usuario');
    if (!d) return null;
    try {
        const u = JSON.parse(d);
        return {
            id_usuario: u.id_usuario,
            nom: u.nombre_completo || u.nom || u.nombre || 'Usuario',
            correo: u.correo || '',
            rol: (u.nombre_rol || u.rol || '').toUpperCase(),
        };
    } catch {
        return null;
    }
}