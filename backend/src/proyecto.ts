export type EstadoProyecto = 'borrador' | 'publicado';
export interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string;
    categoria: string;
    tecnologias: string[];
    imagen: string;
    enlace: string;
    estado: EstadoProyecto;
}
export type DatosProyecto = Omit<Proyecto, 'id'>;

function webUrl(value: string): boolean {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
}
export function validarProyecto(value: unknown): DatosProyecto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Se esperaba un objeto con los datos del proyecto.');
    const data = value as Record<string, unknown>;
    const text = (key: string, max: number, required = true): string => {
        if (typeof data[key] !== 'string') throw new Error(`El campo ${key} debe ser texto.`);
        const result = (data[key] as string).trim();
        if ((required && !result) || result.length > max) throw new Error(`Revisá ${key}: ${required ? 'es obligatorio y ' : ''}admite hasta ${max} caracteres.`);
        return result;
    };
    const nombre = text('nombre', 120), descripcion = text('descripcion', 3000), categoria = text('categoria', 120);
    const imagen = text('imagen', 500, false), enlace = text('enlace', 500, false);
    if (!imagen && !enlace) throw new Error('Indicá una imagen o un enlace representativo.');
    if (imagen && !webUrl(imagen) && !/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif|svg)$/i.test(imagen)) throw new Error('La imagen debe ser una ruta en assets/ o una URL HTTP(S).');
    if (enlace && !webUrl(enlace)) throw new Error('El enlace debe ser una URL HTTP(S) válida.');
    if (!Array.isArray(data.tecnologias) || data.tecnologias.length < 1 || data.tecnologias.length > 20 || data.tecnologias.some(t => typeof t !== 'string' || !t.trim() || t.trim().length > 50)) throw new Error('Ingresá entre 1 y 20 tecnologías, de hasta 50 caracteres cada una.');
    if (data.estado !== 'borrador' && data.estado !== 'publicado') throw new Error('El estado debe ser borrador o publicado.');
    return { nombre, descripcion, categoria, imagen, enlace, tecnologias: [...new Set(data.tecnologias.map(t => t.trim()))], estado: data.estado };
}
