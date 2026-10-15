# Plan de implementación: MusicalPay v1

## Estado actual

La base técnica está lista: acceso privado con Google, aislamiento por agrupación,
modelo financiero con RLS, interfaz adaptable, clientes y borradores de cotización
con varias opciones. La aplicación todavía no completa el recorrido operativo desde
la aceptación de una cotización hasta el pago a los músicos.

## Orden de dependencias

```text
Músicos, roles y formación
        ↓
Presupuesto y ciclo completo de cotización
        ↓
Evento, agenda y participación real
        ↓
Cobros, gastos y obligaciones
        ↓
Pagos agrupados
        ↓
Inicio, alertas, estadísticas y reportes
        ↓
Auditoría, respaldo, seguridad y despliegue
```

## Decisiones de implementación

- Cada módulo se entregará como un recorrido vertical verificable.
- `src/app` conservará solo páginas y rutas; la lógica vivirá en `src/features`.
- Todos los accesos a datos conservarán el filtro por `band_id` además de RLS.
- Los movimientos financieros serán inmutables y se corregirán con registros nuevos.
- Cada incremento debe superar lint, tipos, pruebas y compilación antes de publicarse.

## Fases

1. **Equipo:** músicos, roles configurables y formación habitual.
2. **Venta:** edición, revisiones, emisión, PDF, compartir y aceptación de cotizaciones.
3. **Operación:** eventos, agenda, asignaciones, reemplazos y participación real.
4. **Finanzas:** cobros, devoluciones, gastos, obligaciones y pagos agrupados.
5. **Control:** inicio real, avisos diarios, estadísticas y reporte por músico.
6. **Salida a producción:** auditoría, documentos privados, respaldo, revisión de
   seguridad, pruebas en iPhone y despliegue.

## Riesgos controlados

| Riesgo | Control |
| --- | --- |
| Crear saldos incorrectos | Probar las transiciones financieras y mantener movimientos inmutables |
| Mezclar datos entre agrupaciones | RLS, filtro por `band_id` y pruebas de acceso |
| Perder datos al fallar un formulario | Validación del servidor y conservación de entradas recuperables |
| Consumir servicios pagos | Mantener Supabase y alojamiento dentro de los planes gratuitos |

El detalle ejecutable y sus criterios de aceptación están en `tasks/todo.md`.
