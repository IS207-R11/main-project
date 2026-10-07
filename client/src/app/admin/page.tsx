'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { foodsApi, usersApi, reportsApi, authApi } from '@/api';
import {
  FoodCard,
  User,
  Report,
  FoodStatus,
  UserRole,
  UserStatus,
  ReportStatus,
} from '@/api/types';
import { validatePassword } from '@/lib/validation';
import { PasswordInput } from '@/components/ui/password-input';
import { formatApiError } from '@/lib/errorMapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from '@/components/ui/image';
import { DataPagination } from '@/components/ui/data-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faUtensils,
  faUsers,
  faFlag,
  faCheck,
  faBan,
  faTrashCan,
  faMagnifyingGlass,
  faCircleCheck,
  faPlus,
  faPencil,
  faKey,
} from '@fortawesome/free-solid-svg-icons';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'foods' | 'users' | 'reports'>('foods');

  // =================== FOODS STATE ===================
  const [foods, setFoods] = useState<FoodCard[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [actionFoodId, setActionFoodId] = useState<number | null>(null);
  const [foodsSearch, setFoodsSearch] = useState('');
  const [foodsStatus, setFoodsStatus] = useState<string>('all');
  const [foodsPage, setFoodsPage] = useState(1);
  const [foodsPageSize] = useState(15);
  const [foodsTotal, setFoodsTotal] = useState(0);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodCard | null>(null);
  const [foodForm, setFoodForm] = useState({ name: '', description: '', image_url: '' });
  const [foodFormSaving, setFoodFormSaving] = useState(false);

  // =================== USERS STATE ===================
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize] = useState(15);
  const [usersTotal, setUsersTotal] = useState(0);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // =================== REPORTS STATE ===================
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionReportId, setActionReportId] = useState<number | null>(null);
  const [reportsSearch, setReportsSearch] = useState('');
  const [reportsStatus, setReportsStatus] = useState<string>('all');
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize] = useState(10);
  const [reportsTotal, setReportsTotal] = useState(0);

  // LOAD FOODS
  const loadFoods = useCallback(async () => {
    try {
      setFoodsLoading(true);
      const res = await foodsApi.list({
        page: foodsPage,
        pageSize: foodsPageSize,
        search: foodsSearch.trim() || undefined,
        status: foodsStatus === 'all' ? 'ALL' : (foodsStatus as FoodStatus),
        sort_by: 'name',
      });
      if (res && res.data) {
        setFoods(res.data);
        setFoodsTotal(res.total_records ?? res.data.length);
      }
    } catch (e) {
      console.error('Failed to load foods for admin:', e);
    } finally {
      setFoodsLoading(false);
    }
  }, [foodsPage, foodsPageSize, foodsSearch, foodsStatus]);

  // LOAD USERS
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await usersApi.list({
        page: usersPage,
        pageSize: usersPageSize,
        search: usersSearch.trim() || undefined,
      });
      if (res && res.data) {
        setUsers(res.data);
        setUsersTotal(res.total_records ?? res.data.length);
      }
    } catch (e) {
      console.error('Failed to load users for admin:', e);
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersPageSize, usersSearch]);

  // LOAD REPORTS
  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const res = await reportsApi.list({
        page: reportsPage,
        pageSize: reportsPageSize,
        search: reportsSearch.trim() || undefined,
        status: reportsStatus === 'all' ? 'ALL' : (reportsStatus as ReportStatus),
      });
      if (res && res.data) {
        setReports(res.data);
        setReportsTotal(res.total_records ?? res.data.length);
      }
    } catch (e) {
      console.error('Failed to load reports for admin:', e);
    } finally {
      setReportsLoading(false);
    }
  }, [reportsPage, reportsPageSize, reportsSearch, reportsStatus]);

  useEffect(() => {
    if (activeTab === 'foods') loadFoods();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'reports') loadReports();
  }, [activeTab, loadFoods, loadUsers, loadReports]);

  // Food handlers
  const handleFoodStatusChange = async (foodId: number, newStatus: FoodStatus) => {
    setActionFoodId(foodId);
    try {
      await foodsApi.changeStatus(foodId, { status: newStatus });
      setFoods((prev) =>
        prev.map((f) => (f.food_id === foodId ? { ...f, status: newStatus } : f))
      );
      toast.success(`Đã cập nhật trạng thái món ăn thành ${newStatus}!`);
    } catch (err) {
      console.error('Failed to change food status:', err);
      toast.error('Lỗi khi đổi trạng thái món ăn');
    } finally {
      setActionFoodId(null);
    }
  };

  const handleFoodDelete = async (foodId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này khỏi hệ thống?')) return;
    setActionFoodId(foodId);
    try {
      await foodsApi.delete(foodId);
      setFoods((prev) => prev.filter((f) => f.food_id !== foodId));
      toast.success('Đã xóa món ăn khỏi hệ thống!');
    } catch (err) {
      console.error('Failed to delete food:', err);
      toast.error('Lỗi khi xóa món ăn');
    } finally {
      setActionFoodId(null);
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
    if (!foodForm.description.trim()) {
      toast.error('Vui lòng nhập mô tả món ăn');
      return;
    }
    if (!foodForm.image_url.trim()) {
      toast.error('Vui lòng nhập URL hình ảnh món ăn');
      return;
    }
    try {
      setFoodFormSaving(true);
      if (editingFood) {
        setActionFoodId(editingFood.food_id);
        await foodsApi.update(editingFood.food_id, {
          name: foodForm.name.trim(),
          description: foodForm.description.trim(),
          image_url: foodForm.image_url.trim(),
        });
      } else {
        await foodsApi.create({
          name: foodForm.name.trim(),
          description: foodForm.description.trim(),
          image_url: foodForm.image_url.trim(),
        });
      }
      setFoodModalOpen(false);
      await loadFoods();
      toast.success(editingFood ? 'Cập nhật món ăn thành công!' : 'Tạo món ăn mới thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu món ăn');
    } finally {
      setFoodFormSaving(false);
      setActionFoodId(null);
    }
  };

  // User handlers
  const handleUserRoleChange = async (userId: number, newRole: UserRole) => {
    if (!confirm(`Xác nhận đổi vai trò của người dùng này thành ${newRole}?`)) return;
    setActionUserId(userId);
    try {
      await usersApi.changeRole(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Đã đổi vai trò người dùng thành ${newRole}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi đổi quyền người dùng');
    } finally {
      setActionUserId(null);
    }
  };

  const handleUserStatusChange = async (userId: number, newStatus: UserStatus) => {
    setActionUserId(userId);
    try {
      await usersApi.changeStatus(userId, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );
      toast.success(`Đã cập nhật trạng thái người dùng thành ${newStatus}!`);
    } catch (err) {
      console.error('Failed to change user status:', err);
      toast.error('Lỗi khi đổi trạng thái người dùng');
    } finally {
      setActionUserId(null);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordInput.trim()) return;
    const pwdErr = validatePassword(newPasswordInput.trim());
    if (pwdErr) {
      toast.error(pwdErr);
      return;
    }
    const targetUserId = passwordModalUser.user_id;
    setActionUserId(targetUserId);
    try {
      setPasswordSaving(true);
      await authApi.changePassword(targetUserId, {
        newPassword: newPasswordInput.trim(),
      });
      toast.success(`Đã đặt lại mật khẩu thành công cho ${passwordModalUser.username}!`);
      setPasswordModalUser(null);
      setNewPasswordInput('');
    } catch (err) {
      toast.error(formatApiError(err, 'Đổi mật khẩu người dùng'));
    } finally {
      setPasswordSaving(false);
      setActionUserId(null);
    }
  };

  const handleUserDelete = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động không thể hoàn tác!')) return;
    setActionUserId(userId);
    try {
      await usersApi.delete(userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success('Đã xóa người dùng thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    } finally {
      setActionUserId(null);
    }
  };

  // Report handlers
  const handleReportStatusChange = async (reportId: number, newStatus: ReportStatus) => {
    setActionReportId(reportId);
    try {
      await reportsApi.changeStatus(reportId, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: newStatus } : r))
      );
      toast.success('Đã cập nhật trạng thái báo cáo!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật báo cáo');
    } finally {
      setActionReportId(null);
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
                Quản lý món ăn, phân quyền người dùng và xử lý phản ánh • Vai trò:{' '}
                <strong>{user?.role}</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as 'foods' | 'users' | 'reports')
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
              ]}
              activeTab={activeTab}
              onChange={(val) =>
                setActiveTab(val as 'foods' | 'users' | 'reports')
              }
            />

            {/* TAB 1: FOOD MANAGEMENT */}
            <TabsContent value="foods" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
                  <div className="relative w-full sm:w-80">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
                    />
                    <Input
                      type="text"
                      placeholder="Tìm theo tên món..."
                      value={foodsSearch}
                      onChange={(e) => {
                        setFoodsSearch(e.target.value);
                        setFoodsPage(1);
                      }}
                      className="pl-8"
                    />
                  </div>

                  {/* Status Filter for Admin/Moderator */}
                    <Select
                      value={foodsStatus}
                      onValueChange={(val) => {
                        if (!val) return;
                        setFoodsStatus(val);
                        setFoodsPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                        <SelectItem value="PENDING">Đang chờ duyệt</SelectItem>
                        <SelectItem value="DISABLED">Đang ngưng</SelectItem>
                      </SelectContent>
                    </Select>
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
                <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Hình ảnh</th>
                          <th className="p-3">Tên món & Mô tả</th>
                          <th className="p-3">Ngày tạo</th>
                          <th className="p-3">Độ hiếm</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <tr key={idx}>
                            <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                            <td className="p-3"><Skeleton className="h-10 w-10 rounded-lg" /></td>
                            <td className="p-3 space-y-1.5">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </td>
                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="p-3"><Skeleton className="h-5 w-8 rounded-full" /></td>
                            <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="p-3 text-right"><Skeleton className="h-7 w-24 ml-auto rounded-lg" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          <th className="p-3">Ngày tạo</th>
                          <th className="p-3">Độ hiếm</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {foods.map((food) => {
                          if (actionFoodId === food.food_id) {
                            return (
                              <tr key={food.food_id} className="bg-muted/20">
                                <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                                <td className="p-3"><Skeleton className="h-10 w-10 rounded-lg" /></td>
                                <td className="p-3 space-y-1.5">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-48" />
                                </td>
                                <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                <td className="p-3"><Skeleton className="h-5 w-8 rounded-full" /></td>
                                <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                <td className="p-3 text-right"><Skeleton className="h-7 w-24 ml-auto rounded-lg" /></td>
                              </tr>
                            );
                          }

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
                                <Image
                                  src={food.image_url}
                                  alt={food.name}
                                  className="w-10 h-10 object-cover rounded-lg border border-border shrink-0"
                                />
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-foreground block">{food.name}</span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1">
                                  {food.description || 'Chưa có mô tả'}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-muted-foreground font-medium">
                                {food.created_at
                                  ? new Date(food.created_at).toLocaleDateString('vi-VN')
                                  : '—'}
                              </td>
                              <td className="p-3">
                                <Badge className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-secondary/15 text-foreground border-secondary/30">
                                  {food.food_rank || 'C'}
                                </Badge>
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

              <DataPagination
                currentPage={foodsPage}
                totalRecords={foodsTotal}
                pageSize={foodsPageSize}
                onPageChange={setFoodsPage}
                isLoading={foodsLoading}
              />
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
                    onChange={(e) => {
                      setUsersSearch(e.target.value);
                      setUsersPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
                <Button onClick={loadUsers} variant="outline" size="sm" className="font-bold">
                  Làm mới
                </Button>
              </div>

              {usersLoading ? (
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
                      <tbody className="divide-y border-border">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <tr key={idx}>
                            <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                            <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                            <td className="p-3 space-y-1.5">
                              <Skeleton className="h-4 w-36" />
                              <Skeleton className="h-3 w-44" />
                            </td>
                            <td className="p-3"><Skeleton className="h-7 w-20 rounded" /></td>
                            <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="p-3 text-right"><Skeleton className="h-7 w-28 ml-auto rounded-lg" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          if (actionUserId === u.user_id) {
                            return (
                              <tr key={u.user_id} className="bg-muted/20">
                                <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                                <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                                <td className="p-3 space-y-1.5">
                                  <Skeleton className="h-4 w-36" />
                                  <Skeleton className="h-3 w-44" />
                                </td>
                                <td className="p-3"><Skeleton className="h-7 w-20 rounded" /></td>
                                <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                <td className="p-3 text-right"><Skeleton className="h-7 w-28 ml-auto rounded-lg" /></td>
                              </tr>
                            );
                          }

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
                                  <Select
                                    value={u.role}
                                    onValueChange={(val) => {
                                      if (val) handleUserRoleChange(u.user_id, val as UserRole);
                                    }}
                                  >
                                    <SelectTrigger size="sm" className="h-8.5 min-w-32 text-xs font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USER">USER</SelectItem>
                                      <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                                    </SelectContent>
                                  </Select>
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

              <DataPagination
                currentPage={usersPage}
                totalRecords={usersTotal}
                pageSize={usersPageSize}
                onPageChange={setUsersPage}
                isLoading={usersLoading}
              />
            </TabsContent>

            {/* TAB 3: REPORT MANAGEMENT */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
                  <div className="relative w-full sm:w-80">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
                    />
                    <Input
                      type="text"
                      placeholder="Tìm theo tiêu đề, nội dung báo cáo..."
                      value={reportsSearch}
                      onChange={(e) => {
                        setReportsSearch(e.target.value);
                        setReportsPage(1);
                      }}
                      className="pl-8"
                    />
                  </div>

                  {/* Status Filter for Reports */}
                  <Select
                    value={reportsStatus}
                    onValueChange={(val) => {
                      if (!val) return;
                      setReportsStatus(val);
                      setReportsPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="PENDING">Đang chờ duyệt</SelectItem>
                      <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button onClick={loadReports} variant="outline" size="sm" className="font-bold">
                    Làm mới
                  </Button>
                </div>
              </div>

              {reportsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-16 p-8 rounded-2xl bg-card border border-border text-muted-foreground text-xs">
                  Hiện chưa có báo cáo sự cố hoặc góp ý nào từ người dùng.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    if (actionReportId === report.report_id) {
                      return (
                        <div
                          key={report.report_id}
                          className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3 bg-muted/20"
                        >
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      );
                    }

                    return (
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
                  );
                })}
              </div>
            )}

            <DataPagination
              currentPage={reportsPage}
              totalRecords={reportsTotal}
              pageSize={reportsPageSize}
              onPageChange={setReportsPage}
              isLoading={reportsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

        {/* FOOD MODAL */}
        <Dialog open={foodModalOpen} onOpenChange={setFoodModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingFood ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingFood
                  ? 'Cập nhật thông tin chi tiết của món ăn trong hệ thống.'
                  : 'Nhập thông tin món ăn mới để thêm vào hệ thống AnGi.'}
              </DialogDescription>
            </DialogHeader>
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
                <label className="text-xs font-semibold text-foreground">Mô tả món ăn *</label>
                <Input
                  type="text"
                  placeholder="Món ăn truyền thống đậm đà hương vị..."
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">URL hình ảnh *</label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={foodForm.image_url}
                  onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                  required
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
          </DialogContent>
        </Dialog>

        {/* ADMIN RESET PASSWORD MODAL */}
        <Dialog
          open={Boolean(passwordModalUser)}
          onOpenChange={(open) => !open && setPasswordModalUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Đặt Lại Mật Khẩu ({passwordModalUser?.username})
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Nhập mật khẩu mới cho tài khoản người dùng này.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdminResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mật khẩu mới *</label>
                <PasswordInput
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
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
