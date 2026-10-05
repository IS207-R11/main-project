'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightToBracket,
  faHeartPulse,
  faBookOpen,
  faShieldHalved,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

export const UserNavMenu: React.FC = () => {
  const { user, isAuthenticated, isLoading, isAdmin, isModerator, openAuthModal, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="size-8 rounded-full bg-muted/60 animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => openAuthModal('login')}
        className="font-bold text-xs gap-1.5 rounded-full border-border/80 hover:border-secondary cursor-pointer"
      >
        <FontAwesomeIcon icon={faArrowRightToBracket} className="text-secondary text-xs" />
        <span className="hidden sm:inline">Đăng Nhập</span>
      </Button>
    );
  }

  const roleBadgeColor =
    user.role === 'ADMIN'
      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
      : user.role === 'MODERATOR'
        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';

  const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/80 transition-colors cursor-pointer outline-none">
            <Avatar className="size-8 border border-border">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.username} />}
              <AvatarFallback className="bg-secondary/20 text-secondary font-bold text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-foreground hidden lg:inline-block max-w-[90px] truncate">
              {user.username}
            </span>
          </button>
        }
      />

      <DropdownMenuContent align="end" className="w-56 p-2 bg-popover text-popover-foreground border border-border shadow-2xl">
        <DropdownMenuLabel className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-foreground truncate">{user.username}</span>
            <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
              {user.role}
            </Badge>
          </div>
          {user.email && (
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/profile" className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold cursor-pointer" />}>
          <FontAwesomeIcon icon={faHeartPulse} className="text-rose-500 text-xs shrink-0" />
          <span>Hồ Sơ Sức Khỏe & Cá Nhân</span>
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/nhat-ky" className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold cursor-pointer" />}>
          <FontAwesomeIcon icon={faBookOpen} className="text-amber-500 text-xs shrink-0" />
          <span>Nhật Ký Ăn Uống & Calo</span>
        </DropdownMenuItem>

        {(isAdmin || isModerator) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/admin" className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold text-primary cursor-pointer" />}>
              <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-xs shrink-0" />
              <span>Cổng Quản Trị ({user.role})</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="w-full flex items-center gap-2.5 p-2 text-xs font-semibold text-destructive focus:text-destructive cursor-pointer"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="text-xs shrink-0" />
          <span>Đăng Xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
