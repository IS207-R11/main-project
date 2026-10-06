'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi, healthProfilesApi, authApi, foodsApi } from '@/api';
import {
  HealthProfile,
  CreateHealthProfileRequest,
  MeasuringMethod,
  LaborLevel,
  MaternityStatus,
  UserFoodItem,
} from '@/api/types';
import { validatePassword } from '@/lib/validation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faHeartPulse,
  faLock,
  faHeart,
  faBan,
  faWeightScale,
  faRulerVertical,
  faCalendarDay,
  faCheck,
  faTriangleExclamation,
  faArrowRightToBracket,
  faTrashCan,
  faPencil,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal, refreshUser, logout } =
    useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'health' | 'preferences' | 'security'>(
    'profile'
  );

  // Profile update form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [profileSaving, setProfileSaving] = useState(false);

  // Health Profile state
  const [healthProfiles, setHealthProfiles] = useState<HealthProfile[]>([]);
  const [_healthLoading, setHealthLoading] = useState(false);
  const [weight, setWeight] = useState<number>(60);
  const [height, setHeight] = useState<number>(170);
  const [measuringMethod, setMeasuringMethod] = useState<MeasuringMethod>('STANDING');
  const [laborLevel, setLaborLevel] = useState<LaborLevel>('MID');
  const [maternityStatus, setMaternityStatus] = useState<MaternityStatus | ''>('');
  const [dateOfMeasuring, setDateOfMeasuring] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [healthMsg, setHealthMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [healthSaving, setHealthSaving] = useState(false);

  // Preferences state (Favorite & Hated)
  const [favorites, setFavorites] = useState<UserFoodItem[]>([]);
  const [hated, setHated] = useState<UserFoodItem[]>([]);
  const [loadingPref, setLoadingPref] = useState(false);
  const [editingPref, setEditingPref] = useState<{
    type: 'favorite' | 'hated';
    food_id: number;
    note: string;
  } | null>(null);

  // Security password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [secMsg, setSecMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [secSaving, setSecSaving] = useState(false);

  // Populate user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
    }
  }, [user]);

  // Load health profiles
  const loadHealthProfiles = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setHealthLoading(true);
      const res = await healthProfilesApi.listByUser(user.user_id, { pageSize: 10 });
      if (res && res.data) {
        setHealthProfiles(res.data);
        if (res.data.length > 0) {
          const latest = res.data[0];
          setWeight(latest.weight);
          setHeight(latest.height);
          if (latest.measuring_method) setMeasuringMethod(latest.measuring_method);
          if (latest.labor_level) setLaborLevel(latest.labor_level);
          if (latest.maternity_status) setMaternityStatus(latest.maternity_status);
          if (latest.date_of_measuring) setDateOfMeasuring(latest.date_of_measuring);
        }
      }
    } catch (e) {
      console.warn('Failed to load health profiles:', e);
    } finally {
      setHealthLoading(false);
    }
  }, [user]);

  // Load preferences (Favorites & Hated)
  const loadPreferences = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoadingPref(true);
      const [favRes, hatedRes] = await Promise.all([
        foodsApi.getFavorites(user.user_id, { pageSize: 50 }),
        foodsApi.getHated(user.user_id, { pageSize: 50 }),
      ]);
      if (favRes?.data) setFavorites(favRes.data);
      if (hatedRes?.data) setHated(hatedRes.data);
    } catch (e) {
      console.warn('Failed to load food preferences:', e);
    } finally {
      setLoadingPref(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadHealthProfiles();
      loadPreferences();
    }
  }, [user?.user_id, loadHealthProfiles, loadPreferences]);

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-20 px-4 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-lg py-20 px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto text-secondary text-2xl">
          <FontAwesomeIcon icon={faLock} />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Bạn Chưa Đăng Nhập</h1>
        <p className="text-sm text-muted-foreground">
          Vui lòng đăng nhập để xem và quản lý hồ sơ cá nhân cũng như các chỉ số sức khỏe của bạn.
        </p>
        <Button onClick={() => openAuthModal('login')} className="font-bold gap-2">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <span>Đăng Nhập Ngay</span>
        </Button>
      </div>
    );
  }

  // Calculate BMI
  const heightInMeters = height / 100;
  const bmi =
    heightInMeters > 0 ? Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10 : 0;
  let bmiCategory = 'Bình thường';
  let bmiColor = 'text-emerald-500';
  if (bmi < 18.5) {
    bmiCategory = 'Gầy / Thiếu cân';
    bmiColor = 'text-amber-500';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Thừa cân';
    bmiColor = 'text-orange-500';
  } else if (bmi >= 30) {
    bmiCategory = 'Béo phì';
    bmiColor = 'text-rose-500';
  }

  // Estimated daily calories (BMR approx * activity factor)
  const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5;
  const activityMultiplier = laborLevel === 'LOW' ? 1.2 : laborLevel === 'MID' ? 1.55 : 1.75;
  const targetCalories = Math.round(bmr * activityMultiplier);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      setProfileSaving(true);
      await usersApi.update(user.user_id, {
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshUser();
      setProfileMsg({ text: 'Cập nhật thông tin cá nhân thành công!', type: 'success' });
    } catch (err: unknown) {
      setProfileMsg({ text: err instanceof Error ? err.message : 'Lỗi cập nhật', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setHealthMsg(null);
    try {
      setHealthSaving(true);
      const payload: CreateHealthProfileRequest = {
        weight: Number(weight),
        height: Number(height),
        date_of_measuring: dateOfMeasuring,
        measuring_method: measuringMethod,
        labor_level: laborLevel,
        maternity_status: (maternityStatus as MaternityStatus) || undefined,
      };
      await healthProfilesApi.create(user.user_id, payload);
      await loadHealthProfiles();
      setHealthMsg({ text: 'Đã lưu chỉ số sức khỏe mới!', type: 'success' });
    } catch (err: unknown) {
      setHealthMsg({
        text: err instanceof Error ? err.message : 'Lỗi cập nhật sức khỏe',
        type: 'error',
      });
    } finally {
      setHealthSaving(false);
    }
  };

  const handleDeleteHealthProfile = async (profileId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi chỉ số sức khỏe này?')) return;
    try {
      await healthProfilesApi.delete(profileId);
      setHealthProfiles((prev) => prev.filter((p) => p.profile_id !== profileId));
    } catch (err) {
      console.error('Lỗi khi xóa health profile:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg(null);
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      setSecMsg({ text: pwdErr, type: 'error' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSecMsg({ text: 'Mật khẩu xác nhận không khớp', type: 'error' });
      return;
    }
    try {
      setSecSaving(true);
      await authApi.changePassword(user.user_id, {
        oldPassword: oldPassword || undefined,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSecMsg({ text: 'Đổi mật khẩu thành công!', type: 'success' });
    } catch (err: unknown) {
      setSecMsg({ text: err instanceof Error ? err.message : 'Lỗi đổi mật khẩu', type: 'error' });
    } finally {
      setSecSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn tài khoản của bạn. Nhập tên tài khoản của bạn để xác nhận:'
    );
    if (confirmation !== user.username) return;

    try {
      await usersApi.delete(user.user_id);
      alert('Tài khoản của bạn đã được xóa thành công.');
      logout();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa tài khoản');
    }
  };

  // Preference handlers
  const handleUpdatePrefNote = async () => {
    if (!editingPref) return;
    try {
      if (editingPref.type === 'favorite') {
        await foodsApi.updateFavorite({
          food_id: editingPref.food_id,
          note: editingPref.note,
        });
      } else {
        await foodsApi.updateHated({
          food_id: editingPref.food_id,
          note: editingPref.note,
        });
      }
      setEditingPref(null);
      await loadPreferences();
    } catch (err) {
      console.error('Lỗi cập nhật ghi chú sở thích:', err);
    }
  };

  const handleRemoveFavorite = async (foodId: number) => {
    try {
      await foodsApi.removeFavorite(foodId);
      setFavorites((prev) => prev.filter((item) => item.food_id !== foodId));
    } catch (err) {
      console.error('Lỗi bỏ yêu thích:', err);
    }
  };

  const handleRemoveHated = async (foodId: number) => {
    try {
      await foodsApi.removeHated(foodId);
      setHated((prev) => prev.filter((item) => item.food_id !== foodId));
    } catch (err) {
      console.error('Lỗi bỏ món ghét:', err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-extrabold text-2xl border border-secondary/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{user.username}</h1>
                <Badge className="text-xs font-bold px-2.5 py-0.5 rounded-full">{user.role}</Badge>
                <Badge
                  variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                >
                  {user.status || 'ACTIVE'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.email || 'Chưa liên kết email'} • Tham gia:{' '}
                {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Mới'}
              </p>
              {user.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px] text-primary" />
                  <span>{user.address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            setActiveTab(val as 'profile' | 'health' | 'preferences' | 'security')
          }
          className="space-y-6"
        >
          <UnderlineTabs
            layoutId="profile-tab-indicator"
            align="full"
            tabs={[
              {
                value: 'profile',
                label: 'Cá Nhân',
                icon: <FontAwesomeIcon icon={faUser} />,
              },
              {
                value: 'preferences',
                label: 'Sở Thích',
                icon: <FontAwesomeIcon icon={faHeart} className="text-rose-500" />,
              },
              {
                value: 'health',
                label: 'Sức Khỏe & Calo',
                icon: <FontAwesomeIcon icon={faHeartPulse} className="text-emerald-500" />,
              },
              {
                value: 'security',
                label: 'Bảo Mật',
                icon: <FontAwesomeIcon icon={faLock} />,
              },
            ]}
            activeTab={activeTab}
            onChange={(val) =>
              setActiveTab(val as 'profile' | 'health' | 'preferences' | 'security')
            }
          />

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          <TabsContent value="profile">
            <Card className="rounded-2xl border-border bg-card w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Cập Nhật Thông Tin Cá Nhân</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Thông tin hồ sơ của bạn trên hệ thống AnGi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  {profileMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        profileMsg.type === 'success'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : 'bg-destructive/15 text-destructive border border-destructive/30'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={profileMsg.type === 'success' ? faCheck : faTriangleExclamation}
                      />
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Tên tài khoản (Username)</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Địa chỉ cư trú / giao hàng</label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                    />
                  </div>

                  <Button type="submit" disabled={profileSaving} className="font-bold">
                    {profileSaving ? <Spinner /> : 'Lưu Thay Đổi'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SỞ THÍCH ĂN UỐNG (FAVORITES & HATED) */}
          <TabsContent value="preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Favorites Card */}
              <Card className="rounded-2xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
                    <FontAwesomeIcon icon={faHeart} />
                    <span>Món Ăn Yêu Thích ({favorites.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Danh sách các món ăn bạn đánh dấu thích
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingPref ? (
                    <div className="flex justify-center py-6">
                      <Spinner />
                    </div>
                  ) : favorites.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      Chưa có món ăn yêu thích nào
                    </p>
                  ) : (
                    favorites.map((item) => (
                      <div
                        key={item.food_id}
                        className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">
                            {item.name || `Món #${item.food_id}`}
                          </span>
                          {item.note && (
                            <p className="text-muted-foreground italic">&ldquo;{item.note}&rdquo;</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingPref({
                                type: 'favorite',
                                food_id: item.food_id,
                                note: item.note || '',
                              })
                            }
                            className="h-7 w-7 p-0 rounded-full text-muted-foreground"
                          >
                            <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFavorite(item.food_id)}
                            className="h-7 w-7 p-0 rounded-full text-destructive"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Hated Card */}
              <Card className="rounded-2xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-muted-foreground">
                    <FontAwesomeIcon icon={faBan} className="text-destructive" />
                    <span>Món Ăn Ghét / Dị Ứng ({hated.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Các món ăn bạn không thích hoặc bị dị ứng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingPref ? (
                    <div className="flex justify-center py-6">
                      <Spinner />
                    </div>
                  ) : hated.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      Chưa có món ăn ghét nào
                    </p>
                  ) : (
                    hated.map((item) => (
                      <div
                        key={item.food_id}
                        className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">
                            {item.name || `Món #${item.food_id}`}
                          </span>
                          {item.note && (
                            <p className="text-muted-foreground italic">&ldquo;{item.note}&rdquo;</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingPref({
                                type: 'hated',
                                food_id: item.food_id,
                                note: item.note || '',
                              })
                            }
                            className="h-7 w-7 p-0 rounded-full text-muted-foreground"
                          >
                            <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveHated(item.food_id)}
                            className="h-7 w-7 p-0 rounded-full text-destructive"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Modal edit note */}
            {editingPref && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-sm p-5 space-y-4">
                  <CardTitle className="text-sm font-bold">
                    Cập Nhật Ghi Chú (Món #{editingPref.food_id})
                  </CardTitle>
                  <Input
                    type="text"
                    value={editingPref.note}
                    onChange={(e) =>
                      setEditingPref({ ...editingPref, note: e.target.value })
                    }
                    placeholder="Ghi chú sở thích hoặc lưu ý..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPref(null)}
                    >
                      Hủy
                    </Button>
                    <Button size="sm" onClick={handleUpdatePrefNote}>
                      Lưu Ghi Chú
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: HỒ SƠ SỨC KHỎE */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* BMI Card */}
              <Card className="md:col-span-5 rounded-2xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faWeightScale} className="text-secondary" />
                    <span>Chỉ Số Thể Trạng (BMI)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/60 text-center space-y-1">
                    <div className="text-3xl font-black text-foreground">{bmi || '--'}</div>
                    <div className={`text-xs font-bold ${bmiColor}`}>{bmiCategory}</div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span>Cân nặng:</span>
                      <strong className="text-foreground">{weight} kg</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span>Chiều cao:</span>
                      <strong className="text-foreground">{height} cm</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span>Mức độ vận động:</span>
                      <strong className="text-foreground">
                        {laborLevel === 'LOW' ? 'Nhẹ' : laborLevel === 'MID' ? 'Vừa phải' : 'Nặng'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 text-primary">
                      <span>Khuyến nghị calo/ngày:</span>
                      <strong className="font-black text-sm">{targetCalories} kcal</strong>
                    </div>
                  </div>

                  {healthProfiles.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-foreground block mb-2">
                        Lịch sử đo gần đây:
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {healthProfiles.map((hp) => (
                          <div
                            key={hp.profile_id}
                            className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-muted/40"
                          >
                            <span>
                              {hp.date_of_measuring}: {hp.weight}kg, {hp.height}cm ({hp.measuring_method})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHealthProfile(hp.profile_id)}
                              className="h-5 w-5 p-0 text-destructive"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Cập nhật chỉ số */}
              <Card className="md:col-span-7 rounded-2xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Cập Nhật Số Đo Sức Khỏe</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Lưu lịch sử cân nặng, chiều cao, trạng thái thai sản và mức độ vận động
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateHealthProfile} className="space-y-3.5">
                    {healthMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          healthMsg.type === 'success'
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                            : 'bg-destructive/15 text-destructive border border-destructive/30'
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={healthMsg.type === 'success' ? faCheck : faTriangleExclamation}
                        />
                        <span>{healthMsg.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faWeightScale}
                            className="text-[10px] text-muted-foreground"
                          />
                          <span>Cân nặng (kg) *</span>
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="20"
                          max="250"
                          value={weight}
                          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faRulerVertical}
                            className="text-[10px] text-muted-foreground"
                          />
                          <span>Chiều cao (cm) *</span>
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          min="50"
                          max="250"
                          value={height}
                          onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Phương pháp đo *</label>
                        <select
                          value={measuringMethod}
                          onChange={(e) => setMeasuringMethod(e.target.value as MeasuringMethod)}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="STANDING">Đứng (STANDING)</option>
                          <option value="LAYING">Nằm (LAYING)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Mức độ lao động</label>
                        <select
                          value={laborLevel}
                          onChange={(e) => setLaborLevel(e.target.value as LaborLevel)}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="LOW">Nhẹ (LOW)</option>
                          <option value="MID">Vừa phải (MID)</option>
                          <option value="HEAVY">Nặng (HEAVY)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">
                          Tình trạng thai sản (tùy chọn)
                        </label>
                        <select
                          value={maternityStatus}
                          onChange={(e) => setMaternityStatus(e.target.value as MaternityStatus | '')}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="">Không có</option>
                          <option value="FIRST_3_MONTHS">3 tháng đầu</option>
                          <option value="MID_3_MONTHS">3 tháng giữa</option>
                          <option value="FINAL_3_MONTHS">3 tháng cuối</option>
                          <option value="BREASTFEEDING">Đang cho con bú</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faCalendarDay}
                            className="text-[10px] text-muted-foreground"
                          />
                          <span>Ngày đo *</span>
                        </label>
                        <Input
                          type="date"
                          value={dateOfMeasuring}
                          onChange={(e) => setDateOfMeasuring(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={healthSaving} className="font-bold">
                      {healthSaving ? <Spinner /> : 'Lưu Hồ Sơ Sức Khỏe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: BẢO MẬT & ĐỔI MẬT KHẨU & XÓA TÀI KHOẢN */}
          <TabsContent value="security" className="space-y-6">
            <Card className="rounded-2xl border-border bg-card w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Đổi Mật Khẩu</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Thay đổi mật khẩu tài khoản định kỳ để bảo đảm an toàn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
                  {secMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        secMsg.type === 'success'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : 'bg-destructive/15 text-destructive border border-destructive/30'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={secMsg.type === 'success' ? faCheck : faTriangleExclamation}
                      />
                      <span>{secMsg.text}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Mật khẩu hiện tại</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Mật khẩu mới</label>
                    <Input
                      type="password"
                      placeholder="Tối thiểu 8 ký tự..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu mới</label>
                    <Input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới..."
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={secSaving} className="font-bold">
                    {secSaving ? <Spinner /> : 'Cập Nhật Mật Khẩu'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-destructive">Khu Vực Nguy Hiểm</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Xóa tài khoản của bạn khỏi hệ thống vĩnh viễn. Hành động này không thể hoàn tác.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="font-bold gap-2 text-xs"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span>Xóa Vĩnh Viễn Tài Khoản</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
