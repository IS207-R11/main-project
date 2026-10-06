import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataPagination } from './data-pagination';

describe('DataPagination Component (Testing Matrix & Boundary Checks)', () => {
  it('1. Render thành công: Hiển thị thanh phân trang với các nút chuyển trang', () => {
    render(
      <DataPagination
        currentPage={1}
        totalRecords={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByTitle('Trang trước')).toBeInTheDocument();
    expect(screen.getByTitle('Trang sau')).toBeInTheDocument();
  });

  it('2. Hiển thị đúng dữ liệu: Tóm tắt phân trang và trang active', () => {
    render(
      <DataPagination
        currentPage={3}
        totalRecords={100}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    // Chuỗi tóm tắt 21 - 30 trong 100 bản ghi
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    // Trang 3 là trang đang chọn
    const page3Btn = screen.getByRole('button', { name: '3' });
    expect(page3Btn).toBeInTheDocument();
  });

  it('3. Click vào nút hoạt động bình thường: Chuyển sang trang mới', () => {
    const handlePageChange = vi.fn();
    render(
      <DataPagination
        currentPage={2}
        totalRecords={50}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    // Bấm trang 4
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(handlePageChange).toHaveBeenCalledWith(4);

    // Bấm nút tiếp theo
    fireEvent.click(screen.getByTitle('Trang sau'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('4. Tư duy sai của user: Click nút Trước khi đang ở trang 1', () => {
    const handlePageChange = vi.fn();
    render(
      <DataPagination
        currentPage={1}
        totalRecords={50}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    const prevBtn = screen.getByTitle('Trang trước');
    expect(prevBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(handlePageChange).not.toHaveBeenCalled();
  });

  it('5. Tư duy sai của user: Click nút Tiếp khi đang ở trang cuối cùng', () => {
    const handlePageChange = vi.fn();
    render(
      <DataPagination
        currentPage={5}
        totalRecords={50}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    const nextBtn = screen.getByTitle('Trang sau');
    expect(nextBtn).toBeDisabled();

    fireEvent.click(nextBtn);
    expect(handlePageChange).not.toHaveBeenCalled();
  });

  it('6. Dữ liệu biên: totalRecords <= 0 component ẩn an toàn không crash', () => {
    const { container } = render(
      <DataPagination
        currentPage={1}
        totalRecords={0}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('7. Dữ liệu biên: Nhiều trang xuất hiện ký hiệu rút gọn (ellipsis)', () => {
    render(
      <DataPagination
        currentPage={6}
        totalRecords={200}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    // Dấu ba chấm "..."
    const dots = screen.getAllByText('...');
    expect(dots.length).toBeGreaterThan(0);
  });
});
