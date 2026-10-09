# Configuración de Supabase

Esta guía se ejecutará cuando exista el proyecto gratuito de Supabase. No contiene credenciales.

## 1. Proyecto y variables

1. Crea el proyecto de Supabase.
2. Copia `.env.example` como `.env.local`.
3. Completa la URL y la publishable key. La única cuenta autorizada ya está definida como `cristians2311@gmail.com`.
4. No utilices una secret key o `service_role` en variables `NEXT_PUBLIC_*`.

## 2. Google Auth

1. En Google Auth Platform crea un cliente OAuth de tipo **Aplicación web**.
2. Configura la audiencia como externa, mantén la aplicación en modo de prueba y agrega `cristians2311@gmail.com` como usuario de prueba.
3. Conserva únicamente los scopes `openid`, correo y perfil.
4. En **Orígenes autorizados de JavaScript** registra:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

5. En **URI de redireccionamiento autorizados** de Google registra el callback que muestra el proveedor Google dentro de Supabase. Para el proyecto alojado tendrá esta forma:

- `https://REFERENCIA-DEL-PROYECTO.supabase.co/auth/v1/callback`

6. En Supabase abre **Authentication → Providers → Google**, activa el proveedor y guarda el Client ID y Client Secret creados en Google.
7. En **Authentication → URL Configuration** configura:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Redirect URL adicional: `http://127.0.0.1:3000/auth/callback`

Cuando exista el dominio de producción, agrega también `https://DOMINIO-ASIGNADO/auth/callback` a la lista de Supabase. El callback de Google seguirá siendo el callback del proyecto Supabase.

El registro público no forma parte del producto. El callback compara el correo autenticado con `AUTHORIZED_OWNER_EMAIL`; RLS exige además una fila activa en `app_users`.

## 3. Base de datos

Aplica las migraciones en orden. La ruta recomendada es vincular la CLI y ejecutar:

```text
npx supabase login
npx supabase link --project-ref REFERENCIA-DEL-PROYECTO
npx supabase db push
```

Antes de producción se debe comprobar el esquema mediante una base local o temporal y ejecutar los asesores de seguridad y rendimiento.

En este equipo no está disponible Docker. Las migraciones se validan automáticamente en PostgreSQL embebido con `npm run test:migrations`; después de aplicarlas al proyecto alojado también se deben ejecutar los asesores de seguridad y rendimiento de Supabase.

## 4. Propietario inicial

1. Inicia sesión una vez con Google para que Supabase cree el usuario en `auth.users`.
2. Confirma que `supabase/snippets/bootstrap_owner.sql` usa `cristians2311@gmail.com`.
3. Ejecuta el script una sola vez desde el SQL Editor.
4. Cierra y vuelve a abrir la sesión.

El script crea la agrupación, tu perfil de acordeonero, los roles iniciales, la formación habitual, las categorías y los medios de pago.

## 5. Verificaciones obligatorias

- Una segunda cuenta de Google no puede leer ni escribir filas.
- Alterar `band_id` o identificadores relacionados no cruza agrupaciones.
- Los documentos solo se leen desde rutas cuyo primer segmento es el `band_id` autorizado.
- Una cotización emitida no puede modificar su revisión ni su presupuesto.
- Cobros, pagos, devoluciones y aplicaciones no aceptan UPDATE o DELETE.
- Las aplicaciones nunca exceden el pago ni la obligación y pertenecen al mismo beneficiario.
- Una devolución nunca excede el movimiento original.

