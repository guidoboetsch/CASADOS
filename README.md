# KAZA Comercial

Frontend comercial estático de webs para casamientos. La portada presenta la invitación pública de Guido y María mediante un enlace externo; no replica ni procesa datos del evento. El formulario comercial solo prepara un texto para copiar.

Repositorio comercial: https://github.com/guidoboetsch/CASADOS

Sitio de GitHub Pages: https://guidoboetsch.github.io/CASADOS/
Esta copia parte del rediseño comercial `47d8281`. No contiene el registro de invitados ni la planilla de Drive; `REGISTRO-MAESTRO.md` describe la integración propuesta.

## Revisar localmente

La portada está pensada para parejas y enlaza a la invitación pública de Guido y María. El [editor](https://guidoboetsch.github.io/CASADOS/editor/) sigue disponible por enlace directo (`dist/editor/index.html` para revisarlo localmente), sin acceso desde la navegación comercial. No requiere contraseña. El preset inicial tiene portada, día, itinerario, confirmación, regalos y redes. Los bloques se ordenan por arrastre o con botones. El borrador se guarda en el navegador de ese dispositivo; descargarlo genera una invitación HTML sin dependencias del editor. No se publica ni se conecta automáticamente a una planilla. Cada pareja configura sus enlaces de confirmación, regalos y redes.

Mesas es opcional. El buscador usa coincidencia de nombre completo o código individual y avisa si hay homónimos. Si se exporta con este bloque, sus asignaciones son legibles en el archivo: se recomiendan códigos en lugar de nombres. Quitar el bloque excluye las asignaciones de la exportación.

Foto de muestra de portada: [Auditorio del Perot Theatre](https://www.loc.gov/pictures/item/2014630215/), Carol M. Highsmith. The Lyda Hill Texas Collection of Photographs in Carol M. Highsmith's America Project, Library of Congress, Prints and Photographs Division (LC-DIG-highsm-26015). Está incluida localmente para permitir la descarga sin depender de un servidor de imágenes. Se puede reemplazar por una foto propia.

Abrir `dist/index.html` en un navegador. Para comprobar el botón de copiar con un contexto seguro, servir `dist` por HTTP en localhost o usar HTTPS en GitHub Pages. No hay dependencias ni compilación.

## Publicación manual

En el repositorio: **Settings → Pages → Build and deployment → Source → GitHub Actions**. En **Actions → Publicar KAZA Comercial → Run workflow**, seleccionar `main` y ejecutar únicamente con dirección explícita para esa versión. El flujo se inicia manualmente; un push no publica el sitio.

Solo se publica `dist/`; README, ROADMAP, AGENTS y las verificaciones no forman parte del sitio. El historial comercial es independiente del hosting anterior. No hay dominio personalizado, contacto inventado, analítica, backend ni integraciones externas.

Esperar la ejecución correcta y abrir la URL efectiva devuelta por el despliegue. Comprobar carga, estilos, presentación del casamiento, destino del enlace de invitación y consulta/copia en escritorio y móvil. Registrar versión, ejecución y URL efectiva en VALIDATION.md.

Referencia: [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Trabajo futuro

Las nuevas tareas requieren autorización concreta. Se entregan en una rama y borrador de PR para revisión. No fusionar ni ejecutar el workflow de publicación sin dirección explícita para ese cambio. Ver `ROADMAP.md`.
