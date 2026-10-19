'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faPlus,
  faTrashCan,
  faMagnifyingGlass,
  faFire,
  faClock,
  faUsers,
  faHeart,
  faArrowUpRightFromSquare,
  faCalculator,
  faCheck,
  faRotate,
  faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from '@/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NutritionIngredient {
  id: number;
  name: string;
  calo_per_100g: number | string;
  refuse_rate: number | string;
}

interface SystemDishItem {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  instructions: string;
  total_calo: number;
  favourite_count: number;
  source_url: string | null;
  ingredients?: any[];
  parsed_instructions?: any;
}

interface SelectedIngredientRow {
  ingredient_id: number;
  quantity_display: string;
  weight_in_grams: number;
}

export const SystemDishesManager: React.FC = () => {
  const [dishes, setDishes] = useState<SystemDishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<NutritionIngredient[]>([]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSourceUrl, setFormSourceUrl] = useState('https://monngonmoingay.com/');
  const [formServings, setFormServings] = useState(4);
  const [formCookTime, setFormCookTime] = useState('25 phút');
  const [formDifficulty, setFormDifficulty] = useState('Dễ');
  const [formDescription, setFormDescription] = useState('');
  const [formSteps, setFormSteps] = useState<string[]>([
    'Sơ chế nguyên liệu sạch sẽ.',
    'Nêm gia vị và chế biến chín đều.',
    'Bày ra đĩa, trang trí và thưởng thức nóng.',
  ]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredientRow[]>([]);

  // Fetch Dishes
  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/system-dishes?limit=100&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setDishes(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load system dishes:', e);
      toast.error('Không thể tải danh sách món ăn hệ thống');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Fetch Nutrition Ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/ingredients');
      const data = await res.json();
      if (data.status === 'success') {
        setAvailableIngredients(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load nutrition ingredients:', e);
    }
  }, []);

  useEffect(() => {
    fetchDishes();
    fetchIngredients();
  }, [fetchDishes, fetchIngredients]);

  // Add Ingredient Row to Modal Form
  const handleAddIngredientRow = () => {
    if (availableIngredients.length === 0) return;
    setSelectedIngredients((prev) => [
      ...prev,
      {
        ingredient_id: availableIngredients[0].id,
        quantity_display: '100g',
        weight_in_grams: 100,
      },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setSelectedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientRow = (
    index: number,
    field: keyof SelectedIngredientRow,
    value: any
  ) => {
    setSelectedIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Live Formula Calculation: T = sum(Wi * (1 - Ri/100) * (Ni / 100))
  const calculatedNutrition = useMemo(() => {
    const breakdown = selectedIngredients.map((row) => {
      const ing = availableIngredients.find((item) => item.id === row.ingredient_id);
      if (!ing) return { name: 'Chưa chọn', w: 0, r: 0, n: 0, calo: 0 };
      const w = Number(row.weight_in_grams) || 0;
      const r = Number(ing.refuse_rate) / 100.0;
      const n = Number(ing.calo_per_100g) || 0;
      const calo = w * (1.0 - r) * (n / 100.0);
      return {
        name: ing.name,
        w,
        r: Number(ing.refuse_rate),
        n,
        calo: Math.round(calo * 10) / 10,
      };
    });

    const total = breakdown.reduce((acc, item) => acc + item.calo, 0);

    return {
      total: Math.round(total * 100) / 100,
      breakdown,
    };
  }, [selectedIngredients, availableIngredients]);

  // Submit System Dish
  const handleCreateSystemDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Vui lòng nhập tên món ăn');
      return;
    }
    if (selectedIngredients.length === 0) {
      toast.error('Vui lòng thêm ít nhất một nguyên liệu');
      return;
    }

    try {
      setSubmitting(true);
      const instructionsPayload = {
        servings: Number(formServings) || 4,
        cook_time: formCookTime.trim() || '20 phút',
        difficulty: formDifficulty,
        description: formDescription.trim(),
        steps: formSteps.filter((s) => s.trim().length > 0),
      };

      const res = await fetch('/api/system-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          image_url: formImageUrl.trim() || null,
          source_url: formSourceUrl.trim() || 'https://monngonmoingay.com/',
          instructions: instructionsPayload,
          ingredients: selectedIngredients,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success(`Đã thêm món "${formTitle}" với tổng năng lượng ${data.data.total_calo} kcal!`);
        setIsAddModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormImageUrl('');
        setFormDescription('');
        setSelectedIngredients([]);
        fetchDishes();
      } else {
        toast.error(data.message || 'Lỗi khi tạo món ăn');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dish: SystemDishItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa món chuẩn vị "${dish.title}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/system-dishes/${dish.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Đã xóa món ăn hệ thống thành công');
        setDishes((prev) => prev.filter((d) => d.id !== dish.id));
      } else {
        toast.error(data.message || 'Lỗi khi xóa món ăn');
      }
    } catch (e) {
      toast.error('Lỗi khi xóa món ăn');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
          />
          <Input
            type="text"
            placeholder="Tìm theo tên món ăn chuẩn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button onClick={fetchDishes} variant="outline" size="sm" className="font-bold">
            <FontAwesomeIcon icon={faRotate} className="mr-1.5" />
            Làm mới
          </Button>
          <Button
            onClick={() => {
              if (selectedIngredients.length === 0 && availableIngredients.length > 0) {
                setSelectedIngredients([
                  {
                    ingredient_id: availableIngredients[0].id,
                    quantity_display: '250g',
                    weight_in_grams: 250,
                  },
                ]);
              }
              setIsAddModalOpen(true);
            }}
            size="sm"
            className="font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            <span>Thêm Món Chuẩn Vị</span>
          </Button>
        </div>
      </div>

      {/* Dishes Table */}
      {loading ? (
        <div className="border border-border rounded-2xl overflow-hidden bg-card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-card border border-border text-muted-foreground text-xs">
          Không tìm thấy món ăn chuẩn vị nào. Bấm <strong>"Thêm Món Chuẩn Vị"</strong> để bổ sung.
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Hình ảnh</th>
                  <th className="p-3">Tên món ăn</th>
                  <th className="p-3">Năng lượng chuẩn</th>
                  <th className="p-3">Yêu thích</th>
                  <th className="p-3">Nguồn tham khảo</th>
                  <th className="p-3 text-right whitespace-nowrap min-w-[150px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">#{dish.id}</td>
                    <td className="p-3">
                      <Image
                        src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                        alt={dish.title}
                        className="w-11 h-11 object-cover rounded-xl border border-border"
                      />
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-foreground block text-sm">{dish.title}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        slug: /{dish.slug}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-2 py-0.5">
                        <FontAwesomeIcon icon={faFire} className="mr-1 text-[10px]" />
                        {dish.total_calo} kcal
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <FontAwesomeIcon icon={faHeart} className="text-primary text-[11px]" />
                        {dish.favourite_count}
                      </span>
                    </td>
                    <td className="p-3">
                      {dish.source_url ? (
                        <a
                          href={dish.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-[11px] truncate max-w-[140px]"
                        >
                          <span>Món Ngon Mỗi Ngày</span>
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px]" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/mon-an/${dish.slug}`} target="_blank">
                          <Button size="sm" variant="outline" className="h-7 text-xs font-semibold gap-1">
                            <FontAwesomeIcon icon={faBookOpen} className="text-[10px]" />
                            <span>Xem trang</span>
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDish(dish)}
                          className="h-7 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SYSTEM DISH MODAL WITH LIVE NUTRITION CALCULATOR */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faUtensils} className="text-primary" />
              <span>Thêm Món Ăn Chuẩn Vị & Tính Toán Dinh Dưỡng</span>
            </DialogTitle>
            <DialogDescription>
              Chuẩn hóa theo Viện Dinh Dưỡng Quốc Gia và công thức từ Món Ngon Mỗi Ngày (Ajinomoto).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSystemDish} className="space-y-5 pt-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Tên món ăn (*)</label>
                <Input
                  required
                  placeholder="VD: Thịt Kho Tàu Nước Dừa"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">URL hình ảnh</label>
                <Input
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Số người ăn</label>
                <Input
                  type="number"
                  min="1"
                  value={formServings}
                  onChange={(e) => setFormServings(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Thời gian nấu</label>
                <Input
                  placeholder="VD: 30 phút"
                  value={formCookTime}
                  onChange={(e) => setFormCookTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Mô tả tóm tắt món ăn</label>
              <textarea
                rows={2}
                placeholder="Hương vị đậm đà, màu sắc cánh gián hấp dẫn..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            {/* INGREDIENTS EDITOR WITH REAL-TIME CALORIES CALCULATION */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalculator} className="text-primary" />
                    <span>Nguyên liệu & Khối lượng thực tế</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống tự động trừ tỷ lệ thải bỏ (R%) và tính calo chuẩn
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddIngredientRow}
                  className="h-7 text-xs font-bold"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  Thêm nguyên liệu
                </Button>
              </div>

              {selectedIngredients.map((row, idx) => {
                const ing = availableIngredients.find((i) => i.id === row.ingredient_id);
                return (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-card p-2.5 rounded-xl border border-border/70">
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={row.ingredient_id}
                        onChange={(e) =>
                          handleUpdateIngredientRow(idx, 'ingredient_id', Number(e.target.value))
                        }
                        className="w-full text-xs p-2 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                      >
                        {availableIngredients.map((ingItem) => (
                          <option key={ingItem.id} value={ingItem.id}>
                            {ingItem.name} ({ingItem.calo_per_100g} kcal/100g, bỏ {ingItem.refuse_rate}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <Input
                        placeholder="Hiển thị (vd: 2 củ)"
                        value={row.quantity_display}
                        onChange={(e) =>
                          handleUpdateIngredientRow(idx, 'quantity_display', e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Gram"
                        value={row.weight_in_grams}
                        onChange={(e) =>
                          handleUpdateIngredientRow(idx, 'weight_in_grams', Number(e.target.value))
                        }
                        className="h-8 text-xs font-bold"
                      />
                    </div>

                    <div className="w-20 text-right font-mono text-xs font-bold text-primary">
                      {ing
                        ? Math.round(
                            (Number(row.weight_in_grams) *
                              (1 - Number(ing.refuse_rate) / 100) *
                              (Number(ing.calo_per_100g) / 100)) *
                              10
                          ) / 10
                        : 0}{' '}
                      kcal
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </Button>
                  </div>
                );
              })}

              {/* LIVE FORMULA NUTRITION PREVIEW */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/5 p-3 rounded-xl">
                <div>
                  <span className="text-[11px] text-muted-foreground font-mono block">
                    Công thức: T = Σ [ Wi × (1 - Ri) × (Ni / 100) ]
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    Tổng cộng: {selectedIngredients.length} thành phần dinh dưỡng
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Tổng calo ước tính:</span>
                  <Badge className="bg-primary text-primary-foreground font-black text-sm px-3 py-1">
                    <FontAwesomeIcon icon={faFire} className="mr-1.5" />
                    {calculatedNutrition.total} kcal
                  </Badge>
                </div>
              </div>
            </div>

            {/* Steps Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Các bước chế biến</label>
              {formSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    value={step}
                    onChange={(e) => {
                      const next = [...formSteps];
                      next[idx] = e.target.value;
                      setFormSteps(next);
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormSteps((prev) => prev.filter((_, i) => i !== idx))}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormSteps((prev) => [...prev, ''])}
                className="text-xs font-semibold"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                Thêm bước thực hiện
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                {submitting ? 'Đang lưu...' : 'Lưu Món Chuẩn Vị'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

