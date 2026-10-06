import { describe, it, expect } from 'vitest';
import { formatPrice, periodToSession, sessionToPeriod } from './foodData';

describe('foodData helpers', () => {
  it('1. formatPrice: Định dạng tiền tệ VND chính xác kể cả biên', () => {
    // 45 nghìn đồng -> 45.000 đ
    const formatted = formatPrice(45);
    expect(formatted).toContain('45.000');

    // 0 nghìn đồng
    const formattedZero = formatPrice(0);
    expect(formattedZero).toContain('0');
  });

  it('2. periodToSession: Chuyển đổi khung giờ sáng / tối', () => {
    expect(periodToSession('morning')).toBe('Sáng sớm');
    expect(periodToSession('night')).toBe('Tối');
  });

  it('3. sessionToPeriod: Chuyển đổi các buổi ăn thành period', () => {
    expect(sessionToPeriod('Sáng sớm')).toBe('morning');
    expect(sessionToPeriod('Giữa trưa')).toBe('morning');
    expect(sessionToPeriod('Chiều')).toBe('morning');
    expect(sessionToPeriod('Tối')).toBe('night');
  });
});
