# Registro maestro por casamiento

Propuesta para la integración. La demo estática no guarda respuestas y no está conectada a una planilla.

## Un archivo por evento

- Invitados: una fila por persona, incluso acompañantes. ID fijo, nombre, grupo, asistencia, menú, restricciones, ID de mesa, capitán e ID de traslado. Ni el nombre ni el número de fila identifican a una persona: pueden repetirse o cambiar.
- Mesas y Transporte: catálogos de mesas y viajes con capacidad. La asignación se hace una sola vez, en Invitados. Solo los confirmados ocupan plazas. Renumerar una mesa no cambia su ID.
- Resumen: totales y confirmados sin mesa. Cocina, capitanes y pasajeros usan vistas de la misma lista, no copias para completar por separado.

## Cómo conectarlo

1. Probar con un evento ficticio. Los organizadores son los únicos con edición completa. El responsable del evento define quién ve datos personales o alimentarios. Un filtro de Sheets no es una barrera de privacidad.
2. Agregar un servicio privado entre la web y Sheets. Cada invitación identifica el evento y su grupo. El servicio valida esa invitación y escribe solo asistencia, preferencias alimentarias y solicitud de traslado. La asignación de vehículo, mesa y capitán queda en manos del equipo. Separar solicitud y asignación de transporte antes de activar confirmaciones públicas.
3. Registrar cada envío con identificador único y fecha. Reintentar un envío no crea otra persona; una rectificación conserva el evento anterior en el historial. Ante cambios concurrentes, revisar conflictos antes de sobrescribir. Los acompañantes nuevos quedan pendientes de aprobación.
4. La app de mesas consulta ese mismo registro. Mover a alguien actualiza su ID de mesa; la geometría del salón se guarda por separado. Los proveedores reciben solo la vista autorizada a través de la app, sin el enlace al archivo maestro.
5. Antes de usar datos reales, hacer copia, reconciliar invitados, plazas y asignaciones, y probar un reenvío, una corrección, homónimos y la recuperación de un cambio. Cada cliente recibe su propio archivo y permisos. Ningún enlace privado ni credencial en la web comercial.
