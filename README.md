# KAZA Comercial

Frontend comercial estático de webs para casamientos. La demo de Ana y Julián es ficticia: las respuestas no se guardan, los regalos no permiten pagos y el formulario solo prepara un texto para copiar.

Repositorio comercial: https://github.com/guidoboetsch/CASADOS

Sitio de GitHub Pages: https://guidoboetsch.github.io/CASADOS/
Esta copia parte del rediseño comercial `47d8281`. No contiene el registro de invitados ni la planilla de Drive; `REGISTRO-MAESTRO.md` describe la integración propuesta.

## Revisar localmente

Abrir `dist/index.html` en un navegador. Para comprobar el botón de copiar con un contexto seguro, servir `dist` por HTTP en localhost o usar HTTPS en GitHub Pages. No hay dependencias ni compilación.

## Publicación manual

En el repositorio: **Settings → Pages → Build and deployment → Source → GitHub Actions**. En **Actions → Publicar KAZA Comercial → Run workflow**, seleccionar `main` y ejecutar únicamente con dirección explícita para esa versión. El flujo se inicia manualmente; un push no publica el sitio.

Solo se publica `dist/`; README, ROADMAP, AGENTS y las verificaciones no forman parte del sitio. El historial comercial es independiente del hosting anterior. No hay dominio personalizado, contacto inventado, analítica, backend ni integraciones externas.

Esperar la ejecución correcta y abrir la URL efectiva devuelta por `deployment`. Comprobar carga, estilos, pestañas, asistencia ficticia, mesa, regalos y consulta/copia en escritorio y móvil. Registrar versión, ejecución y URL efectiva en `VALIDATION.md`. Una URL calculada no acredita un despliegue.

Referencia: [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Trabajo futuro

Las nuevas tareas requieren autorización concreta. Se entregan en una rama y borrador de PR para revisión. No fusionar ni ejecutar el workflow de publicación sin dirección explícita para ese cambio. Ver `ROADMAP.md`.
