'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { foodsApi, usersApi, reportsApi, nutritionsApi, authApi } from '@/api';
import {
  FoodCard,
  User,
  Report,
  Nutrition,
  FoodStatus,
  UserRole,
  UserStatus,
  ReportStatus,
} from '@/api/types';
import { validatePassword } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faUtensils,
  faUsers,
  faFlag,
  faAppleWhole,
  faCheck,
  faBan,
  faTrashCan,
  faMagnifyingGlass,
  faCircleCheck,
  faPlus,
  faPencil,
  faKey,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'foods' | 'users' | 'reports' | 'nutritions'>('foods');

  // =================== FOODS STATE ===================
  const [foods, setFoods] = useState<FoodCard[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsSearch, setFoodsSearch] = useState('');
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodCard | null>(null);
  const [foodForm, setFoodForm] = useState({ name: '', description: '', image_url: '' });
  const [foodFormSaving, setFoodFormSaving] = useState(false);

  // =================== USERS STATE ===================
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // =================== REPORTS STATE ===================
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // =================== NUTRITIONS STATE ===================
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [nutritionsLoading, setNutritionsLoading] = useState(false);
  const [nutritionSearch, setNutritionSearch] = useState('');
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState<Nutrition | null>(null);
  const [nutritionForm, setNutritionForm] = useState({
    nutrition_name: '',
    calories: 0,
    serving_size_g: 100,
    protein_g: 0,
    carbohydrates_total_g: 0,
    fat_total_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
  });

  // LOAD FOODS
  const loadFoods = useCallback(async () => {
    try {
      setFoodsLoading(true);
      const res = await foodsApi.list({
        pageSize: 50,
        search: foodsSearch || undefined,
        sort_by: 'name',
      });
      if (res && res.data) {
        setFoods(res.data);
      }
    } catch (e) {
      console.error('Failed to load foods for admin:', e);
    } finally {
      setFoodsLoading(false);
    }
  }, [foodsSearch]);

  // LOAD USERS
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await usersApi.list({
        pageSize: 50,
        search: usersSearch || undefined,
      });
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (e) {
      console.error('Failed to load users for admin:', e);
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch]);

  // LOAD REPORTS
  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const res = await reportsApi.list({
        pageSize: 50,
      });
      if (res && res.data) {
        setReports(res.data);
      }
    } catch (e) {
      console.error('Failed to load reports for admin:', e);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // LOAD NUTRITIONS
  const loadNutritions = useCallback(async () => {
    try {
      setNutritionsLoading(true);
      const res = await nutritionsApi.list({
        pageSize: 50,
        search: nutritionSearch || undefined,
      });
      if (res && res.data) {
        setNutritions(res.data);
      }
    } catch (e) {
      console.error('Failed to load nutritions:', e);
    } finally {
      setNutritionsLoading(false);
    }
  }, [nutritionSearch]);

  useEffect(() => {
    if (activeTab === 'foods') loadFoods();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'reports') loadReports();
    else if (activeTab === 'nutritions') loadNutritions();
  }, [activeTab, loadFoods, loadUsers, loadReports, loadNutritions]);

  // Food handlers
  const handleFoodStatusChange = async (foodId: number, newStatus: FoodStatus) => {
    try {
      await foodsApi.changeStatus(foodId, { status: newStatus });
      setFoods((prev) =>
        prev.map((f) => (f.food_id === foodId ? { ...f, status: newStatus } : f))
      );
    } catch (err) {
      console.error('Failed to change food status:', err);
    }
  };

  const handleFoodDelete = async (foodId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này khỏi hệ thống?')) return;
    try {
      await foodsApi.delete(foodId);
      setFoods((prev) => prev.filter((f) => f.food_id !== foodId));
    } catch (err) {
      console.error('Failed to delete food:', err);
    }
  };

  const handleOpenFoodModal = (food?: FoodCard) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name || '',
        description: food.description || '',
        image_url: food.image_url || '',
      });
    } else {
      setEditingFood(null);
      setFoodForm({ name: '', description: '', image_url: '' });
    }
    setFoodModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name.trim()) return;
    try {
      setFoodFormSaving(true);
      if (editingFood) {
        await foodsApi.update(editingFood.food_id, {
          name: foodForm.name.trim(),
          description: foodForm.description.trim() || undefined,
          image_url: foodForm.image_url.trim() || undefined,
        });
      } else {
        await foodsApi.create({
          name: foodForm.name.trim(),
          description: foodForm.description.trim() || undefined,
          image_url: foodForm.image_url.trim() || undefined,
        });
      }
      setFoodModalOpen(false);
      await loadFoods();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu món ăn');
    } finally {
      setFoodFormSaving(false);
    }
  };

  // User handlers
  const handleUserRoleChange = async (userId: number, newRole: UserRole) => {
    if (!confirm(`Xác nhận đổi vai trò của người dùng này thành ${newRole}?`)) return;
    try {
      await usersApi.changeRole(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi đổi quyền người dùng');
    }
  };

  const handleUserStatusChange = async (userId: number, newStatus: UserStatus) => {
    try {
      await usersApi.changeStatus(userId, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error('Failed to change user status:', err);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordInput.trim()) return;
    const pwdErr = validatePassword(newPasswordInput.trim());
    if (pwdErr) {
      alert(pwdErr);
      return;
    }
    try {
      setPasswordSaving(true);
      await authApi.changePassword(passwordModalUser.user_id, {
        newPassword: newPasswordInput.trim(),
      });
      alert(`Đã đặt lại mật khẩu thành công cho ${passwordModalUser.username}!`);
      setPasswordModalUser(null);
      setNewPasswordInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUserDelete = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động không thể hoàn tác!')) return;
    try {
      await usersApi.delete(userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    }
  };

  // Report handlers
  const handleReportStatusChange = async (reportId: number, newStatus: ReportStatus) => {
    try {
      await reportsApi.changeStatus(reportId, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật báo cáo');
    }
  };

  // Nutrition handlers
  const handleOpenNutritionModal = (item?: Nutrition) => {
    if (item) {
      setEditingNutrition(item);
      setNutritionForm({
        nutrition_name: item.nutrition_name || '',
        calories: item.calories || 0,
        serving_size_g: item.serving_size_g || 100,
        protein_g: item.protein_g || 0,
        carbohydrates_total_g: item.carbohydrates_total_g || 0,
        fat_total_g: item.fat_total_g || 0,
        fiber_g: item.fiber_g || 0,
        sugar_g: item.sugar_g || 0,
        sodium_mg: item.sodium_mg || 0,
      });
    } else {
      setEditingNutrition(null);
      setNutritionForm({
        nutrition_name: '',
        calories: 0,
        serving_size_g: 100,
        protein_g: 0,
        carbohydrates_total_g: 0,
        fat_total_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
      });
    }
    setNutritionModalOpen(true);
  };

  const handleSaveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nutritionForm.nutrition_name.trim()) return;
    try {
      if (editingNutrition) {
        await nutritionsApi.update(editingNutrition.nutrition_id, nutritionForm);
      } else {
        await nutritionsApi.create(nutritionForm);
      }
      setNutritionModalOpen(false);
      await loadNutritions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu bảng dinh dưỡng');
    }
  };

  const handleDeleteNutrition = async (nutritionId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi dinh dưỡng này?')) return;
    try {
      await nutritionsApi.delete(nutritionId);
      setNutritions((prev) => prev.filter((n) => n.nutrition_id !== nutritionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa bảng dinh dưỡng');
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MODERATOR']}>
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-secondary text-2xl" />
                <h1 className="text-2xl font-black text-foreground">Cổng Quản Trị Hệ Thống</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý món ăn, phân quyền người dùng, dinh dưỡng và xử lý phản ánh • Vai trò:{' '}
                <strong>{user?.role}</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as 'foods' | 'users' | 'reports' | 'nutritions')
            }
            className="space-y-6"
          >
            <UnderlineTabs
              layoutId="admin-tab-indicator"
              align="left"
              className="max-w-2xl"
              tabs={[
                {
                  value: 'foods',
                  label: 'Món Ăn',
                  icon: <FontAwesomeIcon icon={faUtensils} />,
                  count: foods.length,
                },
                {
                  value: 'users',
                  label: 'Người Dùng',
                  icon: <FontAwesomeIcon icon={faUsers} />,
                  count: users.length,
                },
                {
                  value: 'reports',
                  label: 'Báo Cáo',
                  icon: <FontAwesomeIcon icon={faFlag} />,
                  count: reports.length,
                },
                {
                  value: 'nutritions',
                  label: 'Dinh Dưỡng',
                  icon: <FontAwesomeIcon icon={faAppleWhole} />,
                  count: nutritions.length,
                },
              ]}
              activeTab={activeTab}
              onChange={(val) =>
                setActiveTab(val as 'foods' | 'users' | 'reports' | 'nutritions')
              }
            />

            {/* TAB 1: FOOD MANAGEMENT */}
            <TabsContent value="foods" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
                  />
                  <Input
                    type="text"
                    placeholder="Tìm theo tên món..."
                    value={foodsSearch}
                    onChange={(e) => setFoodsSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadFoods} variant="outline" size="sm" className="font-bold">
                    Làm mới
                  </Button>
                  <Button
                    onClick={() => handleOpenFoodModal()}
                    size="sm"
                    className="font-bold gap-1.5"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    <span>Thêm Món Mới</span>
                  </Button>
                </div>
              </div>

              {foodsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Hình ảnh</th>
                          <th className="p-3">Tên món & Mô tả</th>
                          <th className="p-3">Thống kê</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {foods.map((food) => {
                          const statusColor =
                            food.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : food.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : 'bg-destructive/15 text-destructive border-destructive/30';

                          return (
                            <tr key={food.food_id} className="hover:bg-muted/40 transition-colors">
                              <td className="p-3 font-mono text-muted-foreground">#{food.food_id}</td>
                              <td className="p-3">
                                {food.image_url ? (
                                  <img
                                    src={food.image_url}
                                    alt={food.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-border"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                                    <FontAwesomeIcon icon={faUtensils} />
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-foreground block">{food.name}</span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1">
                                  {food.description || 'Chưa có mô tả'}
                                </span>
                              </td>
                              <td className="p-3 space-y-0.5">
                                <div className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                                  <FontAwesomeIcon icon={faHeart} className="text-[10px]" />
                                  <span>{food.favorite_count ?? 0} thích</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUtensils} className="text-[10px]" />
                                  <span>{food.eaten_count ?? 0} đã ăn</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}
                                >
                                  {food.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                {food.status !== 'ACTIVE' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleFoodStatusChange(food.food_id, 'ACTIVE')}
                                    className="h-7 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                    title="Duyệt hoạt động"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                    Duyệt
                                  </Button>
                                )}
                                {food.status !== 'DISABLED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleFoodStatusChange(food.food_id, 'DISABLED')}
                                    className="h-7 px-2 text-[11px] font-bold text-amber-600 hover:bg-amber-50 border-amber-200"
                                    title="Ẩn món"
                                  >
                                    <FontAwesomeIcon icon={faBan} className="mr-1" />
                                    Ẩn
                                  </Button>
                                )}
                                {isAdmin && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleOpenFoodModal(food)}
                                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                      title="Sửa món"
                                    >
                                      <FontAwesomeIcon icon={faPencil} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleFoodDelete(food.food_id)}
                                      className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                      title="Xóa món"
                                    >
                                      <FontAwesomeIcon icon={faTrashCan} />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: USER MANAGEMENT */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
                  />
                  <Input
                    type="text"
                    placeholder="Tìm theo username, email..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={loadUsers} variant="outline" size="sm" className="font-bold">
                  Làm mới
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Tài khoản</th>
                          <th className="p-3">Email & Địa chỉ</th>
                          <th className="p-3">Vai trò</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((u) => {
                          const statusColor =
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : u.status === 'DISABLED'
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : 'bg-destructive/15 text-destructive border-destructive/30';

                          return (
                            <tr key={u.user_id} className="hover:bg-muted/40 transition-colors">
                              <td className="p-3 font-mono text-muted-foreground">#{u.user_id}</td>
                              <td className="p-3 font-bold text-foreground">{u.username}</td>
                              <td className="p-3">
                                <div>{u.email || '--'}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  {u.address || 'Chưa cập nhật địa chỉ'}
                                </div>
                              </td>
                              <td className="p-3">
                                {isAdmin ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) =>
                                      handleUserRoleChange(u.user_id, e.target.value as UserRole)
                                    }
                                    className="h-7 rounded border border-input bg-transparent px-2 text-xs font-bold outline-none cursor-pointer"
                                  >
                                    <option value="USER">USER</option>
                                    <option value="MODERATOR">MODERATOR</option>
                                    <option value="ADMIN">ADMIN</option>
                                  </select>
                                ) : (
                                  <Badge className="text-[10px] font-black px-2 py-0.5 rounded-full border">
                                    {u.role}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}
                                >
                                  {u.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                {u.status === 'ACTIVE' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUserStatusChange(u.user_id, 'DISABLED')}
                                    className="h-7 px-2 text-[11px] font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                                  >
                                    <FontAwesomeIcon icon={faBan} className="mr-1" />
                                    Khóa
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUserStatusChange(u.user_id, 'ACTIVE')}
                                    className="h-7 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border-emerald-300"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                    Mở
                                  </Button>
                                )}
                                {isAdmin && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setPasswordModalUser(u);
                                        setNewPasswordInput('');
                                      }}
                                      className="h-7 px-2 text-[11px] font-bold text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                                      title="Đặt lại mật khẩu"
                                    >
                                      <FontAwesomeIcon icon={faKey} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleUserDelete(u.user_id)}
                                      className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                      title="Xóa tài khoản"
                                    >
                                      <FontAwesomeIcon icon={faTrashCan} />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: REPORT MANAGEMENT */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={loadReports} variant="outline" size="sm" className="font-bold">
                  Làm mới
                </Button>
              </div>

              {reportsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-16 p-8 rounded-2xl bg-card border border-border text-muted-foreground text-xs">
                  Hiện chưa có báo cáo sự cố hoặc góp ý nào từ người dùng.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.report_id}
                      className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              report.type === 'ERROR'
                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                : 'bg-secondary/15 text-secondary border-secondary/30'
                            }`}
                          >
                            {report.type === 'ERROR' ? 'Báo Lỗi' : 'Góp Ý'}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              report.status === 'RESOLVED'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                            }`}
                          >
                            {report.status}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            Gửi bởi: <strong>{report.author?.username || 'Ẩn danh'}</strong> •{' '}
                            {report.created_at || 'Mới đây'}
                          </span>
                        </div>
                        {report.title && (
                          <h4 className="font-bold text-sm text-foreground">{report.title}</h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {report.content}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="shrink-0 self-end sm:self-center">
                          {report.status !== 'RESOLVED' ? (
                            <Button
                              size="sm"
                              onClick={() => handleReportStatusChange(report.report_id, 'RESOLVED')}
                              className="font-bold text-xs gap-1.5"
                            >
                              <FontAwesomeIcon icon={faCircleCheck} />
                              <span>Đã Giải Quyết</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportStatusChange(report.report_id, 'PENDING')}
                              className="text-xs text-muted-foreground"
                            >
                              Mở Lại
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: NUTRITIONS MANAGEMENT */}
            <TabsContent value="nutritions" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
                  />
                  <Input
                    type="text"
                    placeholder="Tìm theo tên thành phần..."
                    value={nutritionSearch}
                    onChange={(e) => setNutritionSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadNutritions}
                    variant="outline"
                    size="sm"
                    className="font-bold"
                  >
                    Làm mới
                  </Button>
                  <Button
                    onClick={() => handleOpenNutritionModal()}
                    size="sm"
                    className="font-bold gap-1.5"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    <span>Thêm Dinh Dưỡng</span>
                  </Button>
                </div>
              </div>

              {nutritionsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Tên dinh dưỡng</th>
                          <th className="p-3">Khẩu phần</th>
                          <th className="p-3">Năng lượng</th>
                          <th className="p-3">Đạm (Protein)</th>
                          <th className="p-3">Đường bột (Carb)</th>
                          <th className="p-3">Chất béo (Fat)</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {nutritions.map((n) => (
                          <tr key={n.nutrition_id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">#{n.nutrition_id}</td>
                            <td className="p-3 font-bold text-foreground">{n.nutrition_name}</td>
                            <td className="p-3">{n.serving_size_g ?? 100}g</td>
                            <td className="p-3 font-semibold text-primary">{n.calories ?? 0} kcal</td>
                            <td className="p-3">{n.protein_g ?? 0}g</td>
                            <td className="p-3">{n.carbohydrates_total_g ?? 0}g</td>
                            <td className="p-3">{n.fat_total_g ?? 0}g</td>
                            <td className="p-3 text-right space-x-1">
                              {isAdmin && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenNutritionModal(n)}
                                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                  >
                                    <FontAwesomeIcon icon={faPencil} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteNutrition(n.nutrition_id)}
                                    className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOD MODAL */}
        {foodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg p-6 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold">
                  {editingFood ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSaveFood} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Tên món ăn *</label>
                    <Input
                      type="text"
                      placeholder="Phở bò, Cơm tấm sườn bì..."
                      value={foodForm.name}
                      onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Mô tả món ăn</label>
                    <Input
                      type="text"
                      placeholder="Món ăn truyền thống đậm đà hương vị..."
                      value={foodForm.description}
                      onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">URL hình ảnh</label>
                    <Input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={foodForm.image_url}
                      onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFoodModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" size="sm" disabled={foodFormSaving} className="font-bold">
                      {foodFormSaving ? <Spinner /> : 'Lưu Món'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ADMIN RESET PASSWORD MODAL */}
        {passwordModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm p-6 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold">
                  Đặt Lại Mật Khẩu ({passwordModalUser.username})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleAdminResetPassword} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Mật khẩu mới *</label>
                    <Input
                      type="password"
                      placeholder="Tối thiểu 8 ký tự..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPasswordModalUser(null)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" size="sm" disabled={passwordSaving} className="font-bold">
                      {passwordSaving ? <Spinner /> : 'Xác Nhận Đổi'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NUTRITION MODAL */}
        {nutritionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg p-6 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold">
                  {editingNutrition ? 'Chỉnh Sửa Bảng Dinh Dưỡng' : 'Thêm Bảng Dinh Dưỡng'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSaveNutrition} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Tên thành phần *</label>
                    <Input
                      type="text"
                      placeholder="Thịt bò xào, Gạo tẻ..."
                      value={nutritionForm.nutrition_name}
                      onChange={(e) =>
                        setNutritionForm({ ...nutritionForm, nutrition_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Năng lượng (kcal)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={nutritionForm.calories}
                        onChange={(e) =>
                          setNutritionForm({ ...nutritionForm, calories: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Khẩu phần (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={nutritionForm.serving_size_g}
                        onChange={(e) =>
                          setNutritionForm({
                            ...nutritionForm,
                            serving_size_g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Đạm (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={nutritionForm.protein_g}
                        onChange={(e) =>
                          setNutritionForm({ ...nutritionForm, protein_g: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Đường bột (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={nutritionForm.carbohydrates_total_g}
                        onChange={(e) =>
                          setNutritionForm({
                            ...nutritionForm,
                            carbohydrates_total_g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Chất béo (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={nutritionForm.fat_total_g}
                        onChange={(e) =>
                          setNutritionForm({ ...nutritionForm, fat_total_g: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNutritionModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" size="sm" className="font-bold">
                      Lưu Dinh Dưỡng
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
