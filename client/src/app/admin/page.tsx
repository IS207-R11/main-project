'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { foodsApi, usersApi, reportsApi } from '@/api';
import { FoodCard, User, Report, FoodStatus, UserStatus, ReportStatus } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Spinner } from '@/components/ui/spinner';
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
} from '@fortawesome/free-solid-svg-icons';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'foods' | 'users' | 'reports'>('foods');

  // FOODS STATE
  const [foods, setFoods] = useState<FoodCard[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsSearch, setFoodsSearch] = useState('');

  // USERS STATE
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');

  // REPORTS STATE
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // LOAD FOODS
  const loadFoods = useCallback(async () => {
    try {
      setFoodsLoading(true);
      const res = await foodsApi.list({
        pageSize: 30,
        search: foodsSearch || undefined,
        sort_by: 'food_name',
      });
      if (res.data) {
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
        pageSize: 30,
        search: usersSearch || undefined,
      });
      if (res.data) {
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
        pageSize: 30,
      });
      if (res.data) {
        setReports(res.data);
      }
    } catch (e) {
      console.error('Failed to load reports for admin:', e);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'foods') loadFoods();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'reports') loadReports();
  }, [activeTab, loadFoods, loadUsers, loadReports]);

  // Food status change handler
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

  // Food delete handler
  const handleFoodDelete = async (foodId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này khỏi hệ thống?')) return;
    try {
      await foodsApi.delete(foodId);
      setFoods((prev) => prev.filter((f) => f.food_id !== foodId));
    } catch (err) {
      console.error('Failed to delete food:', err);
    }
  };

  // User status change handler
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

  // Report status change handler
  const handleReportStatusChange = async (reportId: number, newStatus: ReportStatus) => {
    try {
      await reportsApi.changeStatus(reportId, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Failed to change report status:', err);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MODERATOR']}>
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-secondary text-2xl" />
                <h1 className="text-2xl font-black text-foreground">Cổng Quản Trị Hệ Thống</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý món ăn, phân quyền người dùng và kiểm duyệt báo cáo sự cố • Quyền hạn hiện tại: <strong>{user?.role}</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'foods' | 'users' | 'reports')}
            className="space-y-6"
          >
            <UnderlineTabs
              layoutId="admin-tab-indicator"
              align="left"
              className="max-w-xl"
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
              onChange={(val) => setActiveTab(val as 'foods' | 'users' | 'reports')}
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
                <Button onClick={loadFoods} variant="outline" size="sm" className="font-bold">
                  Làm mới
                </Button>
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
                          <th className="p-3">Tên món</th>
                          <th className="p-3">Giá (k VND)</th>
                          <th className="p-3">Chay</th>
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
                              <td className="p-3 font-mono text-muted-foreground">{food.food_id}</td>
                              <td className="p-3 font-bold text-foreground">{food.food_name}</td>
                              <td className="p-3 font-semibold">{food.price ?? '--'}</td>
                              <td className="p-3">{food.is_veg ? '🌱 Chay' : 'Thường'}</td>
                              <td className="p-3">
                                <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>
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
                                    title="Duyệt món"
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
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleFoodDelete(food.food_id)}
                                    className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                    title="Xóa món"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                  </Button>
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
                          <th className="p-3">Username</th>
                          <th className="p-3">Email</th>
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
                              : 'bg-destructive/15 text-destructive border-destructive/30';

                          return (
                            <tr key={u.user_id} className="hover:bg-muted/40 transition-colors">
                              <td className="p-3 font-mono text-muted-foreground">{u.user_id}</td>
                              <td className="p-3 font-bold text-foreground">{u.username}</td>
                              <td className="p-3 text-muted-foreground">{u.email || '--'}</td>
                              <td className="p-3">
                                <Badge className="text-[10px] font-black px-2 py-0.5 rounded-full border">
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>
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
                                    Mở Khóa
                                  </Button>
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
                            Gửi bởi: <strong>{report.author?.username || 'Ẩn danh'}</strong> • {report.created_at || 'Mới đây'}
                          </span>
                        </div>
                        {report.title && (
                          <h4 className="font-bold text-sm text-foreground">{report.title}</h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {report.content}
                        </p>
                      </div>

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
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}
