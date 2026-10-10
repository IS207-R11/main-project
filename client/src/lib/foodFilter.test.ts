import { describe, it, expect } from 'vitest';
import { isFoodMatchingFilter, ALLERGY_OPTIONS, MEAL_SESSION_OPTIONS } from './foodFilter';

describe('foodFilter Utility', () => {
  it('1. Đầy đủ các options cho Dị ứng và Khung giờ bữa ăn', () => {
    expect(ALLERGY_OPTIONS.length).toBe(8);
    expect(MEAL_SESSION_OPTIONS.length).toBe(6);
  });

  it('2. Lọc chế độ ăn chay chính xác', () => {
    const chayFood = { id: 1, name: 'Đậu Hũ Sốt Cà Chua', description: 'Món chay thanh đạm với nấm và đậu phụ' };
    const manFood = { id: 2, name: 'Bún Bò Huế', description: 'Thịt bò nạm và chả cua thơm ngon' };

    expect(isFoodMatchingFilter(chayFood, { dietary: 'veg' })).toBe(true);
    expect(isFoodMatchingFilter(manFood, { dietary: 'veg' })).toBe(false);
  });

  it('3. Lọc chế độ ăn mặn chính xác', () => {
    const chayFood = { id: 1, name: 'Cơm Chay Nấm', description: 'Cơm chay thanh đạm' };
    const manFood = { id: 2, name: 'Cơm Sườn Nướng', description: 'Sườn heo nướng mật ong' };

    expect(isFoodMatchingFilter(chayFood, { dietary: 'meat' })).toBe(false);
    expect(isFoodMatchingFilter(manFood, { dietary: 'meat' })).toBe(true);
  });

  it('4. Loại trừ món khi dính dị ứng đã chọn', () => {
    const seafoodDish = { id: 1, name: 'Mực Hấp Gừng', description: 'Mực tươi hấp gừng cay nồng' };
    const beefDish = { id: 2, name: 'Phở Bò Tái', description: 'Thịt bò tái mềm ngon' };
    const normalDish = { id: 3, name: 'Bánh Mì Trứng', description: 'Bánh mì ốp la giòn rụm' };

    // Dị ứng hải sản
    expect(isFoodMatchingFilter(seafoodDish, { allergies: ['seafood'] })).toBe(false);
    expect(isFoodMatchingFilter(beefDish, { allergies: ['seafood'] })).toBe(true);

    // Dị ứng thịt bò
    expect(isFoodMatchingFilter(beefDish, { allergies: ['beef'] })).toBe(false);

    // Dị ứng trứng
    expect(isFoodMatchingFilter(normalDish, { allergies: ['egg'] })).toBe(false);
  });

  it('5. Lọc theo khung giờ / bữa ăn trong ngày', () => {
    const breakfast = { id: 1, name: 'Phở Gà Hà Nội', description: 'Món ăn sáng quốc hồn quốc túy' };
    const dessert = { id: 2, name: 'Chè Bưởi An Giang', description: 'Món tráng miệng thanh mát ngọt bùi' };
    const snack = { id: 3, name: 'Bánh Tráng Trộn', description: 'Món ăn vặt đường phố hấp dẫn' };

    expect(isFoodMatchingFilter(breakfast, { mealSession: 'breakfast' })).toBe(true);
    expect(isFoodMatchingFilter(dessert, { mealSession: 'dessert' })).toBe(true);
    expect(isFoodMatchingFilter(breakfast, { mealSession: 'dessert' })).toBe(false);
    expect(isFoodMatchingFilter(snack, { mealSession: 'snack' })).toBe(true);
  });
});
