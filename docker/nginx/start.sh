#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ -f composer.json ]; then
    composer install --no-interaction --prefer-dist
fi

php-fpm -D
exec nginx -g 'daemon off;'
