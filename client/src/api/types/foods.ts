import { PaginationParams } from './common';

export type FoodStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';
export type FoodRank = 'C' | 'UC' | 'SR' | 'SSR';

export interface FoodCard {
  food_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  status: FoodStatus;
  food_rank?: FoodRank;
  created_at: string | null;
  contributor_id: number | null;
  rating_score?: number | null;
  cd?: number | null;
  is_favorited?: boolean;
  is_hated?: boolean;
  is_eaten?: boolean;
  favorites_count?: number;
  hated_count?: number;
  eaten_count?: number;
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
  note: string | null;
  created_at: string | null;
  contributor_id: number | null;
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
  status?: FoodStatus | 'ALL';
  food_rank?: FoodRank;
  sort_by?: 'name' | 'created_at' | 'rating_score' | 'cd' | 'food_rank';
  sort_order?: 'asc' | 'desc';
}

export type ExclusionType = 'newest' | 'oldest' | 'random';

export interface GachaRequest {
  numberOfExcludedEaten?: number;
  typeOfExcludedEaten?: ExclusionType;
  excludedGachaSet?: boolean;
  foodSet?: number[];
}

export interface TinderRequest {
  numberOfExcludedEaten?: number;
  typeOfExcludedEaten?: ExclusionType;
  excludedGachaSet?: boolean;
  numberOfResult?: number;
  foodSet?: number[];
}

export interface CreateFoodRequest {
  name: string;
  description: string;
  image_url: string;
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

