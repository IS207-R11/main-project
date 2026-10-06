import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TinderMatchModal } from './TinderMatchModal';
import type { FoodItem } from '@/types/food';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

const mockMatchedFood: FoodItem = {
  id: 88,
  food_id: 88,
  name: 'Lẩu Thái Chua Cay',
  description: 'Hương vị hải sản chua cay thơm lừng sả ớt',
  imagePath: 'https://images.unsplash.com/lau-thai',
  status: 'ACTIVE',
  food_rank: 'SSR',
  rarity: 'SSR',
  favorites_count: 50,
  hated_count: 1,
  eaten_count: 20,
};

describe('TinderMatchModal Component (Testing Matrix & Interaction)', () => {
  it('1. Render thành công: Hiển thị modal khi isOpen = true', () => {
    render(
      <TinderMatchModal
        food={mockMatchedFood}
        isOpen={true}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onChangeFilter={vi.fn()}
      />
    );

    expect(screen.getAllByText(/IT'S A MATCH!/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lẩu Thái Chua Cay/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hương vị hải sản chua cay thơm lừng sả ớt/i).length).toBeGreaterThan(0);
  });

  it('2. Chế độ Super Like Match: Hiển thị badge Siêu Thích', () => {
    render(
      <TinderMatchModal
        food={mockMatchedFood}
        isSuperMatch={true}
        isOpen={true}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onChangeFilter={vi.fn()}
      />
    );

    expect(screen.getAllByText(/SUPER MATCH!/i).length).toBeGreaterThan(0);
  });

  it('3. Click các nút thao tác hoạt động bình thường', () => {
    const onRestart = vi.fn();
    const onChangeFilter = vi.fn();

    render(
      <TinderMatchModal
        food={mockMatchedFood}
        isOpen={true}
        onClose={vi.fn()}
        onRestart={onRestart}
        onChangeFilter={onChangeFilter}
      />
    );

    // Bấm Quẹt lại
    const restartBtn = screen.getByRole('button', { name: /Chơi Lại/i });
    fireEvent.click(restartBtn);
    expect(onRestart).toHaveBeenCalledTimes(1);

    // Bấm Quay lại / đổi bộ lọc
    const backBtn = screen.getByRole('button', { name: /Quay Lại/i });
    fireEvent.click(backBtn);
    expect(onChangeFilter).toHaveBeenCalledTimes(1);
  });

  it('4. Tư duy sai / Biên dữ liệu: Modal đóng hoặc food = null không gây lỗi', () => {
    const { container } = render(
      <TinderMatchModal
        food={null}
        isOpen={false}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onChangeFilter={vi.fn()}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
