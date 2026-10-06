'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faArrowRightToBracket, faHouse } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-6 rounded-3xl bg-card border border-border shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto text-secondary text-2xl">
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Yêu Cầu Xác Thực</h2>
        <p className="text-xs text-muted-foreground">
          Khu vực quản trị yêu cầu bạn phải đăng nhập tài khoản có thẩm quyền (Quản trị viên hoặc Điều hành viên).
        </p>
        <Button onClick={() => openAuthModal('login')} className="font-bold gap-2">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <span>Đăng Nhập</span>
        </Button>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto text-destructive text-2xl">
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không Có Quyền Truy Cập (403)</h2>
        <p className="text-xs text-muted-foreground">
          Tài khoản <strong>{user.username}</strong> mang quyền <strong>{user.role}</strong>, không đủ thẩm quyền để truy cập trang quản trị này.
        </p>
        <Button variant="outline" render={<Link href="/" className="gap-2 font-bold" />}>
          <FontAwesomeIcon icon={faHouse} />
          <span>Trở Về Trang Chủ</span>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
