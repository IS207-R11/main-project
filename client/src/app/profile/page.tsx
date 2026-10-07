'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { usersApi, authApi, foodsApi } from '@/api';
import { UserFoodItem, EatenFood } from '@/api/types';
import { validatePassword } from '@/lib/validation';
import { PasswordInput } from '@/components/ui/password-input';
import { formatApiError } from '@/lib/errorMapping';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from '@/components/ui/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faLock,
  faHeart,
  faBan,
  faArrowRightToBracket,
  faTrashCan,
  faPencil,
  faMapMarkerAlt,
  faUtensils,
  faClock,
} from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal, refreshUser, logout } =
    useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'eaten' | 'preferences' | 'security'>('profile');

  // Profile update form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Preferences & Eaten state (Favorite, Hated, Eaten)
  const [favorites, setFavorites] = useState<UserFoodItem[]>([]);
  const [hated, setHated] = useState<UserFoodItem[]>([]);
  const [eatenFoods, setEatenFoods] = useState<EatenFood[]>([]);
  const [loadingPref, setLoadingPref] = useState(false);
  const [actionPrefId, setActionPrefId] = useState<number | null>(null);
  const [editingPref, setEditingPref] = useState<{
    type: 'favorite' | 'hated' | 'eaten';
    food_id: number;
    eaten_id?: number;
    note: string;
  } | null>(null);

  // Security password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [secSaving, setSecSaving] = useState(false);

  // Populate user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
    }
  }, [user]);

  // Load preferences (Favorites, Hated, Eaten)
  const loadPreferences = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoadingPref(true);
      const [favRes, hatedRes, eatenRes] = await Promise.all([
        foodsApi.getFavorites(user.user_id, { pageSize: 50 }),
        foodsApi.getHated(user.user_id, { pageSize: 50 }),
        foodsApi.getEaten(user.user_id, { pageSize: 50, sort_order: 'desc' }),
      ]);
      if (favRes?.data) setFavorites(favRes.data);
      if (hatedRes?.data) setHated(hatedRes.data);
      if (eatenRes?.data) setEatenFoods(eatenRes.data);
    } catch (e) {
      console.warn('Failed to load food preferences/eaten:', e);
    } finally {
      setLoadingPref(false);
    }
  }, [user]);

  const parseDate = (d?: string | null): number => {
    if (!d) return 0;
    const parsed = new Date(d).getTime();
    if (!isNaN(parsed)) return parsed;
    const isoFallback = new Date(d.replace(' ', 'T')).getTime();
    return isNaN(isoFallback) ? 0 : isoFallback;
  };

  // Sắp xếp danh mục món ăn đã ăn giảm dần theo created_at
  const sortedEatenFoods = useMemo(() => {
    return [...eatenFoods].sort((a, b) => {
      const timeA = parseDate(a.created_at);
      const timeB = parseDate(b.created_at);
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (b.eaten_id || 0) - (a.eaten_id || 0);
    });
  }, [eatenFoods]);

  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) => {
      const timeA = parseDate(a.created_at);
      const timeB = parseDate(b.created_at);
      return timeB - timeA;
    });
  }, [favorites]);

  const sortedHated = useMemo(() => {
    return [...hated].sort((a, b) => {
      const timeA = parseDate(a.created_at);
      const timeB = parseDate(b.created_at);
      return timeB - timeA;
    });
  }, [hated]);

  const formatEatenDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Không rõ thời gian';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadPreferences();
    }
  }, [user?.user_id, loadPreferences]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl space-y-8">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-md flex items-center gap-4">
            <Skeleton className="size-16 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </div>
        </div>
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
          Vui lòng đăng nhập để xem và quản lý hồ sơ cá nhân của bạn.
        </p>
        <Button onClick={() => openAuthModal('login')} className="font-bold gap-2">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <span>Đăng Nhập Ngay</span>
        </Button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await usersApi.update(user.user_id, {
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshUser();
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật thông tin');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra mật khẩu hiện có trước
    if (!oldPassword || !oldPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    // 2. Sau đó mới kiểm tra mật khẩu mới
    if (!newPassword || !newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      toast.error(pwdErr);
      return;
    }

    if (newPassword === oldPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
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
      toast.success('Đổi mật khẩu thành công!');
    } catch (err: unknown) {
      toast.error(formatApiError(err, 'Đổi mật khẩu'));
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
      toast.success('Tài khoản của bạn đã được xóa thành công.');
      logout();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa tài khoản');
    }
  };

  // Preference & Eaten handlers
  const handleUpdatePrefNote = async () => {
    if (!editingPref) return;
    try {
      if (editingPref.type === 'favorite') {
        await foodsApi.updateFavorite({
          food_id: editingPref.food_id,
          note: editingPref.note,
        });
      } else if (editingPref.type === 'hated') {
        await foodsApi.updateHated({
          food_id: editingPref.food_id,
          note: editingPref.note,
        });
      } else if (editingPref.type === 'eaten' && editingPref.eaten_id) {
        await foodsApi.updateEaten(editingPref.eaten_id, {
          note: editingPref.note,
        });
      }
      setEditingPref(null);
      await loadPreferences();
      toast.success('Đã cập nhật ghi chú thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật ghi chú:', err);
      toast.error('Lỗi khi cập nhật ghi chú');
    }
  };

  const handleRemoveFavorite = async (foodId: number) => {
    setActionPrefId(foodId);
    try {
      await foodsApi.removeFavorite(foodId);
      setFavorites((prev) => prev.filter((item) => item.food_id !== foodId));
      toast.success('Đã bỏ món khỏi danh sách yêu thích');
    } catch (err) {
      console.error('Lỗi bỏ yêu thích:', err);
      toast.error('Lỗi khi bỏ món yêu thích');
    } finally {
      setActionPrefId(null);
    }
  };

  const handleRemoveHated = async (foodId: number) => {
    setActionPrefId(foodId);
    try {
      await foodsApi.removeHated(foodId);
      setHated((prev) => prev.filter((item) => item.food_id !== foodId));
      toast.success('Đã bỏ món khỏi danh sách không thích');
    } catch (err) {
      console.error('Lỗi bỏ món ghét:', err);
      toast.error('Lỗi khi bỏ món không thích');
    } finally {
      setActionPrefId(null);
    }
  };

  const handleRemoveEaten = async (eatenId: number) => {
    setActionPrefId(eatenId);
    try {
      await foodsApi.deleteEaten(eatenId);
      setEatenFoods((prev) => prev.filter((item) => item.eaten_id !== eatenId));
      toast.success('Đã xóa món khỏi danh mục đã ăn');
    } catch (err) {
      console.error('Lỗi xóa món đã ăn:', err);
      toast.error('Lỗi khi xóa món đã ăn');
    } finally {
      setActionPrefId(null);
    }
  };

  const renderEatenCard = (isFullWidth = true) => (
    <Card className={`rounded-2xl border-border bg-card shadow-md flex flex-col ${isFullWidth ? 'w-full' : ''}`}>
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
          <FontAwesomeIcon icon={faUtensils} />
          <span>Danh Mục Món Ăn Đã Ăn ({sortedEatenFoods.length})</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Danh sách món ăn bạn đã thưởng thức, sắp xếp giảm dần theo thời gian tạo gần nhất
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {loadingPref ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-7 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : sortedEatenFoods.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground text-lg">
              <FontAwesomeIcon icon={faUtensils} />
            </div>
            <p className="text-xs text-muted-foreground italic">
              Chưa có món ăn nào trong danh mục đã ăn
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {sortedEatenFoods.map((item) => {
              if (actionPrefId === item.eaten_id) {
                return (
                  <div
                    key={item.eaten_id}
                    className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="size-12 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-7 w-14 rounded-full" />
                  </div>
                );
              }

              return (
                <div
                  key={item.eaten_id}
                  className="p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.food?.image_url ? (
                      <Image
                        src={item.food.image_url}
                        alt={item.food.name || `Món #${item.food_id}`}
                        width={48}
                        height={48}
                        className="size-12 rounded-xl object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="size-12 rounded-xl bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
                        <FontAwesomeIcon icon={faUtensils} className="text-base" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm truncate">
                          {item.food?.name || `Món #${item.food_id}`}
                        </span>
                        {item.food?.food_rank && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">
                            {item.food.food_rank}
                          </Badge>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-muted-foreground italic truncate">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="text-[10px] text-primary/70" />
                        <span>{formatEatenDate(item.created_at)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingPref({
                          type: 'eaten',
                          food_id: item.food_id,
                          eaten_id: item.eaten_id,
                          note: item.note || '',
                        })
                      }
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      title="Chỉnh sửa ghi chú"
                    >
                      <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEaten(item.eaten_id)}
                      className="h-7 w-7 p-0 rounded-full text-destructive hover:text-destructive"
                      title="Xóa món khỏi danh mục đã ăn"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl space-y-8">
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

        {/* Tab Controls - Centered block */}
        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            setActiveTab(val as 'profile' | 'eaten' | 'preferences' | 'security')
          }
          className="space-y-6 w-full"
        >
          <div className="flex justify-center w-full">
            <UnderlineTabs
              layoutId="profile-tab-indicator"
              align="center"
              tabs={[
                {
                  value: 'profile',
                  label: 'Cá Nhân',
                  icon: <FontAwesomeIcon icon={faUser} />,
                },
                {
                  value: 'eaten',
                  label: `Món Đã Ăn (${sortedEatenFoods.length})`,
                  icon: <FontAwesomeIcon icon={faUtensils} className="text-amber-500" />,
                },
                {
                  value: 'preferences',
                  label: 'Sở Thích',
                  icon: <FontAwesomeIcon icon={faHeart} className="text-rose-500" />,
                },
                {
                  value: 'security',
                  label: 'Bảo Mật',
                  icon: <FontAwesomeIcon icon={faLock} />,
                },
              ]}
              activeTab={activeTab}
              onChange={(val) =>
                setActiveTab(val as 'profile' | 'eaten' | 'preferences' | 'security')
              }
              tabClassName="px-4 sm:px-6 py-3"
            />
          </div>

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          <TabsContent value="profile" className="w-full">
            <Card className="rounded-2xl border-border bg-card w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Cập Nhật Thông Tin Cá Nhân</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Thông tin hồ sơ và tài khoản của bạn trên hệ thống AnGi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4 w-full">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Tên tài khoản (Username)</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Địa chỉ cư trú / giao hàng</label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      className="w-full"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={profileSaving} className="font-bold min-w-32">
                      {profileSaving ? <Spinner /> : 'Lưu Thay Đổi'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: DANH MỤC MÓN ĂN ĐÃ ĂN (SẮP XẾP GIẢM DẦN THEO CREATED_AT) */}
          <TabsContent value="eaten" className="w-full">
            {renderEatenCard(true)}
          </TabsContent>

          {/* TAB 3: SỞ THÍCH ĂN UỐNG (FAVORITES & HATED & EATEN) */}
          <TabsContent value="preferences" className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Favorites Card */}
              <Card className="rounded-2xl border-border bg-card shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
                    <FontAwesomeIcon icon={faHeart} />
                    <span>Món Ăn Yêu Thích ({sortedFavorites.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Danh sách các món ăn bạn đánh dấu thích
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  {loadingPref ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                          <Skeleton className="h-7 w-14 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : sortedFavorites.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      Chưa có món ăn yêu thích nào
                    </p>
                  ) : (
                    sortedFavorites.map((item) => {
                      if (actionPrefId === item.food_id) {
                        return (
                          <div
                            key={item.food_id}
                            className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                            <Skeleton className="h-7 w-14 rounded-full" />
                          </div>
                        );
                      }

                      return (
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
                              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                            >
                              <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFavorite(item.food_id)}
                              className="h-7 w-7 p-0 rounded-full text-destructive hover:text-destructive"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Hated Card */}
              <Card className="rounded-2xl border-border bg-card shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-muted-foreground">
                    <FontAwesomeIcon icon={faBan} className="text-destructive" />
                    <span>Món Ăn Ghét / Dị Ứng ({sortedHated.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Các món ăn bạn không thích hoặc bị dị ứng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  {loadingPref ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                          <Skeleton className="h-7 w-14 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : sortedHated.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      Chưa có món ăn ghét nào
                    </p>
                  ) : (
                    sortedHated.map((item) => {
                      if (actionPrefId === item.food_id) {
                        return (
                          <div
                            key={item.food_id}
                            className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                            <Skeleton className="h-7 w-14 rounded-full" />
                          </div>
                        );
                      }

                      return (
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
                              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                            >
                              <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveHated(item.food_id)}
                              className="h-7 w-7 p-0 rounded-full text-destructive hover:text-destructive"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Món ăn đã ăn hiển thị ở tab Sở Thích */}
            {renderEatenCard(true)}
          </TabsContent>

          {/* TAB 4: BẢO MẬT & ĐỔI MẬT KHẨU & XÓA TÀI KHOẢN */}
          <TabsContent value="security" className="space-y-6 w-full">
            <Card className="rounded-2xl border-border bg-card w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Đổi Mật Khẩu</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Thay đổi mật khẩu tài khoản định kỳ để bảo đảm an toàn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 w-full">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Mật khẩu hiện tại</label>
                    <PasswordInput
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Mật khẩu mới</label>
                    <PasswordInput
                      placeholder="Tối thiểu 8 ký tự..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu mới</label>
                    <PasswordInput
                      placeholder="Nhập lại mật khẩu mới..."
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={secSaving} className="font-bold min-w-36">
                      {secSaving ? <Spinner /> : 'Cập Nhật Mật Khẩu'}
                    </Button>
                  </div>
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
              <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-muted-foreground max-w-md">
                  Sau khi xóa tài khoản, tất cả dữ liệu cá nhân, món ăn yêu thích và lịch sử ăn uống sẽ bị xóa vĩnh viễn.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="font-bold gap-2 text-xs shrink-0"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span>Xóa Vĩnh Viễn Tài Khoản</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal edit note */}
        <Dialog
          open={Boolean(editingPref)}
          onOpenChange={(open) => !open && setEditingPref(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">
                Cập Nhật Ghi Chú ({editingPref?.type === 'eaten' ? 'Món Đã Ăn' : 'Món'} #{editingPref?.food_id})
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Thêm hoặc chỉnh sửa ghi chú cho món ăn này trong danh sách{' '}
                {editingPref?.type === 'eaten'
                  ? 'đã ăn'
                  : editingPref?.type === 'favorite'
                  ? 'yêu thích'
                  : 'kiêng ăn'}
                .
              </DialogDescription>
            </DialogHeader>
            {editingPref && (
              <div className="space-y-4">
                <Input
                  type="text"
                  value={editingPref.note}
                  onChange={(e) =>
                    setEditingPref({ ...editingPref, note: e.target.value })
                  }
                  placeholder="Ghi chú sở thích hoặc lưu ý bữa ăn..."
                  className="w-full"
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
