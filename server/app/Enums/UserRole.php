<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'ADMIN';
    case MODERATOR = 'MODERATOR';
    case USER = 'USER';
}
