# cross-listing-service

Laravel API + React SPA с cookie-based авторизацией (Sanctum), Google OAuth, email verification и reset password.

## Стек

- Backend: Laravel 12, Sanctum, Socialite, PostgreSQL, Redis
- Frontend: React (Vite), React Router, React Query, Axios, React Hook Form, Zod, MUI
- Авторизация: session + httpOnly cookies (`withCredentials: true`)

## Локальные URL

- Frontend (через Nginx proxy): `http://127.0.0.1:5173`
- Backend API (через Nginx + php-fpm): `http://127.0.0.1:18080`

## Запуск в Docker

```bash
docker compose up --build -d
docker compose exec nginx php artisan migrate --force
```

Если порт занят, можно переопределить:

```bash
BACKEND_HOST_PORT=18081 FRONTEND_HOST_PORT=5174 docker compose up --build -d
```

## Архитектура контейнеров

- `nginx`: единственная HTTP-точка входа
- `php-fpm`: запускается внутри контейнера `nginx`
- `js`: Vite dev server, доступен только через Nginx proxy
- `postgres`, `redis`

## Backend ENV (`php/.env`)

- `APP_URL=http://127.0.0.1:18080`
- `FRONTEND_URL=http://127.0.0.1:5173`
- `SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,localhost:5173,127.0.0.1:18080,localhost:18080`
- `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173`
- `SESSION_DRIVER=database`
- `SESSION_SECURE_COOKIE=false` (для локалки)
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URI=http://127.0.0.1:18080/api/v1/auth/google/callback`

## Frontend ENV (`js/.env`)

- `VITE_BACKEND_URL=http://127.0.0.1:18080`

## Google OAuth Setup

1. В Google Cloud Console создайте OAuth 2.0 Client ID (тип `Web application`).
2. Добавьте `Authorized redirect URI`:
   - `http://127.0.0.1:18080/api/v1/auth/google/callback`
3. Добавьте `Authorized JavaScript origins`:
   - `http://127.0.0.1:5173`
   - `http://127.0.0.1:18080`
4. Внесите `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `php/.env`.
5. Перезапустите контейнер:
   - `docker compose restart nginx`

## SPA Auth Flow (Sanctum)

1. `GET /sanctum/csrf-cookie`
2. `POST /api/v1/auth/login` или `POST /api/v1/auth/register`
3. `GET /api/v1/auth/me`

Сессия хранится в httpOnly cookie. `localStorage` для токенов не используется.

## Google Login Flow

1. Frontend открывает `GET /api/v1/auth/google/redirect`
2. Пользователь проходит OAuth в Google
3. Callback приходит на `GET /api/v1/auth/google/callback`
4. Backend логинит пользователя в web-session и редиректит на `FRONTEND_URL/app?oauth=google`

## Пример Axios конфигурации

```js
import axios from 'axios'

const http = axios.create({
  baseURL: 'http://127.0.0.1:18080',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})
```

## API v1 Auth Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/google/redirect`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/logout` (auth:sanctum)
- `GET /api/v1/auth/me` (auth:sanctum)
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/email/verification-notification` (auth:sanctum)
- `GET /api/v1/auth/email/verify/{id}/{hash}` (signed URL, редирект на frontend)

## Лимиты

- Login: 5 попыток / минуту / `ip+email`
- Остальные auth-эндпоинты: 10 / минуту / `ip`
- Verification: 6 / минуту

## Audit Logs

Таблица: `audit_logs`

Фиксируются события:

- `auth.register`
- `auth.login`
- `auth.oauth.google.login`
- `auth.logout`
- `auth.email_verification_requested`
- `auth.email_verified`
- `auth.password_reset_requested`
- `auth.password_reset_completed`

## Тесты и проверка

Backend:

```bash
cd php
php artisan test
```

Frontend:

```bash
cd js
npm run lint
npm run build
```
