import type { FoodStatus } from "@/api/types/foods";

export type Rarity = "C" | "UC" | "SR" | "SSR";
export type FoodRank = Rarity;

export type MealSession = "Sáng sớm" | "Giữa trưa" | "Chiều" | "Tối";

export type TimePeriod = "morning" | "night";

export type DietaryFilter = "all" | "veg" | "meat";

export type SessionFilter = "all" | "auto" | MealSession;

export interface FoodItem {
  id: number;
  food_id: number;
  name: string;
  description: string;
  image_url?: string | null;
  imagePath: string;
  status: FoodStatus;
  food_rank: FoodRank;
  rarity: Rarity;
  rating_score?: number | null;
  cd?: number | null;
  created_at?: string | null;
  contributor_id?: number | null;
  isFavorite?: boolean;
  is_favorited?: boolean;
  is_hated?: boolean;
  is_eaten?: boolean;
  favorites_count?: number;
  hated_count?: number;
  eaten_count?: number;
  sub?: string;
  sessions?: string[];
  veg?: boolean;
}

