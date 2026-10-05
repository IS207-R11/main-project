import { PaginationParams } from './common';

export type MeasuringMethod = 'STANDING' | 'LAYING';

export type LaborLevel = 'LOW' | 'MID' | 'HEAVY';

export type MaternityStatus =
  | 'FIRST_3_MONTHS'
  | 'MID_3_MONTHS'
  | 'FINAL_3_MONTHS'
  | 'BREASTFEEDING';

export interface HealthProfile {
  profile_id: number;
  user_id: number;
  weight: number;
  height: number;
  date_of_measuring: string | null;
  measuring_method: MeasuringMethod;
  labor_level: LaborLevel | null;
  maternity_status: MaternityStatus | null;
}

export interface CreateHealthProfileRequest {
  weight: number;
  height: number;
  date_of_measuring: string;
  measuring_method: MeasuringMethod;
  labor_level?: LaborLevel;
  maternity_status?: MaternityStatus;
}

export type UpdateHealthProfileRequest = Partial<CreateHealthProfileRequest>;

export type ListHealthProfilesParams = PaginationParams;
