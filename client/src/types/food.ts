import type { FoodStatus } from "@/api/types/foods";

export type Rarity = "C" | "UC" | "SR" | "SSR";
export type FoodRank = Rarity;

export type MealSession = "Sáng sớm" | "Giữa trưa" | "Chiều" | "Tối";

export type TimePeriod = "morning" | "midday" | "afternoon" | "night";

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
  rank: FoodRank;
  rarity: Rarity;
  favorite_count: number;
  eaten_count: number;
  created_at?: string | null;
  contributor_id?: number | null;
  contributor?: {
    user_id?: number;
    username?: string | null;
  } | null;
  isFavorite?: boolean;
  sub?: string;
  sessions?: string[];
  veg?: boolean;
}

