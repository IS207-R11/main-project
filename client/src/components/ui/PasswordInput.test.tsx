import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PasswordInput } from './password-input';

describe('PasswordInput Component', () => {
  it('Khởi tạo ban đầu với type là password và luôn hiển thị nút con mắt', () => {
    render(<PasswordInput placeholder="Nhập mật khẩu" />);

    const input = screen.getByPlaceholderText('Nhập mật khẩu');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /hiện mật khẩu/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('Click nút con mắt lần 1 chuyển type thành text (hiển thị password), aria-label đổi thành Ẩn mật khẩu', () => {
    render(<PasswordInput placeholder="Nhập mật khẩu" />);

    const input = screen.getByPlaceholderText('Nhập mật khẩu');
    const toggleButton = screen.getByRole('button', { name: /hiện mật khẩu/i });

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ẩn mật khẩu/i })).toBeInTheDocument();
  });

  it('Click nút con mắt lần 2 chuyển type ngược lại về password (ẩn password)', () => {
    render(<PasswordInput placeholder="Nhập mật khẩu" />);

    const input = screen.getByPlaceholderText('Nhập mật khẩu');
    const toggleButton = screen.getByRole('button', { name: /hiện mật khẩu/i });

    // Click 1: show
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click 2: hide
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /hiện mật khẩu/i })).toBeInTheDocument();
  });

  it('Vô hiệu hóa cả input và nút bấm khi disabled = true', () => {
    render(<PasswordInput placeholder="Nhập mật khẩu" disabled />);

    const input = screen.getByPlaceholderText('Nhập mật khẩu');
    const toggleButton = screen.getByRole('button', { name: /hiện mật khẩu/i });

    expect(input).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });
});
