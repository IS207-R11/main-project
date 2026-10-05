'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi, healthProfilesApi, authApi } from '@/api';
import { HealthProfile, CreateHealthProfileRequest } from '@/api/types';
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
  faWeightScale,
  faRulerVertical,
  faCalendarDay,
  faCheck,
  faTriangleExclamation,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal, refreshUser } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'health' | 'security'>('profile');

  // Profile update form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Health Profile state
  const [_healthProfiles, setHealthProfiles] = useState<HealthProfile[]>([]);
  const [_healthLoading, setHealthLoading] = useState(false);
  const [weight, setWeight] = useState<number>(60);
  const [height, setHeight] = useState<number>(170);
  const [measuringMethod, setMeasuringMethod] = useState<'STANDING' | 'LAYING'>('STANDING');
  const [laborLevel, setLaborLevel] = useState<'LOW' | 'MID' | 'HEAVY'>('MID');
  const [dateOfMeasuring, setDateOfMeasuring] = useState(new Date().toISOString().split('T')[0]);
  const [healthMsg, setHealthMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [healthSaving, setHealthSaving] = useState(false);

  // Security password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [secMsg, setSecMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [secSaving, setSecSaving] = useState(false);

  // Populate user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDob(user.date_of_birth || '');
      setGender(user.gender || '');
    }
  }, [user]);

  // Load health profiles
  const loadHealthProfiles = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setHealthLoading(true);
      const res = await healthProfilesApi.listByUser(user.user_id, { pageSize: 10 });
      if (res.data) {
        setHealthProfiles(res.data);
        if (res.data.length > 0) {
          const latest = res.data[0];
          setWeight(latest.weight);
          setHeight(latest.height);
          setMeasuringMethod(latest.measuring_method);
          if (latest.labor_level) setLaborLevel(latest.labor_level);
        }
      }
    } catch (e) {
      console.warn('Failed to load health profiles:', e);
    } finally {
      setHealthLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadHealthProfiles();
    }
  }, [user?.user_id, loadHealthProfiles]);

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
  const bmi = heightInMeters > 0 ? Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10 : 0;
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
  const bmr = 10 * weight + 6.25 * height - 5 * 25 + (gender === 'FEMALE' ? -161 : 5);
  const activityMultiplier = laborLevel === 'LOW' ? 1.2 : laborLevel === 'MID' ? 1.55 : 1.75;
  const targetCalories = Math.round(bmr * activityMultiplier);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      setProfileSaving(true);
      await usersApi.update(user.user_id, {
        email: email || undefined,
        phone: phone || undefined,
        date_of_birth: dob || undefined,
        gender: (gender as 'MALE' | 'FEMALE') || undefined,
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
      };
      await healthProfilesApi.create(user.user_id, payload);
      await loadHealthProfiles();
      setHealthMsg({ text: 'Đã lưu chỉ số sức khỏe mới!', type: 'success' });
    } catch (err: unknown) {
      setHealthMsg({ text: err instanceof Error ? err.message : 'Lỗi cập nhật sức khỏe', type: 'error' });
    } finally {
      setHealthSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setSecMsg({ text: 'Mật khẩu mới tối thiểu 6 ký tự', type: 'error' });
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

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-6 rounded-xl bg-card border border-border shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-extrabold text-2xl border border-secondary/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{user.username}</h1>
                <Badge className="text-xs font-bold px-2.5 py-0.5 rounded-full">{user.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.email || 'Chưa liên kết email'} • Tham gia: {user.created_at || 'Mới'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'profile' | 'health' | 'security')}
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
                value: 'health',
                label: 'Sức Khỏe & Calo',
                icon: <FontAwesomeIcon icon={faHeartPulse} className="text-rose-500" />,
              },
              {
                value: 'security',
                label: 'Mật Khẩu',
                icon: <FontAwesomeIcon icon={faLock} />,
              },
            ]}
            activeTab={activeTab}
            onChange={(val) => setActiveTab(val as 'profile' | 'health' | 'security')}
          />

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          <TabsContent value="profile">
            <Card className="rounded-xl border-border bg-card w-full shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Cập Nhật Thông Tin Cá Nhân</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Thông tin giúp hệ thống gợi ý chế độ ăn uống phù hợp hơn
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
                      <FontAwesomeIcon icon={profileMsg.type === 'success' ? faCheck : faTriangleExclamation} />
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

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
                    <label className="text-xs font-semibold text-foreground">Số điện thoại</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Ngày sinh</label>
                      <Input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Giới tính</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | '')}
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={profileSaving} className="font-bold">
                    {profileSaving ? <Spinner /> : 'Lưu Thay Đổi'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: HỒ SƠ SỨC KHỎE */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* BMI Card */}
              <Card className="md:col-span-5 rounded-xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faWeightScale} className="text-secondary" />
                    <span>Chỉ Số Thể Trạng (BMI)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/60 text-center space-y-1">
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
                </CardContent>
              </Card>

              {/* Form Cập nhật chỉ số */}
              <Card className="md:col-span-7 rounded-xl border-border bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Cập Nhật Số Đo Sức Khỏe</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Lưu lịch sử cân nặng và chiều cao để theo dõi tiến trình
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
                        <FontAwesomeIcon icon={healthMsg.type === 'success' ? faCheck : faTriangleExclamation} />
                        <span>{healthMsg.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <FontAwesomeIcon icon={faWeightScale} className="text-[10px] text-muted-foreground" />
                          <span>Cân nặng (kg)</span>
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
                          <FontAwesomeIcon icon={faRulerVertical} className="text-[10px] text-muted-foreground" />
                          <span>Chiều cao (cm)</span>
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
                        <label className="text-xs font-semibold text-foreground">Tư thế đo</label>
                        <select
                          value={measuringMethod}
                          onChange={(e) => setMeasuringMethod(e.target.value as 'STANDING' | 'LAYING')}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="STANDING">Đứng</option>
                          <option value="LAYING">Nằm</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Cường độ lao động</label>
                        <select
                          value={laborLevel}
                          onChange={(e) => setLaborLevel(e.target.value as 'LOW' | 'MID' | 'HEAVY')}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                        >
                          <option value="LOW">Nhẹ (Ít vận động)</option>
                          <option value="MID">Vừa (Thể thao thường xuyên)</option>
                          <option value="HEAVY">Nặng (Lao động nặng)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarDay} className="text-[10px] text-muted-foreground" />
                        <span>Ngày đo</span>
                      </label>
                      <Input
                        type="date"
                        value={dateOfMeasuring}
                        onChange={(e) => setDateOfMeasuring(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={healthSaving} className="font-bold">
                      {healthSaving ? <Spinner /> : 'Lưu Chỉ Số'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU */}
          <TabsContent value="security">
            <Card className="rounded-xl border-border bg-card w-full shadow-md">
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
                      <FontAwesomeIcon icon={secMsg.type === 'success' ? faCheck : faTriangleExclamation} />
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
                      placeholder="Tối thiểu 6 ký tự..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
