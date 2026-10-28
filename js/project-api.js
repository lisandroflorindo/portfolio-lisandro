export async function api(path = '', options = {}) {
    let response;
    try { response = await fetch(`/api/proyectos${path}`, { ...options, headers: { 'Content-Type': 'application/json' } }); }
    catch { throw new Error('No se pudo conectar con el servidor'); }
    if (response.status === 204) return;
    let data;
    try { data = await response.json(); } catch { throw new Error('Error de conexión'); }
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
    return data;
}
export function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
export function card(project, management = false) {
    const article = element('article', 'project-card');
    const info = element('div', 'project-info');
    info.append(element('p', 'project-type', project.categoria), element('h2', '', project.nombre), element('p', '', project.descripcion));
    const tags = element('div', 'project-tags');
    tags.setAttribute('aria-label', 'Tecnologías utilizadas');
    project.tecnologias.forEach(tech => tags.append(element('span', 'technology-tag', tech)));
    info.append(tags);
    if (project.enlace) {
        const link = element('a', 'outline-button', 'Ver proyecto ↗');
        link.href = project.enlace; link.target = '_blank'; link.rel = 'noopener noreferrer';
        info.append(link);
    }
    if (management) info.append(element('p', 'publication-state', project.estado === 'publicado' ? 'Publicado' : 'Borrador'));
    article.append(info);
    if (project.imagen) {
        const media = element('div', 'project-media');
        const image = element('img'); image.src = project.imagen; image.alt = `Imagen de ${project.nombre}`; image.loading = 'lazy';
        image.addEventListener('error', () => media.replaceChildren(element('p', '', 'Imagen no disponible')), { once: true });
        media.append(image); article.append(media);
    } else article.classList.add('project-without-image');
    return { article, info };
}
