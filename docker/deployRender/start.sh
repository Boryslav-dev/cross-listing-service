#!/usr/bin/env sh
set -eu

# ── Inject $PORT into Nginx config ────────────────────────────────────────────
# envsubst replaces only $PORT, leaving other nginx $variables untouched
envsubst '$PORT' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/http.d/default.conf

# ── Laravel bootstrap ─────────────────────────────────────────────────────────
cd /var/www/html

php artisan storage:link --force 2>/dev/null || true

# Run migrations (--force skips the confirmation prompt in production)
# Note: if deploying multiple replicas, consider a one-off migration job
php artisan migrate --force

# Cache config/routes/views for production performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── Start services ────────────────────────────────────────────────────────────
php-fpm -D
exec nginx -g 'daemon off;'
