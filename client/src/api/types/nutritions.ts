import { SortablePaginationParams } from './common';

export interface Nutrition {
  nutrition_id: number;
  nutrition_name: string;
  calories: number | null;
  serving_size_g: number | null;
  fat_total_g: number | null;
  fat_saturated_g: number | null;
  fat_trans_g: number | null;
  protein_g: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  cholesterol_mg: number | null;
  carbohydrates_total_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
}

export interface NutritionOption {
  nutrition_id: number;
  nutrition_name: string;
}

export interface CreateNutritionRequest {
  nutrition_name: string;
  calories?: number | null;
  serving_size_g?: number | null;
  fat_total_g?: number | null;
  fat_saturated_g?: number | null;
  fat_trans_g?: number | null;
  protein_g?: number | null;
  sodium_mg?: number | null;
  potassium_mg?: number | null;
  cholesterol_mg?: number | null;
  carbohydrates_total_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
}

export type UpdateNutritionRequest = Partial<CreateNutritionRequest>;

export type ListNutritionsParams = SortablePaginationParams;
