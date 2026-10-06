import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GameSettingsProvider,
  useGameSettings,
  DEFAULT_GACHA_SETTINGS,
  DEFAULT_TINDER_SETTINGS,
} from './GameSettingsContext';

describe('GameSettingsContext (Testing Matrix & LocalStorage Persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Khởi tạo mặc định khi chưa có localStorage', () => {
    const { result } = renderHook(() => useGameSettings(), {
      wrapper: ({ children }) => (
        <GameSettingsProvider>{children}</GameSettingsProvider>
      ),
    });

    expect(result.current.gachaSettings).toEqual(DEFAULT_GACHA_SETTINGS);
    expect(result.current.tinderSettings).toEqual(DEFAULT_TINDER_SETTINGS);
  });

  it('2. Cập nhật cấu hình Gacha và lưu vào localStorage', () => {
    const { result } = renderHook(() => useGameSettings(), {
      wrapper: ({ children }) => (
        <GameSettingsProvider>{children}</GameSettingsProvider>
      ),
    });

    act(() => {
      result.current.updateGachaSettings({
        numberOfExcludedEaten: 5,
        typeOfExcludedEaten: 'random',
      });
    });

    expect(result.current.gachaSettings.numberOfExcludedEaten).toBe(5);
    expect(result.current.gachaSettings.typeOfExcludedEaten).toBe('random');

    // Kiểm tra trong localStorage
    const saved = JSON.parse(
      localStorage.getItem('an_gi_gacha_settings_v1') || '{}'
    );
    expect(saved.numberOfExcludedEaten).toBe(5);
  });

  it('3. Cập nhật cấu hình Tinder và kiểm tra giới hạn kết quả', () => {
    const { result } = renderHook(() => useGameSettings(), {
      wrapper: ({ children }) => (
        <GameSettingsProvider>{children}</GameSettingsProvider>
      ),
    });

    act(() => {
      result.current.updateTinderSettings({
        numberOfResult: 25,
        excludedGachaSet: true,
      });
    });

    expect(result.current.tinderSettings.numberOfResult).toBe(25);
    expect(result.current.tinderSettings.excludedGachaSet).toBe(true);
  });

  it('4. Reset cấu hình về giá trị mặc định ban đầu', () => {
    const { result } = renderHook(() => useGameSettings(), {
      wrapper: ({ children }) => (
        <GameSettingsProvider>{children}</GameSettingsProvider>
      ),
    });

    act(() => {
      result.current.updateGachaSettings({ numberOfExcludedEaten: 10 });
      result.current.resetGachaSettings();
    });

    expect(result.current.gachaSettings).toEqual(DEFAULT_GACHA_SETTINGS);
  });

  it('5. Tư duy sai / Dữ liệu corrupt từ localStorage: Tự động sanitize về biên hợp lệ', () => {
    // User tự sửa localStorage thành dữ liệu sai: số âm hoặc số quá lớn
    localStorage.setItem(
      'an_gi_tinder_settings_v1',
      JSON.stringify({
        numberOfResult: 99999, // vượt quá 50
        numberOfExcludedEaten: -15, // số âm
        foodSet: 'invalid_array', // không phải mảng
      })
    );

    const { result } = renderHook(() => useGameSettings(), {
      wrapper: ({ children }) => (
        <GameSettingsProvider>{children}</GameSettingsProvider>
      ),
    });

    // Sanitized: Max 50, Min 0, Mảng rỗng
    expect(result.current.tinderSettings.numberOfResult).toBe(50);
    expect(result.current.tinderSettings.numberOfExcludedEaten).toBe(0);
    expect(result.current.tinderSettings.foodSet).toEqual([]);
  });
});
