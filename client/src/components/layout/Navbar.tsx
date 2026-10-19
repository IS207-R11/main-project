"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Image } from "@/components/ui/image";
import { useSelectedLayoutSegment } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDesktop,
  faBars,
  faXmark,
  faCheck,
  faSun,
  faMoon,
  faChevronDown,
  faBookOpen,
  faFileContract,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { useTimeTheme } from "@/context/TimeThemeContext";
import type { ThemeMode } from "@/context/TimeThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserNavMenu } from "@/components/auth/UserNavMenu";

const themeOptions: { mode: ThemeMode; label: string; icon: typeof faSun }[] = [
  { mode: "system", label: "Theo hệ thống", icon: faDesktop },
  { mode: "light", label: "Chế độ sáng", icon: faSun },
  { mode: "dark", label: "Chế độ tối", icon: faMoon },
];

export const Navbar: React.FC = () => {
  const segment = useSelectedLayoutSegment();
  const { themeMode, colorTheme, setThemeMode } = useTimeTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomeActive = segment === null;
  const isResourcesActive = segment === "tai-nguyen";
  const isGuideActive = segment === "huong-dan";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/90 backdrop-blur-md transition-all duration-300 shadow-xs">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 gap-3">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-102 group cursor-pointer shrink-0"
          >
            <Image
              src="/logos/main-logo.png"
              alt="Logo Ăn gì?"
              width={34}
              height={34}
              draggable={false}
              className="h-8 w-auto object-contain shrink-0 select-none"
              priority
            />
            <span className="font-heading font-black text-xl tracking-tight text-foreground flex items-center gap-0.5 leading-none">
              ĂN GÌ<span className="text-secondary text-2xl leading-none">?</span>
            </span>
          </Link>

          {/* Desktop Nav Links - Single Line & Compact */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* 1. Món Ngon Hệ Thống */}
            <Link
              href="/"
              className={`relative px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 cursor-pointer ${
                isHomeActive
                  ? "bg-primary/10 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Món Ngon Chuẩn Vị
            </Link>

            {/* 2. Mạng xã hội Ẩm thực (Cookpad style) */}
            <Link
              href="/cong-dong"
              className={`relative px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 cursor-pointer ${
                segment === "cong-dong"
                  ? "bg-primary/10 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Cộng Đồng Bếp Việt
            </Link>

            {/* 3. Mini-Games */}
            <Link
              href="/mini-games"
              className={`relative px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 cursor-pointer ${
                segment === "mini-games" || segment === "tinder"
                  ? "bg-primary/10 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              🎮 Mini-Games
            </Link>

            {/* 4. Kho Tàng */}
            <Link
              href="/tai-nguyen"
              className={`relative px-3 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 cursor-pointer ${
                isResourcesActive
                  ? "bg-primary/10 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Tra Cứu Món
            </Link>
          </nav>

          {/* Right Action Group - Sleek & Compact */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cookpad CTA: Đăng Món Mới */}
            <Link
              href="/cong-dong/tao-mon"
              className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs hover:shadow transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <span className="text-sm font-black leading-none">+</span>
              <span className="hidden sm:inline">Viết món mới</span>
            </Link>

            {/* Compact Theme Mode Switcher (Icon Button) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full border-border/80 bg-background/60 hover:bg-muted text-foreground cursor-pointer shrink-0"
                    title="Chế độ sáng / tối"
                  >
                    <FontAwesomeIcon
                      icon={colorTheme === "dark" ? faMoon : faSun}
                      className={colorTheme === "dark" ? "text-amber-400 text-xs" : "text-amber-500 text-xs"}
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-1.5 z-50">
                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Chế Độ Giao Diện
                </DropdownMenuLabel>
                {themeOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.mode}
                    onClick={() => setThemeMode(opt.mode)}
                    className="flex items-center justify-between text-xs font-semibold rounded-xl cursor-pointer py-1.5 px-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={opt.icon}
                        className={
                          opt.mode === "dark"
                            ? "text-amber-400 text-xs"
                            : opt.mode === "light"
                            ? "text-amber-500 text-xs"
                            : "text-primary text-xs"
                        }
                      />
                      <span>{opt.label}</span>
                    </div>
                    {themeMode === opt.mode && (
                      <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Account Nav Menu */}
            <UserNavMenu />

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-full size-8 text-foreground cursor-pointer shrink-0"
              aria-label="Menu điều hướng"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="text-sm" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 px-4 py-4 backdrop-blur-md animate-in slide-in-from-top-2 space-y-3">
            <div className="flex flex-col gap-1.5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  isHomeActive
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                🍲 Món Ngon Chuẩn Vị
              </Link>
              <Link
                href="/cong-dong"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  segment === "cong-dong"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                👥 Cộng Đồng Bếp Việt (Cookpad)
              </Link>
              <Link
                href="/mini-games"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  segment === "mini-games" || segment === "tinder"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                🎮 Mini-Games (Tinder & Gacha)
              </Link>
              <Link
                href="/tai-nguyen"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  isResourcesActive
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                🔍 Tra Cứu Món Ăn
              </Link>
              <Link
                href="/cong-dong/tao-mon"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 text-white"
              >
                ✍️ + Viết Món Mới
              </Link>

              {/* Guide Group Mobile */}
              <div className="pt-2 pb-1 space-y-1 border-t border-border/50 mt-1">
                <div className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Hướng Dẫn
                </div>
                <Link
                  href="/huong-dan/quy-dinh-dong-gop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl"
                >
                  <FontAwesomeIcon icon={faBookOpen} className="text-secondary text-xs" />
                  <span>Quy Định Đóng Góp</span>
                </Link>
                <Link
                  href="/huong-dan/dieu-khoan-su-dung"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl"
                >
                  <FontAwesomeIcon icon={faFileContract} className="text-primary text-xs" />
                  <span>Điều Khoản Sử Dụng</span>
                </Link>
                <Link
                  href="/huong-dan/chinh-sach-bao-mat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl"
                >
                  <FontAwesomeIcon icon={faUserShield} className="text-emerald-500 text-xs" />
                  <span>Chính Sách Bảo Mật</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

