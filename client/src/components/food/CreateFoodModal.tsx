'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/utils/supabase/client';
import { foodsApi } from '@/api';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faCloudArrowUp,
  faPaste,
  faTriangleExclamation,
  faTrashCan,
  faCheck,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

interface CreateFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (food: FoodCard) => void;
}

const FIVE_MB = 5 * 1024 * 1024;

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
  const [isOver5MB, setIsOver5MB] = useState(false);
  const [originalSizeMB, setOriginalSizeMB] = useState<string>('0');

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle file selection
  const processSelectedFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn hoặc dán định dạng file hình ảnh (PNG, JPG, WEBP, v.v.)');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    const sizeInMB = file.size / (1024 * 1024);
    setOriginalSizeMB(sizeInMB.toFixed(2));
    setIsOver5MB(file.size > FIVE_MB);

    // Create preview
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Handle Ctrl + V (Paste image)
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

  // Clean up preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClearImage = () => {
    setSelectedFile(null);
    setIsOver5MB(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isAuthenticated) {
      onOpenChange(false);
      openAuthModal('login');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên món ăn');
      return;
    }

    setLoading(true);
    let uploadedFilePath: string | null = null;
    let targetBucket = 'storage';
    const supabase = createClient();

    try {
      let finalImageUrl: string | undefined = undefined;

      // STEP 1: Upload image to Supabase if file selected
      if (selectedFile) {
        let fileToUpload = selectedFile;

        // If file > 5MB, compress it
        if (selectedFile.size > FIVE_MB) {
          setStatusText(`Đang nén ảnh từ ${originalSizeMB}MB về dưới 5MB...`);
          const compressionOptions = {
            maxSizeMB: 4.8,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(selectedFile, compressionOptions);
        }

        setStatusText('Đang tải ảnh lên Supabase Storage...');

        // Try 'storage' bucket, or fallback to first available bucket
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          if (buckets && buckets.length > 0) {
            const hasStorageBucket = buckets.some((b) => b.name === 'storage');
            if (!hasStorageBucket) {
              targetBucket = buckets[0].name;
            }
          }
        } catch (bucketErr) {
          console.warn('Could not list buckets, defaulting to storage:', bucketErr);
        }

        const fileExt = fileToUpload.name.split('.').pop() || 'png';
        const cleanName = name
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_');
        const fileName = `${Date.now()}_${cleanName || 'food'}.${fileExt}`;
        const filePath = `foods/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Lỗi tải ảnh lên Supabase: ${uploadError.message}`);
        }

        uploadedFilePath = filePath;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      // STEP 2: Insert into server backend (PUT /foods)
      setStatusText('Đang lưu thông tin món ăn vào hệ thống...');
      const createdFoodRes = await foodsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: finalImageUrl,
      });

      setSuccessMessage('Món ăn đã được tạo thành công! Đang chờ duyệt.');
      setStatusText('');

      if (onSuccess && createdFoodRes.data) {
        onSuccess(createdFoodRes.data);
      }

      setTimeout(() => {
        setName('');
        setDescription('');
        handleClearImage();
        setSuccessMessage(null);
        onOpenChange(false);
      }, 1200);
    } catch (err: unknown) {
      console.error('Lỗi quy trình tạo món:', err);

      // STEP 3: ROLLBACK - If server insertion fails, delete uploaded image from Supabase storage
      if (uploadedFilePath) {
        try {
          setStatusText('Đang hoàn tác: xóa ảnh khỏi Supabase storage...');
          await supabase.storage.from(targetBucket).remove([uploadedFilePath]);
        } catch (cleanupErr) {
          console.error('Lỗi khi xóa ảnh rollback khỏi Supabase:', cleanupErr);
        }
      }

      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo món ăn';
      setErrorMessage(msg);
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
              Bạn cần đăng nhập tài khoản để có thể đóng góp món ăn mới vào hệ thống.
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
            {errorMessage && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-destructive/15 text-destructive border border-destructive/30">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <FontAwesomeIcon icon={faCheck} />
                <span>{successMessage}</span>
              </div>
            )}

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
              <label className="text-xs font-semibold text-foreground">Mô tả món ăn</label>
              <Textarea
                rows={3}
                placeholder="Mô tả hương vị, nguồn gốc hoặc đặc điểm hấp dẫn của món..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Image Upload Area with Paste Support */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Hình ảnh món ăn</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                  <FontAwesomeIcon icon={faPaste} className="text-secondary" />
                  <span>Hỗ trợ bấm Ctrl + V để dán ảnh</span>
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={loading}
              />

              {previewUrl ? (
                <div className="relative rounded-2xl border border-border overflow-hidden bg-muted/30 p-2">
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black/5">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
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

                  {/* 5MB Warning note */}
                  {isOver5MB && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] flex items-start gap-2">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
                      <span>
                        Dung lượng ảnh hiện tại là <strong>{originalSizeMB} MB</strong> (vượt quá 5MB).
                        Hệ thống sẽ <strong>tự động nén về dưới 5MB</strong> khi tải lên để tối ưu tốc độ.
                      </span>
                    </div>
                  )}
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
                    Hỗ trợ PNG, JPG, WEBP. Ảnh lớn hơn 5MB sẽ được nén tự động.
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
