import { api, card, element } from './project-api.js';
const form = document.querySelector('#project-form');
const message = document.querySelector('#form-status');
const status = document.querySelector('#project-status');
const list = document.querySelector('#projects-list');
const cancel = document.querySelector('#cancel-edit');
const retry = document.querySelector('#retry-projects');
let editing = null;
let busy = false;
function reset() {
    editing = null; form.reset(); cancel.hidden = true;
    document.querySelector('#form-title').textContent = 'Nuevo proyecto';
    document.querySelector('#save-project').textContent = 'Guardar proyecto';
}
function setBusy(value) {
    busy = value;
    document.querySelectorAll('#project-form input, #project-form textarea, #project-form select, #project-form button, #projects-list button').forEach(node => node.disabled = value);
}
async function load() {
    retry.hidden = true; status.textContent = 'Cargando proyectos…';
    try {
        const projects = await api('?todos=true');
        list.replaceChildren(...projects.map(project => {
            const { article, info } = card(project, true);
            const actions = element('div', 'form-actions');
            const edit = element('button', 'outline-button', 'Editar');
            edit.type = 'button'; edit.setAttribute('aria-label', `Editar ${project.nombre}`);
            edit.addEventListener('click', () => {
                if (busy) return;
                editing = project.id;
                for (const key of ['nombre', 'descripcion', 'categoria', 'imagen', 'enlace', 'estado']) form.elements.namedItem(key).value = project[key];
                form.elements.namedItem('tecnologias').value = project.tecnologias.join(', ');
                cancel.hidden = false; message.textContent = '';
                document.querySelector('#form-title').textContent = 'Editar proyecto';
                document.querySelector('#save-project').textContent = 'Guardar cambios';
                form.elements.namedItem('nombre').focus();
            });
            const remove = element('button', 'outline-button delete-button', 'Eliminar');
            remove.type = 'button'; remove.setAttribute('aria-label', `Eliminar ${project.nombre}`);
            remove.addEventListener('click', async () => {
                if (busy || !window.confirm(`¿Eliminar “${project.nombre}”? Esta acción no se puede deshacer.`)) return;
                setBusy(true);
                try {
                    await api(`/${project.id}`, { method: 'DELETE' });
                    if (editing === project.id) reset();
                    message.textContent = 'Proyecto eliminado.'; await load();
                } catch (error) { message.textContent = error.message; }
                finally { setBusy(false); }
            });
            actions.append(edit, remove); info.append(actions); return article;
        }));
        status.textContent = `${projects.length} proyecto${projects.length === 1 ? '' : 's'} registrado${projects.length === 1 ? '' : 's'}.`;
    } catch (error) { status.textContent = error.message; retry.hidden = false; }
}
form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const values = Object.fromEntries(new FormData(form));
    values.tecnologias = values.tecnologias.split(',').map(t => t.trim()).filter(Boolean);
    setBusy(true); message.textContent = 'Guardando…';
    try {
        await api(editing ? `/${editing}` : '', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(values) });
        reset(); message.textContent = 'Proyecto guardado correctamente.'; await load();
    } catch (error) { message.textContent = error.message; }
    finally { setBusy(false); }
});
cancel.addEventListener('click', () => { reset(); message.textContent = 'Edición cancelada.'; });
retry.addEventListener('click', load);
load();
