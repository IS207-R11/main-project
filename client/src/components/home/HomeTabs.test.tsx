import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeTabs } from './HomeTabs';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/components/home/GachaGame', () => ({
  GachaGame: () => <div data-testid="gacha-game-mock">Gacha Game View</div>,
}));

vi.mock('@/components/tinder/TinderGame', () => ({
  TinderGame: () => <div data-testid="tinder-game-mock">Tinder Game View</div>,
}));

vi.mock('@/context/GameSettingsContext', () => ({
  useGameSettings: () => ({
    gachaSettings: {
      numberOfExcludedEaten: 0,
      typeOfExcludedEaten: 'newest',
      foodSet: [],
    },
    tinderSettings: {
      numberOfResult: 10,
      numberOfExcludedEaten: 0,
      typeOfExcludedEaten: 'newest',
      excludedGachaSet: false,
      foodSet: [],
    },
    updateGachaSettings: vi.fn(),
    updateTinderSettings: vi.fn(),
    resetGachaSettings: vi.fn(),
    resetTinderSettings: vi.fn(),
  }),
}));

describe('HomeTabs Component (Testing Matrix & Navigation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('');
  });

  it('1. Render thành công: Khởi tạo mặc định với tab Vòng Quay Gacha', () => {
    render(<HomeTabs />);

    expect(screen.getByText('Hôm Nay Bạn Muốn Ăn Gì?')).toBeInTheDocument();
    expect(screen.getByText('Vòng Quay Gacha')).toBeInTheDocument();
    expect(screen.getByText('Tinder Quẹt Món')).toBeInTheDocument();
    expect(screen.getByTestId('gacha-game-mock')).toBeInTheDocument();
  });

  it('2. Click vào nút hoạt động bình thường: Chuyển sang tab Tinder Quẹt Món', () => {
    render(<HomeTabs />);

    const tinderTabBtn = screen.getByRole('tab', { name: /Tinder Quẹt Món/i });
    fireEvent.click(tinderTabBtn);

    expect(mockReplace).toHaveBeenCalledWith('/?tab=tinder', { scroll: false });
  });

  it('3. Đọc dữ liệu query URL: Khi query tab=tinder thì render giao diện Tinder', () => {
    mockSearchParams = new URLSearchParams('tab=tinder');
    render(<HomeTabs />);

    expect(screen.getByText('Quẹt Món Ăn Bạn Thích')).toBeInTheDocument();
  });

  it('4. Click nút Settings mở dialog cấu hình', () => {
    render(<HomeTabs />);

    const settingsBtn = screen.getByTitle(/Cài đặt vòng quay/i);
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);

    // Dialog mở ra
    expect(screen.getByText(/Tùy chỉnh vòng quay/i)).toBeInTheDocument();
  });
});
