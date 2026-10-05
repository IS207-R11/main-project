'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/api/types';
import { Spinner } from '@/components/ui/spinner';
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
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
