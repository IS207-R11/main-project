'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClock,
  faUsers,
  faCamera,
  faFlag,
  faComment,
  faPaperPlane,
  faTrash,
  faCheck,
  faUser,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportModal } from '@/components/community/ReportModal';
import { useAuth } from '@/context/AuthContext';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New comment
  const [commentContent, setCommentContent] = useState('');
  const [cooksnapPhoto, setCooksnapPhoto] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'POST' | 'COMMENT'; id: number; title: string }>({
    type: 'POST',
    id: 0,
    title: '',
  });

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${id}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPost(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          user_id: userId,
          content: commentContent.trim(),
          image_url: cooksnapPhoto.trim() ? [cooksnapPhoto.trim()] : null,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(cooksnapPhoto ? 'Đã gửi bình luận Cooksnap của bạn!' : 'Đã đăng bình luận!');
        setCommentContent('');
        setCooksnapPhoto('');
        fetchPost();
      } else {
        toast.error(data.message || 'Lỗi khi gửi bình luận.');
      }
    } catch {
      toast.error('Lỗi kết nối.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Đã xóa bài viết.');
        router.push('/cong-dong');
      } else {
        toast.error(data.message || 'Không thể xóa bài viết.');
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Không tìm thấy bài viết này.</h2>
        <Link href="/cong-dong">
          <Button variant="outline" className="rounded-xl">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Quay lại Cộng Đồng
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = post.author_id === userId;
  const cooksnaps = (post.comments || []).filter((c: any) => c.photos && c.photos.length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Breadcrumb */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between text-xs">
          <Link href="/cong-dong" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-semibold">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại Cộng Đồng</span>
          </Link>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePost}
                className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-full"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                <span>Xóa Bài</span>
              </Button>
            )}

            <button
              onClick={() => {
                setReportTarget({ type: 'POST', id: post.id, title: post.title });
                setReportModalOpen(true);
              }}
              className="text-stone-400 hover:text-rose-500 text-xs flex items-center gap-1 transition-colors px-2 py-1"
            >
              <FontAwesomeIcon icon={faFlag} className="text-[10px]" />
              <span>Báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 pt-8 space-y-8">
        {/* Title & Author Info */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {post.topic_title || 'Bếp Việt'}
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center justify-between gap-4 pt-1 border-b border-border/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-black text-xs">
                {post.author_name ? post.author_name.charAt(0).toUpperCase() : 'U'}
              </span>
              <div>
                <p className="text-xs font-extrabold text-foreground">{post.author_name || 'Đầu bếp'}</p>
                <p className="text-[10px] text-muted-foreground">
                  Đã đăng lúc {new Date(post.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xs" />
                {post.cook_time || '30 phút'}
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="text-secondary text-xs" />
                {post.servings} người
              </span>
            </div>
          </div>

          {/* Story */}
          {post.story && (
            <p className="text-sm text-foreground/80 leading-relaxed italic bg-muted/30 p-4 rounded-2xl border border-border/60">
              "{post.story}"
            </p>
          )}
        </div>

        {/* Ingredients */}
        <section className="bg-card p-6 sm:p-7 rounded-3xl border border-border shadow-xs space-y-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            Nguyên Liệu
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(post.ingredients || []).map((ing: string, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs font-semibold text-foreground"
              >
                <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <span>{ing}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-card p-6 sm:p-7 rounded-3xl border border-border shadow-xs space-y-6">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            Các Bước Nấu
          </h2>

          <div className="space-y-6">
            {(post.steps || []).map((st: any, i: number) => (
              <div key={i} className="space-y-3 pb-4 border-b border-border/60 last:border-none last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    {st.step || i + 1}
                  </span>
                  <span className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                    Bước {st.step || i + 1}
                  </span>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed pl-8">
                  {st.text}
                </p>

                {st.image && (
                  <div className="pl-8 pt-1">
                    <img
                      src={st.image}
                      alt={`Bước ${st.step}`}
                      className="max-h-60 rounded-2xl object-cover border border-border shadow-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Cooksnap Section Highlight */}
        {cooksnaps.length > 0 && (
          <section className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-6 rounded-3xl border border-orange-500/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-wider">
              <FontAwesomeIcon icon={faCamera} />
              <span>Ảnh Thực Hành Từ Cộng Đồng (Cooksnap - {cooksnaps.length})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cooksnaps.map((cs: any, i: number) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-card border border-border shadow-xs">
                  <img src={cs.photos[0]} alt="Cooksnap" className="h-full w-full object-cover group-hover:scale-106 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <p className="text-[10px] text-white font-bold truncate">
                      {cs.user_name || 'Đầu bếp'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section className="bg-card p-6 sm:p-7 rounded-3xl border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <FontAwesomeIcon icon={faComment} className="text-secondary text-sm" />
              Bình Luận & Cooksnap ({(post.comments || []).length})
            </h2>
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="bg-muted/30 p-4 rounded-2xl border border-border/80 space-y-3">
            <textarea
              required
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Chia sẻ nhận xét hoặc cảm ơn tác giả vì công thức ngon..."
              rows={2}
              className="w-full bg-card border border-border rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-primary resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <FontAwesomeIcon icon={faCamera} className="text-muted-foreground text-xs" />
                <input
                  type="url"
                  value={cooksnapPhoto}
                  onChange={(e) => setCooksnapPhoto(e.target.value)}
                  placeholder="Link ảnh bạn đã nấu thử món này (Cooksnap)..."
                  className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary text-muted-foreground"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingComment}
                className="rounded-xl text-xs font-bold bg-primary text-white shrink-0 self-end sm:self-auto"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-1.5 text-xs" />
                {isSubmittingComment ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-4 pt-2">
            {(post.comments || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">
                Chưa có bình luận nào. Hãy là người đầu tiên để lại lời khen hoặc Cooksnap!
              </p>
            ) : (
              post.comments.map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                        {c.user_name ? c.user_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                      <span className="text-xs font-bold text-foreground">{c.user_name || 'Thành viên'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setReportTarget({ type: 'COMMENT', id: c.id, title: c.content });
                        setReportModalOpen(true);
                      }}
                      className="text-stone-400 hover:text-rose-500 text-[10px] p-1"
                      title="Báo cáo bình luận"
                    >
                      <FontAwesomeIcon icon={faFlag} />
                    </button>
                  </div>

                  <p className="text-xs text-foreground/90 pl-8 leading-relaxed">
                    {c.content}
                  </p>

                  {/* Cooksnap Photo in comment */}
                  {c.photos && c.photos.length > 0 && (
                    <div className="pl-8 pt-1">
                      <img
                        src={c.photos[0]}
                        alt="Cooksnap"
                        className="size-36 rounded-2xl object-cover border border-border shadow-xs"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
        reporterId={userId}
      />
    </div>
  );
}

