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

interface NavItem {
  href: string;
  label: string;
  segment: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang Chủ", segment: null },
  { href: "/tai-nguyen", label: "Tài Nguyên", segment: "tai-nguyen" },
  { href: "/tai-lieu", label: "Tài Liệu", segment: "tai-lieu" },
];

export const Navbar: React.FC = () => {
  const segment = useSelectedLayoutSegment();
  const { period, themeMode, setThemeMode, currentTime } = useTimeTheme();
  const { savedFoods } = useSavedFoods();
  const { openSaved } = useSavedSheet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const CurrentPeriodIcon = periodIcons[period] || faSun;

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

          {/* Desktop Nav Links - Clean Navbar Style */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {NAV_ITEMS.map((item) => {
              const isActive = segment === item.segment;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-1 text-sm tracking-normal transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Saved Dishes Drawer Trigger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openSaved}
              className="relative flex items-center gap-1.5 text-xs font-semibold hover:bg-muted rounded-full px-3 text-foreground cursor-pointer"
              title="Món Đã Lưu"
            >
              <FontAwesomeIcon icon={faBookmark} className="text-secondary text-xs" />
              <span className="hidden sm:inline">Đã Lưu</span>
              {savedFoods.length > 0 && (
                <Badge
                  variant="default"
                  className="ml-0.5 h-4.5 min-w-4.5 px-1.5 text-[10px] bg-primary text-primary-foreground font-black rounded-full"
                >
                  {savedFoods.length}
                </Badge>
              )}
            </Button>

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
          <div className="md:hidden border-t border-border bg-card/95 px-4 py-4 backdrop-blur-md animate-in slide-in-from-top-2 space-y-2">
            <div className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = segment === item.segment;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
