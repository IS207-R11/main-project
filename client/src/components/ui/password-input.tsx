'use client';

import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from 'cn';

export interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  containerClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          className={cn('pr-9', className)}
          data-slot="password-input"
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={togglePasswordVisibility}
          className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus:outline-none"
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? (
            <EyeOff className="size-4 select-none" aria-hidden="true" />
          ) : (
            <Eye className="size-4 select-none" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
