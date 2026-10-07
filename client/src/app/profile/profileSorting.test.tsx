import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from './page';
import { foodsApi } from '@/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      user_id: 99,
      username: 'foodie_master',
      email: 'foodie@angi.vn',
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00Z',
    },
    isAuthenticated: true,
    isLoading: false,
    openAuthModal: vi.fn(),
    refreshUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/api', () => ({
  foodsApi: {
    getFavorites: vi.fn().mockResolvedValue({ data: [] }),
    getHated: vi.fn().mockResolvedValue({ data: [] }),
    getEaten: vi.fn(),
    deleteEaten: vi.fn().mockResolvedValue({ message: 'Deleted' }),
    updateEaten: vi.fn().mockResolvedValue({ data: {} }),
  },
  usersApi: {
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  authApi: {
    changePassword: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfilePage Eaten Foods Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders eaten food items sorted descending by created_at', async () => {
    const mockEaten = [
      {
        eaten_id: 1,
        user_id: 99,
        food_id: 101,
        note: 'Ăn tuần trước',
        created_at: '2026-10-01 10:00:00',
        food: { food_id: 101, name: 'Phở Bò Cổ Điển', food_rank: 'SSR' },
      },
      {
        eaten_id: 2,
        user_id: 99,
        food_id: 102,
        note: 'Vừa mới ăn sáng nay',
        created_at: '2026-10-08 08:30:00',
        food: { food_id: 102, name: 'Bánh Mì Chảo', food_rank: 'SR' },
      },
      {
        eaten_id: 3,
        user_id: 99,
        food_id: 103,
        note: 'Ăn hôm qua',
        created_at: '2026-10-07 19:00:00',
        food: { food_id: 103, name: 'Cơm Tấm Sườn Bì', food_rank: 'UR' },
      },
    ];

    (foodsApi.getEaten as any).mockResolvedValue({
      data: mockEaten,
      total_records: 3,
    });

    render(<ProfilePage />);

    // Chuyển sang tab Món Đã Ăn
    await waitFor(() => {
      expect(screen.getByText(/Món Đã Ăn/)).toBeInTheDocument();
    });

    const eatenTabBtn = screen.getByText(/Món Đã Ăn/);
    fireEvent.click(eatenTabBtn);

    // Kiểm tra các món ăn hiển thị đúng thứ tự giảm dần theo created_at:
    // 1: Bánh Mì Chảo (2026-10-08)
    // 2: Cơm Tấm Sườn Bì (2026-10-07)
    // 3: Phở Bò Cổ Điển (2026-10-01)
    await waitFor(() => {
      const titles = screen.getAllByText(/Bánh Mì Chảo|Cơm Tấm Sườn Bì|Phở Bò Cổ Điển/);
      expect(titles).toHaveLength(3);
      expect(titles[0]).toHaveTextContent('Bánh Mì Chảo');
      expect(titles[1]).toHaveTextContent('Cơm Tấm Sườn Bì');
      expect(titles[2]).toHaveTextContent('Phở Bò Cổ Điển');
    });
  });
});
