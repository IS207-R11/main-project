'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFire,
  faClock,
  faUsers,
  faPlus,
  faBookmark,
  faCamera,
  faFlag,
  faFilter,
  faFolderPlus,
  faAward,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportModal } from '@/components/community/ReportModal';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

export default function CommunityPage() {
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;

  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [exclude, setExclude] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: number; title: string }>({ id: 0, title: '' });

  // Create Topic Modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/community/topics');
      const data = await res.json();
      if (data.status === 'success') {
        setTopics(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/community/posts?sort=${sort}`;
      if (selectedTopicId) url += `&topic_id=${selectedTopicId}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (exclude.trim()) url += `&exclude=${encodeURIComponent(exclude.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success') {
        setPosts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedTopicId, sort, exclude]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    try {
      const res = await fetch('/api/community/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          description: newTopicDesc.trim() || null,
          created_by: userId,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(`Đã tạo chủ đề "${newTopicTitle}" thành công!`);
        setTopicModalOpen(false);
        setNewTopicTitle('');
        setNewTopicDesc('');
        fetchTopics();
      } else if (data.status === 'duplicate') {
        toast.warning(
          `Chủ đề tương tự "${data.suggested_topic.title}" đã có sẵn. Hãy tham gia chia sẻ vào chủ đề này!`
        );
      } else {
        toast.error(data.message || 'Lỗi khi tạo chủ đề.');
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ================= COOKPAD HEADER & TOP SEARCH ================= */}
      <section className="border-b border-border bg-card/80 backdrop-blur-md sticky top-16 z-30 shadow-xs">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 w-full max-w-xl flex items-center bg-muted/60 dark:bg-stone-900 border border-border rounded-full px-4 py-2 shadow-xs focus-within:ring-2 focus-within:ring-primary/30"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted-foreground mr-2.5 text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm công thức cộng đồng (VD: sườn xào chua ngọt, phở bò...)"
              className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
            />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopicModalOpen(true)}
              className="rounded-full text-xs font-bold gap-1.5 border-border hover:bg-muted cursor-pointer"
            >
              <FontAwesomeIcon icon={faFolderPlus} className="text-secondary text-xs" />
              <span>+ Tạo Chủ Đề</span>
            </Button>

            <Link href="/cong-dong/tao-mon">
              <Button
                size="sm"
                className="rounded-full text-xs font-bold gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm active:scale-95 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Viết Món Mới</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Topics Scroll Bar */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 pb-3 pt-1 overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            onClick={() => setSelectedTopicId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTopicId === null
                ? 'bg-primary text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Tất Cả Chủ Đề
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopicId(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopicId === t.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{t.title}</span>
              <span className="text-[10px] opacity-70">({t.post_count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* ================= MAIN COMMUNITY CONTENT ================= */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Tabs: Mới Nhất | Phổ Biến */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSort('newest')}
                  className={`text-sm font-extrabold pb-2 transition-colors relative cursor-pointer ${
                    sort === 'newest' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mới Nhất
                  {sort === 'newest' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`text-sm font-extrabold pb-2 transition-colors relative cursor-pointer ${
                    sort === 'popular' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Phổ Biến Nhất
                  {sort === 'popular' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </div>

              <span className="text-xs text-muted-foreground font-semibold">
                {posts.length} công thức chia sẻ
              </span>
            </div>

            {/* Top 3 Verified Recipes Highlight (Medals 1, 2, 3) */}
            {posts.length >= 3 && !search && (
              <div className="bg-card p-4 rounded-3xl border border-border shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-wider">
                  <FontAwesomeIcon icon={faAward} />
                  <span>Top Công Thức Nổi Bật Được Yêu Thích</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {posts.slice(0, 3).map((p, idx) => {
                    const firstStepImg = p.steps?.[0]?.image || p.steps?.[2]?.image;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <Link
                        key={p.id}
                        href={`/cong-dong/bai-viet/${p.id}`}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-xs block"
                      >
                        <img
                          src={firstStepImg || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
                          alt={p.title}
                          className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 size-6 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-xs shadow-md">
                          {medals[idx]}
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {p.title}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Post Feed List (Cookpad Style) */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border p-8 space-y-3">
                <FontAwesomeIcon icon={faUtensils} className="text-3xl text-muted-foreground/30" />
                <h3 className="font-bold text-foreground">Chưa có công thức nào phù hợp</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Hãy là người đầu tiên chia sẻ công thức nấu ăn của bạn cho cộng đồng!
                </p>
                <Link href="/cong-dong/tao-mon">
                  <Button size="sm" className="rounded-full font-bold text-xs bg-primary text-white mt-2">
                    + Viết Công Thức Ngay
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const cover = post.steps?.[0]?.image || post.steps?.[2]?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                  const ingredientsSnippet = Array.isArray(post.ingredients) ? post.ingredients.slice(0, 4).join(', ') : '';

                  return (
                    <div
                      key={post.id}
                      className="group bg-card rounded-2xl border border-border p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-4"
                    >
                      {/* Left Square Thumbnail */}
                      <Link
                        href={`/cong-dong/bai-viet/${post.id}`}
                        className="relative size-32 sm:size-36 rounded-2xl overflow-hidden bg-muted shrink-0 mx-auto sm:mx-0"
                      >
                        <img
                          src={cover}
                          alt={post.title}
                          className="h-full w-full object-cover group-hover:scale-106 transition-transform duration-300"
                        />
                      </Link>

                      {/* Right Details */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                              {post.topic_title || 'Món Ngon Gia Đình'}
                            </span>

                            {/* Report Flag Button */}
                            <button
                              onClick={() => {
                                setReportTarget({ id: post.id, title: post.title });
                                setReportModalOpen(true);
                              }}
                              className="text-stone-400 hover:text-rose-500 text-xs transition-colors p-1"
                              title="Báo cáo vi phạm"
                            >
                              <FontAwesomeIcon icon={faFlag} className="text-[10px]" />
                            </button>
                          </div>

                          <Link href={`/cong-dong/bai-viet/${post.id}`}>
                            <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1 leading-snug">
                              {post.title}
                            </h3>
                          </Link>

                          {/* Story / Excerpt */}
                          {post.story && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {post.story}
                            </p>
                          )}

                          {/* Ingredients snippet */}
                          {ingredientsSnippet && (
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-1 font-medium italic">
                              Nguyên liệu: {ingredientsSnippet}...
                            </p>
                          )}
                        </div>

                        {/* Metadata row: time, servings, Cooksnap count, author */}
                        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 font-semibold">
                              <FontAwesomeIcon icon={faClock} className="text-[10px] text-amber-500" />
                              {post.cook_time || '30 phút'}
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                              <FontAwesomeIcon icon={faUsers} className="text-[10px] text-secondary" />
                              {post.servings} người
                            </span>
                            {post.cooksnap_count > 0 && (
                              <span className="flex items-center gap-1 font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full text-[10px]">
                                <FontAwesomeIcon icon={faCamera} className="text-[9px]" />
                                {post.cooksnap_count} Cooksnap
                              </span>
                            )}
                          </div>

                          {/* Author pill */}
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span className="size-5 rounded-full bg-secondary/20 text-secondary text-[10px] flex items-center justify-center font-black">
                              {post.author_name ? post.author_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                            <span className="truncate max-w-[100px]">{post.author_name || 'Đầu bếp'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar (4 cols - Cookpad Style) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sàng Lọc Nguyên Liệu (Exclude filter) */}
            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wider">
                <FontAwesomeIcon icon={faFilter} className="text-primary text-xs" />
                <span>Sàng Lọc Nguyên Liệu</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiển thị công thức <strong>không chứa</strong> nguyên liệu bạn muốn tránh:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={exclude}
                  onChange={(e) => setExclude(e.target.value)}
                  placeholder="Nhập nguyên liệu (VD: tôm, đậu phộng...)"
                  className="w-full bg-muted/60 text-foreground border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
                />
                {exclude && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExclude('')}
                    className="text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>

            {/* Tìm Kiếm Tương Tự (Tags) */}
            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-3">
              <span className="text-xs font-black text-foreground uppercase tracking-wider block">
                Tìm Kiếm Tương Tự
              </span>
              <div className="flex flex-wrap gap-2">
                {['sườn xào chua ngọt', 'sườn kho thơm', 'sườn chua ngọt kiểu bắc', 'phở tái lăn', 'canh chua cá lóc', 'thịt kho tàu', 'salad bơ mè'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearch(tag);
                      fetchPosts();
                    }}
                    className="text-xs font-medium bg-muted/60 hover:bg-muted text-foreground px-3 py-1 rounded-full border border-border transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooksnap Community Banner */}
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-5 rounded-3xl border border-orange-500/20 space-y-3">
              <div className="size-10 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center text-lg">
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <h4 className="font-extrabold text-sm text-foreground">Cooksnap là gì?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đã nấu thử một món ăn từ cộng đồng? Hãy chụp lại thành phẩm của bạn và chia sẻ vào phần bình luận dưới bài viết để cảm ơn tác giả nhé!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Topic */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground rounded-3xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <h3 className="font-black text-lg text-foreground">Tạo Chủ Đề Món Ăn Mới</h3>
            <p className="text-xs text-muted-foreground">
              Hệ thống tự động kiểm tra trùng lặp để tránh trùng lặp tên chủ đề tương tự nhau.
            </p>
            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Tên Chủ Đề (*):</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="VD: Món Cuốn Ba Miền, Chè Truyền Thống..."
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Mô Tả Chủ Đề:</label>
                <textarea
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn thể loại món ăn trong chủ đề này..."
                  rows={2}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTopicModalOpen(false)}
                  className="rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-primary text-white font-bold"
                >
                  Tạo Chủ Đề
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="POST"
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
        reporterId={userId}
      />
    </div>
  );
}

