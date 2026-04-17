/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authApi, doctorsApi } from '@/lib/api';
import type { PublicDoctorCard } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

/* ─────────── Icon mapping for specialties ─────────── */
const SPECIALTY_ICONS: Record<string, string> = {
  'noi-tong-quat': 'cardiology',
  'tim-mach': 'favorite',
  'nhi-khoa': 'child_care',
  'ngoai-khoa': 'surgical',
  'da-lieu': 'dermatology',
  'than-kinh': 'neurology',
  'mat': 'visibility',
  'san-phu-khoa': 'pregnant_woman',
  'xuong-khop': 'skeleton',
  'tai-mui-hong': 'hearing',
  'rang-ham-mat': 'dentistry',
};
function getSpecIcon(slug: string) {
  return SPECIALTY_ICONS[slug] || 'medical_services';
}

/* ─────────── Static blog data (no public API yet) ─────────── */
const articles = [
  {
    tag: 'AI & Sức khỏe',
    title: 'Tương lai của chẩn đoán ứng dụng công nghệ trí tuệ nhân tạo trong y tế',
    excerpt: 'Khám phá cách AI đang thay đổi ngành y tế và mang lại chẩn đoán chính xác hơn cho bệnh nhân.',
    image: '/images/blog-1.png',
  },
  {
    tag: 'Dinh dưỡng',
    title: '5 thói quen giúp cải thiện hệ miễn dịch vào mùa đông',
    excerpt: 'Những thay đổi nhỏ trong thói quen hàng ngày có thể tạo nên sự khác biệt lớn cho sức khỏe.',
    image: '/images/blog-2.png',
  },
  {
    tag: 'Sức khỏe',
    title: 'Khám sức khỏe định kỳ tổng quát — phát hiện bệnh sớm',
    excerpt: 'Tại sao việc khám định kỳ mỗi năm lại quan trọng và bạn cần chuẩn bị những gì.',
    image: '/images/blog-3.png',
  },
];

/* ─────────── Component ─────────── */

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  // ── Fetch specialties from DB ──
  const { data: specialties = [] } = useQuery({
    queryKey: ['home-specialties'],
    queryFn: () => authApi.specialties(),
    staleTime: 5 * 60_000,
  });

  // ── Fetch top doctors from DB ──
  const { data: doctorsData } = useQuery({
    queryKey: ['home-doctors'],
    queryFn: () => doctorsApi.list({ limit: 4 }),
    staleTime: 5 * 60_000,
  });
  const doctors: PublicDoctorCard[] = doctorsData?.items ?? [];

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  return (
    <div className="page">
      {/* ═══════ HEADER ═══════ */}
      <header className="hdr">
        <div className="hdr-inner">
          <Link className="hdr-brand" href="/">
            <span className="hdr-brand-icon material-symbols-outlined">clinical_notes</span>
            <span className="hdr-brand-name">Clinical Precision</span>
          </Link>

          <nav className="hdr-nav">
            <a href="#specialties">Chuyên khoa</a>
            <a href="#doctors">Bác sĩ</a>
            <a href="#blog">Blog</a>
          </nav>

          <div className="hdr-cta">
            {user ? (
              <>
                <Link className="hdr-link" href={appHref}>Vào ứng dụng</Link>
                <button
                  className="hdr-btn-fill"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </button>
              </>
            ) : (
              <>
                <Link className="hdr-link" href="/login">Đăng nhập</Link>
                <Link className="hdr-btn-fill" href="/register">Đăng ký</Link>
              </>
            )}
          </div>

          <button className="hdr-burger" aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <main>
        {/* ═══════ HERO / AI BANNER ═══════ */}
        <section className="hero">
          <div className="hero-bg">
            <Image
              src="/images/hero-banner.png"
              alt="AI Health"
              fill
              priority
              className="hero-bg-img"
            />
            <div className="hero-overlay" />
          </div>

          <div className="hero-content">
            <span className="hero-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
              Được hỗ trợ bởi AI
            </span>
            <h1 className="hero-title">
              Chẩn đoán sức khỏe<br />
              <em>thông minh</em> với AI
            </h1>
            <p className="hero-desc">
              Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu,
              tìm bác sĩ phù hợp và đặt lịch khám nhanh chóng.
            </p>

            <div className="hero-actions">
              <Link className="hero-btn-primary" href="/patient/ai-assistant">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
                Thử phân tích với AI
              </Link>
              <Link className="hero-btn-ghost" href="#specialties">
                Khám phá chuyên khoa
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{doctorsData?.total ?? '—'}</strong>
                <span>Bác sĩ uy tín</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>{specialties.length || '—'}</strong>
                <span>Chuyên khoa</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>98%</strong>
                <span>Hài lòng</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ SPECIALTIES (from DB) ═══════ */}
        <section className="sec specialties" id="specialties">
          <div className="sec-inner">
            <p className="sec-eyebrow">Chuyên khoa</p>
            <h2 className="sec-heading">Tìm bác sĩ theo chuyên khoa</h2>
            <p className="sec-sub">Đội ngũ bác sĩ trải rộng trên nhiều lĩnh vực, sẵn sàng hỗ trợ bạn.</p>

            <div className="spec-grid">
              {specialties.map((s) => (
                <Link href={`/patient/doctors?specialty=${s.slug}`} className="spec-item" key={s.id}>
                  <span className="spec-icon material-symbols-outlined">{getSpecIcon(s.slug)}</span>
                  <div>
                    <span className="spec-name">{s.name}</span>
                  </div>
                </Link>
              ))}
              {specialties.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)', fontSize: '.875rem' }}>
                  Đang tải chuyên khoa...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══════ DOCTORS (from DB) ═══════ */}
        <section className="sec docs" id="doctors">
          <div className="sec-inner">
            <div className="sec-row">
              <div>
                <p className="sec-eyebrow">Bác sĩ ưu tú</p>
                <h2 className="sec-heading">Đội ngũ chuyên gia hàng đầu</h2>
              </div>
              <Link href="/patient/doctors" className="sec-see-all">
                Xem tất cả
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>

            <div className="doc-grid">
              {doctors.map((doc) => (
                <article className="doc-card" key={doc.userId}>
                  <div className="doc-img-wrap">
                    {doc.avatarUrl ? (
                      <Image
                        src={doc.avatarUrl}
                        alt={doc.fullName}
                        width={320}
                        height={400}
                        className="doc-img"
                      />
                    ) : (
                      <div className="doc-avatar-placeholder">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                  </div>
                  <div className="doc-info">
                    <h3 className="doc-name">
                      {doc.professionalTitle ? `${doc.professionalTitle} ` : ''}
                      {doc.fullName}
                    </h3>
                    <span className="doc-spec">
                      {doc.specialties?.map(s => s.name).join(', ') || 'Đa khoa'}
                    </span>
                    {doc.workplaceName && (
                      <span className="doc-workplace">{doc.workplaceName}</span>
                    )}
                    <span className="doc-fee">
                      {Number(doc.consultationFee).toLocaleString('vi-VN')}đ / lượt
                    </span>
                  </div>
                </article>
              ))}
              {doctors.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)', fontSize: '.875rem' }}>
                  Đang tải danh sách bác sĩ...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══════ BLOG (static for now) ═══════ */}
        <section className="sec blog" id="blog">
          <div className="sec-inner">
            <div className="sec-center">
              <p className="sec-eyebrow">Blog Y Khoa</p>
              <h2 className="sec-heading">Kiến thức sức khỏe &amp; Cộng đồng</h2>
              <p className="sec-sub">Cập nhật những thông tin y khoa mới nhất từ đội ngũ chuyên gia.</p>
            </div>

            <div className="blog-grid">
              {articles.map((a) => (
                <article className="blog-card" key={a.title}>
                  <div className="blog-img-wrap">
                    <Image
                      src={a.image}
                      alt={a.title}
                      width={420}
                      height={260}
                      className="blog-img"
                    />
                  </div>
                  <div className="blog-body">
                    <span className="blog-tag">{a.tag}</span>
                    <h3 className="blog-title">{a.title}</h3>
                    <p className="blog-excerpt">{a.excerpt}</p>
                    <a href="#" className="blog-read">Đọc thêm →</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="ft">
        <div className="ft-inner">
          <div className="ft-top">
            <div className="ft-brand">
              <div className="hdr-brand" style={{ marginBottom: 12 }}>
                <span className="hdr-brand-icon material-symbols-outlined">clinical_notes</span>
                <span className="hdr-brand-name" style={{ color: '#fff' }}>Clinical Precision</span>
              </div>
              <p className="ft-desc">
                Nền tảng chăm sóc sức khỏe thông minh — hỗ trợ bạn chẩn đoán, đặt lịch khám
                và quản lý sức khỏe toàn diện bằng AI.
              </p>
            </div>
            <div className="ft-col">
              <h4>Nền tảng</h4>
              <a href="#">Chẩn đoán AI</a>
              <a href="#">Đặt lịch khám</a>
              <a href="#">Tư vấn trực tuyến</a>
              <a href="#">Hồ sơ sức khỏe</a>
            </div>
            <div className="ft-col">
              <h4>Về chúng tôi</h4>
              <a href="#">Giới thiệu</a>
              <a href="#">Đội ngũ bác sĩ</a>
              <a href="#">Chính sách bảo mật</a>
              <a href="#">Điều khoản sử dụng</a>
            </div>
            <div className="ft-col">
              <h4>Hỗ trợ</h4>
              <a href="#">Trung tâm trợ giúp</a>
              <a href="#">Liên hệ</a>
              <a href="#">Câu hỏi thường gặp</a>
            </div>
          </div>
          <div className="ft-bottom">
            <p>© 2025 Clinical Precision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
