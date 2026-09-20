#!/bin/sh
set -e

# Render cấp cổng qua biến PORT (mặc định 10000)
PORT="${PORT:-10000}"
sed -ri "s/Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

cd /var/www/html

php artisan package:discover --ansi
php artisan storage:link || true
php artisan config:clear

# Sinh lại tài liệu Swagger ở MỖI lần deploy
php artisan l5-swagger:generate

# Bỏ comment nếu muốn tự migrate
# php artisan migrate --force

php artisan config:cache
php artisan route:cache
php artisan view:cache

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground