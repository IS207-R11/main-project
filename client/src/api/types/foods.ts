import { PaginationParams } from './common';
import { Nutrition } from './nutritions';

export type FoodStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';

export type FoodSession = 'MORNING' | 'LUNCH' | 'EVENING' | 'AFTERNOON';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface FoodCard {
  food_id: number;
  food_name: string;
  quip: string | null;
  sub: string | null;
  price: number | null;
  image_url: string | null;
  status: FoodStatus;
  note: string | null;
  is_veg: boolean;
  sessions: FoodSession[];
  nutritions: Nutrition[];
}

export interface FoodOption {
  food_id: number;
  food_name: string;
}

export interface EatenFoodItem {
  food: FoodCard[];
  quantity: number;
}

export interface EatenFood {
  user_id: number;
  eaten_food_id: number;
  meal_type: MealType;
  eaten_at: string | null;
  address: string | null;
  note: string | null;
  items: EatenFoodItem[];
}

export interface ListFoodsParams extends PaginationParams {
  session?: FoodSession;
  is_veg?: 0 | 1;
  price_range?: number[] | string;
  sort_by?: 'food_name' | 'price';
  sort_order?: 'asc' | 'desc';
}

export interface GachaParams {
  num?: number;
  session?: string;
  is_veg?: number;
  price_range?: number[] | string;
}

export interface CreateFoodRequest {
  food_name: string;
  is_veg: boolean;
  quip?: string;
  sub?: string;
  price?: number;
  image_url?: string;
  note?: string;
  sessions?: FoodSession[];
  nutritions?: number[];
}

export type UpdateFoodRequest = Partial<CreateFoodRequest>;

export interface ChangeFoodStatusRequest {
  status: FoodStatus;
}

export interface AddFavoriteFoodRequest {
  food_id: number;
}

export interface AddScannedFoodRequest {
  food_id: number;
}

export interface RecordEatenItemPayload {
  food_id: number;
  quantity: number;
}

export interface RecordEatenFoodRequest {
  meal_type: MealType;
  items: RecordEatenItemPayload[];
  eaten_at?: string;
  address?: string;
  note?: string;
}
