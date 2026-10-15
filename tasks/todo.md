# Trabajo pendiente de MusicalPay v1

## Fase 1: Equipo

- [x] **T1. Catálogo de músicos.** Crear, listar, asignar uno o varios roles y archivar
  músicos; validar nombre, teléfono y pertenencia de los roles a la agrupación.
- [x] **T2. Roles configurables.** Crear, ordenar, activar y desactivar roles sin
  eliminar los que ya tengan historial.
- [ ] **T3. Formación habitual.** Elegir un músico sugerido por rol y conservar una
  sola formación predeterminada activa.

### Punto de control

- [ ] El propietario y los músicos aparecen con sus roles; la formación habitual se
  puede usar como base sin cambiar datos históricos.

## Fase 2: Cotizaciones

- [ ] **T4. Edición de borradores.** Reabrir un borrador, cambiar opciones y conservar
  los datos del formulario ante errores.
- [ ] **T5. Presupuesto por opción.** Asociar músicos, pago propio y gastos estimados a
  cada alternativa, mostrando costo y utilidad esperada.
- [ ] **T6. Revisiones y emisión.** Numerar COT, congelar cada revisión emitida y crear
  una revisión nueva al negociar cambios.
- [ ] **T7. PDF y compartir.** Generar el documento profesional con vigencia y opciones,
  descargarlo y abrir el menú de compartir disponible en el dispositivo.
- [ ] **T8. Decisión del cliente.** Registrar opción aceptada, rechazo, vencimiento o
  cancelación y crear el evento cuando corresponda.

### Punto de control

- [ ] Una cotización completa llega desde borrador hasta evento confirmado y el PDF
  coincide con la revisión aceptada.

## Fase 3: Eventos

- [x] **T9. Agenda y evento manual.** Crear eventos sin cotización y mostrar agenda por
  fecha con estado operativo y financiero separados.
- [ ] **T10. Asignaciones.** Aplicar la formación habitual, reemplazar músicos por
  presentación y evitar dobles asignaciones dentro del mismo evento.
- [ ] **T11. Realización y cancelación.** Confirmar participación real, reprogramar o
  cancelar; una cancelación previa no debe crear obligaciones.

## Fase 4: Finanzas

- [x] **T12. Cobros y devoluciones.** Registrar abonos, saldo del cliente y devolución
  total cuando se cancele un evento con dinero recibido.
- [x] **T13. Gastos.** Registrar gastos únicamente dentro de un evento y reflejarlos en
  caja y utilidad.
- [x] **T14. Obligaciones.** Al realizar el evento, generar una deuda por músico según
  su participación real y remuneración total acordada.
- [ ] **T15. Pagos agrupados.** Registrar un pago total a un músico, distribuirlo entre
  varias obligaciones y admitir pagos parciales.

### Punto de control

- [ ] Un fin de semana con varios músicos produce saldos correctos por persona y puede
  pagarse sin perder el detalle por evento.

## Fase 5: Control y salida

- [ ] **T16. Inicio y avisos.** Mostrar próximos eventos, valor contratado, cobros,
  pagos y gastos pendientes; avisar una vez al día por saldos posteriores al evento.
- [x] **T17. Estadísticas y reporte.** Filtrar por mes y generar el reporte por músico
  con cantidad de eventos y valor contratado.
- [ ] **T18. Auditoría y documentos.** Registrar operaciones sensibles y conservar PDFs
  en almacenamiento privado con validación.
- [ ] **T19. Respaldo recuperable.** Crear el respaldo manual para USB y comprobar que
  puede restaurarse.
- [ ] **T20. Seguridad y producción.** Ejecutar auditoría, probar Chrome e iPhone,
  configurar el dominio de producción y desplegar sin servicios de pago adicionales.

### Criterio de cierre

- [ ] El recorrido cotización → evento → cobro/gasto → obligación → pago funciona de
  extremo a extremo y todas las verificaciones automáticas pasan.
