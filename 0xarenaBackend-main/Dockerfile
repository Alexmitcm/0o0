FROM php:8.2-apache

# Install system libraries and PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Enable allow_url_fopen (useful for file_get_contents and similar)
RUN echo "allow_url_fopen=On" >> /usr/local/etc/php/php.ini

# Set working directory
WORKDIR /var/www/html

# Clean default Apache directory and copy app files
RUN rm -rf /var/www/html/*
COPY . /var/www/html

# Fix file permissions (optional but useful)
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80
