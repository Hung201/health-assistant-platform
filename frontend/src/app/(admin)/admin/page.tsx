const PENDING_ARTICLES = [
  {
    title: 'Ảnh hưởng của AI trong chẩn đoán hình ảnh',
    category: 'Công nghệ Y tế',
    doctor: 'BS. Nguyễn Văn A',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkg1sGcFkCF-bCr-LAdbOU5MuxthSyFJxMAZ-9jSER2Pb39OAqU2pk75gpnxd5A5Xy5uB7J6kmSIeGxol32Zz6nNkfM4lTa-58ESFdxoFOC3grCz9u53sVVGMGqzuAT8rIszEuXorl65cqoPz-5dC-nIDlJ6PBmqwYYD_ieFuPWSjo-QkBNiZmhzk7hDHun82JsoDG8ze--3DwCdUScrM8Y_8R3AqnIkyQc2s86bM4E7XgPj76bgq3PUsGNdldbI0j0wQ2u1nqdeOw',
    date: '20/10/2023',
  },
  {
    title: 'Cách phòng ngừa đột quỵ ở người trẻ',
    category: 'Tim mạch',
    doctor: 'BS. Lê Thị B',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEFh5mdi5VjKh_ZtRiJR-IvPGKejzi1-i0SJCN4W_G9Z6jM_FBa6Cbj88z-hkcfcxUtNxY-A4dftFAnPKRgLc4yLhao9yCNMQq9xE98o6fSMoV8zuSXeHRnofIbNkB_fgEpEhKXXjyr2nNQog87hfSEnR3mruglFttIuXwyjQYGBgPpfRNLIIF3vC6P5SuUIW0MfJ04F3p16lH2_Ys1lDfiCPM2kEsRQTOR_HTFqToH2b18PrsxN7Ho8-BvCmQwyXess_U7ci-0BO7',
    date: '19/10/2023',
  },
  {
    title: 'Chế độ dinh dưỡng cho bệnh nhân tiểu đường',
    category: 'Nội tiết',
    doctor: 'BS. Phạm Văn C',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtOhpx9CiryRlJjxlWqt7nHeAj_bp1H8U63BlATHM7fJNOvdXcZMnntAabh7Y-8zJ1ijyjSEWr2C8fh-T9kKi9W1U1g7KOFz1VmFupWqCh0usssP15Qf8NDp8t1GAybV1TGzrvtKjA2gRbXoynQRoXGJW_lmNxN9xpwT4PulfEouktFDN-ZUxVYl9ZZN0iTOhFklEH0xpWRHRPaUd4kEJ-R19VZEJKT_m71Tyc6K9DWK0bneJTXFShpTTAgo-XyTgvUYaWuXyL2DH2',
    date: '18/10/2023',
  },
];

const SPECIALTIES = [
  { name: 'Tim mạch', count: '12 BS', icon: 'cardiology', wrap: 'bg-blue-100', iconClass: 'text-blue-600' },
  { name: 'Tâm thần học', count: '8 BS', icon: 'psychiatry', wrap: 'bg-green-100', iconClass: 'text-green-600' },
  { name: 'Thần kinh', count: '15 BS', icon: 'neurology', wrap: 'bg-red-100', iconClass: 'text-red-600' },
  { name: 'Nhi khoa', count: '24 BS', icon: 'pediatrics', wrap: 'bg-yellow-100', iconClass: 'text-yellow-600' },
];

export default function AdminDashboardPage() {
  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bảng điều khiển tổng quan</h2>
          <p className="text-sm text-slate-500">
            Chào mừng quay trở lại, đây là những gì đang diễn ra hôm nay.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-sm text-slate-400">search</span>
            <input
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tìm kiếm dữ liệu..."
              type="search"
            />
          </div>
          <button
            className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600"
            type="button"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2.5 top-2 size-2 rounded-full border-2 border-white bg-red-500" />
          </button>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-blue-50 p-2 text-primary">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <span className="flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-500">
              +12.5%
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">Tổng người dùng</p>
          <h3 className="text-2xl font-bold">12,840</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <span className="flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-500">
              +24.8%
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">Tổng lượt dùng AI</p>
          <h3 className="text-2xl font-bold">45,200</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <span className="flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-500">
              -2.1%
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">Tỷ lệ đặt lịch thành công</p>
          <h3 className="text-2xl font-bold">88.5%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Biểu đồ tăng trưởng người dùng</h4>
            <select className="rounded-lg border border-slate-200 bg-transparent py-1 text-xs">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          <div className="flex h-64 flex-col justify-end">
            <svg className="h-48 w-full" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="adminUserChartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0066cc" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,120 Q50,110 80,130 T160,80 T240,100 T320,40 T400,60 V150 H0 Z"
                fill="url(#adminUserChartGradient)"
              />
              <path
                d="M0,120 Q50,110 80,130 T160,80 T240,100 T320,40 T400,60"
                fill="none"
                stroke="#0066cc"
                strokeWidth="3"
              />
            </svg>
            <div className="mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-400">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Danh mục chuyên khoa</h4>
            <button className="text-xs font-bold text-primary hover:underline" type="button">
              + Thêm mới
            </button>
          </div>
          <div className="space-y-4">
            {SPECIALTIES.map((s) => (
              <div
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                key={s.name}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-full ${s.wrap}`}>
                    <span className={`material-symbols-outlined text-sm ${s.iconClass}`}>{s.icon}</span>
                  </div>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <span className="text-xs text-slate-400">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h4 className="font-bold text-slate-900">Bài viết chờ duyệt từ Bác sĩ</h4>
          <button
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
            type="button"
          >
            Xem tất cả
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Tiêu đề bài viết</th>
                <th className="px-6 py-4">Bác sĩ</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PENDING_ARTICLES.map((row) => (
                <tr className="transition-colors hover:bg-slate-50" key={row.title}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{row.title}</span>
                      <span className="text-xs text-slate-400">{row.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img alt="" className="size-6 rounded-full" height={24} src={row.avatar} width={24} />
                      <span className="text-sm">{row.doctor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{row.date}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-700">
                      Chờ duyệt
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg p-1.5 text-primary transition-colors hover:bg-blue-50"
                        title="Xem chi tiết"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50"
                        title="Duyệt bài"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
