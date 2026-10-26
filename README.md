# Portfolio de Lisandro Florindo

Adaptación de la Actividad Integradora de las unidades 3, 4, 5 y 6. Conserva el diseño, Inicio, Experiencia y Contacto. La sección Proyectos consulta una API Express y persiste sus datos en MySQL/MariaDB mediante XAMPP. Incluye un formulario para crear, editar, publicar y eliminar proyectos.

## Instalación y ejecución

Requisitos: Node.js 22.13 o superior, npm y XAMPP con el servicio MySQL iniciado. XAMPP utiliza MariaDB, compatible con el conector `mysql2` de este proyecto.

1. Abrir XAMPP Control Panel e iniciar **MySQL**. Apache solo es necesario si querés usar phpMyAdmin.
2. En phpMyAdmin, abrir la pestaña SQL e importar `backend/data/schema.sql`. Crea la base `portfolio_lisandro` y sus tablas. También se puede ejecutar el archivo con el cliente MySQL de XAMPP.
3. Copiar `.env.example` a `.env` y ajustar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. Los valores iniciales corresponden a XAMPP local: `127.0.0.1:3306`, usuario `root`, contraseña vacía. Si tu instalación tiene contraseña, colocar la propia en `.env`. No versionar este archivo.
4. Ejecutar desde la carpeta del proyecto:

```sh
npm install
npm start
```

Abrir http://127.0.0.1:3000 y, para el CRUD, http://127.0.0.1:3000/manage.html. Node entrega el frontend y la API; no hace falta mover el proyecto a `htdocs`. No abrir el HTML directamente ni usar Live Server. `npm start` compila TypeScript antes de iniciar. MySQL debe permanecer encendido mientras se usa el portfolio.

En una instalación nueva, el primer inicio crea las tablas si faltan y carga los cuatro proyectos originales desde `backend/data/projects.json` **una sola vez**, dentro de una transacción. La base debe existir previamente. Reiniciar conserva cambios y eliminaciones; incluso si se eliminan todos, no vuelve a cargar el contenido inicial.

Si aparece `ECONNREFUSED`, comprobar que MySQL esté iniciado y que el puerto coincida con `.env`. Ante `Access denied`, revisar usuario y contraseña; ante `Unknown database`, importar `schema.sql`. Para un servidor público, utilizar un usuario específico con los permisos necesarios y proteger las rutas de gestión.

## Organización

- Frontend: `index.html`, `resume.html`, `contact.html`, `projects.html`, `manage.html`, `css/`, `js/`, `assets/`.
- Backend: `backend/src/server.ts` (inicio), `app.ts` (Express y rutas), `database.ts` (SQL y carga inicial), `proyecto.ts` (tipos y validación).
- Base: MySQL/MariaDB de XAMPP; `backend/data/schema.sql` (estructura) y `backend/data/projects.json` (datos iniciales).
- Compilación: `backend/dist/` (generada, excluida de Git).
- Configuración común: `package.json`, `package-lock.json`, `.env.example`, `backend/tsconfig.json`.

El frontend se mantiene en la raíz para conservar las rutas originales. El servidor expone únicamente sus páginas y directorios públicos, no todo el repositorio.

## API y modelo de datos

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/proyectos` | Proyectos publicados |
| GET | `/api/proyectos?todos=true` | Todos los proyectos para la gestión |
| GET | `/api/proyectos/:id` | Un proyecto (incluye borradores) |
| POST | `/api/proyectos` | Crear, respuesta 201 |
| PUT | `/api/proyectos/:id` | Reemplazar datos, respuesta 200 |
| DELETE | `/api/proyectos/:id` | Eliminar, respuesta 204 |

POST y PUT reciben JSON con todos estos campos:

```json
{
  "nombre": "Mi proyecto",
  "descripcion": "Sitio web adaptable a dispositivos móviles.",
  "categoria": "Sitio web",
  "tecnologias": ["HTML", "CSS", "JavaScript"],
  "imagen": "assets/logo-lisandro.png",
  "enlace": "",
  "estado": "borrador"
}
```

`id` es entero autoincremental. Nombre y categoría admiten hasta 120 caracteres; descripción hasta 3000; imagen y enlace hasta 500. Se exige al menos una imagen o enlace y entre 1 y 20 tecnologías de hasta 50 caracteres. Estado acepta `borrador` o `publicado`. Las imágenes pueden apuntar a archivos existentes dentro de `assets/` o URLs HTTP(S); no se implementa carga de archivos. Enlace acepta HTTP(S). Los errores devuelven `{ "error": "mensaje" }` y estados 400, 403, 404, 413 o 500 según corresponda.

## Decisiones para la defensa

**Base relacional:** MySQL/MariaDB almacena registros en tablas con columnas, claves y restricciones, y se consulta mediante SQL. Una base no relacional, como MongoDB, suele almacenar documentos flexibles. Elegí MySQL con XAMPP porque los proyectos tienen una estructura común y permite administrar y mostrar los registros desde phpMyAdmin. Se usa InnoDB para las transacciones y utf8mb4 para caracteres Unicode. `tecnologias` se serializa como JSON en una columna de texto y vuelve a un array al consultar. El conector `mysql2/promise` trabaja de forma asíncrona con `async/await`, un pool de conexiones y consultas parametrizadas. El servidor puede usar MariaDB de XAMPP o MySQL con la misma configuración de conexión.

**TypeScript:** `Proyecto` define las propiedades y sus tipos, `EstadoProyecto` es la unión `'borrador' | 'publicado'` y `DatosProyecto` reutiliza la interfaz sin el ID. El repositorio retorna un array `Proyecto[]`. TypeScript detecta incompatibilidades durante la compilación y mejora el autocompletado; JavaScript es el código que ejecuta Node después de compilar. Los tipos no validan solicitudes externas en tiempo de ejecución: por eso también se usa `validarProyecto` antes de escribir en SQL. El frontend conserva JavaScript.

**Recorrido de la información:** el navegador llama a `fetch`; Express recibe la solicitud y valida los datos; la capa de base ejecuta SQL parametrizado; MySQL lee o escribe los registros persistentes; Express devuelve JSON y el navegador construye las tarjetas con `textContent`. La vista pública pide solo publicados; gestión pide todos. El formulario muestra los errores del servidor y confirma antes de eliminar.

**Alcance:** demostración académica local, sin usuarios ni autenticación. El servidor escucha solo en `127.0.0.1` y rechaza solicitudes de otros orígenes. La gestión y los borradores no son privados para quien tenga acceso al servidor. Antes de desplegar en Internet se debe agregar autenticación y autorización a las rutas de gestión. Un hosting estático como GitHub Pages no ejecuta este backend.

## Verificación y demostración

```sh
npm test
```

MySQL debe estar iniciado para ejecutar las pruebas. El usuario configurado necesita permisos CREATE DATABASE y DROP DATABASE: se crea y elimina únicamente una base temporal con nombre `portfolio_test_<proceso>_<fecha>`, independiente de los datos reales. Las pruebas verifican CRUD por HTTP, validaciones, errores, publicación, archivos privados y persistencia al cerrar/reabrir la conexión. También comprueban que eliminar todos los proyectos no dispara una nueva carga inicial.

Para la defensa:
1. Abrir Proyectos: aparecen los cuatro registros iniciales.
2. Crear un borrador en Gestionar proyectos. No aparece en la vista pública.
3. Editar el proyecto y cambiar a Publicado. Verlo en Proyectos.
4. Detener y volver a ejecutar `npm start`: comprobar que sigue guardado.
5. Cancelar una eliminación y luego confirmarla: comprobar que desaparece.
6. Mostrar la interfaz TypeScript, los endpoints y las consultas SQL parametrizadas.

## Git y entrega

Se conserva el repositorio y su historial. Revisar `git diff`, registrar los cambios con un commit descriptivo y subir a la rama correspondiente del repositorio existente. Compartir su enlace con la docente. La actualización en GitHub requiere hacer el push; no está incluida automáticamente al ejecutar el proyecto.
