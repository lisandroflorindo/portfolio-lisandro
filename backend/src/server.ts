import { crearApp } from './app.js';
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un número entre 1 y 65535.');
const { app, cerrar } = await crearApp();
const server = app.listen(port, '127.0.0.1', () => console.log(`Portfolio: http://127.0.0.1:${port}\nGestión: http://127.0.0.1:${port}/manage.html`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await cerrar(); process.exit(0); }));
