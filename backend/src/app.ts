import express from 'express';
import { resolve } from 'node:path';
import { abrirBase, root } from './database.js';
import { validarProyecto } from './proyecto.js';

export async function crearApp(databaseName?: string) {
    const store = await abrirBase(databaseName);
    const app = express();
    app.disable('x-powered-by');
    // La gestión es una demostración local, sin autenticación. Rechaza otros orígenes.
    app.use('/api', (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        const origin = req.get('origin');
        if (origin && origin !== `${req.protocol}://${req.get('host')}`) { res.status(403).json({ error: 'Origen no permitido.' }); return; }
        next();
    });
    app.use(express.json({ limit: '32kb' }));
    app.get('/api/proyectos', async (req, res) => { res.json(await store.listar(req.query.todos === 'true')); });
    app.param('id', (req, res, next, value) => {
        if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) { res.status(400).json({ error: 'ID inválido.' }); return; }
        next();
    });
    app.get('/api/proyectos/:id', async (req, res) => {
        const proyecto = await store.obtener(Number(req.params.id));
        if (!proyecto) { res.status(404).json({ error: 'Proyecto no encontrado.' }); return; }
        res.json(proyecto);
    });
    app.post('/api/proyectos', async (req, res) => {
        let datos;
        try { datos = validarProyecto(req.body); } catch (error) { res.status(400).json({ error: (error as Error).message }); return; }
        const id = await store.crear(datos);
        res.status(201).location(`/api/proyectos/${id}`).json(await store.obtener(id));
    });
    app.put('/api/proyectos/:id', async (req, res) => {
        let datos;
        try { datos = validarProyecto(req.body); } catch (error) { res.status(400).json({ error: (error as Error).message }); return; }
        const id = Number(req.params.id);
        if (!await store.actualizar(id, datos)) { res.status(404).json({ error: 'Proyecto no encontrado.' }); return; }
        res.json(await store.obtener(id));
    });
    app.delete('/api/proyectos/:id', async (req, res) => {
        if (!await store.eliminar(Number(req.params.id))) { res.status(404).json({ error: 'Proyecto no encontrado.' }); return; }
        res.status(204).end();
    });
    app.use('/api', (_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
    // Solo se exponen los archivos del frontend, nunca la base o el código del servidor.
    for (const dir of ['assets', 'css', 'js']) app.use(`/${dir}`, express.static(resolve(root, dir)));
    for (const page of ['index', 'projects', 'resume', 'contact', 'manage']) app.get(page === 'index' ? ['/', '/index.html'] : `/${page}.html`, (_req, res) => res.sendFile(resolve(root, `${page}.html`)));
    app.use((_req, res) => { res.status(404).send('Página no encontrada.'); });
    const errors: express.ErrorRequestHandler = (error, _req, res, _next) => {
        if (error.type === 'entity.parse.failed') { res.status(400).json({ error: 'JSON inválido.' }); return; }
        if (error.type === 'entity.too.large') { res.status(413).json({ error: 'La solicitud es demasiado grande.' }); return; }
        console.error(error);
        res.status(500).json({ error: 'No se pudo completar la operación.' });
    };
    app.use(errors);
    return { app, cerrar: store.cerrar };
}
