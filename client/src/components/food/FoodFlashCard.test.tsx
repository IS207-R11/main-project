import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FoodFlashCard } from './FoodFlashCard';
import type { FoodItem } from '@/types/food';
import { foodsApi } from '@/api';
import { toast } from 'react-toastify';

const { mockAuthState, mockOpenAuthModal } = vi.hoisted(() => ({
  mockAuthState: { isAuthenticated: true },
  mockOpenAuthModal: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockAuthState.isAuthenticated,
    openAuthModal: mockOpenAuthModal,
    user: { user_id: 1, username: 'testuser' },
  }),
}));

vi.mock('@/api', () => ({
  foodsApi: {
    addFavorite: vi.fn().mockResolvedValue({ message: 'Success' }),
    removeFavorite: vi.fn().mockResolvedValue({ message: 'Success' }),
    addHated: vi.fn().mockResolvedValue({ message: 'Success' }),
    removeHated: vi.fn().mockResolvedValue({ message: 'Success' }),
    recordEaten: vi.fn().mockResolvedValue({ message: 'Success' }),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFood: FoodItem = {
  id: 42,
  food_id: 42,
  name: 'Bún Chả Hà Nội',
  description: 'Thịt nướng thơm lừng ăn kèm bún và nước mắm chua ngọt đặc trưng.',
  imagePath: 'https://images.unsplash.com/photo-1555126634',
  status: 'ACTIVE',
  food_rank: 'SR',
  rarity: 'SR',
  rating_score: 9.5,
  favorites_count: 15,
  hated_count: 2,
  eaten_count: 8,
  is_favorited: false,
  is_hated: false,
  is_eaten: false,
};

describe('FoodFlashCard Component (Testing Matrix & Negative User Scenarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = true;
  });

  it('1. Render thành công: Khởi tạo card với đầy đủ các phần tử', () => {
    render(<FoodFlashCard food={mockFood} />);

    expect(screen.getByText('Bún Chả Hà Nội')).toBeInTheDocument();
    expect(screen.getByText('SR')).toBeInTheDocument();
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
  });

  it('2. Hiển thị đúng dữ liệu: Tên món, mô tả, độ hiếm và số lượng tương tác', () => {
    render(<FoodFlashCard food={mockFood} />);

    expect(screen.getByText('Bún Chả Hà Nội')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Thịt nướng thơm lừng ăn kèm bún và nước mắm chua ngọt đặc trưng.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('SR')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('3. Click vào nút hoạt động bình thường: Yêu thích, Ghét và Đã ăn', async () => {
    render(<FoodFlashCard food={mockFood} />);

    const favButton = screen.getByTitle('Yêu thích món này');
    fireEvent.click(favButton);

    await waitFor(() => {
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(foodsApi.addFavorite).toHaveBeenCalledWith({ food_id: 42 });
    });

    const hateButton = screen.getByTitle('Ghét món này');
    fireEvent.click(hateButton);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(foodsApi.addHated).toHaveBeenCalledWith({ food_id: 42 });
      expect(foodsApi.removeFavorite).toHaveBeenCalledWith(42);
    });

    const eatenButton = screen.getByTitle('Đánh dấu đã ăn');
    fireEvent.click(eatenButton);

    await waitFor(() => {
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(foodsApi.recordEaten).toHaveBeenCalledWith({ food_id: 42 });
    });
  });

  it('4. Tư duy sai của user: Chưa đăng nhập cố bấm Yêu thích / Ghét / Đã ăn', () => {
    mockAuthState.isAuthenticated = false;
    render(<FoodFlashCard food={mockFood} />);

    const favButton = screen.getByTitle('Yêu thích món này');
    fireEvent.click(favButton);
    expect(mockOpenAuthModal).toHaveBeenCalled();
    expect(foodsApi.addFavorite).not.toHaveBeenCalled();

    const hateButton = screen.getByTitle('Ghét món này');
    fireEvent.click(hateButton);
    expect(mockOpenAuthModal).toHaveBeenCalledTimes(2);

    const eatenButton = screen.getByTitle('Đánh dấu đã ăn');
    fireEvent.click(eatenButton);
    expect(mockOpenAuthModal).toHaveBeenCalledTimes(3);
  });

  it('5. Tư duy sai của user: Hủy yêu thích khi đã yêu thích trước đó', async () => {
    const favoritedFood: FoodItem = {
      ...mockFood,
      is_favorited: true,
      favorites_count: 20,
    };
    render(<FoodFlashCard food={favoritedFood} />);

    const favButton = screen.getByTitle('Bỏ yêu thích');
    fireEvent.click(favButton);

    await waitFor(() => {
      expect(screen.getByText('19')).toBeInTheDocument();
      expect(foodsApi.removeFavorite).toHaveBeenCalledWith(42);
    });
  });

  it('6. Tư duy sai / Thất bại hệ thống: API thất bại phải rollback optimistic update', async () => {
    vi.mocked(foodsApi.addFavorite).mockRejectedValueOnce(new Error('Network Error'));
    render(<FoodFlashCard food={mockFood} />);

    const favButton = screen.getByTitle('Yêu thích món này');
    fireEvent.click(favButton);

    // Rollback về lại 15 và gọi toast thông báo lỗi
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('7. Trạng thái kiểm duyệt đặc biệt: Món chờ duyệt (PENDING)', () => {
    const pendingFood: FoodItem = {
      ...mockFood,
      status: 'PENDING',
    };
    render(<FoodFlashCard food={pendingFood} />);
    expect(screen.getAllByText('Chờ duyệt').length).toBeGreaterThan(0);
  });
});
