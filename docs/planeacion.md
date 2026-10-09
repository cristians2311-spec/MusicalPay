# Planeación aprobada de MusicalPay

Estado: aprobada para implementación el 9 de octubre de 2026.

## Propósito

MusicalPay centraliza la operación administrativa de Cristian Santiago Music. Su flujo principal cubre cotización, reserva, evento, formación, participación real, cobros, gastos, obligaciones y pagos.

La primera versión es privada para una agrupación y un solo propietario. Clientes y músicos no tendrán cuenta. El sistema funcionará con internet desde Chrome de escritorio y iPhone, mediante Wi-Fi o datos móviles.

## Límites

- Servicios gratuitos mientras su capacidad resulte suficiente.
- Sin registro público, pagos en línea, facturación, PWA ni modo sin conexión.
- Sin anticipos a músicos o proveedores.
- Todos los gastos pertenecen a un evento.
- No se importará historia financiera anterior.
- Los movimientos financieros originales no se sobrescriben ni eliminan.

## Módulos de la primera versión

1. Acceso con Google y autorización explícita del propietario.
2. Clientes, músicos, roles y formación habitual.
3. Cotizaciones con opciones, revisiones inmutables y PDF.
4. Eventos, agenda, asignaciones, reemplazos y participación real.
5. Cobros, devoluciones, gastos, obligaciones y pagos agrupados.
6. Inicio, avisos diarios, estadísticas y reporte por músico.
7. Auditoría, archivos privados y respaldos verificables.

## Reglas financieras esenciales

- Todo importe se expresa en COP enteros, sin punto flotante.
- Una persona puede cubrir varios roles en un evento con una sola remuneración total.
- La deuda a un músico nace cuando el evento se marca realizado y su participación real se confirma.
- Un pago puede cubrir varias obligaciones del mismo beneficiario y puede ser parcial.
- El propietario también puede ser acordeonero; su remuneración es un costo independiente de la utilidad.
- Una cancelación previa a la presentación no crea deuda a músicos y exige registrar la devolución total de lo recibido del cliente.
- Utilidad y caja se calculan por separado.

## Identidad y formatos

- Nombre: Cristian Santiago Music.
- Moneda: COP sin centavos.
- Zona horaria: America/Bogota.
- Fecha: dd/mm/aaaa.
- Hora: 12 horas con a. m./p. m.
- Consecutivos: COT, EVT, COB y PAG con seis dígitos.
- Una tanda equivale a una hora; se permiten medias tandas y descansos separados.

## Roles iniciales

Voz, acordeón, caja, guacharaca, bajo, guitarra y auxiliar. Los roles son configurables. Sonidista y conductor se registran como gastos.

## Estados principales

- Cotización: borrador, enviada, aceptada, rechazada, vencida o cancelada.
- Evento: pendiente, confirmado, realizado o cancelado.
- El estado financiero se maneja por separado del estado operativo.

## Seguridad

- RLS en todas las tablas expuestas.
- Identidad autorizada almacenada en datos controlados por la aplicación, nunca en `user_metadata`.
- Credenciales privilegiadas exclusivas del servidor.
- Storage privado y archivos validados.
- Reautenticación lógica de las operaciones sensibles.
- Auditoría de correcciones, cancelaciones, reprogramaciones y reaperturas.

## Experiencia

Navegación móvil: Inicio, Cotizaciones, Eventos, Pagos y Más. En escritorio se utiliza una barra lateral. La interfaz debe ser clara, táctil, accesible y conservar los datos del formulario ante errores recuperables.

## Criterio de terminación

La primera versión debe demostrar el recorrido completo desde una cotización con alternativas hasta el pago agrupado a músicos, además de saldos, reportes, seguridad, uso en iPhone y restauración de respaldo.

Las decisiones completas DEC-001 a DEC-245 permanecen registradas en la conversación de planeación y prevalecen ante cualquier resumen ambiguo de este archivo.

