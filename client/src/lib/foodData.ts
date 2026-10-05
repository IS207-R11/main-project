import rawFoodsData from "@/data/foods.json";
import type {
  FoodRawItem,
  FoodItem,
  NutritionIngredient,
  NutritionSummary,
  Rarity,
  MealSession,
  TimePeriod,
} from "@/types/food";

export function calculateMacros(nutritions: NutritionIngredient[] = []): NutritionSummary {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let sugar = 0;
  let sodium = 0;
  let potassium = 0;
  let cholesterol = 0;

  for (const n of nutritions) {
    calories += n.calories || 0;
    protein += n.protein_g || 0;
    carbs += n.carbohydrates_total_g || 0;
    fat += n.fat_total_g || 0;
    fiber += n.fiber_g || 0;
    sugar += n.sugar_g || 0;
    sodium += n.sodium_mg || 0;
    potassium += n.potassium_mg || 0;
    cholesterol += n.cholesterol_mg || 0;
  }

  // Fallback if explicit calories sum is 0 but macros exist
  if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    sugar: Math.round(sugar * 10) / 10,
    sodium: Math.round(sodium * 10) / 10,
    potassium: Math.round(potassium * 10) / 10,
    cholesterol: Math.round(cholesterol * 10) / 10,
  };
}

export function calculateRarity(item: FoodRawItem): Rarity {
  if (item.price >= 120) return "SSR";
  if (item.price >= 80) return "SR";
  if (item.price >= 50) return "UC";
  return "C";
}

export function normalizeFood(raw: FoodRawItem): FoodItem {
  const macros = calculateMacros(raw.nutritions || []);
  const rarity = calculateRarity(raw);
  const ingredients = (raw.nutritions || []).map((n) => n.name).filter(Boolean);
  const imagePath = `/data/images/${raw.id}.webp`;

  return {
    ...raw,
    imagePath,
    rarity,
    macros,
    ingredients,
  };
}

export const allFoods: FoodItem[] = (rawFoodsData as FoodRawItem[]).map(normalizeFood);

export function formatPrice(price: number): string {
  // Price in data is in thousands (e.g. 45 = 45.000 VND)
  const fullPrice = price * 1000;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(fullPrice);
}

export function periodToSession(period: TimePeriod): MealSession {
  switch (period) {
    case "morning":
      return "Sáng sớm";
    case "midday":
      return "Giữa trưa";
    case "afternoon":
      return "Chiều";
    case "night":
      return "Tối";
  }
}

export function sessionToPeriod(session: MealSession): TimePeriod {
  switch (session) {
    case "Sáng sớm":
      return "morning";
    case "Giữa trưa":
      return "midday";
    case "Chiều":
      return "afternoon";
    case "Tối":
      return "night";
  }
}
