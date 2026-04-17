'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

type AccountKind = 'patient' | 'doctor';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AccountKind>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
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
      return authApi.register({ ...base, phone: p ? p : undefined });
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
    setCertificateFiles((prev) => [...prev, ...Array.from(files)]);
  }, []);

  const removeFile = (idx: number) => {
    setCertificateFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      pickFiles(e.dataTransfer.files);
    },
    [pickFiles],
  );

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className={`auth-card ${kind === 'doctor' ? 'auth-card--register-doc' : 'auth-card--register'}`}>
        {/* brand */}
        <Link className="auth-brand" href="/">
          <span className="auth-brand-icon material-symbols-outlined">clinical_notes</span>
          <span className="auth-brand-name">Clinical Precision</span>
        </Link>

        {/* tab bar */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${kind === 'patient' ? 'auth-tab--active' : ''}`}
            onClick={() => setKind('patient')}
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
            Bệnh nhân
          </button>
          <button
            className={`auth-tab ${kind === 'doctor' ? 'auth-tab--active' : ''}`}
            onClick={() => setKind('doctor')}
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>stethoscope</span>
            Bác sĩ
          </button>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">
            {kind === 'patient' ? 'Tạo tài khoản Bệnh nhân' : 'Đăng ký tài khoản Bác sĩ'}
          </h1>
          <p className="auth-subtitle">
            {kind === 'patient'
              ? 'Đăng ký để truy cập hồ sơ sức khỏe và đặt lịch khám nhanh chóng'
              : 'Vui lòng cung cấp thông tin chuyên môn để bắt đầu quá trình xác thực'}
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error" role="alert">{errorMessage}</div>
        )}

        {kind === 'doctor' && specialtiesLoadError && (
          <div className="auth-warning">
            Không tải được danh sách chuyên khoa. Bạn vẫn có thể đăng ký, chọn chuyên khoa sẽ bổ sung sau.
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (pwdMismatch || password.length < 6) return;
            registerMutation.mutate();
          }}
        >
          {/* ─── PATIENT FIELDS ─── */}
          {kind === 'patient' && (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">Họ và Tên</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">badge</span>
                  <input className="auth-input" id="fullName" autoComplete="name" minLength={2}
                    onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A"
                    required value={fullName} />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">mail</span>
                  <input className="auth-input" id="email" autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    required type="email" value={email} />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="phone">Số điện thoại</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">phone</span>
                  <input className="auth-input" id="phone" autoComplete="tel" inputMode="tel"
                    maxLength={20} onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123 456 789" type="tel" value={phone} />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Mật khẩu</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">lock</span>
                  <input className="auth-input" id="password" autoComplete="new-password"
                    minLength={6} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự" required type="password" value={password} />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="confirm">Xác nhận mật khẩu</label>
                <div className={`auth-input-wrap ${pwdMismatch ? 'auth-input-wrap--error' : ''}`}>
                  <span className="auth-input-icon material-symbols-outlined">lock</span>
                  <input className="auth-input" id="confirm" autoComplete="new-password"
                    onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                    required type="password" value={confirm} />
                </div>
                {pwdMismatch && <p className="auth-field-error">Mật khẩu không khớp</p>}
              </div>
            </>
          )}

          {/* ─── DOCTOR FIELDS ─── */}
          {kind === 'doctor' && (
            <>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="doc-fullName">Họ và Tên</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon material-symbols-outlined">badge</span>
                    <input className="auth-input" id="doc-fullName" autoComplete="name" minLength={2}
                      onChange={(e) => setFullName(e.target.value)} placeholder="BS. Nguyễn Văn A"
                      required value={fullName} />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="doc-email">Email chuyên môn</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon material-symbols-outlined">mail</span>
                    <input className="auth-input" id="doc-email" autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)} placeholder="doctor@hospital.vn"
                      required type="email" value={email} />
                  </div>
                </div>
              </div>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="specialty">Chuyên khoa</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon material-symbols-outlined">medical_information</span>
                    <select className="auth-input auth-select" id="specialty"
                      onChange={(e) => setSpecialtyId(e.target.value)} value={specialtyId}>
                      <option value="">Chọn chuyên khoa</option>
                      {apiSpecialties?.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="license">Số chứng chỉ hành nghề</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon material-symbols-outlined">verified</span>
                    <input className="auth-input" id="license"
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="VD: 123456/CCHN" type="text" value={licenseNumber} />
                  </div>
                </div>
              </div>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="doc-password">Mật khẩu</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon material-symbols-outlined">lock</span>
                    <input className="auth-input" id="doc-password" autoComplete="new-password"
                      minLength={6} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự" required type="password" value={password} />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="doc-confirm">Xác nhận mật khẩu</label>
                  <div className={`auth-input-wrap ${pwdMismatch ? 'auth-input-wrap--error' : ''}`}>
                    <span className="auth-input-icon material-symbols-outlined">lock</span>
                    <input className="auth-input" id="doc-confirm" autoComplete="new-password"
                      onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                      required type="password" value={confirm} />
                  </div>
                  {pwdMismatch && <p className="auth-field-error">Mật khẩu không khớp</p>}
                </div>
              </div>

              {/* ─── FILE UPLOAD ─── */}
              <div className="auth-field">
                <label className="auth-label">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>attach_file</span>
                  {' '}Đính kèm chứng chỉ &amp; bằng cấp
                </label>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="auth-file-hidden"
                  onChange={(e) => pickFiles(e.target.files)}
                  ref={fileInputRef}
                  type="file"
                  multiple
                />
                <div
                  className={`auth-dropzone ${dragActive ? 'auth-dropzone--active' : ''}`}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="auth-dropzone-icon">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p className="auth-dropzone-text">
                    Kéo thả tệp vào đây hoặc <strong>chọn tệp</strong>
                  </p>
                  <p className="auth-dropzone-hint">PDF, JPG, PNG — tối đa 10MB mỗi tệp</p>
                </div>

                {certificateFiles.length > 0 && (
                  <div className="auth-file-list">
                    {certificateFiles.map((f, i) => (
                      <div className="auth-file-item" key={`${f.name}-${i}`}>
                        <span className="material-symbols-outlined auth-file-item-icon">
                          {f.type.startsWith('image/') ? 'image' : 'description'}
                        </span>
                        <span className="auth-file-item-name">{f.name}</span>
                        <span className="auth-file-item-size">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          className="auth-file-item-remove"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          type="button"
                          aria-label="Xóa tệp"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            className="auth-submit"
            disabled={registerMutation.isPending || pwdMismatch || password.length < 6}
            type="submit"
          >
            {registerMutation.isPending ? (
              <>
                <span className="auth-spinner" />
                Đang xử lý…
              </>
            ) : (
              kind === 'patient' ? 'Đăng ký tài khoản Bệnh nhân' : 'Đăng ký tài khoản Bác sĩ'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link className="auth-link-accent" href="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
