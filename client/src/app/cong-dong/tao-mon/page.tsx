'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faUtensils,
  faCamera,
  faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function CreateRecipePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;

  const [topics, setTopics] = useState<any[]>([]);
  const [topicId, setTopicId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [servings, setServings] = useState<number>(4);
  const [cookTime, setCookTime] = useState('30 phút');

  // Ingredients: free text items
  const [ingredients, setIngredients] = useState<string[]>([
    '500g thịt hoặc nguyên liệu chính',
    'Gia vị: muối, đường, hạt nêm, tiêu',
  ]);

  // Steps: numbered items with optional image
  const [steps, setSteps] = useState<{ step: number; text: string; image: string }[]>([
    { step: 1, text: 'Sơ chế nguyên liệu sạch sẽ và chuẩn bị sẵn sàng.', image: '' },
    { step: 2, text: 'Bắt đầu chế biến trên bếp với lửa vừa.', image: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/community/topics')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.data.length > 0) {
          setTopics(data.data);
          setTopicId(data.data[0].id);
        }
      });
  }, []);

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, val: string) => {
    const next = [...ingredients];
    next[index] = val;
    setIngredients(next);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, text: '', image: '' }]);
  };

  const updateStep = (index: number, field: 'text' | 'image', val: string) => {
    const next = [...steps];
    next[index][field] = val;
    setSteps(next);
  };

  const removeStep = (index: number) => {
    const next = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, step: idx + 1 }));
    setSteps(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề món ăn.');
      return;
    }

    const filteredIngredients = ingredients.filter((item) => item.trim());
    if (filteredIngredients.length === 0) {
      toast.error('Vui lòng thêm ít nhất một nguyên liệu.');
      return;
    }

    const filteredSteps = steps.filter((s) => s.text.trim());
    if (filteredSteps.length === 0) {
      toast.error('Vui lòng nhập ít nhất một bước thực hiện.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topicId,
          author_id: userId,
          title: title.trim(),
          story: story.trim() || null,
          servings: servings || 2,
          cook_time: cookTime || '30 phút',
          ingredients: filteredIngredients,
          steps: filteredSteps,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Đã đăng công thức mới thành công!');
        router.push(`/cong-dong/bai-viet/${data.data.id}`);
      } else {
        toast.error(data.message || 'Lỗi khi đăng bài.');
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi công thức.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Breadcrumb */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between text-xs font-semibold">
          <Link href="/cong-dong" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại Cộng Đồng</span>
          </Link>
          <span className="text-foreground font-bold">Chia Sẻ Công Thức Mới</span>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Card */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faUtensils} />
              <span>Viết Món Mới Cùng Cookpad</span>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-foreground">
                Tên Món Ăn Của Bạn (*):
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Sườn non kho thơm đậm đà, chuẩn vị mẹ nấu..."
                className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3 text-base font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Topic & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Chọn Chủ Đề:</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Khẩu Phần (Người):</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Thời Gian Nấu:</label>
                <input
                  type="text"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="VD: 30 phút, 1 tiếng..."
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Story */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Câu Chuyện / Cảm Hứng Về Món Này:
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Chia sẻ lý do bạn thích món này, hoặc mẹo nhỏ giúp nấu ngon hơn..."
                rows={3}
                className="w-full bg-muted/40 border border-border rounded-2xl p-3.5 text-xs font-medium focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Nguyên Liệu (*):</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
                className="rounded-xl text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Thêm Nguyên Liệu</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => updateIngredient(idx, e.target.value)}
                    placeholder="VD: 300g thịt bắp bò, 2 muỗng cà phê đường..."
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="size-8 rounded-xl text-muted-foreground hover:text-destructive flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Section */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Các Bước Thực Hiện (*):</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="rounded-xl text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Thêm Bước</span>
              </Button>
            </div>

            <div className="space-y-5">
              {steps.map((st, idx) => (
                <div key={idx} className="bg-muted/30 p-4 rounded-2xl border border-border/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      Bước {st.step}
                    </span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={st.text}
                    onChange={(e) => updateStep(idx, 'text', e.target.value)}
                    placeholder={`Mô tả chi tiết bước ${st.step}...`}
                    rows={2}
                    className="w-full bg-card border border-border rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-primary resize-none"
                  />

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCamera} className="text-muted-foreground text-xs" />
                    <input
                      type="url"
                      value={st.image}
                      onChange={(e) => updateStep(idx, 'image', e.target.value)}
                      placeholder="Link ảnh minh họa cho bước này (tùy chọn)..."
                      className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/cong-dong">
              <Button type="button" variant="outline" className="rounded-2xl text-xs font-bold">
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl text-xs font-black px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md active:scale-95"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
              {isSubmitting ? 'Đang Đăng...' : 'Đăng Công Thức Lên Cộng Đồng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

