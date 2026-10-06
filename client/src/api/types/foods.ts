import { PaginationParams } from './common';

export type FoodStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';
export type FoodRank = 'C' | 'UC' | 'SR' | 'SSR';

export interface FoodCard {
  food_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  status: FoodStatus;
  rank?: FoodRank;
  created_at: string | null;
  contributor_id: number | null;
  favorite_count: number;
  eaten_count: number;
  contributor?: {
    user_id?: number;
    username?: string | null;
  } | null;
}

export interface FoodOption {
  food_id: number;
  name: string;
}

export interface UserFoodItem {
  food_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  status: FoodStatus;
  rank?: FoodRank;
  note: string | null;
  created_at: string | null;
  contributor_id: number | null;
  favorite_count: number;
  eaten_count: number;
}

export interface EatenFood {
  eaten_id: number;
  user_id: number;
  food_id: number;
  note: string | null;
  created_at: string | null;
  food?: FoodCard;
}

export interface ListFoodsParams extends PaginationParams {
  search?: string;
  status?: FoodStatus;
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export type ExclusionType = 'newest' | 'oldest' | 'random';

export interface GachaRequest {
  numberOfExcludedEaten?: number;
  typeOfExcludedEaten?: ExclusionType;
  numberOfExcludedGacha?: number;
  typeOfExcludedGacha?: ExclusionType;
  foodSet?: number[];
}

export interface CreateFoodRequest {
  name: string;
  description?: string;
  image_url?: string;
}

export interface UpdateFoodRequest {
  name?: string;
  description?: string;
  image_url?: string;
  status?: FoodStatus;
}

export interface ChangeFoodStatusRequest {
  status: FoodStatus;
}

export interface AddFavoriteFoodRequest {
  food_id: number;
  note?: string;
}

export interface UpdateFavoriteFoodRequest {
  food_id: number;
  note?: string;
}

export interface AddHatedFoodRequest {
  food_id: number;
  note?: string;
}

export interface UpdateHatedFoodRequest {
  food_id: number;
  note?: string;
}

export interface RecordEatenFoodRequest {
  food_id: number;
  note?: string;
}

export interface UpdateEatenFoodRequest {
  food_id?: number;
  note?: string;
}

export interface ListUserFoodParams extends PaginationParams {
  search?: string;
}

export interface ListEatenFoodParams extends PaginationParams {
  search?: string;
  sort_order?: 'asc' | 'desc';
}

