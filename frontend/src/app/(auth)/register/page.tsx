'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

type AccountKind = 'patient' | 'doctor';

/** Hiệu ứng / timing dùng chung hai luồng đăng ký */
const ease = 'ease-out';
const dur = 'duration-200';
const durCard = 'duration-300';

const fieldInputClass = `w-full rounded-lg border-none bg-[#f3f4f5] px-4 py-3 text-[#191c1d] placeholder:text-[#c2c6d4] transition-[box-shadow,background-color] ${dur} ${ease} focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:ring-offset-0`;

const labelFieldClass =
  'block text-[0.75rem] font-bold uppercase tracking-wider text-[#424752]';

const btnPrimaryClass = `w-full rounded-lg bg-[#003f87] py-4 text-base font-bold text-white shadow-sm shadow-[#003f87]/12 transition-all ${dur} ${ease} hover:bg-[#0056b3] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#003f87] disabled:hover:shadow-sm disabled:active:scale-100`;

const cardElevatedClass = `overflow-hidden rounded-xl bg-white shadow-[0px_24px_48px_rgba(0,26,64,0.06)] transition-[box-shadow] ${durCard} ${ease} hover:shadow-[0px_28px_52px_rgba(0,26,64,0.09)]`;

const linkAccentClass = `font-semibold text-[#003f87] transition-colors ${dur} ${ease} hover:text-[#0056b3]`;

const AVATAR_PLACEHOLDER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBIo2fJtNAdfFq0puDBuRkEnUAFOHkjzBdeECD9WfhLbg47Bz8HK9KcVCEMDSz9JwAWHiwe7MxGYMauSU6mdMGttAUBxtIVcxTPTbtApFHxsRV2HaISaJv8DsjgpEuXKk8pYMy3BcQCP75X06_P5nnekzcWV3_vJxT-UAcF6pjPcPtW5pfJDcfl7OmsHcZZBsbFUl_URFUOXTFaeeYMBCWDba4ivZmQAINboXRP3y9i5r4U6Z9iRqOPCbQRhBAkIRF1qYWME6MojAI';

function RegisterSiteHeader() {
  return (
    <header className="fixed top-0 z-50 flex w-full max-w-full items-center justify-between border-b border-black/5 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md transition-colors duration-200">
      <div className="flex shrink-0 items-center gap-4">
        <Link className="text-xl font-bold tracking-tighter text-[#003f87]" href="/">
          Clinical Precision
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#003f87] transition-colors ${dur} ${ease} hover:bg-[#f3f4f5] hover:text-[#0056b3]`}
          type="button"
        >
          Help Center
        </button>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e7e8e9] ring-1 ring-black/5 transition-shadow duration-200 hover:ring-black/10">
          <img alt="Ảnh đại diện minh họa" className="h-full w-full object-cover" src={AVATAR_PLACEHOLDER} />
        </div>
      </div>
    </header>
  );
}

function TabBar({
  kind,
  onChange,
}: {
  kind: AccountKind;
  onChange: (k: AccountKind) => void;
}) {
  return (
    <div className="flex border-b border-[#e1e3e4]/80">
      <button
        className={`flex-1 py-4 text-center text-sm uppercase tracking-wide transition-colors ${dur} ${ease} ${
          kind === 'patient'
            ? 'border-b-2 border-blue-900 bg-white font-bold text-blue-900'
            : 'font-medium text-[#424752] hover:bg-[#f3f4f5]'
        }`}
        onClick={() => onChange('patient')}
        type="button"
      >
        Bệnh nhân
      </button>
      <button
        className={`flex-1 py-4 text-center text-sm uppercase tracking-wide transition-colors ${dur} ${ease} ${
          kind === 'doctor'
            ? 'border-b-2 border-blue-900 bg-white font-bold text-blue-900'
            : 'font-medium text-[#424752] hover:bg-[#f3f4f5]'
        }`}
        onClick={() => onChange('doctor')}
        type="button"
      >
        Bác sĩ
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AccountKind>('doctor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: apiSpecialties, isError: specialtiesLoadError } = useQuery({
    queryKey: ['register-specialties'],
    queryFn: () => authApi.specialties(),
    staleTime: 60_000,
  });

  const registerMutation = useMutation({
    mutationFn: () => {
      const base = {
        email,
        password,
        fullName: fullName.trim(),
        role: kind,
      } as Parameters<typeof authApi.register>[0];
      if (kind === 'doctor') {
        const sid = specialtyId ? Number(specialtyId) : undefined;
        return authApi.register({
          ...base,
          licenseNumber: licenseNumber.trim() || undefined,
          specialtyId: sid !== undefined && !Number.isNaN(sid) ? sid : undefined,
        });
      }
      const p = phone.trim();
      return authApi.register({
        ...base,
        phone: p ? p : undefined,
      });
    },
    onSuccess: async () => {
      const me = await usersApi.me();
      setSession({ user: me });
      syncAuthToLegacyStorage({ accessToken: null, user: me });
      router.push('/');
      router.refresh();
    },
  });

  const errorMessage =
    registerMutation.error instanceof Error
      ? registerMutation.error.message
      : registerMutation.isError
        ? 'Đăng ký thất bại'
        : null;

  const pwdMismatch = confirm.length > 0 && password !== confirm;

  const pickFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    setCertificateFile(files[0]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      pickFiles(e.dataTransfer.files);
    },
    [pickFiles],
  );

  const emailPlaceholder = kind === 'doctor' ? 'doctor@precision.vn' : 'example@precision.com';

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-[#191c1d]">
      <RegisterSiteHeader />

      <main
        className={`flex flex-grow items-center justify-center px-4 pt-24 ${kind === 'patient' ? 'pb-12' : 'pb-16'}`}
      >
        {kind === 'patient' ? (
          <div className="w-full max-w-md">
            <div className={cardElevatedClass}>
              <TabBar kind={kind} onChange={setKind} />
              <div className="space-y-6 p-8">
                <div>
                  <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#003f87]">Bắt đầu hành trình</h1>
                  <p className="text-pretty text-sm leading-relaxed text-[#424752]">
                    Đăng ký để truy cập hồ sơ bệnh án điện tử của bạn
                  </p>
                </div>

                {errorMessage ? (
                  <div
                    className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 transition-opacity ${dur} ${ease}`}
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pwdMismatch || password.length < 6) return;
                    registerMutation.mutate();
                  }}
                >
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="fullName">
                      Họ và Tên
                    </label>
                    <input
                      autoComplete="name"
                      className={fieldInputClass}
                      id="fullName"
                      minLength={2}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      value={fullName}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="email">
                      Email
                    </label>
                    <input
                      autoComplete="email"
                      className={fieldInputClass}
                      id="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@precision.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="phone">
                      Số điện thoại
                    </label>
                    <input
                      autoComplete="tel"
                      className={fieldInputClass}
                      id="phone"
                      inputMode="tel"
                      maxLength={20}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0123 456 789"
                      type="tel"
                      value={phone}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className={labelFieldClass} htmlFor="password">
                        Mật khẩu
                      </label>
                      <input
                        autoComplete="new-password"
                        className={fieldInputClass}
                        id="password"
                        minLength={6}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        type="password"
                        value={password}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelFieldClass} htmlFor="confirm">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        autoComplete="new-password"
                        className={`${fieldInputClass} ${pwdMismatch ? 'ring-2 ring-red-300' : ''}`}
                        id="confirm"
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        type="password"
                        value={confirm}
                      />
                      {pwdMismatch ? <p className="text-xs text-red-600">Mật khẩu không khớp.</p> : null}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      className={btnPrimaryClass}
                      disabled={registerMutation.isPending || pwdMismatch || password.length < 6}
                      type="submit"
                    >
                      {registerMutation.isPending ? 'Đang xử lý…' : 'Đăng ký tài khoản Bệnh nhân'}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="text-sm text-[#424752]">
                    Bạn đã có tài khoản?{' '}
                    <Link className={`${linkAccentClass} hover:underline`} href="/login">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-full bg-[#983c00] px-3 py-1 transition-transform ${dur} ${ease} hover:scale-[1.02]`}
              >
                <span
                  className="material-symbols-outlined text-[14px] text-[#ffc2a7]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  verified
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffc2a7]">
                  Bảo mật HIPAA
                </span>
              </div>
              <div
                className={`flex items-center gap-2 rounded-full bg-[#d7e2ff] px-3 py-1 transition-transform ${dur} ${ease} hover:scale-[1.02]`}
              >
                <span
                  className="material-symbols-outlined text-[14px] text-[#004491]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  lock
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#004491]">
                  Mã hóa đầu cuối
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-full max-w-xl ${cardElevatedClass}`}>
            <TabBar kind={kind} onChange={setKind} />
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#003f87]">
                  Đăng ký tài khoản Bác sĩ
                </h1>
                <p className="text-sm text-[#424752]">
                  Chào mừng bạn đến với hệ thống Precision Portal. Vui lòng cung cấp thông tin chuyên môn để bắt đầu
                  quá trình xác thực.
                </p>
              </div>

              {errorMessage ? (
                <div
                  className={`mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 transition-opacity ${dur} ${ease}`}
                  role="alert"
                >
                  {errorMessage}
                </div>
              ) : null}

              {specialtiesLoadError ? (
                <p className="mb-4 text-xs text-amber-800">
                  Không tải được danh sách chuyên khoa từ máy chủ. Bạn vẫn có thể đăng ký; chọn chuyên khoa sẽ bổ sung
                  sau khi kết nối API.
                </p>
              ) : null}

              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pwdMismatch || password.length < 6) return;
                  registerMutation.mutate();
                }}
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="doc-fullName">
                      Họ và Tên
                    </label>
                    <input
                      autoComplete="name"
                      className={fieldInputClass}
                      id="doc-fullName"
                      minLength={2}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      value={fullName}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="doc-email">
                      Email Chuyên môn
                    </label>
                    <input
                      autoComplete="email"
                      className={fieldInputClass}
                      id="doc-email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={emailPlaceholder}
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="specialty">
                      Chuyên khoa
                    </label>
                    <select
                      className={`${fieldInputClass} appearance-none`}
                      id="specialty"
                      onChange={(e) => setSpecialtyId(e.target.value)}
                      value={specialtyId}
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {apiSpecialties?.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelFieldClass} htmlFor="license">
                      Số Chứng chỉ Hành nghề
                    </label>
                    <input
                      className={fieldInputClass}
                      id="license"
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="123456/CCHN"
                      type="text"
                      value={licenseNumber}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelFieldClass} htmlFor="doc-password">
                    Mật khẩu
                  </label>
                  <input
                    autoComplete="new-password"
                    className={fieldInputClass}
                    id="doc-password"
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    type="password"
                    value={password}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelFieldClass} htmlFor="doc-confirm">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    autoComplete="new-password"
                    className={`${fieldInputClass} ${pwdMismatch ? 'ring-2 ring-red-300' : ''}`}
                    id="doc-confirm"
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    type="password"
                    value={confirm}
                  />
                  {pwdMismatch ? <p className="text-xs text-red-600">Mật khẩu không khớp.</p> : null}
                </div>

                <div className="space-y-3">
                  <span className={labelFieldClass}>Tải lên Chứng chỉ & Bằng cấp</span>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => pickFiles(e.target.files)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <div
                    className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c2c6d4]/80 bg-[#f3f4f5]/30 p-8 transition-all ${dur} ${ease} hover:border-[#0056b3]/40 hover:bg-[#f3f4f5] ${
                      dragActive ? 'border-[#0056b3] bg-[#d7e2ff]/50 ring-2 ring-[#0056b3]/20' : ''
                    }`}
                    onDragLeave={() => setDragActive(false)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDrop={onDrop}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d7e2ff] text-[#003f87] transition-transform ${dur} ${ease} group-hover:scale-105`}
                    >
                      <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                    </div>
                    <p className="text-center text-sm font-medium text-[#191c1d]">
                      Kéo và thả tệp tại đây hoặc{' '}
                      <span className="font-bold text-[#003f87]">chọn tệp</span>
                    </p>
                    <p className="mt-1 text-center text-xs text-[#424752]">
                      Định dạng hỗ trợ: PDF, JPG, PNG (Tối đa 10MB)
                    </p>
                    {certificateFile ? (
                      <p className="mt-3 max-w-full truncate text-center text-xs font-medium text-[#003f87]">
                        Đã chọn: {certificateFile.name}
                      </p>
                    ) : (
                      <p className="mt-2 text-center text-[11px] text-slate-500">
                        Tệp chỉ lưu trên trình duyệt trong phiên này; API tải lên sẽ được bổ sung sau.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  className={btnPrimaryClass}
                  disabled={registerMutation.isPending || pwdMismatch || password.length < 6}
                  type="submit"
                >
                  {registerMutation.isPending ? 'Đang xử lý…' : 'Đăng ký tài khoản Bác sĩ'}
                </button>
              </form>

              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#e1e3e4]/80 pt-8 md:flex-row">
                <p className="text-sm text-[#424752]">Bạn đã có tài khoản?</p>
                <Link
                  className={`group flex items-center gap-1 text-sm font-bold transition-colors ${dur} ${ease} hover:text-[#0056b3] text-[#003f87]`}
                  href="/login"
                >
                  Đăng nhập ngay
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform ${dur} ${ease} group-hover:translate-x-1`}
                  >
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer
        className={
          kind === 'patient'
            ? 'mt-auto flex w-full flex-col items-center justify-center space-y-4 bg-slate-50 py-8'
            : 'flex w-full flex-col items-center justify-center space-y-4 bg-[#f3f4f5]/50 py-8'
        }
      >
        <div className="flex flex-wrap justify-center gap-6 px-4 sm:gap-8">
          <a
            className={`text-[12px] font-medium uppercase tracking-wide text-slate-500 opacity-80 transition-[color,opacity] ${dur} ${ease} hover:text-blue-800 hover:opacity-100`}
            href="#"
          >
            Terms of Service
          </a>
          <a
            className={`text-[12px] font-medium uppercase tracking-wide text-slate-500 opacity-80 transition-[color,opacity] ${dur} ${ease} hover:text-blue-800 hover:opacity-100`}
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className={`text-[12px] font-medium uppercase tracking-wide text-slate-500 opacity-80 transition-[color,opacity] ${dur} ${ease} hover:text-blue-800 hover:opacity-100`}
            href="#"
          >
            HIPAA Compliance
          </a>
        </div>
        <p className="px-4 text-center text-[12px] font-medium tracking-wide text-slate-500">
          © 2024 Clinical Precision Framework. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
