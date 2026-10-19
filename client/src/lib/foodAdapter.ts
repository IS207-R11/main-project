import { FoodCard } from '@/api/types/foods';
import { FoodItem, Rarity } from '@/types/food';

export function stripFoodCode(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s*\(#?[0-9a-zA-Z_-]+\)/gi, '')
    .replace(/\s*#[0-9a-zA-Z_-]+/gi, '')
    .replace(/\s+(?=[a-zA-Z0-9]*[0-9])[0-9a-zA-Z]{4,}$/gi, '')
    .replace(/\s+[0-9a-fA-F]{10,}$/gi, '')
    .trim();
}

export function mapFoodCardToFoodItem(card: FoodCard): FoodItem {
  // Use food_rank directly from V_FOODS_RANKED (defaults to 'C' if absent)
  const rank: Rarity = (card.food_rank as Rarity) || 'C';
  const imagePath = card.image_url?.trim() || '/logos/main-logo.png';
  const desc = card.description || '';
  const cleanName = stripFoodCode(card.name) || card.name;

  return {
    id: card.food_id,
    food_id: card.food_id,
    name: cleanName,
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

export function mapSystemDishToFoodItem(dish: any): FoodItem {
  const calo = parseFloat(dish.total_calo) || 350;
  const favCount = parseInt(dish.favourite_count, 10) || 0;

  let rarity: Rarity = 'C';
  if (favCount >= 120) rarity = 'SSR';
  else if (favCount >= 70) rarity = 'SR';
  else if (favCount >= 30) rarity = 'UC';

  let instructionsDesc = '';
  try {
    const parsed = typeof dish.instructions === 'string' ? JSON.parse(dish.instructions) : dish.instructions;
    instructionsDesc = parsed?.description || parsed?.so_che || '';
  } catch {
    instructionsDesc = typeof dish.instructions === 'string' ? dish.instructions : '';
  }

  const isVeg =
    dish.title?.toLowerCase().includes('chay') ||
    instructionsDesc?.toLowerCase().includes('chay');

  const sessions: string[] = [];
  const lowerTitle = (dish.title || '').toLowerCase();
  const lowerDesc = instructionsDesc.toLowerCase();
  if (lowerTitle.includes('sáng') || lowerDesc.includes('sáng') || lowerDesc.includes('15 phút') || lowerDesc.includes('10 phút')) {
    sessions.push('Sáng sớm');
  }
  if (lowerTitle.includes('trưa') || lowerTitle.includes('cơm') || lowerDesc.includes('trưa') || lowerDesc.includes('canh')) {
    sessions.push('Giữa trưa');
  }
  if (lowerTitle.includes('chiều') || lowerTitle.includes('chè') || lowerTitle.includes('bánh') || lowerTitle.includes('ăn vặt')) {
    sessions.push('Chiều');
  }
  if (lowerTitle.includes('tối') || lowerTitle.includes('lẩu') || lowerTitle.includes('kho') || lowerDesc.includes('tối')) {
    sessions.push('Tối');
  }
  if (sessions.length === 0) {
    sessions.push('Giữa trưa', 'Tối');
  }

  return {
    id: dish.id,
    food_id: dish.id,
    name: dish.title || 'Món ngon',
    description: instructionsDesc || 'Món ngon mỗi ngày chuẩn vị Việt Nam',
    sub: instructionsDesc || 'Món ngon mỗi ngày chuẩn vị Việt Nam',
    image_url: dish.image_url || '/logos/main-logo.png',
    imagePath: dish.image_url || '/logos/main-logo.png',
    status: 'ACTIVE',
    food_rank: rarity,
    rarity: rarity,
    rating_score: favCount,
    cd: calo,
    created_at: dish.created_at || new Date().toISOString(),
    contributor_id: 1,
    is_favorited: !!dish.is_favourited,
    is_hated: !!dish.is_disliked,
    is_eaten: false,
    favorites_count: favCount,
    hated_count: 0,
    eaten_count: 0,
    veg: isVeg,
    sessions,
  };
}


