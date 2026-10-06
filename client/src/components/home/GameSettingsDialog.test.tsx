import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameSettingsDialog } from './GameSettingsDialog';

const mockUpdateGacha = vi.fn();
const mockUpdateTinder = vi.fn();
const mockResetGacha = vi.fn();
const mockResetTinder = vi.fn();

vi.mock('@/context/GameSettingsContext', () => ({
  useGameSettings: () => ({
    gachaSettings: {
      numberOfExcludedEaten: 3,
      typeOfExcludedEaten: 'newest',
      excludedGachaSet: false,
      foodSet: [1],
    },
    tinderSettings: {
      numberOfResult: 15,
      numberOfExcludedEaten: 2,
      typeOfExcludedEaten: 'newest',
      excludedGachaSet: false,
      foodSet: [],
    },
    updateGachaSettings: mockUpdateGacha,
    updateTinderSettings: mockUpdateTinder,
    resetGachaSettings: mockResetGacha,
    resetTinderSettings: mockResetTinder,
  }),
}));

vi.mock('@/api', () => ({
  foodsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        { food_id: 1, name: 'Phở Bò' },
        { food_id: 2, name: 'Bún Chả' },
      ],
    }),
  },
}));

describe('GameSettingsDialog Component (Testing Matrix & Mode switching)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Render chế độ Gacha: Hiển thị đúng tiêu đề và thuộc tính', async () => {
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeTab="gacha"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh vòng quay')).toBeInTheDocument();
      expect(screen.getByText('Bỏ qua món đã ăn')).toBeInTheDocument();
    });
  });

  it('2. Render chế độ Tinder: Hiển thị đúng tiêu đề và số lượng món quẹt', async () => {
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeTab="tinder"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh quẹt món')).toBeInTheDocument();
      expect(screen.getByText('Số lượng món mỗi lượt')).toBeInTheDocument();
    });
  });

  it('3. Click nút Mặc định gọi reset function', async () => {
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeTab="gacha"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh vòng quay')).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /Mặc định/i });
    fireEvent.click(resetBtn);
    expect(mockResetGacha).toHaveBeenCalledTimes(1);
  });

  it('4. Click nút Hoàn tất đóng dialog', async () => {
    const onOpenChange = vi.fn();
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={onOpenChange}
        activeTab="tinder"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh quẹt món')).toBeInTheDocument();
    });

    const doneBtn = screen.getByRole('button', { name: /Hoàn tất/i });
    fireEvent.click(doneBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('5. Cấu hình thứ tự loại trừ và ẩn món từng quay trúng', async () => {
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeTab="gacha"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tùy chỉnh vòng quay')).toBeInTheDocument();
    });

    // Đổi select thứ tự sang 'random'
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'random' } });
    expect(mockUpdateGacha).toHaveBeenCalledWith({ typeOfExcludedEaten: 'random' });

    // Tick checkbox ẩn món từng quay trúng
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockUpdateGacha).toHaveBeenCalledWith({ excludedGachaSet: true });
  });

  it('6. Mở bộ chọn món cụ thể, tìm kiếm và xóa chọn', async () => {
    render(
      <GameSettingsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeTab="gacha"
      />
    );

    // Mở bộ chọn món
    const openPickerBtn = screen.getByRole('button', { name: /Chọn món/i });
    fireEvent.click(openPickerBtn);

    // Chờ danh sách món load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tìm tên món.../i)).toBeInTheDocument();
    });

    // Nhập tìm kiếm
    const searchInput = screen.getByPlaceholderText(/Tìm tên món.../i);
    fireEvent.change(searchInput, { target: { value: 'Phở' } });

    // Bấm nút xóa chọn
    const clearBtn = screen.getByRole('button', { name: /Xóa chọn/i });
    fireEvent.click(clearBtn);
    expect(mockUpdateGacha).toHaveBeenCalledWith({ foodSet: [] });
  });
});
