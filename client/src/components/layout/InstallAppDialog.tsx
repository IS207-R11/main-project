"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faMobileScreenButton,
  faDesktop,
  faCheck,
  faShareFromSquare,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstallAppDialog: React.FC<InstallAppDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/logos/main-logo.png"
              alt="Logo Ăn gì?"
              width={56}
              height={70}
              draggable={false}
              className="h-16 w-auto object-contain select-none"
            />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Cài Đặt Ứng Dụng Ăn Gì?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Trải nghiệm &ldquo;Ăn gì?&rdquo; mượt mà, khởi chạy tức thì trên điện thoại và máy tính mà không cần qua kho ứng dụng.
          </DialogDescription>
        </DialogHeader>

        {isInstalled ? (
          <div className="py-4 text-center space-y-3 bg-muted/40 rounded-2xl p-4 border border-border/40">
            <div className="w-10 h-10 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-lg" />
            </div>
            <p className="text-sm font-bold text-foreground">
              Ứng dụng đã được cài đặt trên thiết bị của bạn!
            </p>
            <p className="text-xs text-muted-foreground">
              Bạn có thể mở &ldquo;Ăn gì?&rdquo; trực tiếp từ màn hình chính bất cứ lúc nào.
            </p>
          </div>
        ) : deferredPrompt ? (
          <div className="py-2 space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center space-y-2">
              <span className="text-xs font-semibold text-primary block">
                ✦ Sẵn sàng cài đặt chỉ với 1 chạm
              </span>
              <p className="text-xs text-muted-foreground">
                Nhấn nút bên dưới để thêm Ăn gì? vào thiết bị của bạn ngay lập tức.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleInstallClick}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:brightness-105 shadow-lg transition-transform active:scale-98"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Cài Đặt Ngay
            </Button>
          </div>
        ) : isIOS ? (
          /* iOS Step-by-Step Instructions */
          <div className="py-2 space-y-3">
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/60 space-y-2.5 text-xs text-foreground">
              <span className="font-bold flex items-center gap-1.5 text-primary uppercase text-[11px] tracking-wider">
                <FontAwesomeIcon icon={faMobileScreenButton} />
                Hướng dẫn cài đặt trên iPhone / iPad:
              </span>
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground leading-relaxed">
                <li>
                  Mở trình duyệt <strong>Safari</strong> trên thiết bị.
                </li>
                <li>
                  Chạm vào biểu tượng <strong>Chia sẻ</strong>{" "}
                  <FontAwesomeIcon
                    icon={faShareFromSquare}
                    className="inline mx-0.5 text-foreground"
                  />{" "}
                  ở thanh công cụ phía dưới.
                </li>
                <li>
                  Cuộn xuống và chọn{" "}
                  <span className="font-semibold text-foreground">
                    &ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)
                  </span>{" "}
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="inline mx-0.5 text-foreground"
                  />
                  .
                </li>
                <li>
                  Nhấn <strong className="text-foreground">&ldquo;Thêm&rdquo; (Add)</strong> ở góc trên bên phải để hoàn tất.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Android / Desktop Instructions */
          <div className="py-2 space-y-3">
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/60 space-y-2.5 text-xs text-foreground">
              <span className="font-bold flex items-center gap-1.5 text-primary uppercase text-[11px] tracking-wider">
                <FontAwesomeIcon icon={faDesktop} />
                Cách thêm vào thiết bị:
              </span>
              <ul className="space-y-2 text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>
                    Trên Chrome / Edge: Nhấn biểu tượng <strong>Cài đặt (Install App)</strong>{" "}
                    trên thanh địa chỉ trình duyệt.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>
                    Trên điện thoại Android: Mở menu <strong>⋮</strong> và chọn{" "}
                    <strong>&ldquo;Cài đặt ứng dụng&rdquo;</strong> hoặc{" "}
                    <strong>&ldquo;Thêm vào màn hình chính&rdquo;</strong>.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold px-5"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
