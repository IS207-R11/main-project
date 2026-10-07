import { describe, it, expect, vi } from 'vitest';
import { normalizeErrorMessage, formatApiError } from './errorMapping';

describe('errorMapping - normalizeErrorMessage', () => {
  it('Chuẩn hóa lỗi Invalid username or password sang tiếng Việt', () => {
    expect(normalizeErrorMessage('Invalid username or password')).toBe(
      'Tên đăng nhập hoặc mật khẩu không chính xác'
    );
    expect(normalizeErrorMessage('invalid username or password.')).toBe(
      'Tên đăng nhập hoặc mật khẩu không chính xác'
    );
  });

  it('Chuẩn hóa lỗi Invalid user... sang tiếng Việt', () => {
    expect(normalizeErrorMessage('Invalid user')).toBe('Người dùng không hợp lệ');
    expect(normalizeErrorMessage('Invalid user credentials')).toBe('Người dùng không hợp lệ');
    expect(normalizeErrorMessage('Invalid user ID provided')).toBe('Người dùng không hợp lệ');
  });

  it('Chuẩn hóa lỗi User not found và Account is not active', () => {
    expect(normalizeErrorMessage('User not found')).toBe('Không tìm thấy người dùng');
    expect(normalizeErrorMessage('Account is not active')).toBe(
      'Tài khoản chưa được kích hoạt hoặc đã bị khóa'
    );
  });

  it('Chuẩn hóa các lỗi xác thực form (validation errors)', () => {
    expect(normalizeErrorMessage('The username has already been taken.')).toBe(
      'Tên đăng nhập này đã được sử dụng'
    );
    expect(normalizeErrorMessage('The email has already been taken.')).toBe(
      'Email này đã được sử dụng'
    );
    expect(normalizeErrorMessage('The username field is required.')).toBe(
      'Tên đăng nhập là bắt buộc'
    );
    expect(normalizeErrorMessage('The email field is required.')).toBe(
      'Email là bắt buộc'
    );
  });

  it('Trích xuất và chuẩn hóa từ đối tượng ApiErrorResponse hoặc error object', () => {
    expect(normalizeErrorMessage({ message: 'User not found' })).toBe('Không tìm thấy người dùng');
    expect(
      normalizeErrorMessage({
        errors: { username: ['The username has already been taken.'] },
      })
    ).toBe('Tên đăng nhập này đã được sử dụng');
  });

  it('Giữ nguyên các thông báo đã là tiếng Việt', () => {
    expect(normalizeErrorMessage('Tên đăng nhập là bắt buộc.')).toBe('Tên đăng nhập là bắt buộc.');
    expect(normalizeErrorMessage('Mật khẩu không khớp')).toBe('Mật khẩu không khớp');
  });

  it('Các thông báo không được chuẩn hóa hiển thị "Đã có lỗi xảy ra!"', () => {
    expect(normalizeErrorMessage('Random unknown database failure #9982')).toBe(
      'Đã có lỗi xảy ra!'
    );
    expect(normalizeErrorMessage('Syntax error in SQL query')).toBe('Đã có lỗi xảy ra!');
    expect(normalizeErrorMessage('')).toBe('Đã có lỗi xảy ra!');
    expect(normalizeErrorMessage(null)).toBe('Đã có lỗi xảy ra!');
  });
});

describe('errorMapping - formatApiError', () => {
  it('Xuất lỗi thật sự ra console.error và trả về thông báo chuẩn hóa', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const rawError = new Error('Invalid user details');
    const result = formatApiError(rawError, 'TestContext');

    expect(consoleSpy).toHaveBeenCalledWith('[API Error - TestContext]:', rawError);
    expect(result).toBe('Người dùng không hợp lệ');

    consoleSpy.mockRestore();
  });

  it('Xuất lỗi không được chuẩn hóa ra console.error và hiển thị "Đã có lỗi xảy ra!"', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const unknownErr = { code: 'ERR_UNKNOWN_XYZ', stack: 'trace...' };
    const result = formatApiError(unknownErr);

    expect(consoleSpy).toHaveBeenCalledWith('[API Error]:', unknownErr);
    expect(result).toBe('Đã có lỗi xảy ra!');

    consoleSpy.mockRestore();
  });
});
