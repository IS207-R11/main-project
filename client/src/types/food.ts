export type Rarity = "C" | "UC" | "SR" | "SSR";

export type MealSession = "Sáng sớm" | "Giữa trưa" | "Chiều" | "Tối";

export type TimePeriod = "morning" | "midday" | "afternoon" | "night";

export type DietaryFilter = "all" | "veg" | "meat";

export type PriceFilter = "all" | "under_50" | "50_80" | "80_120" | "above_120";

export type SessionFilter = "all" | "auto" | MealSession;

export interface NutritionIngredient {
  name: string;
  serving_size_g?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbohydrates_total_g?: number | null;
  fat_total_g?: number | null;
  fat_saturated_g?: number | null;
  fat_trans_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  potassium_mg?: number | null;
  cholesterol_mg?: number | null;
}

export interface NutritionSummary {
  calories: number; // kcal
  protein: number;  // g
  carbs: number;    // g
  fat: number;      // g
  fiber: number;    // g
  sugar: number;    // g
  sodium: number;   // mg
  potassium?: number; // mg
  cholesterol?: number; // mg
}

export interface FoodRawItem {
  id: number;
  name: string;
  sub: string;
  price: number;
  image: number;
  quip?: string;
  name_en: string;
  nutritions: NutritionIngredient[];
  sessions: string[];
  veg?: boolean;
}

export interface FoodItem extends FoodRawItem {
  imagePath: string; // "/data/images/{id}.webp"
  rarity: Rarity;
  macros: NutritionSummary;
  ingredients: string[];
  isFavorite?: boolean;
}

export interface FilterOptions {
  count: number; // 1, 3, 5
  dietary: DietaryFilter;
  session: SessionFilter;
  priceRange: PriceFilter;
}
