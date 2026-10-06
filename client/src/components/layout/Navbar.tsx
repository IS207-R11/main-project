"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelectedLayoutSegment } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faBookmark,
  faBars,
  faXmark,
  faCheck,
  faSun,
  faMoon,
  faCloudSun,
  faCloudSunRain,
  faChevronDown,
  faBookOpen,
  faFileContract,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { useTimeTheme } from "@/context/TimeThemeContext";
import type { ThemeMode } from "@/context/TimeThemeContext";
import { useSavedFoods } from "@/context/SavedFoodsContext";
import { useSavedSheet } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserNavMenu } from "@/components/auth/UserNavMenu";

const timePeriodLabels: Record<string, string> = {
  morning: "Buổi Sáng",
  midday: "Buổi Trưa",
  afternoon: "Buổi Chiều",
  night: "Buổi Tối",
};

const timePeriodDetailLabels: Record<string, string> = {
  morning: "Buổi Sáng (05:00 - 10:59)",
  midday: "Buổi Trưa (11:00 - 13:59)",
  afternoon: "Buổi Chiều (14:00 - 17:59)",
  night: "Buổi Tối (18:00 - 04:59)",
};

const periodIcons: Record<string, typeof faSun> = {
  morning: faSun,
  midday: faCloudSun,
  afternoon: faCloudSunRain,
  night: faMoon,
};

export const Navbar: React.FC = () => {
  const segment = useSelectedLayoutSegment();
  const { period, themeMode, setThemeMode, currentTime } = useTimeTheme();
  const { savedFoods } = useSavedFoods();
  const { openSaved } = useSavedSheet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const CurrentPeriodIcon = periodIcons[period] || faSun;

  const isHomeActive = segment === null;
  const isResourcesActive = segment === "tai-nguyen";
  const isGuideActive = segment === "huong-dan";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/85 backdrop-blur-md transition-all duration-300 shadow-xs">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-102 group cursor-pointer"
          >
            <Image
              src="/logos/main-logo.png"
              alt="Logo Ăn gì?"
              width={40}
              height={40}
              draggable={false}
              className="h-10 w-auto object-contain shrink-0 select-none"
              priority
            />
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-foreground flex items-center gap-1.5 leading-none">
                ĂN GÌ <span className="text-secondary">?</span>
              </span>
              <span className="hidden sm:block text-[9.5px] text-muted-foreground font-semibold tracking-wider uppercase mt-1">
                Gợi Ý & Khám Phá Ẩm Thực
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Shared Style */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            {/* 1. Trang Chủ */}
            <Link
              href="/"
              className={`relative py-1 text-sm tracking-normal transition-all duration-200 cursor-pointer ${
                isHomeActive
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              Trang Chủ
              {isHomeActive && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>

            {/* 2. Tài Nguyên */}
            <Link
              href="/tai-nguyen"
              className={`relative py-1 text-sm tracking-normal transition-all duration-200 cursor-pointer ${
                isResourcesActive
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              Tài Nguyên
              {isResourcesActive && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>

            {/* 3. Hướng Dẫn (Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={`relative py-1 text-sm tracking-normal transition-all duration-200 cursor-pointer flex items-center gap-1.5 outline-none ${
                      isGuideActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    }`}
                  >
                    <span>Hướng Dẫn</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-muted-foreground/70" />
                    {isGuideActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                }
              />
              <DropdownMenuContent
                align="start"
                className="w-56 bg-card text-card-foreground border border-border shadow-xl rounded-2xl p-1.5"
              >
                <DropdownMenuItem
                  render={
                    <Link
                      href="/huong-dan/quy-dinh-dong-gop"
                      className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold cursor-pointer rounded-xl"
                    />
                  }
                >
                  <FontAwesomeIcon icon={faBookOpen} className="text-secondary text-xs shrink-0" />
                  <span>Quy Định Đóng Góp</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/huong-dan/dieu-khoan-su-dung"
                      className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold cursor-pointer rounded-xl"
                    />
                  }
                >
                  <FontAwesomeIcon icon={faFileContract} className="text-primary text-xs shrink-0" />
                  <span>Điều Khoản Sử Dụng</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/huong-dan/chinh-sach-bao-mat"
                      className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold cursor-pointer rounded-xl"
                    />
                  }
                >
                  <FontAwesomeIcon icon={faUserShield} className="text-emerald-500 text-xs shrink-0" />
                  <span>Chính Sách Bảo Mật</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 4. Đã Lưu */}
            <button
              type="button"
              onClick={openSaved}
              className="relative py-1 text-sm tracking-normal transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium outline-none"
              title="Món Đã Lưu"
            >
              <FontAwesomeIcon icon={faBookmark} className="text-secondary text-xs" />
              <span>Đã Lưu</span>
              {savedFoods.length > 0 && (
                <Badge
                  variant="default"
                  className="ml-0.5 h-4.5 min-w-4.5 px-1.5 text-[10px] bg-primary text-primary-foreground font-black rounded-full"
                >
                  {savedFoods.length}
                </Badge>
              )}
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Time-Theme Mode Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 border-border bg-card/60 text-xs font-semibold hover:bg-muted text-foreground cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={CurrentPeriodIcon}
                      className="text-secondary text-xs"
                    />
                    <span className="hidden sm:inline">
                      {timePeriodLabels[period] || period}
                    </span>
                    <span
                      suppressHydrationWarning
                      className="text-[11px] text-muted-foreground font-mono hidden md:inline"
                    >
                      {currentTime}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-60 bg-card text-card-foreground border border-border shadow-xl rounded-2xl p-1.5">
                <DropdownMenuLabel suppressHydrationWarning className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Chủ Đề Theo Giờ ({currentTime})
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setThemeMode("auto")}
                  className="flex items-center justify-between text-xs font-medium rounded-xl cursor-pointer py-2 px-2.5"
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                    <span>Tự Động (Theo Thời Gian)</span>
                  </div>
                  {themeMode === "auto" && (
                    <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border/60" />
                {(["morning", "midday", "afternoon", "night"] as ThemeMode[]).map((mode) => (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className="flex items-center justify-between text-xs font-medium rounded-xl cursor-pointer py-1.5 px-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={periodIcons[mode] || faSun}
                        className="text-secondary text-xs"
                      />
                      <span>{timePeriodDetailLabels[mode]}</span>
                    </div>
                    {themeMode === mode && (
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
              className="md:hidden rounded-full h-9 w-9 text-foreground cursor-pointer"
              aria-label="Menu điều hướng"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="text-base" />
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
                Trang Chủ
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
                Tài Nguyên
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

              {/* Saved Mobile */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSaved();
                }}
                className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors cursor-pointer text-left border-t border-border/50 pt-2"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBookmark} className="text-secondary text-xs" />
                  <span>Đã Lưu</span>
                </div>
                {savedFoods.length > 0 && (
                  <Badge className="px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground font-black rounded-full">
                    {savedFoods.length}
                  </Badge>
                )}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

