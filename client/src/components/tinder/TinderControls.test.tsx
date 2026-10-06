import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TinderControls } from './TinderControls';

describe('TinderControls Component (Testing Matrix & Negative Scenarios)', () => {
  it('1. Render thành công: Đầy đủ 5 nút điều khiển tương tác', () => {
    render(
      <TinderControls
        canUndo={true}
        onUndo={vi.fn()}
        onNope={vi.fn()}
        onSuperLike={vi.fn()}
        onLike={vi.fn()}
        onInfo={vi.fn()}
      />
    );

    expect(screen.getByTitle(/Hoàn tác món vừa quẹt/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Bỏ qua món này/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Siêu Thích/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Chốt món ăn này/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Xem thông tin chi tiết/i)).toBeInTheDocument();
  });

  it('2. Click vào các nút hoạt động bình thường', () => {
    const onUndo = vi.fn();
    const onNope = vi.fn();
    const onSuperLike = vi.fn();
    const onLike = vi.fn();
    const onInfo = vi.fn();

    render(
      <TinderControls
        canUndo={true}
        onUndo={onUndo}
        onNope={onNope}
        onSuperLike={onSuperLike}
        onLike={onLike}
        onInfo={onInfo}
      />
    );

    fireEvent.click(screen.getByTitle(/Bỏ qua món này/i));
    expect(onNope).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Chốt món ăn này/i));
    expect(onLike).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Siêu Thích/i));
    expect(onSuperLike).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Hoàn tác/i));
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Xem thông tin chi tiết/i));
    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  it('3. Tư duy sai của user: Cố bấm Hoàn tác khi canUndo = false', () => {
    const onUndo = vi.fn();
    render(
      <TinderControls
        canUndo={false}
        onUndo={onUndo}
        onNope={vi.fn()}
        onSuperLike={vi.fn()}
        onLike={vi.fn()}
        onInfo={vi.fn()}
      />
    );

    const undoBtn = screen.getByTitle(/Hoàn tác/i);
    expect(undoBtn).toBeDisabled();

    fireEvent.click(undoBtn);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('4. Trạng thái disabled toàn bộ: Khi không có thẻ hoặc đang thực hiện chuyển cảnh', () => {
    const onLike = vi.fn();
    render(
      <TinderControls
        canUndo={true}
        onUndo={vi.fn()}
        onNope={vi.fn()}
        onSuperLike={vi.fn()}
        onLike={onLike}
        onInfo={vi.fn()}
        disabled={true}
      />
    );

    const likeBtn = screen.getByTitle(/Chốt món ăn này/i);
    expect(likeBtn).toBeDisabled();

    fireEvent.click(likeBtn);
    expect(onLike).not.toHaveBeenCalled();
  });
});
