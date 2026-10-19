'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faTriangleExclamation,
  faBan,
  faTrashCan,
  faCheck,
  faEyeSlash,
  faRotate,
  faUserSlash,
  faMessage,
  faUtensils,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ModerationReportItem {
  id: number;
  reporter_id: number;
  reporter_name: string | null;
  target_type: 'POST' | 'COMMENT';
  target_id: number;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  target_title_preview: string | null;
  total_reports_for_target: number;
}

interface ModerationManagerProps {
  adminId?: number;
}

export const ModerationManager: React.FC<ModerationManagerProps> = ({ adminId = 1 }) => {
  const [reports, setReports] = useState<ModerationReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'POST' | 'COMMENT'>('ALL');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/moderation/queue');
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load moderation queue:', e);
      toast.error('Lỗi khi tải hàng đợi kiểm duyệt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (
    reportId: number,
    action: 'DELETE_TARGET' | 'BAN_USER' | 'DISMISS' | 'RESOLVE'
  ) => {
    let confirmMsg = 'Xác nhận xử lý báo cáo này?';
    if (action === 'DELETE_TARGET') {
      confirmMsg = 'Bạn có chắc chắn muốn xóa/ẩn vĩnh viễn nội dung vi phạm này?';
    } else if (action === 'BAN_USER') {
      confirmMsg = 'Bạn có chắc chắn muốn KHÓA TÀI KHOẢN tác giả vi phạm và xóa nội dung?';
    } else if (action === 'DISMISS') {
      confirmMsg = 'Bỏ qua báo cáo này (coi như không vi phạm)?';
    }

    if (!confirm(confirmMsg)) return;

    try {
      setProcessingId(reportId);
      const res = await fetch('/api/moderation/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          admin_id: adminId,
          action,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'Xử lý thành công');
        // Remove handled report from pending queue
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        toast.error(data.message || 'Lỗi xử lý báo cáo');
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterType === 'POST') return r.target_type === 'POST';
    if (filterType === 'COMMENT') return r.target_type === 'COMMENT';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Moderation Policy Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <FontAwesomeIcon icon={faShieldHalved} className="text-amber-600 text-base mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">Quy chuẩn kiểm duyệt cộng đồng Bếp Việt (Cookpad UGC)</p>
          <p className="leading-relaxed text-muted-foreground">
            Hệ thống tự động kích hoạt chế độ <strong>Tạm ẩn bài viết/bình luận</strong> khi nhận từ <strong>3 báo cáo trở lên</strong>. Quản trị viên có toàn quyền thẩm định, gỡ bỏ nội dung độc hại hoặc khóa vĩnh viễn tài khoản người dùng vi phạm.
          </p>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-1">Bộ lọc:</span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Tất cả ({reports.length})
          </button>
          <button
            onClick={() => setFilterType('POST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'POST'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Công thức ({reports.filter((r) => r.target_type === 'POST').length})
          </button>
          <button
            onClick={() => setFilterType('COMMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'COMMENT'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Cooksnap / Bình luận ({reports.filter((r) => r.target_type === 'COMMENT').length})
          </button>
        </div>

        <Button onClick={fetchReports} variant="outline" size="sm" className="font-bold">
          <FontAwesomeIcon icon={faRotate} className="mr-1.5" />
          Làm mới hàng đợi
        </Button>
      </div>

      {/* Report Cards List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <Skeleton className="h-5 w-48 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-card border border-border text-muted-foreground text-xs">
          Tuyệt vời! Không có báo cáo vi phạm nào đang chờ xử lý trong hệ thống.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isAutoHidden = report.total_reports_for_target >= 3;
            const isProcessing = processingId === report.id;

            return (
              <div
                key={report.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isAutoHidden
                    ? 'bg-destructive/5 border-destructive/30'
                    : 'bg-card border-border shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Info details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          report.target_type === 'POST'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary/15 text-foreground border-secondary/30'
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={report.target_type === 'POST' ? faUtensils : faMessage}
                          className="mr-1 text-[9px]"
                        />
                        {report.target_type === 'POST' ? 'Công thức Món' : 'Cooksnap / Bình luận'}
                      </Badge>

                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-bold">
                        Lý do: {report.reason}
                      </Badge>

                      {isAutoHidden && (
                        <Badge className="bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 animate-pulse">
                          <FontAwesomeIcon icon={faEyeSlash} className="mr-1" />
                          Đã tự động ẩn ({report.total_reports_for_target} lượt báo cáo)
                        </Badge>
                      )}

                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        {new Date(report.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {/* Target Content Preview */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Nội dung bị báo cáo:
                      </span>
                      <p className="text-xs font-bold text-foreground line-clamp-2">
                        {report.target_title_preview || '(Nội dung không còn tồn tại hoặc chưa rõ)'}
                      </p>
                    </div>

                    {/* Reporter note */}
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Người báo cáo: </span>
                      {report.reporter_name || 'Người dùng ẩn danh'}
                      {report.description && (
                        <span className="italic block mt-0.5">
                          "Ghi chú: {report.description}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => handleAction(report.id, 'DISMISS')}
                      className="text-xs font-semibold h-8 cursor-pointer"
                      title="Báo cáo sai - Bỏ qua"
                    >
                      Bỏ qua
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => handleAction(report.id, 'DELETE_TARGET')}
                      className="text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30 h-8 cursor-pointer gap-1.5"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      <span>Xóa nội dung</span>
                    </Button>

                    <Button
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleAction(report.id, 'BAN_USER')}
                      className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 cursor-pointer gap-1.5"
                    >
                      <FontAwesomeIcon icon={faUserSlash} />
                      <span>Khóa tài khoản</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

