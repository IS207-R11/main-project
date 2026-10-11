import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TinderMatchModal } from './TinderMatchModal';
import type { FoodItem } from '@/types/food';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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
    const onClose = vi.fn();

    render(
      <TinderMatchModal
        food={mockMatchedFood}
        isOpen={true}
        onClose={onClose}
        onRestart={onRestart}
      />
    );

    // Bấm Chơi lại
    const restartBtn = screen.getByRole('button', { name: /Chơi Lại/i });
    fireEvent.click(restartBtn);
    expect(onRestart).toHaveBeenCalledTimes(1);

    // Bấm Chia sẻ điều hướng đến trang tài nguyên kèm filter
    const shareBtn = screen.getByRole('button', { name: /Chia Sẻ/i });
    fireEvent.click(shareBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Lẩu Thái Chua Cay'))
    );

    // Kiểm tra link Google Maps và YouTube
    const mapsLink = screen.getByTitle(/Google Maps/i);
    expect(mapsLink).toHaveAttribute('href', expect.stringContaining('maps/search'));

    const youtubeLink = screen.getByTitle(/YouTube/i);
    expect(youtubeLink).toHaveAttribute('href', expect.stringContaining('youtube.com/results'));
  });

  it('4. Tư duy sai / Biên dữ liệu: Modal đóng hoặc food = null không gây lỗi', () => {
    const { container } = render(
      <TinderMatchModal
        food={null}
        isOpen={false}
        onClose={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
