import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GachaGame } from './GachaGame';
import { foodsApi } from '@/api';
import { toast } from 'react-toastify';

vi.mock('@/api', () => ({
  foodsApi: {
    gacha: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { user_id: 1, username: 'testuser' },
    isAuthenticated: true,
    openAuthModal: vi.fn(),
  }),
}));

vi.mock('@/context/GameSettingsContext', () => ({
  useGameSettings: () => ({
    gachaSettings: {
      numberOfExcludedEaten: 0,
      typeOfExcludedEaten: 'newest',
      excludedGachaSet: false,
      foodSet: [],
    },
  }),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('GachaGame flow with Vortex, Reveal, and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers vortex swirl parallel to API fetch and transitions to finished reveal on success', async () => {
    const mockFood = {
      food_id: 88,
      name: 'Bún Bò Huế Hoàng Gia',
      food_rank: 'SSR',
      image_url: '/foods/bun-bo.jpg',
      status: 'ACTIVE',
      created_at: '2026-10-08T00:00:00Z',
    };

    (foodsApi.gacha as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockFood });
          }, 100);
        })
    );

    render(<GachaGame />);

    // Initially pack is visible
    expect(screen.getByText('Mở Gói Khám Phá Ngay')).toBeInTheDocument();

    // Click open pack
    fireEvent.click(screen.getByText('Mở Gói Khám Phá Ngay'));

    // Vortex animation appears immediately
    await waitFor(() => {
      expect(screen.getByText('VÒNG XOÁY ẨM THỰC')).toBeInTheDocument();
    });

    // After API finishes and min vortex time passes, reveal effect is displayed
    await waitFor(
      () => {
        expect(screen.getByText('KHÁM PHÁ MỚI')).toBeInTheDocument();
        expect(screen.getByText('SSR')).toBeInTheDocument();
        expect(screen.getByText('Bún Bò Huế Hoàng Gia')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    // Clicking reveal finishes it into flashcard view
    fireEvent.click(screen.getByText('KHÁM PHÁ MỚI'));

    await waitFor(() => {
      expect(screen.getByText('Kết Quả Gacha Xuất Sắc Nhất')).toBeInTheDocument();
      expect(screen.getByText('Quay Lại Vòng Quay')).toBeInTheDocument();
    });
  });

  it('handles API error by notifying with toastify and resetting interface back to pack state', async () => {
    (foodsApi.gacha as any).mockRejectedValue(new Error('Máy chủ đang bận, thử lại sau!'));

    render(<GachaGame />);

    // Click open pack
    fireEvent.click(screen.getByText('Mở Gói Khám Phá Ngay'));

    // Vortex animation appears during fetch
    await waitFor(() => {
      expect(screen.getByText('VÒNG XOÁY ẨM THỰC')).toBeInTheDocument();
    });

    // When error occurs, toast.error is called
    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith('Máy chủ đang bận, thử lại sau!');
      },
      { timeout: 3000 }
    );

    // And UI returns back to initial pack state as before gacha
    await waitFor(() => {
      expect(screen.getByText('Mở Gói Khám Phá Ngay')).toBeInTheDocument();
      expect(screen.queryByText('VÒNG XOÁY ẨM THỰC')).not.toBeInTheDocument();
    });
  });
});
