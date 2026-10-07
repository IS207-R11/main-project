import { ApiErrorResponse } from '../api/types/common';

/**
 * Common English API error messages mapped to standardized Vietnamese messages.
 */
const COMMON_ERROR_MAP: Record<string, string> = {
  // Authentication & User errors
  'invalid username or password': 'Tên đăng nhập hoặc mật khẩu không chính xác',
  'invalid credentials or disabled account': 'Thông tin đăng nhập không hợp lệ hoặc tài khoản đã bị vô hiệu hóa',
  'account is not active': 'Tài khoản chưa được kích hoạt hoặc đã bị khóa',
  'account is disabled or banned': 'Tài khoản đã bị khóa hoặc vô hiệu hóa',
  'user not found': 'Không tìm thấy người dùng',
  'invalid user': 'Người dùng không hợp lệ',
  'invalid credentials': 'Thông tin xác thực không hợp lệ',
  'unauthorized': 'Phiên đăng nhập đã hết hạn hoặc bạn không có quyền truy cập',
  'unauthenticated': 'Vui lòng đăng nhập để tiếp tục',
  'forbidden': 'Bạn không có quyền thực hiện thao tác này',
  'refresh token required': 'Yêu cầu mã làm mới phiên đăng nhập',
  'invalid or expired refresh token': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'old password is incorrect': 'Mật khẩu cũ không chính xác',
  'new password must be at least 6 characters': 'Mật khẩu mới phải có ít nhất 6 ký tự',

  // Validation messages
  'the username field is required': 'Tên đăng nhập là bắt buộc',
  'the email field is required': 'Email là bắt buộc',
  'the password field is required': 'Mật khẩu là bắt buộc',
  'the username has already been taken': 'Tên đăng nhập này đã được sử dụng',
  'the email has already been taken': 'Email này đã được sử dụng',
  'the email field must be a valid email address': 'Địa chỉ email không đúng định dạng',
  'the username format is invalid': 'Tên đăng nhập không được chứa khoảng trắng hoặc ký tự có dấu',
  'the username must only contain ascii characters': 'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode',
  'the given data was invalid': 'Dữ liệu không hợp lệ',
  'validation error': 'Dữ liệu không hợp lệ',

  // Resource errors
  'food not found': 'Không tìm thấy món ăn',
  'report not found': 'Không tìm thấy báo cáo',
  'health profile not found': 'Không tìm thấy hồ sơ sức khỏe',
  'nutrition not found': 'Không tìm thấy thông tin dinh dưỡng',
  'failed to upload image': 'Không thể tải ảnh lên',

  // System & HTTP errors
  'too many requests': 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
  'internal server error': 'Máy chủ gặp sự cố, vui lòng thử lại sau',
  'server error': 'Máy chủ gặp sự cố, vui lòng thử lại sau',
  'network error': 'Không thể kết nối đến máy chủ',
  'failed to fetch': 'Không thể kết nối đến máy chủ',
};

/**
 * Regex patterns for matching variants (e.g. "Invalid user...", "Invalid user id")
 */
const PATTERN_MAP: Array<{ regex: RegExp; message: string }> = [
  { regex: /^invalid\s+user/i, message: 'Người dùng không hợp lệ' },
  { regex: /^invalid\s+username\s+or\s+password/i, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
  { regex: /^account\s+is\s+not\s+active/i, message: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa' },
  { regex: /^user\s+not\s+found/i, message: 'Không tìm thấy người dùng' },
  { regex: /^unauthorized/i, message: 'Phiên đăng nhập đã hết hạn hoặc bạn không có quyền truy cập' },
  { regex: /^forbidden/i, message: 'Bạn không có quyền thực hiện thao tác này' },
  { regex: /the username has already been taken/i, message: 'Tên đăng nhập này đã được sử dụng' },
  { regex: /the email has already been taken/i, message: 'Email này đã được sử dụng' },
  { regex: /username.*(whitespace|khoảng trắng)/i, message: 'Tên đăng nhập không được chứa khoảng trắng' },
  { regex: /username.*(ascii|unicode|ký tự có dấu)/i, message: 'Tên đăng nhập không được chứa ký tự có dấu hoặc unicode' },
  { regex: /email.*(valid|hợp lệ|định dạng)/i, message: 'Địa chỉ email không đúng định dạng' },
  { regex: /^too many requests/i, message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau' },
  { regex: /^network\s*error|^failed to fetch/i, message: 'Không thể kết nối đến máy chủ' },
];

/**
 * Check if the message is already in Vietnamese (contains Vietnamese diacritics).
 */
function isVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

/**
 * Normalize an error message into Vietnamese.
 * If the message matches common known error patterns, returns standard Vietnamese translation.
 * If the message is already in Vietnamese, preserves it.
 * If unnormalized / unknown, returns the default fallback: "Đã có lỗi xảy ra!".
 */
export function normalizeErrorMessage(raw: unknown): string {
  if (!raw) {
    return 'Đã có lỗi xảy ra!';
  }

  let text = '';
  if (typeof raw === 'string') {
    text = raw.trim();
  } else if (raw instanceof Error) {
    text = raw.message.trim();
  } else if (typeof raw === 'object') {
    const errObj = raw as ApiErrorResponse;
    if (errObj.message) {
      text = errObj.message.trim();
    } else if (errObj.errors && typeof errObj.errors === 'object') {
      const firstKey = Object.keys(errObj.errors)[0];
      const errList = firstKey ? errObj.errors[firstKey] : null;
      if (Array.isArray(errList) && errList.length > 0) {
        text = String(errList[0]).trim();
      }
    }
  }

  if (!text) {
    return 'Đã có lỗi xảy ra!';
  }

  // If the message is already Vietnamese, keep it
  if (isVietnamese(text)) {
    return text;
  }

  const normalized = text.toLowerCase().replace(/[.!]+$/, '').trim();

  // 1. Direct dictionary match
  if (COMMON_ERROR_MAP[normalized]) {
    return COMMON_ERROR_MAP[normalized];
  }

  // 2. Pattern matching
  for (const { regex, message } of PATTERN_MAP) {
    if (regex.test(text)) {
      return message;
    }
  }

  // 3. Fallback for unnormalized messages
  return 'Đã có lỗi xảy ra!';
}

/**
 * Check if the error contains password-related issues
 */
export function hasPasswordError(raw: unknown): boolean {
  if (!raw) return false;
  if (typeof raw === 'string') {
    return /password|mật khẩu/i.test(raw);
  }
  if (raw instanceof Error) {
    return /password|mật khẩu/i.test(raw.message);
  }
  if (typeof raw === 'object') {
    const errObj = raw as ApiErrorResponse;
    if (errObj.errors && typeof errObj.errors === 'object' && errObj.errors.password) {
      return true;
    }
    if (errObj.message && /password|mật khẩu/i.test(errObj.message)) {
      return true;
    }
  }
  return false;
}

/**
 * Format any API/UI error:
 * 1. Outputs the real error to console log.
 * 2. Returns the normalized Vietnamese message or "Đã có lỗi xảy ra!".
 * Đối với đăng ký tài khoản mới: nếu có lỗi mật khẩu, luôn trả về "Mật khẩu sai".
 */
export function formatApiError(err: unknown, context?: string): string {
  // Requirement: Lỗi thật sự thì xuất ra console log
  if (context) {
    console.error(`[API Error - ${context}]:`, err);
  } else {
    console.error('[API Error]:', err);
  }

  // Khi user tạo mới tài khoản và nhập sai mật khẩu: luôn hiển thị "Mật khẩu sai"
  if (context === 'Đăng ký' && hasPasswordError(err)) {
    return 'Mật khẩu sai';
  }

  return normalizeErrorMessage(err);
}
