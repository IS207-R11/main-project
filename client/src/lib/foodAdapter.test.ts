import { describe, it, expect } from 'vitest';
import { mapFoodCardToFoodItem } from './foodAdapter';
import type { FoodCard } from '@/api/types/foods';

describe('foodAdapter - mapFoodCardToFoodItem', () => {
  it('1. Đầy đủ dữ liệu: Map chính xác toàn bộ thuộc tính từ backend', () => {
    const rawCard: FoodCard = {
      food_id: 101,
      name: 'Bún Bò Huế',
      description: 'Nước dùng cay nồng hương sả',
      image_url: 'https://images.unsplash.com/bun-bo',
      status: 'ACTIVE',
      food_rank: 'SSR',
      rating_score: 9.8,
      cd: 0.95,
      created_at: '2026-10-06 12:00:00',
      contributor_id: 5,
      is_favorited: true,
      is_hated: false,
      is_eaten: true,
      favorites_count: 120,
      hated_count: 3,
      eaten_count: 85,
    };

    const item = mapFoodCardToFoodItem(rawCard);

    expect(item.id).toBe(101);
    expect(item.food_id).toBe(101);
    expect(item.name).toBe('Bún Bò Huế');
    expect(item.description).toBe('Nước dùng cay nồng hương sả');
    expect(item.sub).toBe('Nước dùng cay nồng hương sả');
    expect(item.image_url).toBe('https://images.unsplash.com/bun-bo');
    expect(item.imagePath).toBe('https://images.unsplash.com/bun-bo');
    expect(item.status).toBe('ACTIVE');
    expect(item.food_rank).toBe('SSR');
    expect(item.rarity).toBe('SSR');
    expect(item.rating_score).toBe(9.8);
    expect(item.cd).toBe(0.95);
    expect(item.is_favorited).toBe(true);
    expect(item.is_hated).toBe(false);
    expect(item.is_eaten).toBe(true);
    expect(item.favorites_count).toBe(120);
    expect(item.hated_count).toBe(3);
    expect(item.eaten_count).toBe(85);
  });

  it('2. Tư duy sai của user / Biên dữ liệu: Xử lý dữ liệu null, thiếu trường, khoảng trắng', () => {
    const incompleteCard = {
      food_id: 202,
      name: 'Món Thiếu Thông Tin',
      // description missing
      image_url: '   ', // whitespace only
      status: undefined,
      food_rank: undefined,
      rating_score: undefined,
      cd: undefined,
      is_favorited: 0 as any,
      is_hated: null as any,
      is_eaten: undefined,
      favorites_count: null as any,
      hated_count: undefined,
      eaten_count: null as any,
    } as unknown as FoodCard;

    const item = mapFoodCardToFoodItem(incompleteCard);

    // Fallback rank mặc định là 'C'
    expect(item.food_rank).toBe('C');
    expect(item.rarity).toBe('C');

    // Fallback ảnh mặc định khi image_url rỗng hoặc toàn space
    expect(item.imagePath).toBe('/logos/main-logo.png');

    // Fallback mô tả rỗng
    expect(item.description).toBe('');
    expect(item.sub).toBe('');

    // Fallback status ACTIVE
    expect(item.status).toBe('ACTIVE');

    // Ép kiểu boolean an toàn
    expect(item.is_favorited).toBe(false);
    expect(item.is_hated).toBe(false);
    expect(item.is_eaten).toBe(false);

    // Đếm số lượng fallback 0
    expect(item.favorites_count).toBe(0);
    expect(item.hated_count).toBe(0);
    expect(item.eaten_count).toBe(0);
  });
});
