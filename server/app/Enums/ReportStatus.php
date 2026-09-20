<?php

namespace App\Enums;

enum ReportStatus: string
{
    case RESOLVED = 'RESOLVED';
    case PENDING = 'PENDING';
}
