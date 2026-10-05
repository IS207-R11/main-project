FROM php:8.3-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip bcmath gd exif pcntl \
    && a2enmod rewrite headers remoteip \
    && sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && echo "UseCanonicalName Off" >> /etc/apache2/apache2.conf \
    && echo "UseCanonicalPhysicalPort Off" >> /etc/apache2/apache2.conf \
    && echo "SetEnvIf X-Forwarded-Proto \"^https$\" HTTPS=on" >> /etc/apache2/apache2.conf \
    && echo "RemoteIPHeader X-Forwarded-For" >> /etc/apache2/apache2.conf \
    && echo "RemoteIPInternalProxy 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 127.0.0.1" >> /etc/apache2/apache2.conf \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Cài dependency trước để tận dụng cache của Docker
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy source rồi hoàn tất autoload
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# sed xử lý trường hợp file bị CRLF khi soạn trên Windows
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 10000
ENTRYPOINT ["docker-entrypoint.sh"]