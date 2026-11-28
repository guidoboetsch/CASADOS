# Verificación de CASADOS

## Revisión local · grupos y edad de menores

El 28/11/2026 se verificaron en Chrome a 390 y 1440 px el recorrido desde el editor a la muestra, la conservación de un formulario externo anterior y la invitación exportada en HTML y ZIP. En el paquete del evento, con el servicio de Google simulado y sin tráfico externo, se confirmó una familia de tres; se verificaron la edad obligatoria de cada menor, un bebé de 0 años, el límite de 17, los cupos, el cambio de menor a adulto y una ausencia sin edad. Se simuló un corte **después** de guardar y el reintento no duplicó a nadie. El registro ficticio conservó sus filas anteriores y el contador devolvió solo el total.

Pruebas: `node --test tests/rsvp.test.cjs tests/event-live.test.cjs tests/salon.test.cjs` y `node tests/browser/rsvp.cjs` (Playwright y Chrome). No se usaron invitados reales, no se modificó una planilla ni se desplegó una aplicación. Para activar un evento queda probar su despliegue autorizado de Apps Script, el acceso anónimo con pase y la consulta desde un teléfono físico.

## Revisión local · cuenta regresiva y personas confirmadas

El 28/11/2026 se probaron los dos bloques en el editor y en la invitación descargada, en Chrome a 390 y 1440 px. Un invitado en otro huso vio el mismo instante de inicio; se verificaron el último segundo, el día del evento y el mensaje posterior. El recuento leyó una fuente ficticia al abrir y cada minuto: aumentó, bajó, marcó un cero real y se recuperó de un corte sin mostrar datos personales. El HTML y el del ZIP coincidieron; quitar el bloque excluyó su fuente y un borrador anterior conservó sus seis bloques originales.

Pasaron las diez pruebas de `node --test tests/event-live.test.cjs tests/salon.test.cjs`, incluida la lectura de identificadores únicos y rectificaciones con el servicio de Sheets simulado. La prueba de navegador reproducible es `node tests/browser/event-live.cjs` (requiere Playwright y Chrome). También pasaron las verificaciones anteriores de colección y salón. No se conectó un registro real, no se modificaron confirmaciones y no se desplegó la web ni el adaptador. Quedan para el alta de cada evento la prueba anónima desde su dominio con el registro autorizado y la revisión en un teléfono físico.

## Revisión local · estudio del salón y servicios por evento

En la versión de trabajo del 28/11/2026 se probó el recorrido desde el editor a la maqueta en Chrome a 1440 y 390 px. Movimiento en 3D con mouse y tacto emulado, coordenadas compartidas con la planta, restauración tras recargar, deshacer/rehacer, plazas, giro, salones iniciales, ajuste de medidas y referencia local. La edición en planta también se verificó con WebGL deshabilitado. Las pruebas del modelo cubren límites, numeración, proyecciones y borradores inválidos.

Desde la portada se verificaron «Nosotros» y la preparación del enlace al redactor de correo, sin enviar mensajes. Se probaron los cuatro diseños, la lista propia de regalos con ideas añadidas sin duplicar y el ZIP con ruta personalizada. Se comprobó su integridad y se leyó el HTML extraído. No se habilitaron cobros, no se publicaron invitaciones de prueba y no se usó correspondencia real. Pendiente: prueba en un teléfono físico, un acuse con una nueva consulta real y verificación pública tras autorizar el despliegue.

## Fondo negro e invitación de Guido y María

El 27/11/2026 se publicó `7c45e06cee18684f0ab92aad46099efd6a5d12aa` en [CASADOS](https://guidoboetsch.github.io/CASADOS/) ([ejecución de Pages](https://github.com/guidoboetsch/CASADOS/actions/runs/46062340385)).

Verificado desde el enlace público en Chrome a 390 y 1440 px con preferencia de sistema clara: fondo negro, navegación a la sección de Guido y María, fecha del 21 de noviembre de 2026 y destino del botón de invitación. La preparación y copia de la consulta funcionaron sin errores de página ni desborde horizontal. HTML, CSS y JavaScript coincidieron con la versión revisada. La vista móvil fue emulada; no se enviaron respuestas al sitio del casamiento.

## Publicación inicial

Edición comercial con datos ficticios. El paquete web es `dist/`; la planilla y los datos del casamiento real no forman parte del repositorio.

Prueba local del 27/11/2026: JavaScript válido y Chrome a 1440 y 390 px sin desborde ni errores de página. Se verificaron los recursos bajo `/CASADOS/`, el botón rojo, asistencia ficticia, mesa, regalos y la preparación y copia de una consulta.

Publicación verificada el 27/11/2026: [sitio público](https://guidoboetsch.github.io/CASADOS/), [ejecución exitosa de Pages](https://github.com/guidoboetsch/CASADOS/actions/runs/46058688636), versión `f604f89dff1775314dcc2af184e1296bb13fcf49`.

La portada, la hoja de estilos y el JavaScript públicos coincidieron con los archivos locales (normalizando saltos de línea). Se repitieron las mismas pruebas en la URL pública en Chrome a 1440 y 390 px; ambas pasaron. La vista móvil fue emulada, no probada en un dispositivo físico. No se probaron pagos ni persistencia: la demo no los habilita.
