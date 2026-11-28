# KAZA Comercial

Frontend comercial estático de webs para casamientos creado por Guido y María. La portada presenta su invitación pública mediante un enlace externo; no replica ni procesa datos del evento. La consulta prepara un texto para copiar o abrir en el correo del visitante; el sitio no envía ni almacena mensajes.

Repositorio comercial: https://github.com/guidoboetsch/CASADOS

Sitio de GitHub Pages: https://guidoboetsch.github.io/CASADOS/
Esta copia parte del rediseño comercial `47d8281`. No contiene el registro de invitados ni la planilla de Drive; `REGISTRO-MAESTRO.md` describe la integración propuesta.

## Revisar localmente

La colección se prueba en la portada, en **Diseños**, sin abrir el editor. Cine es el predeterminado; Herbario, Gaceta y Verbena cambian la composición, la tipografía y los detalles gráficos sin modificar el contenido. El botón de copiar prepara un mensaje con el estilo y, en la web, un enlace que lo preselecciona. No registra ni envía la elección. En el editor, el diseño se guarda con el borrador y viaja dentro de la descarga HTML.

Referencias de producto: [DeCasorio, Argentina](https://www.decasorio.com.ar/) distingue las tareas de pareja e invitado; [Riley & Grey](https://www.rileygrey.com/wedding-website-templates) permite explorar una colección; [Juno, Francia](https://www.wearejuno.fr/faire-part) coordina la invitación con el sitio; [Online Wedding Invitation, Australia](https://onlineweddinginvitation.au/wedding-website-templates) muestra estilos con composiciones diferentes y conserva los datos al alternarlos. KAZA usa sus propios textos, estilos y gráficos, no recursos de esas plataformas.

La portada está pensada para parejas y enlaza a la invitación pública de Guido y María. El [editor](https://guidoboetsch.github.io/CASADOS/editor/) sigue disponible por enlace directo (`dist/editor/index.html` para revisarlo localmente), sin acceso desde la navegación comercial. No requiere contraseña. El preset inicial tiene portada, día, itinerario, confirmación, regalos y redes. Los bloques se ordenan por arrastre o con botones. El borrador se guarda en el navegador de ese dispositivo; descargarlo genera una invitación HTML sin dependencias del editor. No se publica ni se conecta automáticamente a una planilla. Cada pareja configura sus enlaces de confirmación, regalos y redes.

Mesas es opcional. El buscador usa coincidencia de nombre completo o código individual y avisa si hay homónimos. Si se exporta con este bloque, sus asignaciones son legibles en el archivo: se recomiendan códigos en lugar de nombres. Quitar el bloque excluye las asignaciones de la exportación.

**Confirmar → Formulario de KAZA** permite probar una inscripción individual, de pareja o familiar desde [la muestra local](dist/rsvp/index.html). Cada asistente indica si tendrá 18 años o más el día de la fiesta. Solo a los menores se les pide la edad en años cumplidos (0 para bebés). El cupo incluye al titular: 10 por defecto, ajustable por invitación de 1 a 20. Se revisa la respuesta antes de enviarla; las ausencias no piden edades. La muestra no guarda ni envía nombres.

Para recibir respuestas de verdad, cada pareja debe activar su [formulario privado por evento](tools/rsvp/README.md) y poner su enlace en el bloque. La planilla no se comparte con invitados: queda una fila por persona y el contador público, si se habilita, sigue leyendo solo la cantidad. Sin ese enlace, un archivo exportado avisa que la confirmación todavía no abrió. Los borradores anteriores mantienen su formulario externo y pueden seguir usándolo.

En **Bloques → Opcionales**, la cuenta regresiva usa la fecha de la portada, la hora y el huso del evento (Argentina por defecto). Funciona también sin conexión. El contador de confirmados es independiente y requiere un [recuento público agregado del evento](REGISTRO-MAESTRO.md#contador-p%C3%BAblico-de-confirmados). Se comprueba desde la vista previa antes de exportar. La invitación consulta el total al abrirse y luego cada minuto mientras está visible; sin conexión muestra que el dato no está disponible, no un cero inventado. Ambos bloques se pueden mover o quitar, y se incluyen tanto en el HTML como en el ZIP. No se alteran borradores ni invitaciones anteriores.

Foto de muestra de portada: [Auditorio del Perot Theatre](https://www.loc.gov/pictures/item/2014630215/), Carol M. Highsmith. The Lyda Hill Texas Collection of Photographs in Carol M. Highsmith's America Project, Library of Congress, Prints and Photographs Division (LC-DIG-highsm-26015). Está incluida localmente para permitir la descarga sin depender de un servidor de imágenes. Se puede reemplazar por una foto propia.

Abrir `dist/index.html` en un navegador. Para comprobar el botón de copiar con un contexto seguro, servir `dist` por HTTP en localhost o usar HTTPS en GitHub Pages. Los archivos publicados son estáticos; no se necesita instalar herramientas para probarlos.

## Estudio del salón

Desde el editor, **Abrir estudio del salón** lleva a `dist/salon/index.html`. Atrio central, Galería larga y Salón vacío son maquetas de muestra; no incluyen invitados. Planta y espacio 3D editan la misma distribución en metros (medidas orientativas, no un plano técnico). Se pueden mover las piezas con mouse o tacto, o mediante sus coordenadas. Hay órbita, zoom, encuadre, prevención de salidas del perímetro y aviso de superposición. Si no hay WebGL 2, la planta conserva los controles de edición.

Una imagen opcional se centra sin deformarse en el plano 2D. No se sube ni se interpreta con IA. El borrador se guarda en una clave del navegador separada de la invitación; no hay sincronización con la lista de invitados. Deshacer/rehacer abarca las últimas 30 ediciones de la sesión.

Pruebas del modelo: `node --test tests/salon.test.cjs`. La fuente del renderizador está en `tools/salon/scene.js`; solo para cambiarla, ejecutar `npm ci` y `npm run build` desde esa carpeta. El paquete y su licencia se sirven desde `dist/salon/`, sin CDN.

## Enlaces por evento y regalos

El enlace opcional del editor prepara un ZIP estático con `i/<nombre>/index.html`. No registra un dominio, no reserva el nombre ni publica. Antes de una publicación autorizada, verificar que la ruta esté libre y revisar el contenido y su privacidad, sobre todo si se exportaron mesas. Nunca sobreescribir otra invitación. El HTML común sigue disponible sin usar este flujo.

Regalos admite una lista propia y enlaces opcionales por regalo. Los presets «Para la casa», «Luna de miel» y «Experiencias» suman ideas sin reemplazar regalos existentes. Son sugerencias editables, no una tienda, reserva de artículos ni un sistema de pagos.

## Publicación manual

En el repositorio: **Settings → Pages → Build and deployment → Source → GitHub Actions**. En **Actions → Publicar KAZA Comercial → Run workflow**, seleccionar `main` y ejecutar únicamente con dirección explícita para esa versión. El flujo se inicia manualmente; un push no publica el sitio.

Solo se publica `dist/`; README, ROADMAP, AGENTS y las verificaciones no forman parte del sitio. El historial comercial es independiente del hosting anterior. El canal comercial usa un alias de la casilla indicada por Guido; el acuse se gestiona fuera del sitio. No hay analítica, backend ni acceso a Gmail desde la web.

Esperar la ejecución correcta y abrir la URL efectiva devuelta por el despliegue. Comprobar carga, estilos, presentación del casamiento, destino del enlace de invitación y consulta/copia en escritorio y móvil. Registrar versión, ejecución y URL efectiva en VALIDATION.md.

Referencia: [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Trabajo futuro

Las nuevas tareas requieren autorización concreta. Se entregan en una rama y borrador de PR para revisión. No fusionar ni ejecutar el workflow de publicación sin dirección explícita para ese cambio. Ver `ROADMAP.md`.
