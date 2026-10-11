import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TinderCard, type TinderCardHandle } from './TinderCard';
import type { FoodItem } from '@/types/food';

const mockFoodSSR: FoodItem = {
  id: 99,
  food_id: 99,
  name: 'Bò Wagyu Nướng Đá',
  description: 'Thịt bò vân mỡ tan chảy trên phiến đá núi lửa',
  imagePath: 'https://images.unsplash.com/wagyu',
  status: 'ACTIVE',
  food_rank: 'SSR',
  rarity: 'SSR',
  favorites_count: 88,
  hated_count: 0,
  eaten_count: 50,
};

describe('TinderCard Component (3D Flip & Multi-Rarity Matrix)', () => {
  it('1. Render mặt trước thành công với thông tin món ăn và độ hiếm SSR', () => {
    render(
      <TinderCard
        food={mockFoodSSR}
        isFront={true}
        stackIndex={0}
        onSwipe={vi.fn()}
      />
    );

    // Kiểm tra tên món
    expect(screen.getByRole('heading', { level: 2, name: 'Bò Wagyu Nướng Đá' })).toBeInTheDocument();
    expect(screen.getAllByText('Thịt bò vân mỡ tan chảy trên phiến đá núi lửa').length).toBeGreaterThan(0);

    // Badges
    const badges = screen.getAllByText('SSR');
    expect(badges.length).toBeGreaterThan(0);

    // Nút liên kết ngoài
    expect(screen.getAllByTitle(/Tìm quán Bò Wagyu Nướng Đá trên Google Maps/i).length).toBeGreaterThan(0);
  });

  it('2. Lật thẻ 3D: Click Lật thẻ chuyển sang mặt sau hiển thị chi tiết món ăn', async () => {
    render(
      <TinderCard
        food={mockFoodSSR}
        isFront={true}
        stackIndex={0}
        onSwipe={vi.fn()}
      />
    );

    // Nút lật thẻ
    const flipBtn = screen.getByTitle('Lật thẻ');
    fireEvent.click(flipBtn);

    // Mặt sau hiển thị: Thông tin món ăn và nút lật lại
    await waitFor(() => {
      expect(screen.getByText('Thông Tin Món Ăn')).toBeInTheDocument();
      expect(screen.getByText('Lật lại mặt trước')).toBeInTheDocument();
      expect(screen.getAllByText('Bò Wagyu Nướng Đá').length).toBeGreaterThan(0);
    });

    // Lật lại mặt trước
    const backBtn = screen.getByText('Lật lại mặt trước');
    fireEvent.click(backBtn);
  });

  it('3. Swipe thông qua imperative handle ref', async () => {
    const cardRef = createRef<TinderCardHandle>();
    const onSwipe = vi.fn();

    render(
      <TinderCard
        ref={cardRef}
        food={mockFoodSSR}
        isFront={true}
        stackIndex={0}
        onSwipe={onSwipe}
      />
    );

    expect(cardRef.current).not.toBeNull();
    // Kích hoạt swipe qua ref
    if (cardRef.current) {
      await act(async () => {
        await cardRef.current?.swipe('right');
      });
      expect(onSwipe).toHaveBeenCalledWith('right', mockFoodSSR);
    }
  });

  it('4. Độ hiếm khác nhau: UC và C fallback an toàn', () => {
    const mockFoodC: FoodItem = {
      ...mockFoodSSR,
      rarity: 'C',
      food_rank: 'C',
      status: 'PENDING',
    };

    render(
      <TinderCard
        food={mockFoodC}
        isFront={false}
        stackIndex={1}
        onSwipe={vi.fn()}
      />
    );

    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument();
  });
});
