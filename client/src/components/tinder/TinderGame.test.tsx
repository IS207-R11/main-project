import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TinderGame } from './TinderGame';
import type { FoodItem } from '@/types/food';

// Mock GameSettingsContext
vi.mock('@/context/GameSettingsContext', () => ({
  useGameSettings: () => ({
    tinderSettings: {
      numberOfResult: 10,
      numberOfExcludedEaten: 0,
      typeOfExcludedEaten: 'newest',
      excludedGachaSet: false,
      foodSet: [],
    },
  }),
}));

// Mock API
vi.mock('@/api', () => ({
  foodsApi: {
    tinder: vi.fn().mockResolvedValue({
      data: [
        {
          food_id: 1,
          name: 'Phở Bò Tái',
          description: 'Nước dùng thanh ngọt',
          status: 'ACTIVE',
          food_rank: 'SSR',
        },
        {
          food_id: 2,
          name: 'Cơm Tấm Sườn Bì',
          description: 'Sườn nướng thơm ngon',
          status: 'ACTIVE',
          food_rank: 'SR',
        },
      ],
    }),
  },
}));

const mockFoods: FoodItem[] = [
  {
    id: 1,
    food_id: 1,
    name: 'Phở Bò Tái',
    description: 'Nước dùng thanh ngọt',
    imagePath: '/logos/main-logo.png',
    status: 'ACTIVE',
    food_rank: 'SSR',
    rarity: 'SSR',
  },
  {
    id: 2,
    food_id: 2,
    name: 'Cơm Tấm Sườn Bì',
    description: 'Sườn nướng thơm ngon',
    imagePath: '/logos/main-logo.png',
    status: 'ACTIVE',
    food_rank: 'SR',
    rarity: 'SR',
  },
];

describe('TinderGame Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Render thành công: Hiển thị giao diện chờ với card preview và nút Quẹt Ngay!', () => {
    render(<TinderGame allFoods={mockFoods} />);

    expect(screen.getByText('Quẹt Món Yêu Thích')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quẹt Ngay!/i })).toBeInTheDocument();
  });

  it('2. Hiển thị đúng dữ liệu: Số lượng món ăn khả dụng từ prop/API', () => {
    render(<TinderGame allFoods={mockFoods} />);

    // Kiểm tra thông tin "2 món ăn đã sẵn sàng"
    expect(screen.getByText('2 món ăn đã sẵn sàng')).toBeInTheDocument();
  });

  it('3. Click vào nút hoạt động bình thường: Bấm "Quẹt Ngay!" chuyển sang chế độ lướt thẻ', async () => {
    render(<TinderGame allFoods={mockFoods} />);

    const startButton = screen.getByRole('button', { name: /Quẹt Ngay!/i });
    fireEvent.click(startButton);

    // Sau khi click, chuyển sang card stack và hiển thị tên món ăn đầu tiên
    await waitFor(() => {
      expect(screen.getByText('Tinder Ẩm Thực')).toBeInTheDocument();
      const foodHeadings = screen.getAllByRole('heading', {
        name: /(Phở Bò Tái|Cơm Tấm Sườn Bì)/i,
      });
      expect(foodHeadings.length).toBeGreaterThan(0);
    });
  });
});
