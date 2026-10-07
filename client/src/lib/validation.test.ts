import { describe, it, expect } from 'vitest';
import { validatePassword, validateUsername, validateEmail } from './validation';

describe('validation - validateUsername', () => {
  it('Bắt buộc: Báo lỗi khi username rỗng hoặc chỉ có khoảng trắng', () => {
    expect(validateUsername('')).toBe('Tên đăng nhập là bắt buộc.');
    expect(validateUsername('   ')).toBe('Tên đăng nhập là bắt buộc.');
  });

  it('Không có khoảng trắng: Báo lỗi khi username chứa khoảng trắng', () => {
    expect(validateUsername('user name')).toBe('Tên đăng nhập không được chứa khoảng trắng.');
    expect(validateUsername('username ')).toBe('Tên đăng nhập không được chứa khoảng trắng.');
    expect(validateUsername(' user')).toBe('Tên đăng nhập không được chứa khoảng trắng.');
    expect(validateUsername('my\tuser')).toBe('Tên đăng nhập không được chứa khoảng trắng.');
  });

  it('Không có unicode: Báo lỗi khi username chứa ký tự có dấu / unicode', () => {
    expect(validateUsername('nguyễn_văn_a')).toBe(
      'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode.'
    );
    expect(validateUsername('user_đẹp')).toBe(
      'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode.'
    );
    expect(validateUsername('tài_khoản')).toBe(
      'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode.'
    );
  });

  it('Hợp lệ: Chấp nhận username chỉ chứa ASCII không khoảng trắng', () => {
    expect(validateUsername('valid_user')).toBeNull();
    expect(validateUsername('john_doe123')).toBeNull();
    expect(validateUsername('angi-app.vn')).toBeNull();
    expect(validateUsername('User123')).toBeNull();
  });
});

describe('validation - validateEmail', () => {
  it('Bắt buộc: Báo lỗi khi email rỗng', () => {
    expect(validateEmail('')).toBe('Email là bắt buộc.');
    expect(validateEmail('   ')).toBe('Email là bắt buộc.');
  });

  it('Định dạng: Báo lỗi khi email sai định dạng', () => {
    expect(validateEmail('invalid-email')).toBe('Địa chỉ email không đúng định dạng.');
    expect(validateEmail('user@')).toBe('Địa chỉ email không đúng định dạng.');
    expect(validateEmail('user@domain')).toBe('Địa chỉ email không đúng định dạng.');
    expect(validateEmail('@domain.com')).toBe('Địa chỉ email không đúng định dạng.');
  });

  it('Hợp lệ: Chấp nhận email đúng định dạng', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name+tag@domain.co')).toBeNull();
  });
});

describe('validation - validatePassword (Testing Matrix & Negative User Inputs)', () => {
  it('1. Tư duy sai: Mật khẩu rỗng hoặc dưới 8 ký tự', () => {
    expect(validatePassword('')).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
    expect(validatePassword('123')).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
    expect(validatePassword('Abc1!f')).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('2. Tư duy sai: Mật khẩu thiếu chữ hoa (A-Z)', () => {
    expect(validatePassword('password123!')).toBe(
      'Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).'
    );
  });

  it('3. Tư duy sai: Mật khẩu thiếu chữ thường (a-z)', () => {
    expect(validatePassword('PASSWORD123!')).toBe(
      'Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).'
    );
  });

  it('4. Tư duy sai: Mật khẩu thiếu chữ số (0-9)', () => {
    expect(validatePassword('Password!Special')).toBe(
      'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).'
    );
  });

  it('5. Tư duy sai: Mật khẩu thiếu ký tự đặc biệt (!@#$%...)', () => {
    expect(validatePassword('Password123456')).toBe(
      'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).'
    );
  });

  it('6. Mật khẩu hợp lệ: Thỏa mãn toàn bộ tiêu chí bảo mật', () => {
    expect(validatePassword('Pass@word123')).toBeNull();
    expect(validatePassword('Secure#P4ssw0rd!')).toBeNull();
  });
});
