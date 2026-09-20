<?php

namespace App\Enums;

enum MaternityStatus: string
{
    case FIRST_3_MONTHS = 'FIRST_3_MONTHS';
    case MID_3_MONTHS = 'MID_3_MONTHS';
    case FINAL_3_MONTHS = 'FINAL_3_MONTHS';
    case BREASTFEEDING = 'BREASTFEEDING';
}
