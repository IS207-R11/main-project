import { FoodCard } from '@/api/types/foods';
import { FoodItem, Rarity } from '@/types/food';

export function mapFoodCardToFoodItem(card: FoodCard): FoodItem {
  // Use rank directly from server response (defaults to 'C' if absent)
  const rank: Rarity = (card.rank as Rarity) || 'C';
  const imagePath = card.image_url?.trim() || '/logos/main-logo.png';
  const desc = card.description || '';

  return {
    id: card.food_id,
    food_id: card.food_id,
    name: card.name,
    description: desc,
    sub: desc,
    image_url: card.image_url,
    imagePath,
    status: card.status || 'ACTIVE',
    rank,
    rarity: rank,
    favorite_count: card.favorite_count || 0,
    eaten_count: card.eaten_count || 0,
    created_at: card.created_at,
    contributor_id: card.contributor_id,
    contributor: card.contributor,
  };
}

