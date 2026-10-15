# MusicalPay

Aplicación privada para administrar cotizaciones, eventos, músicos, cobros, pagos y gastos de **Cristian Santiago Music**.

## Requisitos

- Node.js 22 o superior.
- Un proyecto de Supabase.
- Un proveedor Google configurado en Supabase Auth.

## Desarrollo local

1. Copia `.env.example` como `.env.local`.
2. Completa la URL y la publishable key de Supabase.
3. Conserva `AUTHORIZED_OWNER_EMAIL=cristians2311@gmail.com`, la única cuenta autorizada.
4. Instala dependencias con `npm install`.
5. Ejecuta `npm run dev`.

Las credenciales privadas, respaldos y datos reales no deben entrar al repositorio.

## Verificación

```text
npm run lint
npm run typecheck
npm test
npm run test:migrations
npm run build
```

## Estructura del proyecto

```text
src/
├── app/          # Páginas, layouts y rutas de Next.js
├── components/   # Marca, estructura visual y controles compartidos
├── features/     # Módulos de negocio: autenticación, clientes y cotizaciones
└── lib/          # Configuración e integraciones de infraestructura
```

Las migraciones y políticas de la base de datos viven en `supabase/`, los recursos
públicos en `public/` y la documentación funcional en `docs/`.

La fuente de verdad funcional está en [docs/planeacion.md](docs/planeacion.md).
La conexión inicial de Supabase está documentada en [docs/configuracion-supabase.md](docs/configuracion-supabase.md).

