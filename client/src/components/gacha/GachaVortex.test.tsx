import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GachaVortex } from './GachaVortex';

describe('GachaVortex Component', () => {
  it('renders vortex title and summon messages properly', () => {
    render(<GachaVortex title="VÒNG XOÁY THẦN BÍ" />);

    expect(screen.getByText('VÒNG XOÁY THẦN BÍ')).toBeInTheDocument();
    expect(screen.getByText(/Hệ thống đang kết nối vũ trụ ẩm thực/)).toBeInTheDocument();
  });

  it('calls onCancel callback when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<GachaVortex onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
