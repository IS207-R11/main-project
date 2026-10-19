'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const VIOLATION_REASONS = [
  'Spam / Quảng cáo',
  'Ngôn từ đả kích / Thù địch',
  'Nội dung không liên quan đến ẩm thực',
  'Hình ảnh phản cảm',
  'Công thức nguy hiểm / Độc hại',
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  targetTitle?: string;
  reporterId: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  reporterId,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(VIOLATION_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.info(data.message || 'Báo cáo vi phạm đã được gửi đến ban quản trị.');
        onClose();
        setDescription('');
      } else {
        toast.error(data.message || 'Lỗi khi gửi báo cáo.');
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi báo cáo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card text-foreground rounded-3xl border border-border shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto text-lg">
            <FontAwesomeIcon icon={faFlag} />
          </div>
          <DialogTitle className="text-xl font-extrabold text-center">
            Báo Cáo Vi Phạm
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-center">
            Báo cáo {targetType === 'POST' ? 'bài viết' : 'bình luận'}{' '}
            {targetTitle ? `"${targetTitle}"` : ''} vi phạm tiêu chuẩn cộng đồng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">Chọn lý do vi phạm:</Label>
            <div className="space-y-1.5">
              {VIOLATION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    selectedReason === r
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-primary"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Mô tả thêm (nếu có):</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm chi tiết để ban quản trị xử lý nhanh chóng..."
              rows={3}
              className="rounded-xl text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="rounded-xl">
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

