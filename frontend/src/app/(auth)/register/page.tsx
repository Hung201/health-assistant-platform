'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { User, Mail, Stethoscope, BadgeIcon as Badge, Lock, CloudUpload, Activity } from 'lucide-react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

type AccountKind = 'patient' | 'doctor';

const ease = 'ease-out';
const dur = 'duration-200';
const durCard = 'duration-300';

const labelFieldClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2';

const btnPrimaryClass = `w-full rounded-xl bg-[#71d4c8] py-4 text-base font-bold text-white shadow-sm transition-all ${dur} ${ease} hover:bg-[#5bc2b6] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60`;

const cardElevatedClass = `overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 transition-all ${durCard} ${ease}`;

function InputWithIcon({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
        <Icon size={20} strokeWidth={2} />
      </div>
      <input
        {...props}
        className={`w-full rounded-xl border border-teal-100 bg-[#f4fcfb] pl-12 pr-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent ${props.className || ''}`}
      />
    </div>
  );
}

function SelectWithIcon({ icon: Icon, children, ...props }: any) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
        <Icon size={20} strokeWidth={2} />
      </div>
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-teal-100 bg-[#f4fcfb] pl-12 pr-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent ${props.className || ''}`}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
}

function RegisterSiteHeader() {
  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4">
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-500 text-white">
          <Activity size={18} />
        </div>
        <Link className="text-xl font-bold tracking-tight text-slate-800" href="/">
          Clinical Precision
        </Link>
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
    <div className="flex px-2 pt-2 border-b border-slate-100">
      <button
        className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center gap-2 transition-colors ${dur} ${ease} ${
          kind === 'patient'
            ? 'border-b-2 border-teal-500 text-teal-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
        onClick={() => onChange('patient')}
        type="button"
      >
        <User size={18} /> Bệnh nhân
      </button>
      <button
        className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center gap-2 transition-colors ${dur} ${ease} ${
          kind === 'doctor'
            ? 'border-b-2 border-teal-500 text-teal-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
        onClick={() => onChange('doctor')}
        type="button"
      >
        <Stethoscope size={18} /> Bác sĩ
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

  return (
    <div className="flex min-h-screen flex-col bg-[#eefaf8] font-sans">
      <RegisterSiteHeader />

      <main className="flex flex-grow items-center justify-center px-4 pt-20 pb-16">
        <div className={`w-full ${kind === 'doctor' ? 'max-w-3xl' : 'max-w-md'} ${cardElevatedClass}`}>
          <TabBar kind={kind} onChange={setKind} />
          
          <div className="p-8 md:p-12">
            <div className="mb-8 text-center md:text-left">
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-800">
                {kind === 'doctor' ? 'Đăng ký tài khoản Bác sĩ' : 'Bắt đầu hành trình'}
              </h1>
              <p className="text-slate-500 text-sm">
                {kind === 'doctor' 
                  ? 'Vui lòng cung cấp thông tin chuyên môn để bắt đầu quá trình xác thực' 
                  : 'Đăng ký để truy cập hồ sơ sức khỏe của bạn'}
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {errorMessage}
              </div>
            ) : null}

            {specialtiesLoadError && kind === 'doctor' ? (
              <p className="mb-4 text-xs text-amber-600">
                Không tải được danh sách chuyên khoa. Bạn vẫn có thể đăng ký và bổ sung sau.
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
              {kind === 'doctor' ? (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelFieldClass} htmlFor="doc-fullName">Họ và Tên</label>
                      <InputWithIcon 
                        icon={User}
                        id="doc-fullName"
                        placeholder="BS. Nguyễn Văn A"
                        required
                        value={fullName}
                        onChange={(e: any) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelFieldClass} htmlFor="doc-email">Email chuyên môn</label>
                      <InputWithIcon 
                        icon={Mail}
                        id="doc-email"
                        type="email"
                        placeholder="doctor@hospital.vn"
                        required
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelFieldClass} htmlFor="specialty">Chuyên khoa chính</label>
                      <SelectWithIcon 
                        icon={Stethoscope}
                        id="specialty"
                        value={specialtyId}
                        required
                        onChange={(e: any) => setSpecialtyId(e.target.value)}
                      >
                        <option value="">Chọn 1 chuyên khoa chính</option>
                        {apiSpecialties?.map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                      </SelectWithIcon>
                      <p className="mt-1 text-xs text-slate-500">Mỗi bác sĩ chỉ thuộc 1 chuyên khoa để đồng bộ lịch và báo cáo.</p>
                    </div>
                    <div>
                      <label className={labelFieldClass} htmlFor="license">Số chứng chỉ hành nghề</label>
                      <InputWithIcon 
                        icon={Badge}
                        id="license"
                        placeholder="VD: 123456/CCHN"
                        value={licenseNumber}
                        onChange={(e: any) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelFieldClass} htmlFor="doc-password">Mật khẩu</label>
                      <InputWithIcon 
                        icon={Lock}
                        id="doc-password"
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelFieldClass} htmlFor="doc-confirm">Xác nhận mật khẩu</label>
                      <InputWithIcon 
                        icon={Lock}
                        id="doc-confirm"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirm}
                        className={pwdMismatch ? 'ring-2 ring-red-400 border-transparent focus:ring-red-500' : ''}
                        onChange={(e: any) => setConfirm(e.target.value)}
                      />
                      {pwdMismatch && <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp.</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-500">attach_file</span>
                      <span className={labelFieldClass.replace('mb-2', '')}>Đính kèm chứng chỉ & bằng cấp</span>
                    </div>
                    
                    <input
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => pickFiles(e.target.files)}
                      ref={fileInputRef}
                      type="file"
                    />
                    <div
                      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-[#f4fcfb] py-10 px-4 transition-all ${dur} ${ease} hover:border-teal-400 hover:bg-teal-50 ${
                        dragActive ? 'border-teal-500 bg-teal-50 shadow-inner' : ''
                      }`}
                      onDragLeave={() => setDragActive(false)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600 transition-transform group-hover:-translate-y-1">
                        <CloudUpload size={28} />
                      </div>
                      <p className="text-center text-sm text-slate-600">
                        Kéo thả tệp vào đây hoặc <span className="font-bold text-teal-600">chọn tệp</span>
                      </p>
                      <p className="mt-1 text-center text-xs text-slate-400">
                        PDF, JPG, PNG — tối đa 10MB mỗi tệp
                      </p>
                      {certificateFile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-xl backdrop-blur-sm">
                          <p className="text-sm font-bold text-teal-700">Đã chọn: {certificateFile.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelFieldClass} htmlFor="fullName">Họ và Tên</label>
                    <InputWithIcon 
                      icon={User}
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      required
                      value={fullName}
                      onChange={(e: any) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelFieldClass} htmlFor="email">Email</label>
                    <InputWithIcon 
                      icon={Mail}
                      id="email"
                      type="email"
                      placeholder="example@precision.com"
                      required
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelFieldClass} htmlFor="phone">Số điện thoại</label>
                    <InputWithIcon 
                      icon={User} // Fallback icon since Phone wasn't imported
                      id="phone"
                      type="tel"
                      placeholder="0123 456 789"
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelFieldClass} htmlFor="password">Mật khẩu</label>
                    <InputWithIcon 
                      icon={Lock}
                      id="password"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelFieldClass} htmlFor="confirm">Xác nhận mật khẩu</label>
                    <InputWithIcon 
                      icon={Lock}
                      id="confirm"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={confirm}
                      className={pwdMismatch ? 'ring-2 ring-red-400 border-transparent focus:ring-red-500' : ''}
                      onChange={(e: any) => setConfirm(e.target.value)}
                    />
                    {pwdMismatch && <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp.</p>}
                  </div>
                </>
              )}

              <div className="pt-6">
                <button
                  className={btnPrimaryClass}
                  disabled={registerMutation.isPending || pwdMismatch || password.length < 6 || (kind === 'doctor' && !specialtyId)}
                  type="submit"
                >
                  {registerMutation.isPending ? 'Đang xử lý...' : `Đăng ký tài khoản ${kind === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
