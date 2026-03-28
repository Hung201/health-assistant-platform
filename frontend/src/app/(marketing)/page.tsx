const doctors = [
  {
    name: 'Dr. Sarah Smith',
    specialty: 'Cardiologist',
    rating: '4.9',
    reviews: '120+ reviews',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6nsEEWtMPtJjmpg1totAsDksxZIaivyzz-PLd52lEiZo16IekL-vvnSawne3Enq-YMgg2TmFVDs-riUUjTbsG3A2DHwZ1HO4HPjAem632vu0KIankyqt1RUp1VO1B89tMisFYz1K_m6Bg0PzimG0wZgQAr5apCV1bbnvRWqdaxEkGEMepnJpxcOSMJSocd3t8vAvka_zuy9L55L-cgMDQb7w4Tq_Xqexmpqf-NB5LSIfFx_3tYgfHyk9yydoMKSOVhn_KdRyMvcDy',
  },
  {
    name: 'Dr. James Chen',
    specialty: 'Neurologist',
    rating: '4.8',
    reviews: '95+ reviews',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAj3PYZpd1KOS0xhqHyb3V43zE8-hLfPzjOFWxhwrCndBvdszNiO7r-YvLEMylXPRDWlV6yRbsY8KxXyg8bW52Do4mXHcF-hhjLUhL-QPGT2EG0RY6cV-XCwo9H3Fgzo7GNrQFmiCX3jrdD_tK4D_7dUitaZtMr1vbUi2bFraw9YiQAnocXGwpoYQgUiwunzMa7MLeScYZe3l2TS1KuSxeeY4xI78LkqyYMEO9yBznWQQ8Bxw4VmMqwVVqSsfYsQxuh0VdkRX5-yIv2',
  },
  {
    name: 'Dr. Elena Rodriguez',
    specialty: 'Pediatrician',
    rating: '5.0',
    reviews: '210+ reviews',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnXwkLnw0DQCnv_FO4Iu36r601Y3XCCNifQHNbbzgz-ZDkEP5VbSs_46bkWjElCL2GFpOEmxRdAaNz6_uB1s2KeyCdxlpIuDTZDRUjSrpNS5JJ_NtXgonVs1KJJpXxF_dtnPKLs5KibsFzN-cP4eAQuoFzti9ZOlZfbC_2oa2PJrC-6acoPiCoB0OVFUEmW-USTN3y5jA_6ii7R1mYqINQV0pDELeOzsm2X7dn9zAM4DwInfP5WymFc0kymztahrltqj8RZtE_Qbg4',
  },
  {
    name: 'Dr. Michael Bond',
    specialty: 'Dermatologist',
    rating: '4.7',
    reviews: '80+ reviews',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXr_qQpCmhOO4Vze-SsbhvZkkQ0HkMiB-agzySC8p0I3Y4e56xlh5ILqaJA2J8RmsGBBWIc9XHpNDlf4v0mi6RKn4elwSxnae-NiIeqxU9DB1YASUVUmwYdd-N5U_16RdwTUUy_GmYVKnb3T8XnCynBTq1emO92k6nBWojpykpSTfOXaWAX8fd7AyO0-w2pmYtsf8WaiPy4Xc5e_QiggFnD7bP3guC_a480Gya46UQCCvJO2b4-A-frrHLfEryvJ19OkAEmBL6rzVz',
  },
];

const articles = [
  {
    tag: 'AI Innovation',
    tagClass: 'bg-[#0066cc]/90',
    title: 'How AI is Revolutionizing Symptom Diagnostics',
    summary:
      'Discover the complex algorithms behind MediAI that allow for high-accuracy preliminary medical assessments.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAP71CCqYws70yCMsPTL86jkmiONqzHztS4O7QsfgXCkrO1h_8SG0ZsTefzv8CMJV_8uaw_UqgONwMazmtRIWCo7qertxCv4cFZprmGuAe7aEoEvbsxRzJnsdnY2jafcmg7lUedSu69RZSLqFVfzhNcVWlkyADuucMunrbFSeFJm-njrpgkJYsOO-Zv9-5BlxZH2gi7hlDTeudXit4SnXhm3u_Kf0KiThYd48gIVVco5p4WurxepIJHqbQ-znMeh91FpBJrkhzF2X5y',
  },
  {
    tag: 'Wellness',
    tagClass: 'bg-emerald-500/90',
    title: '5 Daily Habits to Boost Your Immune System',
    summary:
      'Small changes in your daily routine can make a massive difference in how your body fights off common seasonal illnesses.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-yzEeHfFcJh21cKVXloh1T9xBAzjq8dSXK30zsqpr-Q-2Juifa-I4TmsCH6pHTiQRjNIw4nUiJKc9EoMINx59mzukhmvaMinmHhqUqbZwpd8V5kC1IoflcovE7XXob8RqZ0GDJZe1YZpwWUrcIEA15uXCTQ9T6u4Gv_AG42d_n27B0ukuPwY3fqpfgBjhCyCV5DEKI5znRepXO5nZ-ftLenewI3XScQvvzzqZv5-JMqUQWOgEg17u51WPxobfUDgd02_kFyIUKJU4',
  },
  {
    tag: 'Patient Guide',
    tagClass: 'bg-slate-700/90',
    title: 'When to Consult a Specialist for Chronic Pain',
    summary:
      'Understanding the red flags that indicate it is time to move beyond home remedies and talk to a professional.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBA-pO3swj_ICg9BxLi87_EEhOCO-FOLQ5iIEVoAeBhviXJSK4lHFyXVx5PLiSAxZvNqNOcNX9BGQX0IbSV0cmYVZHbLxAe7A-2vnOBNPZttkbQ8SRbTVPo-ZBHjPOZIzTDACMEPXjQP-zliGOMBp6BcVXbKYs71O-cNn-QoA9xIwXSrYcjanCEUSldu1IljiSjq13ThP8XFv_0QSMDh_tewISjux132KX1tYEkeIubdaW22H57BToMJTvj-ezksPmPBu1kcnCqv0dI',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f8] text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#0066cc] p-1.5 text-white">+</div>
            <h1 className="text-xl font-bold tracking-tight">MediAI</h1>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0066cc]" href="#">
              Features
            </a>
            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0066cc]" href="#">
              How it works
            </a>
            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0066cc]" href="#">
              About
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
              Login
            </button>
            <button className="rounded-lg bg-[#0066cc] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#005cb8]">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-24 pt-16 lg:pb-40 lg:pt-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(0,102,204,0.08)_0%,transparent_100%)]" />
          <div className="mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Personalized Medical Insights Powered by AI
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-slate-600">
                Get instant preliminary analysis of your symptoms from our advanced medical AI engine. Trusted by
                thousands for quick, reliable health guidance.
              </p>
              <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="w-full rounded-xl border-0 bg-transparent px-4 py-3 text-base outline-none ring-0 placeholder:text-slate-400"
                    placeholder="Enter your symptoms (e.g., headache, fever...)"
                    type="text"
                  />
                  <button className="rounded-xl bg-[#0066cc] px-8 py-3 font-bold text-white shadow-lg shadow-[#0066cc]/20 transition-all hover:bg-[#005cb8]">
                    Analyze with AI
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-500">
                <span>Popular:</span>
                <button className="underline decoration-slate-300 hover:text-[#0066cc]">Seasonal Allergies</button>
                <button className="underline decoration-slate-300 hover:text-[#0066cc]">Migraine relief</button>
                <button className="underline decoration-slate-300 hover:text-[#0066cc]">Sleep patterns</button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Our Top-Rated Specialists</h3>
                <p className="mt-1 text-sm text-slate-500">Connect with verified professionals across various fields.</p>
              </div>
              <a className="text-sm font-semibold text-[#0066cc] hover:underline" href="#">
                See all
              </a>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.map((doctor) => (
                <article
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:shadow-lg"
                  key={doctor.name}
                >
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-xl bg-slate-200">
                    <img alt={doctor.name} className="h-full w-full object-cover" src={doctor.image} />
                  </div>
                  <h4 className="text-lg font-bold">{doctor.name}</h4>
                  <p className="text-sm font-medium text-[#0066cc]">{doctor.specialty}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {doctor.rating} stars ({doctor.reviews})
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="text-3xl font-bold">Medical Insights &amp; Blog</h3>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Stay informed with the latest research, wellness tips, and AI breakthroughs in the medical field.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  key={article.title}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img alt={article.title} className="h-full w-full object-cover" src={article.image} />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${article.tagClass}`}
                    >
                      {article.tag}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h4 className="mb-3 text-xl font-bold">{article.title}</h4>
                    <p className="mb-6 text-sm text-slate-600">{article.summary}</p>
                    <a className="mt-auto text-sm font-bold text-[#0066cc] hover:underline" href="#">
                      Read article
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 pb-8 pt-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <div className="rounded-lg bg-[#0066cc] p-1.5 text-white">+</div>
                <h2 className="text-xl font-bold">MediAI</h2>
              </div>
              <p className="mb-6 max-w-sm text-sm text-slate-500">
                Empowering patients with AI-driven health insights. MediAI provides preliminary analysis and is not a
                substitute for professional medical advice.
              </p>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider">Platform</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>AI Checker</li>
                <li>Specialists</li>
                <li>Lab Results</li>
                <li>Telemedicine</li>
              </ul>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider">Company</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>About Us</li>
                <li>Careers</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider">Support</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Safety Guide</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center">
            <p className="text-xs text-slate-400">© 2024 MediAI Health Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
