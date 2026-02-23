# =============================================================================
# Stage 1 — Build React / Vite frontend
# =============================================================================
FROM node:22-alpine AS js-builder

WORKDIR /app

COPY js/package*.json ./
RUN npm ci --prefer-offline

# VITE_BACKEND_URL must be passed as a build ARG from Render's environment
# (Dashboard → Service → Environment → Add Build Variable)
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

COPY js/ ./
RUN npm run build


# =============================================================================
# Stage 2 — Production image: PHP 8.4-FPM + Nginx
# =============================================================================
FROM php:8.4-fpm-alpine

# ── System packages + PHP extensions ─────────────────────────────────────────
RUN apk add --no-cache \
        bash \
        nginx \
        gettext \
        icu-dev \
        libpq-dev \
        libzip-dev \
        oniguruma-dev \
        unzip \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && docker-php-ext-install \
        bcmath \
        intl \
        mbstring \
        opcache \
        pdo_pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -f /etc/nginx/http.d/default.conf \
    && mkdir -p /run/nginx /etc/nginx/templates

# ── OPcache tuning for production ─────────────────────────────────────────────
RUN { \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=256"; \
    echo "opcache.interned_strings_buffer=16"; \
    echo "opcache.max_accelerated_files=20000"; \
    echo "opcache.revalidate_freq=0"; \
    echo "opcache.validate_timestamps=0"; \
    echo "opcache.fast_shutdown=1"; \
} > /usr/local/etc/php/conf.d/opcache.ini

# ── Composer ──────────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── Laravel application ───────────────────────────────────────────────────────
WORKDIR /var/www/html

COPY php/ .

RUN composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── React SPA static build ────────────────────────────────────────────────────
COPY --from=js-builder /app/dist /var/www/spa

# ── Nginx config template (PORT is substituted at container start) ────────────
COPY docker/deployRender/nginx.conf.template /etc/nginx/templates/default.conf.template

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY docker/deployRender/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Render injects $PORT at runtime (default 10000)
EXPOSE 10000

CMD ["/usr/local/bin/start.sh"]
