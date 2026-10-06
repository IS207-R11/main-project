import { describe, it, expect } from 'vitest';
import { validatePassword } from './validation';

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
