# Registro maestro por casamiento

Propuesta para la integración. La demo estática no guarda respuestas y no está conectada a una planilla.

## Un archivo por evento

- Invitados: una fila por persona, incluso acompañantes. ID fijo, nombre, grupo, asistencia, menú, restricciones, ID de mesa, capitán e ID de traslado. Ni el nombre ni el número de fila identifican a una persona: pueden repetirse o cambiar.
- Mesas y Transporte: catálogos de mesas y viajes con capacidad. La asignación se hace una sola vez, en Invitados. Solo los confirmados ocupan plazas. Renumerar una mesa no cambia su ID.
- Resumen: totales y confirmados sin mesa. Cocina, capitanes y pasajeros usan vistas de la misma lista, no copias para completar por separado.

### Inscripción individual, en pareja o en familia

El [formulario de grupos](tools/rsvp/README.md) registra a cada asistente con su propio ID, el mismo grupo y su modalidad. Para alguien que va, «Menor» indica si tendrá menos de 18 años al día de la fiesta; «Edad al evento» es un entero de 0 a 17 solo para menores. **0 es un bebé de menos de un año, no un dato faltante**. La edad de adultos y ausentes queda vacía y no se pide fecha de nacimiento. Una ausencia de toda la invitación registra solamente a quien avisa, con asistencia «No».

Para el salón, el organizador puede filtrar en su registro privado por **Asistencia = Sí** y **Menor = Sí** y consultar Nombre y Edad al evento. Si hace falta compartir el resultado, entregar solo las columnas autorizadas, nunca el archivo maestro ni los pases. Las edades no se incorporan a la invitación, el buscador de mesas ni el recuento público.

## Cómo conectarlo

1. Probar con un evento ficticio. Los organizadores son los únicos con edición completa. El responsable del evento define quién ve datos personales o alimentarios. Un filtro de Sheets no es una barrera de privacidad.
2. Agregar un servicio privado entre la web y Sheets. Cada invitación identifica el evento y su grupo. El servicio valida esa invitación y escribe solo asistencia, preferencias alimentarias y solicitud de traslado. La asignación de vehículo, mesa y capitán queda en manos del equipo. Separar solicitud y asignación de transporte antes de activar confirmaciones públicas.
3. Registrar cada envío con identificador único y fecha. Reintentar un envío no crea otra persona; una rectificación conserva el evento anterior en el historial. Ante cambios concurrentes, revisar conflictos antes de sobrescribir. Los acompañantes nuevos quedan pendientes de aprobación.
4. La app de mesas consulta ese mismo registro. Mover a alguien actualiza su ID de mesa; la geometría del salón se guarda por separado. Los proveedores reciben solo la vista autorizada a través de la app, sin el enlace al archivo maestro.
5. Antes de usar datos reales, hacer copia, reconciliar invitados, plazas y asignaciones, y probar un reenvío, una corrección, homónimos y la recuperación de un cambio. Cada cliente recibe su propio archivo y permisos. Ningún enlace privado ni credencial en la web comercial.

## Contador público de confirmados

El formulario de RSVP y el contador cumplen funciones distintas. El formulario (o su integración) tiene que mantener actualizado el registro privado de **ese evento**. El contador **solo lee**: debe haber una fila de estado actual por persona, incluidos los acompañantes, con un ID estable. No usar respuestas crudas por grupo ni sumar el historial de envíos. Dos personas con el mismo nombre pueden tener IDs diferentes.

**Si ya existe un servicio de RSVP**, puede exponer por HTTPS un resumen sin credenciales, con acceso CORS desde la invitación y el editor: solo `{"confirmados": 12}` como `application/json`, con un entero no negativo. El total es público para cualquiera que tenga esa dirección. No publicar un registro de invitados ni pasar tokens o el enlace de un formulario. Al rectificar una asistencia, también puede bajar.

**Adaptador opcional para Sheets** (no desplegado automáticamente):

1. Probar con una planilla privada ficticia. En la pestaña `Invitados`, la primera fila debe tener las columnas `ID` y `Asistencia` (en cualquier orden). Cada acompañante lleva su propia fila. Usar «Sí», «No» o «Pendiente»; una celda vacía significa pendiente. Cambiar el estado de la misma fila si la persona rectifica. Los IDs repetidos con el mismo estado de asistencia cuentan una vez; estados incompatibles para el mismo ID o datos ilegibles dejan el total no disponible hasta corregirlos.
2. Crear un proyecto Apps Script por evento, copiar [Code.gs](tools/confirmados/Code.gs) y su [manifiesto](tools/confirmados/appsscript.json). La única autorización solicitada para los datos es Sheets de solo lectura. Configurar la propiedad del script `KAZA_REGISTRO_ID` con el ID de esa planilla; no incluirlo en el editor. Si se usa un proyecto estándar de Google Cloud, habilitar también la API de Google Sheets.
3. Con autorización del responsable para mostrar el **total**, [desplegar el script como aplicación web](https://developers.google.com/apps-script/guides/web), ejecutado por el propietario, con acceso anónimo al resumen. No compartir la planilla ni habilitar «Publicar en la web» en Sheets. Si el dominio no permite acceso anónimo al resumen, usar otro servicio autorizado u omitir el bloque. El script no tiene escritura, no acepta parámetros de evento, no devuelve filas y reutiliza solo el total durante hasta 20 segundos.
4. En el editor, agregar **contador de confirmados**, pegar la URL de producción terminada en `/exec` y tocar **Probar conexión** en la vista previa. Revisar también desde el origen final de la invitación, sin iniciar sesión, con una confirmación ficticia, un acompañante y una baja. No se permite exportar una fuente que no haya pasado la comprobación de esa sesión. El archivo descargado lleva la dirección del resumen, no una copia del resultado ni de los invitados.
