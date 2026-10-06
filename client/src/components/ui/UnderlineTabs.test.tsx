import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnderlineTabs, type UnderlineTabItem } from './UnderlineTabs';

const mockTabs: UnderlineTabItem[] = [
  { value: 'tab1', label: 'Tab Thứ Nhất', count: 5 },
  { value: 'tab2', label: 'Tab Thứ Hai', count: 12 },
  { value: 'tab3', label: 'Tab Bị Khóa', disabled: true },
];

describe('UnderlineTabs Component', () => {
  it('1. Render thành công: Hiển thị thanh tab và các phần tử con', () => {
    const handleChange = vi.fn();
    render(
      <UnderlineTabs
        tabs={mockTabs}
        activeTab="tab1"
        onChange={handleChange}
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('2. Hiển thị đúng dữ liệu: Tên tab, số đếm và trạng thái active', () => {
    const handleChange = vi.fn();
    render(
      <UnderlineTabs
        tabs={mockTabs}
        activeTab="tab1"
        onChange={handleChange}
      />
    );

    // Kiểm tra tên các tabs
    expect(screen.getByText('Tab Thứ Nhất')).toBeInTheDocument();
    expect(screen.getByText('Tab Thứ Hai')).toBeInTheDocument();
    expect(screen.getByText('Tab Bị Khóa')).toBeInTheDocument();

    // Kiểm tra số đếm count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    // Kiểm tra tab active có aria-selected="true"
    const tab1 = screen.getByRole('tab', { name: /Tab Thứ Nhất/i });
    expect(tab1).toHaveAttribute('aria-selected', 'true');

    const tab2 = screen.getByRole('tab', { name: /Tab Thứ Hai/i });
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  it('3. Click vào nút hoạt động bình thường: Chuyển tab và gọi onChange', () => {
    const handleChange = vi.fn();
    render(
      <UnderlineTabs
        tabs={mockTabs}
        activeTab="tab1"
        onChange={handleChange}
      />
    );

    const tab2 = screen.getByRole('tab', { name: /Tab Thứ Hai/i });
    fireEvent.click(tab2);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('tab2');

    // Tab disabled không được gọi onChange
    const tab3 = screen.getByRole('tab', { name: /Tab Bị Khóa/i });
    fireEvent.click(tab3);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
