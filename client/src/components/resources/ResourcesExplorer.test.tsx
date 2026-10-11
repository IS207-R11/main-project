import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourcesExplorer } from './ResourcesExplorer';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('search=Ph%E1%BB%9F%20B%C3%B2&rarity=SSR');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/tai-nguyen',
}));

vi.mock('@/api', () => ({
  foodsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          food_id: 1,
          name: 'Phở Bò',
          description: 'Hương vị truyền thống Hà Nội',
          status: 'ACTIVE',
          food_rank: 'SSR',
        },
      ],
      total_records: 1,
    }),
  },
}));

vi.mock('@/components/food/CreateFoodModal', () => ({
  CreateFoodModal: () => null,
}));

vi.mock('@/components/food/VirtualMasonryGrid', () => ({
  VirtualMasonryGrid: ({ foods }: { foods: unknown[] }) => (
    <div data-testid="virtual-grid">
      {foods.map((_, i) => (
        <div key={i}>Food Item</div>
      ))}
    </div>
  ),
}));

describe('ResourcesExplorer Component (URL Query Params Sync)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Đọc đúng filter từ URL query params khi khởi tạo', async () => {
    mockSearchParams = new URLSearchParams('search=Ph%E1%BB%9F%20B%C3%B2&rarity=SSR');
    render(<ResourcesExplorer />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên món ăn/i) as HTMLInputElement;
    expect(searchInput.value).toBe('Phở Bò');

    await waitFor(() => {
      expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
    });
  });
});
