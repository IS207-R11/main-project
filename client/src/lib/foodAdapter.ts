import { FoodCard } from '@/api/types/foods';
import { FoodItem, Rarity } from '@/types/food';

export function mapFoodCardToFoodItem(card: FoodCard): FoodItem {
  // Use food_rank directly from V_FOODS_RANKED (defaults to 'C' if absent)
  const rank: Rarity = (card.food_rank as Rarity) || 'C';
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
    food_rank: rank,
    rarity: rank,
    rating_score: card.rating_score ?? null,
    cd: card.cd ?? null,
    created_at: card.created_at,
    contributor_id: card.contributor_id,
    is_favorited: !!card.is_favorited,
    is_hated: !!card.is_hated,
    is_eaten: !!card.is_eaten,
    favorites_count: card.favorites_count ?? 0,
    hated_count: card.hated_count ?? 0,
    eaten_count: card.eaten_count ?? 0,
  };
}

