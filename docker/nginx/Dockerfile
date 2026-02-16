FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        bash \
        git \
        nginx \
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
        pdo_pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -f /etc/nginx/http.d/default.conf \
    && mkdir -p /run/nginx

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/nginx/start.sh /usr/local/bin/start.sh
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

RUN chmod +x /usr/local/bin/start.sh

WORKDIR /var/www/html

EXPOSE 8000 5173

CMD ["/usr/local/bin/start.sh"]
