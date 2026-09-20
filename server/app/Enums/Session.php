<?php

namespace App\Enums;

enum Session: string
{
    case MORNING = 'MORNING';
    case LUNCH = 'LUNCH';
    case EVENING = 'EVENING';
    case AFTERNOON = 'AFTERNOON';
}
