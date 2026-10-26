import mysql, { type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatosProyecto, Proyecto } from './proyecto.js';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const configuracion = () => ({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' });
export async function abrirBase(database = process.env.DB_NAME || 'portfolio_lisandro') {
    const db = mysql.createPool({ ...configuracion(), database, connectionLimit: 5, charset: 'utf8mb4' });
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS proyectos (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL, descripcion TEXT NOT NULL, categoria VARCHAR(120) NOT NULL,
            tecnologias TEXT NOT NULL, imagen VARCHAR(500) NOT NULL, enlace VARCHAR(500) NOT NULL,
            estado ENUM('borrador', 'publicado') NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        await db.query('CREATE TABLE IF NOT EXISTS migraciones (version INT PRIMARY KEY) ENGINE=InnoDB');
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // La marca y la carga inicial se guardan en una sola transacción.
            const [mark] = await connection.execute<ResultSetHeader>('INSERT IGNORE INTO migraciones (version) VALUES (1)');
            if (mark.affectedRows) {
                const initial: DatosProyecto[] = JSON.parse(readFileSync(resolve(root, 'backend/data/projects.json'), 'utf8'));
                for (const p of initial) await connection.execute('INSERT INTO proyectos (nombre, descripcion, categoria, tecnologias, imagen, enlace, estado) VALUES (?, ?, ?, ?, ?, ?, ?)', valores(p));
            }
            await connection.commit();
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    } catch (error) { await db.end(); throw error; }
    function valores(p: DatosProyecto) { return [p.nombre, p.descripcion, p.categoria, JSON.stringify(p.tecnologias), p.imagen, p.enlace, p.estado]; }
    const convertir = (row: RowDataPacket) => ({ ...row, tecnologias: JSON.parse(row.tecnologias) }) as Proyecto;
    return {
        listar: async (todos = false): Promise<Proyecto[]> => {
            const [rows] = await db.query<RowDataPacket[]>(todos ? 'SELECT * FROM proyectos ORDER BY id' : "SELECT * FROM proyectos WHERE estado = 'publicado' ORDER BY id");
            return rows.map(convertir);
        },
        obtener: async (id: number): Promise<Proyecto | undefined> => {
            const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM proyectos WHERE id = ?', [id]);
            return rows[0] ? convertir(rows[0]) : undefined;
        },
        crear: async (p: DatosProyecto) => {
            const [result] = await db.execute<ResultSetHeader>('INSERT INTO proyectos (nombre, descripcion, categoria, tecnologias, imagen, enlace, estado) VALUES (?, ?, ?, ?, ?, ?, ?)', valores(p));
            return result.insertId;
        },
        actualizar: async (id: number, p: DatosProyecto) => {
            const [result] = await db.execute<ResultSetHeader>('UPDATE proyectos SET nombre=?, descripcion=?, categoria=?, tecnologias=?, imagen=?, enlace=?, estado=? WHERE id=?', [...valores(p), id]);
            return result.affectedRows;
        },
        eliminar: async (id: number) => {
            const [result] = await db.execute<ResultSetHeader>('DELETE FROM proyectos WHERE id=?', [id]);
            return result.affectedRows;
        },
        cerrar: () => db.end()
    };
}
