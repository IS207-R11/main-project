export type DietaryType = 'all' | 'veg' | 'meat';

export type AllergyType =
  | 'seafood'
  | 'beef'
  | 'pork'
  | 'poultry'
  | 'egg'
  | 'peanuts'
  | 'dairy'
  | 'spicy';

export type MealSessionType =
  | 'all'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert';

export interface FoodFilterCriteria {
  dietary?: DietaryType;
  allergies?: string[];
  mealSession?: MealSessionType;
  foodSet?: number[];
}

export const ALLERGY_OPTIONS: { id: AllergyType; label: string; icon: string }[] = [
  { id: 'seafood', label: 'Hải sản (Tôm, Cua, Cá...)', icon: '🦐' },
  { id: 'beef', label: 'Thịt bò', icon: '🥩' },
  { id: 'pork', label: 'Thịt heo', icon: '🥓' },
  { id: 'poultry', label: 'Thịt gà / Vịt', icon: '🍗' },
  { id: 'egg', label: 'Trứng', icon: '🥚' },
  { id: 'peanuts', label: 'Đậu phộng / Hạt', icon: '🥜' },
  { id: 'dairy', label: 'Sữa / Phô mai / Bơ', icon: '🧀' },
  { id: 'spicy', label: 'Món cay', icon: '🌶️' },
];

export const MEAL_SESSION_OPTIONS: { id: MealSessionType; label: string; desc: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả các bữa', desc: 'Bao gồm tất cả món ăn', icon: '🍽️' },
  { id: 'breakfast', label: 'Bữa Sáng', desc: 'Phở, Bún, Bánh mì, Xôi, Cháo...', icon: '🌅' },
  { id: 'lunch', label: 'Bữa Trưa', desc: 'Cơm trưa, Bún chả, Mì, Bento...', icon: '☀️' },
  { id: 'dinner', label: 'Bữa Tối', desc: 'Lẩu, Nướng, Cơm gia đình, Bún đậu...', icon: '🌙' },
  { id: 'snack', label: 'Ăn Nhẹ / Ăn Vặt', desc: 'Bánh tráng, Nem chua, Khoai tây...', icon: '🍟' },
  { id: 'dessert', label: 'Tráng Miệng & Đồ Uống', desc: 'Chè, Kem, Sinh tố, Bánh ngọt, Trà sữa...', icon: '🍧' },
];

// Keyword dictionaries for Vietnamese culinary classification
const VEG_KEYWORDS = [
  'chay', 'rau', 'nấm', 'đậu phụ', 'tàu hũ', 'salad', 'củ', 'hoa quả', 'chè', 'sinh tố',
  'nước ép', 'trái cây', 'bánh ngọt', 'sữa chua', 'kem', 'bánh flan', 'thạch', 'nước sen',
];

const MEAT_SEAFOOD_KEYWORDS = [
  'thịt', 'bò', 'heo', 'lợn', 'gà', 'vịt', 'ngan', 'cút', 'sườn', 'chả lụa', 'chả quế',
  'nem', 'ba chỉ', 'ba rọi', 'xúc xích', 'hải sản', 'tôm', 'cua', 'cá', 'mực', 'ốc',
  'nghêu', 'sò', 'hàu', 'ghẹ', 'bạch tuộc', 'lươn', 'ếch', 'bò né', 'steak', 'bún bò',
  'phở bò', 'cơm sườn', 'bún chả', 'bún cá', 'hủ tiếu sườn',
];

const ALLERGY_KEYWORD_MAP: Record<AllergyType, string[]> = {
  seafood: ['hải sản', 'tôm', 'cua', 'cá', 'mực', 'ốc', 'nghêu', 'sò', 'hàu', 'ghẹ', 'bạch tuộc', 'mắm tôm', 'mắm tép', 'chả cá'],
  beef: ['bò', 'nạm', 'gầu', 'bắp bò', 'bò né', 'steak', 'phở bò', 'bún bò'],
  pork: ['heo', 'lợn', 'sườn', 'ba chỉ', 'ba rọi', 'giò heo', 'chả lụa', 'thịt kho', 'nem chua', 'xá xíu'],
  poultry: ['gà', 'vịt', 'ngan', 'chim', 'cút', 'lòng gà', 'chân gà'],
  egg: ['trứng', 'ốp la', 'hột vịt', 'hột gà', 'trứng cút', 'bánh flan', 'trứng muối'],
  peanuts: ['đậu phộng', 'lạc', 'hạt điều', 'hạnh nhân', 'mè', 'vừng'],
  dairy: ['sữa', 'phô mai', 'cheese', 'bơ', 'cream', 'sữa đặc', 'kem cheese'],
  spicy: ['cay', 'ớt', 'sa tế', 'tiêu cay', 'kimchi', 'tomyum', 'tứ xuyên', 'cay nồng'],
};

const SESSION_KEYWORD_MAP: Record<Exclude<MealSessionType, 'all'>, string[]> = {
  breakfast: ['phở', 'bún', 'bánh mì', 'xôi', 'cháo', 'miến', 'bánh cuốn', 'hủ tiếu', 'bánh bao', 'cà phê', 'sữa đậu'],
  lunch: ['cơm', 'cơm tấm', 'bún chả', 'bún bò', 'cơm sườn', 'bento', 'mì', 'phở', 'hủ tiếu', 'cơm rang', 'cơm gà'],
  dinner: ['lẩu', 'nướng', 'bbq', 'cơm', 'bún đậu', 'cháo sườn', 'bò né', 'steak', 'hải sản', 'gà rán', 'mì ý'],
  snack: ['bánh tráng', 'nem chua', 'khoai tây', 'bột chiên', 'gỏi cuốn', 'bánh bao', 'xúc xích', 'xiên bẩn', 'chả giò'],
  dessert: ['chè', 'kem', 'sinh tố', 'nước ép', 'trà sữa', 'cà phê', 'bánh ngọt', 'bánh flan', 'yaourt', 'sữa chua', 'thạch'],
};

/**
 * Filter a food item against dietary, allergy, and meal session criteria
 */
export function isFoodMatchingFilter(
  food: { name: string; description?: string | null; food_id?: number; id?: number },
  criteria: FoodFilterCriteria
): boolean {
  const text = `${food.name || ''} ${food.description || ''}`.toLowerCase();

  // 1. Specific Food Set Filter (if manually selected)
  if (criteria.foodSet && criteria.foodSet.length > 0) {
    const id = food.food_id ?? food.id;
    if (id !== undefined && !criteria.foodSet.includes(id)) {
      return false;
    }
  }

  // 2. Dietary Filter
  if (criteria.dietary === 'veg') {
    const hasMeat = MEAT_SEAFOOD_KEYWORDS.some((kw) => text.includes(kw));
    const isExplicitlyChay = VEG_KEYWORDS.some((kw) => text.includes(kw));
    if (hasMeat && !text.includes('chay')) {
      return false;
    }
    if (!isExplicitlyChay && hasMeat) {
      return false;
    }
  } else if (criteria.dietary === 'meat') {
    if (text.includes('chay')) {
      return false;
    }
  }

  // 3. Allergies & Exclusions
  if (criteria.allergies && criteria.allergies.length > 0) {
    for (const allergy of criteria.allergies) {
      const keywords = ALLERGY_KEYWORD_MAP[allergy as AllergyType];
      if (keywords && keywords.some((kw) => text.includes(kw))) {
        return false;
      }
    }
  }

  // 4. Meal Session Filter
  if (criteria.mealSession && criteria.mealSession !== 'all') {
    const sessionKeywords = SESSION_KEYWORD_MAP[criteria.mealSession];
    if (sessionKeywords) {
      const matchesSession = sessionKeywords.some((kw) => text.includes(kw));
      if (criteria.mealSession === 'dessert') {
        const isDessert = SESSION_KEYWORD_MAP.dessert.some((kw) => text.includes(kw));
        if (!isDessert) return false;
      } else if (criteria.mealSession === 'snack') {
        const isSnack = SESSION_KEYWORD_MAP.snack.some((kw) => text.includes(kw));
        if (!isSnack) return false;
      } else if (matchesSession) {
        return true;
      }
      const isPureDrinkDessert = ['trà sữa', 'cà phê đá', 'nước ngọt'].some((kw) => text.includes(kw));
      if (isPureDrinkDessert && (criteria.mealSession === 'lunch' || criteria.mealSession === 'dinner')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Resolves eligible food IDs based on filter criteria to pass to Backend Gacha / Tinder API
 */
export async function resolveEligibleFoodIds(
  criteria: FoodFilterCriteria,
  cachedFoods?: { food_id: number; name: string; description?: string | null }[]
): Promise<number[] | undefined> {
  const hasDietary = criteria.dietary && criteria.dietary !== 'all';
  const hasAllergies = criteria.allergies && criteria.allergies.length > 0;
  const hasSession = criteria.mealSession && criteria.mealSession !== 'all';
  const hasCustomFoodSet = criteria.foodSet && criteria.foodSet.length > 0;

  if (!hasDietary && !hasAllergies && !hasSession && !hasCustomFoodSet) {
    return undefined;
  }

  if (hasCustomFoodSet && !hasDietary && !hasAllergies && !hasSession) {
    return criteria.foodSet;
  }

  let foods = cachedFoods;
  if (!foods || foods.length === 0) {
    const { foodsApi } = await import('@/api');
    const res = await foodsApi.list({ pageSize: 150 });
    foods = res.data || [];
  }

  const matching = foods.filter((f) => isFoodMatchingFilter(f, criteria));
  return matching.map((f) => f.food_id);
}

