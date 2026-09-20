<?php

namespace App\Enums;

enum FoodStatus: string
{
    case ACTIVE = 'ACTIVE';
    case PENDING = 'PENDING';
    case DISABLED = 'DISABLED';
}
