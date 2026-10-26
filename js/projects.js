import { api, card } from './project-api.js';
const status = document.querySelector('#project-status');
const list = document.querySelector('#projects-list');
const retry = document.querySelector('#retry-projects');
async function load() {
    status.textContent = 'Cargando proyectos…'; retry.hidden = true;
    try {
        const projects = await api();
        list.replaceChildren(...projects.map(project => card(project).article));
        status.textContent = projects.length ? '' : 'Todavía no hay proyectos publicados.';
    } catch (error) { status.textContent = error.message; retry.hidden = false; }
}
retry.addEventListener('click', load);
load();
