'use client';

import { useMemo, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';
import { User, Phone, Calendar, Heart, MapPin, Briefcase, Camera, Save, AlertCircle } from 'lucide-react';

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        {icon} {label}
      </div>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#003f87] focus:bg-white focus:ring-4 focus:ring-[#003f87]/10 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400"
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function PatientProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initial = useMemo(() => {
    const p = user?.patientProfile ?? null;
    return {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      dateOfBirth: user?.dateOfBirth ?? '',
      gender: user?.gender ?? '',
      emergencyContactName: p?.emergencyContactName ?? '',
      emergencyContactPhone: p?.emergencyContactPhone ?? '',
      addressLine: p?.addressLine ?? '',
      provinceCode: p?.provinceCode ?? '',
      districtCode: p?.districtCode ?? '',
      wardCode: p?.wardCode ?? '',
      occupation: p?.occupation ?? '',
      bloodType: p?.bloodType ?? '',
    };
  }, [user]);

  const [form, setForm] = useState(initial);

  if (
    form.fullName === '' &&
    initial.fullName !== '' &&
    user?.fullName &&
    savedAt == null
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setForm(initial);
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#003f87]">Hồ sơ cá nhân</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Cập nhật thông tin y tế và thông tin liên hệ của bạn để có trải nghiệm tốt nhất.</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full mt-4 sm:mt-0 inline-flex items-center gap-1.5">
          <User size={14} /> ID: {user?.id}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" />
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50">
                  {user?.avatarUrl ? (
                    <img alt="Avatar" className="w-full h-full object-cover" src={user.avatarUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-teal-600 bg-teal-50">
                       {user?.fullName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <Camera size={24} />
                  <input
                    className="hidden"
                    disabled={uploading}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setError(null);
                      setUploading(true);
                      try {
                        await usersApi.uploadAvatar(file);
                        const me = await usersApi.me();
                        setSession({ user: me });
                        toast.show({ variant: 'success', title: 'Thành công', message: 'Đã cập nhật ảnh đại diện.' });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Upload thất bại');
                        toast.show({ variant: 'error', title: 'Thất bại', message: 'Không thể cập nhật ảnh đại diện.' });
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                     <div className="w-6 h-6 border-2 border-teal-600 border-r-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{form.fullName || 'Người dùng'}</h3>
              <p className="text-sm font-medium text-slate-500 mb-4">{user?.email}</p>
              
              <div className="w-full h-px bg-slate-100 my-4"></div>
              
              <div className="w-full space-y-3 text-left">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Nhóm máu</span>
                    <span className="font-bold text-rose-600 px-2.5 py-0.5 bg-rose-50 rounded-md">{form.bloodType || 'Chưa cập nhật'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Bảo mật</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><ShieldCheck size={14}/> An toàn</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-teal-50 rounded-[2rem] border border-teal-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-teal-800 mb-2">
                 <AlertCircle size={18} />
                 <h4 className="font-bold">Lưu ý bảo mật</h4>
              </div>
              <p className="text-sm text-teal-700/80 font-medium leading-relaxed">
                 Thông tin y tế của bạn được mã hóa an toàn và chỉ chia sẻ với các Bác sĩ điều trị khi bạn đặt lịch khám.
              </p>
           </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            
            {/* General Info */}
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                 <User className="text-teal-600" /> Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Họ và tên"
                  icon={<User size={14} />}
                  value={form.fullName}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, fullName: v }))}
                  placeholder="Nhập họ và tên đầy đủ"
                />
                <Field
                  label="Số điện thoại"
                  icon={<Phone size={14} />}
                  value={form.phone}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                  placeholder="09xxxxxxxx"
                />
                <Field
                  label="Ngày sinh"
                  icon={<Calendar size={14} />}
                  type="date"
                  value={form.dateOfBirth}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, dateOfBirth: v }))}
                />
                <label className="block">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User size={14} /> Giới tính
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#003f87] focus:bg-white focus:ring-4 focus:ring-[#003f87]/10 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving}
                    value={form.gender}
                    onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}
                  >
                    <option value="">— Chọn giới tính —</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                    <option value="unknown">Không muốn trả lời</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Medical Info */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                 <Heart className="text-rose-500" /> Chỉ số sức khỏe
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Nhóm máu"
                  icon={<Heart size={14} />}
                  value={form.bloodType}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, bloodType: v }))}
                  placeholder="Ví dụ: O+, A-, AB..."
                />
                <Field
                  label="Nghề nghiệp"
                  icon={<Briefcase size={14} />}
                  value={form.occupation}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, occupation: v }))}
                  placeholder="Nghề nghiệp hiện tại"
                />
              </div>
            </div>

            {/* Location Info */}
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                 <MapPin className="text-blue-500" /> Địa chỉ liên hệ
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Địa chỉ nhà"
                    icon={<MapPin size={14} />}
                    value={form.addressLine}
                    disabled={saving}
                    onChange={(v) => setForm((s) => ({ ...s, addressLine: v }))}
                    placeholder="Số nhà, tên đường..."
                  />
                </div>
                <Field
                  label="Mã Tỉnh / Thành phố"
                  value={form.provinceCode}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, provinceCode: v }))}
                  placeholder="Ví dụ: 01"
                />
                <Field
                  label="Mã Quận / Huyện"
                  value={form.districtCode}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, districtCode: v }))}
                  placeholder="Ví dụ: 001"
                />
                <Field
                  label="Mã Phường / Xã"
                  value={form.wardCode}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, wardCode: v }))}
                  placeholder="Ví dụ: 00001"
                />
              </div>
            </div>

            {/* Emergency Info */}
            <div className="p-8 bg-rose-50/30">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                 <AlertCircle className="text-rose-500" /> Liên hệ khẩn cấp
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Họ tên người liên hệ"
                  icon={<User size={14} />}
                  value={form.emergencyContactName}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, emergencyContactName: v }))}
                  placeholder="Tên người thân"
                />
                <Field
                  label="Số điện thoại khẩn cấp"
                  icon={<Phone size={14} />}
                  value={form.emergencyContactPhone}
                  disabled={saving}
                  onChange={(v) => setForm((s) => ({ ...s, emergencyContactPhone: v }))}
                  placeholder="Số điện thoại"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-slate-500">
                {savedAt ? (
                  <span className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck size={16} /> Đồng bộ hóa lúc {new Date(savedAt).toLocaleTimeString()}
                  </span>
                ) : 'Đảm bảo thông tin của bạn luôn được cập nhật chính xác.'}
              </div>
              <button
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#003f87] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#003f87]/20 transition-all hover:bg-[#002b5e] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:transform-none"
                disabled={saving}
                type="button"
                onClick={async () => {
                  setError(null);
                  setSaving(true);
                  try {
                    const payload = {
                      fullName: form.fullName.trim(),
                      phone: form.phone.trim() || null,
                      dateOfBirth: form.dateOfBirth || null,
                      gender: form.gender || null,
                      patientProfile: {
                        emergencyContactName: form.emergencyContactName.trim() || null,
                        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
                        addressLine: form.addressLine.trim() || null,
                        provinceCode: form.provinceCode.trim() || null,
                        districtCode: form.districtCode.trim() || null,
                        wardCode: form.wardCode.trim() || null,
                        occupation: form.occupation.trim() || null,
                        bloodType: form.bloodType.trim() || null,
                      },
                    };
                    const res = await usersApi.updateMe(payload);
                    setSession({ user: res.user });
                    setSavedAt(Date.now());
                    toast.show({ variant: 'success', title: 'Đã lưu', message: 'Hồ sơ đã được cập nhật thành công.' });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Lưu thất bại');
                    toast.show({ variant: 'error', title: 'Thất bại', message: 'Không thể lưu hồ sơ. Vui lòng thử lại.' });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <>
                     <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></div>
                     Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
