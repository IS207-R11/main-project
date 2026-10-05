import { FoodCard } from '@/api/types/foods';
import { FoodItem, Rarity, NutritionSummary } from '@/types/food';

export function calculateMacros(): NutritionSummary {
  return {
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 10,
    fiber: 3,
    sugar: 4,
    sodium: 400,
  };
}

export function determineRarity(favoriteCount: number, eatenCount: number): Rarity {
  const score = (favoriteCount || 0) + (eatenCount || 0);
  if (score >= 10) return 'SSR';
  if (score >= 5) return 'SR';
  if (score >= 2) return 'UC';
  return 'C';
}

export function mapFoodCardToFoodItem(card: FoodCard): FoodItem {
  const macros = calculateMacros();
  const priceNum = 50;
  const rarity = determineRarity(card.favorite_count || 0, card.eaten_count || 0);

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
    name: card.name,
    sub: card.description || '',
    price: priceNum,
    image: card.food_id,
    imagePath,
    quip: card.description || '',
    name_en: card.name,
    nutritions: [],
    sessions: ['Sáng sớm', 'Giữa trưa', 'Chiều', 'Tối'],
    veg: false,
    rarity,
    macros,
    ingredients: [],
    favorite_count: card.favorite_count || 0,
    eaten_count: card.eaten_count || 0,
  };
}
