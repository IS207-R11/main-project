'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { foodsApi } from '@/api';
import { EatenFood, FoodOption } from '@/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faUtensils,
  faPlus,
  faTrashCan,
  faClock,
  faPencil,
  faSearch,
  faArrowDownShortWide,
  faArrowUpWideShort,
  faCheck,
  faTriangleExclamation,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

export default function DiaryPage() {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

  const [eatenList, setEatenList] = useState<EatenFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EatenFood | null>(null);

  // Filter & Search states
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // New/Edit record form state
  const [searchQuery, setSearchQuery] = useState('');
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [note, setNote] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadEatenHistory = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const res = await foodsApi.getEaten(user.user_id, {
        page: currentPage,
        pageSize,
        search: searchFilter || undefined,
        sort_order: sortOrder,
      });
      if (res && res.data) {
        setEatenList(res.data);
        setTotalCount(res.total_records ?? res.data.length);
      }
    } catch (e) {
      console.warn('Failed to load eaten meals:', e);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, pageSize, searchFilter, sortOrder]);

  useEffect(() => {
    if (user?.user_id) {
      loadEatenHistory();
    }
  }, [user?.user_id, loadEatenHistory]);

  // Food search autocomplete for create modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFoodOptions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const options = await foodsApi.options(searchQuery.trim());
        setFoodOptions(options);
      } catch {
        setFoodOptions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleOpenCreateModal = () => {
    setEditItem(null);
    setSelectedFood(null);
    setSearchQuery('');
    setNote('');
    setFormMsg(null);
    setRecordModalOpen(true);
  };

  const handleOpenEditModal = (item: EatenFood) => {
    setEditItem(item);
    setSelectedFood({
      food_id: item.food_id,
      name: item.food?.name || `Món #${item.food_id}`,
    });
    setSearchQuery('');
    setNote(item.note || '');
    setFormMsg(null);
    setRecordModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!selectedFood && !editItem) {
      setFormMsg({ text: 'Vui lòng chọn một món ăn từ danh sách tìm kiếm', type: 'error' });
      return;
    }

    try {
      setFormSaving(true);
      if (editItem) {
        // Update eaten record
        await foodsApi.updateEaten(editItem.eaten_id, {
          food_id: selectedFood ? selectedFood.food_id : editItem.food_id,
          note: note.trim() || undefined,
        });
      } else {
        // Create eaten record
        await foodsApi.recordEaten({
          food_id: selectedFood!.food_id,
          note: note.trim() || undefined,
        });
      }

      await loadEatenHistory();
      setRecordModalOpen(false);
    } catch (err: unknown) {
      setFormMsg({
        text: err instanceof Error ? err.message : 'Lỗi khi lưu thông tin món ăn',
        type: 'error',
      });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteEaten = async (eatenId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    try {
      await foodsApi.deleteEaten(eatenId);
      setEatenList((prev) => prev.filter((item) => item.eaten_id !== eatenId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete meal record:', err);
    }
  };

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
          <FontAwesomeIcon icon={faBookOpen} />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Nhật Ký Ăn Uống</h1>
        <p className="text-sm text-muted-foreground">
          Đăng nhập để ghi chép các món ăn hàng ngày, lưu lại ghi chú và xem lịch sử ăn uống của bạn.
        </p>
        <Button onClick={() => openAuthModal('login')} className="font-bold gap-2">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <span>Đăng Nhập Ngay</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} className="text-secondary text-xl" />
              <h1 className="text-2xl font-black text-foreground">Nhật Ký Ăn Uống</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Ghi nhận và quản lý những món bạn đã thưởng thức ({totalCount} bản ghi)
            </p>
          </div>

          <Button
            onClick={handleOpenCreateModal}
            className="font-bold gap-1.5 rounded-full cursor-pointer shadow-md"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            <span>Ghi Món Vừa Ăn</span>
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border">
          <div className="relative w-full sm:w-80">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
            />
            <Input
              type="text"
              placeholder="Tìm theo ghi chú hoặc tên món..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setCurrentPage(1);
              }}
              className="text-xs gap-1.5"
            >
              <FontAwesomeIcon
                icon={sortOrder === 'asc' ? faArrowUpWideShort : faArrowDownShortWide}
              />
              <span>{sortOrder === 'asc' ? 'Cũ nhất trước' : 'Mới nhất trước'}</span>
            </Button>
          </div>
        </div>

        {/* Create / Edit Record Modal */}
        {recordModalOpen && (
          <Card className="rounded-3xl border-primary/40 bg-card p-6 shadow-xl animate-in slide-in-from-top-3">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  {editItem ? 'Chỉnh Sửa Ghi Chú Món Ăn' : 'Ghi Nhận Món Vừa Ăn'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordModalOpen(false)}
                  className="rounded-full"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {formMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      formMsg.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-destructive/15 text-destructive border border-destructive/30'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={formMsg.type === 'success' ? faCheck : faTriangleExclamation}
                    />
                    <span>{formMsg.text}</span>
                  </div>
                )}

                {/* Food search autocomplete */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-foreground">
                    Chọn món ăn *
                  </label>
                  {selectedFood ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-secondary bg-secondary/10">
                      <span className="text-xs font-bold text-foreground">
                        {selectedFood.name} (Mã: #{selectedFood.food_id})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFood(null)}
                        className="text-xs h-6 px-2 text-destructive"
                      >
                        Đổi món
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        placeholder="Gõ tên món ăn để tìm (Phở, Cơm sườn, Bún bò...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {foodOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border border-border rounded-xl shadow-lg p-1 max-h-48 overflow-y-auto">
                          {foodOptions.map((opt) => (
                            <button
                              key={opt.food_id}
                              type="button"
                              onClick={() => {
                                setSelectedFood(opt);
                                setFoodOptions([]);
                              }}
                              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted font-medium cursor-pointer transition-colors"
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Ghi chú món ăn (tùy chọn)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Ăn trưa cùng bạn tại quán vỉa hè, rất vừa miệng..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRecordModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={formSaving} className="font-bold">
                    {formSaving ? <Spinner /> : editItem ? 'Cập Nhật' : 'Lưu Ghi Nhận'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Timeline of Meals */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : eatenList.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-card border border-border space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FontAwesomeIcon icon={faUtensils} />
            </div>
            <h3 className="font-bold text-base text-foreground">Chưa Có Dữ Liệu Bữa Ăn</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Bắt đầu ghi lại các món bạn ăn hôm nay để lưu giữ lịch sử ăn uống của bạn!
            </p>
            <Button onClick={handleOpenCreateModal} size="sm" className="font-bold mt-2">
              <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
              Ghi Món Ăn Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {eatenList.map((item) => {
              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleString('vi-VN')
                : 'Vừa xong';
              const foodName = item.food?.name || `Món ăn #${item.food_id}`;

              return (
                <div
                  key={item.eaten_id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {item.food?.image_url ? (
                      <img
                        src={item.food.image_url}
                        alt={foodName}
                        className="w-14 h-14 rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <div className="size-14 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-lg font-bold">
                        <FontAwesomeIcon icon={faUtensils} />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{foodName}</h4>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                          {dateStr}
                        </span>
                      </div>

                      {item.note ? (
                        <p className="text-xs text-muted-foreground italic">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60">Không có ghi chú</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(item)}
                      className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Sửa ghi chú"
                    >
                      <FontAwesomeIcon icon={faPencil} className="text-xs" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEaten(item.eaten_id)}
                      className="text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 p-0 cursor-pointer"
                      title="Xóa mục này"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs text-muted-foreground">
                  Trang {currentPage} / {Math.ceil(totalCount / pageSize)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
