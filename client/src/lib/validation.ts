/**
 * Username validation rule:
 * - Required (bắt buộc)
 * - No whitespace (không có khoảng trắng)
 * - No unicode / ASCII only (không có unicode)
 */
export function validateUsername(username: string): string | null {
  if (!username || !username.trim()) {
    return 'Tên đăng nhập là bắt buộc.';
  }
  if (/\s/.test(username)) {
    return 'Tên đăng nhập không được chứa khoảng trắng.';
  }
  if (Array.from(username).some((ch) => ch.charCodeAt(0) > 127)) {
    return 'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode.';
  }
  return null;
}

/**
 * Email validation rule:
 * - Required (bắt buộc)
 * - Valid email format
 */
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email là bắt buộc.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Địa chỉ email không đúng định dạng.';
  }
  return null;
}

/**
 * Password validation rule:
 * - At least 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).';
  }
  return null;
}
