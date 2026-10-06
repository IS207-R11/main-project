'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { foodsApi, uploadApi } from '@/api';
import { FoodCard } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
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
import { Image } from '@/components/ui/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faCloudArrowUp,
  faPaste,
  faTrashCan,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

interface CreateFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (food: FoodCard) => void;
}

const FIVE_MB = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

export const CreateFoodModal: React.FC<CreateFoodModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSizeMB, setFileSizeMB] = useState<string>('0');

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('');

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setFileSizeMB('0');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  // Luồng xác thực ảnh phía Client
  const processSelectedFile = useCallback((file: File) => {
    // 1. Xác thực người dùng
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập tài khoản để có thể chọn và tải ảnh lên.');
      openAuthModal('login');
      return;
    }

    // 2. Xác thực kiểu file (chỉ được phép là ảnh)
    const isImageMime = file.type.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(file.type);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(fileExt || '');

    if (!isImageMime || !isAllowedExt) {
      toast.error('Định dạng tập tin không hợp lệ. Chỉ được phép tải lên file hình ảnh (PNG, JPG, JPEG, WEBP, GIF, SVG, AVIF).');
      handleClearImage();
      return;
    }

    // 3. Xác thực kích thước từ dưới 5MB
    if (file.size >= FIVE_MB) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`Dung lượng ảnh (${sizeMB} MB) vượt quá giới hạn 5MB. Vui lòng chọn ảnh có kích thước dưới 5MB.`);
      handleClearImage();
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSizeMB(sizeInMB);
    setSelectedFile(file);

    // Tạo preview
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, [isAuthenticated, openAuthModal, handleClearImage]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Hỗ trợ dán ảnh bằng Ctrl + V
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processSelectedFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [open, processSelectedFile]);

  // Giải phóng URL đối tượng khi unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Xác thực người dùng
    if (!isAuthenticated) {
      onOpenChange(false);
      openAuthModal('login');
      return;
    }

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên món ăn.');
      return;
    }

    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả món ăn.');
      return;
    }

    if (!selectedFile) {
      toast.error('Vui lòng chọn hình ảnh cho món ăn.');
      return;
    }

    // Xác thực lại kích thước file nếu có chọn ảnh
    if (selectedFile.size >= FIVE_MB) {
      toast.error('Dung lượng ảnh phải dưới 5MB. Vui lòng chọn lại ảnh hợp lệ.');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl: string | undefined = undefined;

      // STEP 1: Upload ảnh lên Server Backend (xử lý qua Cloudinary)
      setStatusText('Đang tải ảnh lên máy chủ Cloudinary...');
      const uploadRes = await uploadApi.uploadImage(selectedFile);
      finalImageUrl = uploadRes.data?.secure_url || uploadRes.data?.url;

      if (!finalImageUrl) {
        toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // STEP 2: Tạo món ăn trong hệ thống backend
      setStatusText('Đang lưu thông tin món ăn vào hệ thống...');
      const createdFoodRes = await foodsApi.create({
        name: name.trim(),
        description: description.trim(),
        image_url: finalImageUrl,
      });

      toast.success('Món ăn đã được tạo thành công! Đang chờ duyệt.');
      setStatusText('');

      if (onSuccess && createdFoodRes.data) {
        onSuccess(createdFoodRes.data);
      }

      setTimeout(() => {
        setName('');
        setDescription('');
        handleClearImage();
        onOpenChange(false);
      }, 800);
    } catch (err: unknown) {
      console.error('Lỗi quy trình tạo món:', err);
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo món ăn';
      toast.error(msg);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faUtensils} className="text-secondary" />
            <span>Đóng Góp Món Ăn Mới</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thêm món ăn mới vào kho tàng AnGi. Món mới tạo sẽ được gửi duyệt với trạng thái PENDING.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Bạn cần đăng nhập tài khoản để có thể đóng góp món ăn và tải ảnh lên hệ thống.
            </p>
            <Button
              onClick={() => {
                onOpenChange(false);
                openAuthModal('login');
              }}
              className="font-bold gap-2 text-xs"
            >
              <FontAwesomeIcon icon={faArrowRightToBracket} />
              <span>Đăng Nhập Ngay</span>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Food Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Tên món ăn <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: Phở bò tái lăn, Bún chả Hà Nội..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Food Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Mô tả món ăn <span className="text-destructive">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Mô tả hương vị, nguồn gốc hoặc đặc điểm hấp dẫn của món..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Image Upload Area with Paste Support */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                  Hình ảnh món ăn <span className="text-destructive">*</span>
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                  <FontAwesomeIcon icon={faPaste} className="text-secondary" />
                  <span>Hỗ trợ bấm Ctrl + V để dán ảnh</span>
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/avif"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={loading}
              />

              {previewUrl ? (
                <div className="relative rounded-2xl border border-border overflow-hidden bg-muted/30 p-2">
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black/5">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleClearImage}
                      disabled={loading}
                      className="absolute top-2 right-2 h-7 px-2 text-xs font-bold shadow-md rounded-lg"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="mr-1" />
                      Xóa ảnh
                    </Button>
                  </div>
                  <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Đã chọn ảnh: <strong>{selectedFile?.name}</strong></span>
                    <span>Dung lượng: <strong>{fileSizeMB} MB</strong> (hợp lệ &lt; 5MB)</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSelectedFile(file);
                  }}
                  className="border-2 border-dashed border-border hover:border-secondary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 space-y-2"
                >
                  <div className="size-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto text-lg">
                    <FontAwesomeIcon icon={faCloudArrowUp} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Bấm để chọn ảnh từ thiết bị
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      hoặc nhấn <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[10px] font-mono">Ctrl + V</kbd> để dán ảnh trực tiếp từ clipboard
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Chỉ chấp nhận file hình ảnh (PNG, JPG, WEBP, GIF, SVG). Dung lượng tối đa <strong>dưới 5MB</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground italic truncate max-w-[200px]">
                {statusText}
              </span>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="font-bold gap-1.5">
                  {loading ? (
                    <>
                      <Spinner />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
                      <span>Đăng Món Mới</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
