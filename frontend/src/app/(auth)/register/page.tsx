'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

type AccountKind = 'patient' | 'doctor';

const ease = 'ease-out';
const dur = 'duration-200';
const durCard = 'duration-300';

const fieldInputClass = `w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pl-10 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] ${dur} ${ease} focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`;
const selectClass = `w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pl-10 text-slate-900 transition-[border-color,box-shadow] ${dur} ${ease} focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none`;

const labelFieldClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1';

const btnPrimaryClass = `w-full rounded-lg bg-primary py-3.5 text-base font-bold text-white shadow-sm transition-all ${dur} ${ease} hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary disabled:hover:shadow-sm disabled:active:scale-100`;

const cardElevatedClass = `overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-200/50 transition-[box-shadow] ${durCard} ${ease}`;

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 text-slate-900 font-sans p-4">
      <div className={`w-full max-w-[600px] ${cardElevatedClass}`}>
        <div className="flex border-b border-slate-100 p-2">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm transition-all ${dur} ${ease} ${
              kind === 'patient'
                ? 'bg-primary/5 font-bold text-primary shadow-sm'
                : 'font-medium text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setKind('patient')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Bệnh nhân
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm transition-all ${dur} ${ease} ${
              kind === 'doctor'
                ? 'bg-primary/5 font-bold text-primary shadow-sm'
                : 'font-medium text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setKind('doctor')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">stethoscope</span>
            Bác sĩ
          </button>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
              Đăng ký tài khoản {kind === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}
            </h1>
            <p className="text-sm text-slate-500">
              {kind === 'doctor'
                ? 'Vui lòng cung cấp thông tin chuyên môn để bắt đầu quá trình xác thực'
                : 'Điền thông tin bên dưới để bắt đầu quản lý hồ sơ y tế của bạn'}
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

          {specialtiesLoadError && kind === 'doctor' ? (
            <p className="mb-4 text-xs text-amber-600">
              Không tải được danh sách chuyên khoa từ máy chủ. Bạn có thể bổ sung sau.
            </p>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (pwdMismatch || password.length < 6) return;
              registerMutation.mutate();
            }}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelFieldClass} htmlFor="fullName">
                  Họ và Tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <input
                    autoComplete="name"
                    className={fieldInputClass}
                    id="fullName"
                    minLength={2}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={kind === 'doctor' ? 'BS. Nguyễn Văn A' : 'Nguyễn Văn A'}
                    required
                    value={fullName}
                  />
                </div>
              </div>
              <div>
                <label className={labelFieldClass} htmlFor="email">
                  {kind === 'doctor' ? 'Email chuyên môn' : 'Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    autoComplete="email"
                    className={fieldInputClass}
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={kind === 'doctor' ? 'doctor@hospital.vn' : 'example@gmail.com'}
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>
            </div>

            {kind === 'doctor' ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelFieldClass} htmlFor="specialty">
                    Chuyên khoa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">medical_information</span>
                    </div>
                    <select
                      className={selectClass}
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
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelFieldClass} htmlFor="license">
                    Số Chứng chỉ hành nghề
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                    <input
                      className={fieldInputClass}
                      id="license"
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="VD: 123456/CCHN"
                      type="text"
                      value={licenseNumber}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelFieldClass} htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </div>
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
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelFieldClass} htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <input
                    autoComplete="new-password"
                    className={fieldInputClass}
                    id="password"
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>
              <div>
                <label className={labelFieldClass} htmlFor="confirm">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </div>
                  <input
                    autoComplete="new-password"
                    className={`${fieldInputClass} ${pwdMismatch ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                    id="confirm"
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    type="password"
                    value={confirm}
                  />
                </div>
                {pwdMismatch ? <p className="mt-1 text-xs text-red-500 font-medium">Mật khẩu không khớp.</p> : null}
              </div>
            </div>

            {kind === 'doctor' && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">attach_file</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đính kèm chứng chỉ & Bằng cấp</span>
                </div>
                
                <input
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => pickFiles(e.target.files)}
                  ref={fileInputRef}
                  type="file"
                />
                <div
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 transition-all ${dur} ${ease} hover:bg-primary/10 ${
                    dragActive ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : ''
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
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <p className="text-center text-sm text-slate-600 font-medium">
                    Kéo thả tệp vào đây hoặc <span className="font-bold text-primary">chọn tệp</span>
                  </p>
                  <p className="mt-1 text-center text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                    PDF, JPG, PNG — Tối đa 10MB
                  </p>
                  {certificateFile && (
                    <div className="mt-4 bg-white px-3 py-1.5 rounded text-xs font-medium text-primary shadow-sm max-w-full truncate">
                      {certificateFile.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                className={btnPrimaryClass}
                disabled={registerMutation.isPending || pwdMismatch || password.length < 6}
                type="submit"
              >
                {registerMutation.isPending ? 'Đang xử lý…' : `Đăng ký tài khoản ${kind === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}`}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Đã có tài khoản?{' '}
              <Link className="font-bold text-primary hover:underline transition-colors" href="/login">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
