# Configuración de Supabase

Esta guía se ejecutará cuando exista el proyecto gratuito de Supabase. No contiene credenciales.

## 1. Proyecto y variables

1. Crea el proyecto de Supabase.
2. Copia `.env.example` como `.env.local`.
3. Completa la URL, la publishable key y el correo autorizado.
4. No utilices una secret key o `service_role` en variables `NEXT_PUBLIC_*`.

## 2. Google Auth

Habilita Google como proveedor y registra estas URL:

- Desarrollo: `http://localhost:3000/auth/callback`.
- Producción: `https://DOMINIO-ASIGNADO/auth/callback`.

El registro público no forma parte del producto. El callback compara el correo autenticado con `AUTHORIZED_OWNER_EMAIL`; RLS exige además una fila activa en `app_users`.

## 3. Base de datos

Aplica las migraciones en orden. Antes de producción se debe comprobar el esquema mediante una base local o temporal y ejecutar los asesores de seguridad y rendimiento.

En este equipo no está disponible Docker, por lo que la migración aún no ha sido ejecutada localmente. Esa comprobación es una puerta obligatoria antes de conectar datos reales.

## 4. Propietario inicial

1. Inicia sesión una vez con Google para que Supabase cree el usuario en `auth.users`.
2. Sustituye el correo en `supabase/snippets/bootstrap_owner.sql`.
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

