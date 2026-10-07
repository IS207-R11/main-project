'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faLock,
  faEnvelope,
  faArrowRightToBracket,
  faUserPlus,
  faMapMarkerAlt,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { validatePassword, getPasswordErrors, validateUsername, validateEmail } from '@/lib/validation';
import { PasswordInput } from '@/components/ui/password-input';
import { formatApiError } from '@/lib/errorMapping';

export const AuthDialog: React.FC = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useAuth();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPasswordErrors, setRegPasswordErrors] = useState<string[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLogin = loginUsername.trim();
    if (!trimmedLogin || !loginPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    if (/\s/.test(loginUsername)) {
      toast.error('Tên đăng nhập không được chứa khoảng trắng.');
      return;
    }

    if (Array.from(loginUsername).some((ch) => ch.charCodeAt(0) > 127)) {
      toast.error('Tên đăng nhập không được chứa ký tự có dấu hoặc unicode.');
      return;
    }

    try {
      setLoginLoading(true);
      await login({ username: trimmedLogin, password: loginPassword });
      toast.success('Đăng nhập thành công!');
      // Reset form
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: unknown) {
      const errorMsg = formatApiError(err, 'Đăng nhập');
      toast.error(errorMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameError = validateUsername(regUsername);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    const emailError = validateEmail(regEmail);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const pwdErrors = getPasswordErrors(regPassword);
    if (pwdErrors.length > 0) {
      setRegPasswordErrors(pwdErrors);
      toast.error('Mật khẩu sai');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setRegLoading(true);
      await register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        address: regAddress.trim() || undefined,
      });
      toast.success('Đăng ký tài khoản thành công!');
      // Reset form
      setRegUsername('');
      setRegEmail('');
      setRegAddress('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegPasswordErrors([]);
    } catch (err: unknown) {
      const errObj = err as any;
      if (errObj?.errors?.password && Array.isArray(errObj.errors.password)) {
        setRegPasswordErrors(errObj.errors.password);
      }
      const errorMsg = formatApiError(err, 'Đăng ký');
      toast.error(errorMsg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="p-6 bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="text-center space-y-1">
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            Tài Khoản Ăn Gì?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Đăng nhập để đồng bộ lịch sử ăn uống, quản lý món yêu thích và theo dõi hồ sơ sức khỏe
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={authModalTab}
          onValueChange={(val) => openAuthModal(val as 'login' | 'register')}
          className="w-full mt-4 space-y-5"
        >
          <UnderlineTabs
            layoutId="auth-dialog-tab-indicator"
            align="full"
            tabs={[
              {
                value: 'login',
                label: 'Đăng Nhập',
                icon: <FontAwesomeIcon icon={faArrowRightToBracket} />,
              },
              {
                value: 'register',
                label: 'Tạo Tài Khoản',
                icon: <FontAwesomeIcon icon={faUserPlus} />,
              },
            ]}
            activeTab={authModalTab}
            onChange={(val) => openAuthModal(val as 'login' | 'register')}
          />

          {/* SIGN IN TAB */}
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-muted-foreground text-[11px]" />
                  <span>Tên đăng nhập hoặc Email</span>
                </label>
                <Input
                  type="text"
                  placeholder="Nhập username hoặc email của bạn..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLock} className="text-muted-foreground text-[11px]" />
                  <span>Mật khẩu</span>
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 font-bold cursor-pointer"
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    <span>Đang đăng nhập...</span>
                  </span>
                ) : (
                  <span>Đăng Nhập Ngay</span>
                )}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Chưa có tài khoản? <span className="font-bold underline text-secondary">Đăng ký mới</span>
                </button>
              </div>
            </form>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-muted-foreground text-[11px]" />
                  <span>Tên đăng nhập *</span>
                </label>
                <Input
                  type="text"
                  placeholder="Chọn username độc nhất (không dấu, không khoảng trắng)..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faEnvelope} className="text-muted-foreground text-[11px]" />
                  <span>Email *</span>
                </label>
                <Input
                  type="email"
                  placeholder="example@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted-foreground text-[11px]" />
                  <span>Địa chỉ (tùy chọn)</span>
                </label>
                <Input
                  type="text"
                  placeholder="123 Nguyễn Huệ, Quận 1, TP. HCM"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  disabled={regLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLock} className="text-muted-foreground text-[11px]" />
                  <span>Mật khẩu *</span>
                </label>
                <PasswordInput
                  placeholder="Tối thiểu 8 ký tự..."
                  value={regPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegPassword(val);
                    if (regPasswordErrors.length > 0) {
                      setRegPasswordErrors(getPasswordErrors(val));
                    }
                  }}
                  disabled={regLoading}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>

                {regPasswordErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1.5 animate-in fade-in duration-200">
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <FontAwesomeIcon icon={faCircleExclamation} />
                      <span>Mật khẩu chưa đạt yêu cầu:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium pl-1">
                      {regPasswordErrors.map((errMsg, idx) => (
                        <li key={idx}>{errMsg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLock} className="text-muted-foreground text-[11px]" />
                  <span>Xác nhận mật khẩu *</span>
                </label>
                <PasswordInput
                  placeholder="Nhập lại mật khẩu..."
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 font-bold cursor-pointer"
              >
                {regLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    <span>Đang tạo tài khoản...</span>
                  </span>
                ) : (
                  <span>Tạo Tài Khoản</span>
                )}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Đã có tài khoản? <span className="font-bold underline text-secondary">Đăng nhập</span>
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
