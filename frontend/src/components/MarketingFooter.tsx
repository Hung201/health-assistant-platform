import Link from 'next/link';
import { Activity } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="footer-dark pt-16 pb-8 mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link className="flex items-center gap-2 mb-4" href="/">
              <div className="rounded-[10px] bg-[#0D9E75] p-1.5 text-white"><Activity size={18} /></div>
              <span className="text-lg font-bold text-white">Clinical Precision</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Nền tảng y tế số thông minh, ứng dụng AI phân tích triệu chứng và kết nối người bệnh với chuyên gia y tế uy tín.
            </p>
            <div className="flex gap-2">
              {['fb','tw','yt'].map(s => (
                <a key={s} href="#" className="footer-social-btn" aria-label={s}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    {s==='fb' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>}
                    {s==='tw' && <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>}
                    {s==='yt' && <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>}
                  </svg>
                </a>
              ))}
            </div>
          </div>
          {/* Links 1 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Về chúng tôi</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <li><Link href="#" className="hover:text-white transition-colors">Giới thiệu</Link></li>
              <li><Link href="/doctors" className="hover:text-white transition-colors">Danh bạ bác sĩ</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog sức khỏe</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Liên hệ</Link></li>
            </ul>
          </div>
          {/* Links 2 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Hướng dẫn đặt lịch</Link></li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <li>Hotline: <span className="text-white">1900 1234</span></li>
              <li>Email: <span className="text-white">support@clinicalprecision.com</span></li>
              <li className="pt-1">Thứ 2 – CN: <span className="text-white">7:00 – 22:00</span></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <p>© 2026 ETHOS CLINICAL SYSTEMS. ALL RIGHTS RESERVED.</p>
          <p>Made with ♥ for better healthcare in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}
