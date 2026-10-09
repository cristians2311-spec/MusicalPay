# MusicalPay

Aplicación privada para administrar cotizaciones, eventos, músicos, cobros, pagos y gastos de **Cristian Santiago Music**.

## Requisitos

- Node.js 22 o superior.
- Un proyecto de Supabase.
- Un proveedor Google configurado en Supabase Auth.

## Desarrollo local

1. Copia `.env.example` como `.env.local`.
2. Completa la URL y la publishable key de Supabase.
3. Define `AUTHORIZED_OWNER_EMAIL` con la cuenta de Google autorizada.
4. Instala dependencias con `npm install`.
5. Ejecuta `npm run dev`.

Las credenciales privadas, respaldos y datos reales no deben entrar al repositorio.

## Verificación

```text
npm run lint
npm run typecheck
npm test
npm run build
```

La fuente de verdad funcional está en [docs/planeacion.md](docs/planeacion.md).

