<?php

use App\Providers\AppServiceProvider;
use CloudinaryLabs\CloudinaryLaravel\CloudinaryServiceProvider;
use L5Swagger\L5SwaggerServiceProvider;

return [
    AppServiceProvider::class,
    L5SwaggerServiceProvider::class,
    CloudinaryServiceProvider::class,
];
