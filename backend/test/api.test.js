import { test } from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { configuracion } from '../dist/database.js';
import { crearApp } from '../dist/app.js';

test('CRUD, validación, publicación y persistencia después de reabrir la base', async () => {
    const databaseName = `portfolio_test_${process.pid}_${Date.now()}`;
    const admin = await mysql.createConnection(configuracion());
    await admin.query(`CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4`);
    let instance, server, base;
    async function start() {
        instance = await crearApp(databaseName);
        server = instance.app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
    }
    async function stop() { await new Promise(resolve => server.close(resolve)); await instance.cerrar(); }
    async function request(url = '', method = 'GET', body) {
        return fetch(`${base}/api/proyectos${url}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    }
    const draft = { nombre: 'Prueba <script>', descripcion: 'Persistencia real', categoria: 'Sitio web', tecnologias: ['Node.js', 'SQLite'], imagen: 'assets/logo-lisandro.png', enlace: '', estado: 'borrador' };
    await start();
    try {
        assert.equal((await (await request()).json()).length, 4);
        let response = await request('', 'POST', draft);
        assert.equal(response.status, 201);
        const created = await response.json();
        assert.equal((await (await request()).json()).length, 4);
        assert.equal((await (await request('?todos=true')).json()).length, 5);
        assert.equal((await request(`/${created.id}`, 'PUT', { ...draft, estado: 'publicado', nombre: 'Modificado' })).status, 200);
        await stop(); await start();
        assert.equal((await (await request(`/${created.id}`)).json()).nombre, 'Modificado');
        assert.equal((await (await request()).json()).length, 5);
        for (const invalid of [{ ...draft, nombre: ' ' }, { ...draft, tecnologias: [] }, { ...draft, estado: 'otro' }, { ...draft, enlace: 'javascript:alert(1)' }, { ...draft, imagen: '../.env' }, { ...draft, imagen: '', enlace: '' }, null]) {
            assert.equal((await request('', 'POST', invalid)).status, 400);
        }
        assert.equal((await request('/abc')).status, 400);
        assert.equal((await request('/999999')).status, 404);
        assert.equal((await request('/999999', 'PUT', draft)).status, 404);
        assert.equal((await request('/999999', 'DELETE')).status, 404);
        assert.equal((await fetch(`${base}/api/proyectos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
        assert.equal((await fetch(`${base}/api/proyectos`, { headers: { Origin: 'https://example.com' } })).status, 403);
        for (const secret of ['/backend/data/portfolio.sqlite', '/.env', '/package.json']) assert.equal((await fetch(base + secret)).status, 404);
        for (const page of ['/', '/projects.html', '/manage.html', '/contact.html', '/resume.html', '/js/manage.js', '/css/custom.css']) assert.equal((await fetch(base + page)).status, 200);
        assert.equal((await request(`/${created.id}`, 'DELETE')).status, 204);
        assert.equal((await request(`/${created.id}`)).status, 404);
        for (const project of await (await request('?todos=true')).json()) await request(`/${project.id}`, 'DELETE');
        await stop(); await start();
        assert.deepEqual(await (await request('?todos=true')).json(), []); // No resucita datos iniciales.
    } finally { await stop(); await admin.query(`DROP DATABASE ${databaseName}`); await admin.end(); }
});
