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
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md transition-all duration-300 shadow-xs">
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
                className="w-56 bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-1.5 z-50"
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
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Mode Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 border-border bg-card/60 text-xs font-semibold hover:bg-muted text-foreground cursor-pointer"
                    title="Chế độ sáng/tối"
                  >
                    <FontAwesomeIcon
                      icon={colorTheme === "dark" ? faMoon : faSun}
                      className={colorTheme === "dark" ? "text-amber-400 text-xs" : "text-amber-500 text-xs"}
                    />
                    <span className="hidden sm:inline">
                      {themeMode === "system" ? "Hệ thống" : themeMode === "dark" ? "Tối" : "Sáng"}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52 bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-1.5 z-50">
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Chế Độ Sáng/Tối
                </DropdownMenuLabel>
                {themeOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.mode}
                    onClick={() => setThemeMode(opt.mode)}
                    className="flex items-center justify-between text-xs font-medium rounded-xl cursor-pointer py-2 px-2.5"
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
            </div>
          </div>
        )}
      </header>
    </>
  );
};

