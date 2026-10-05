import { FoodCard } from '@/api/types/foods';
import { FoodItem, Rarity, NutritionSummary, NutritionIngredient } from '@/types/food';

export function calculateMacros(nutritions: FoodCard['nutritions']): NutritionSummary {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let sugar = 0;
  let sodium = 0;

  for (const n of nutritions) {
    calories += n.calories || 0;
    protein += n.protein_g || 0;
    carbs += n.carbohydrates_total_g || 0;
    fat += n.fat_total_g || 0;
    fiber += n.fiber_g || 0;
    sugar += n.sugar_g || 0;
    sodium += n.sodium_mg || 0;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    sugar: Math.round(sugar * 10) / 10,
    sodium: Math.round(sodium),
  };
}

export function determineRarity(price: number, calories: number): Rarity {
  if (price >= 100 || calories >= 650) return 'SSR';
  if (price >= 65 || calories >= 450) return 'SR';
  if (price >= 40 || calories >= 250) return 'UC';
  return 'C';
}

export function mapFoodCardToFoodItem(card: FoodCard): FoodItem {
  const macros = calculateMacros(card.nutritions || []);
  const priceNum = card.price ?? 50;
  const rarity = determineRarity(priceNum, macros.calories);

  const nutritionsList: NutritionIngredient[] = (card.nutritions || []).map((n) => ({
    name: n.nutrition_name,
    serving_size_g: n.serving_size_g,
    calories: n.calories,
    protein_g: n.protein_g,
    carbohydrates_total_g: n.carbohydrates_total_g,
    fat_total_g: n.fat_total_g,
    fat_saturated_g: n.fat_saturated_g,
    fat_trans_g: n.fat_trans_g,
    fiber_g: n.fiber_g,
    sugar_g: n.sugar_g,
    sodium_mg: n.sodium_mg,
    potassium_mg: n.potassium_mg,
    cholesterol_mg: n.cholesterol_mg,
  }));

  let imagePath = `/data/images/${card.food_id}.webp`;
  if (card.image_url) {
    if (card.image_url.startsWith('http') || card.image_url.startsWith('/')) {
      imagePath = card.image_url;
    } else {
      imagePath = `/data/images/${card.image_url}.webp`;
    }
  }

  return {
    id: card.food_id,
    name: card.food_name,
    sub: card.sub || '',
    price: priceNum,
    image: card.food_id,
    imagePath,
    quip: card.quip || '',
    name_en: card.food_name,
    nutritions: nutritionsList,
    sessions: card.sessions || [],
    veg: card.is_veg,
    rarity,
    macros,
    ingredients: (card.nutritions || []).map((n) => n.nutrition_name),
  };
}
