'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reportsApi } from '@/api';
import { ReportType } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faTriangleExclamation,
  faCommentDots,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ open, onOpenChange }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [type, setType] = useState<ReportType>('COMMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!isAuthenticated) {
      onOpenChange(false);
      openAuthModal('login');
      return;
    }

    if (!content.trim()) {
      setMsg({ text: 'Vui lòng nhập nội dung góp ý hoặc mô tả lỗi', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await reportsApi.create({
        type,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      setMsg({ text: 'Cảm ơn bạn! Báo cáo/góp ý đã được gửi thành công.', type: 'success' });
      setTimeout(() => {
        setTitle('');
        setContent('');
        setMsg(null);
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Lỗi gửi báo cáo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faCommentDots} className="text-secondary" />
            <span>Góp Ý & Báo Cáo Lỗi</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ý kiến của bạn giúp nhóm phát triển hoàn thiện trải nghiệm ứng dụng tốt hơn mỗi ngày.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                  : 'bg-destructive/15 text-destructive border border-destructive/30'
              }`}
            >
              <FontAwesomeIcon icon={msg.type === 'success' ? faCheck : faTriangleExclamation} />
              <span>{msg.text}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Loại phản hồi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('COMMENT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'COMMENT'
                    ? 'border-secondary bg-secondary/15 text-foreground'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              >
                Đóng Góp Ý Kiến
              </button>
              <button
                type="button"
                onClick={() => setType('ERROR')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'ERROR'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-500'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              >
                Báo Lỗi Ứng Dụng
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tiêu đề (tùy chọn)</label>
            <Input
              type="text"
              placeholder="Tóm tắt nội dung..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Nội dung chi tiết *</label>
            <Textarea
              rows={4}
              placeholder="Mô tả cụ thể sự cố hoặc đề xuất tính năng mới..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="font-bold gap-1.5">
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                  <span>Gửi Phản Hồi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
