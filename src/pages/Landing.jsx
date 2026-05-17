import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useRevealAll } from '../hooks/useReveal'
import Layout from '../components/Layout'
import { PROGRAMS } from '../data/programs'

const STATS = [
  { value: '$6,200', label: 'Average annual benefits missed' },
  { value: '10+',    label: 'Programs checked at once' },
  { value: '3 min',  label: 'Average time to complete' },
  { value: '75+',    label: 'Languages supported' },
]

const DIFFERENTIATORS = [
  {
    title: 'Cross-program view',
    desc: 'We show you SNAP + Medicaid + LIHEAP + EITC in one session. Most tools only check one at a time.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: 'Real multilingual support',
    desc: 'Not just Spanish. We support Haitian Creole, Vietnamese, Somali, Arabic — the languages that matter most.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: 'Start without knowing what you need',
    desc: "You don't have to know what to search for. Just answer a few questions and we'll find everything.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: 'Pre-filled applications',
    desc: "Your answers auto-populate each form so you don't have to type the same info six times.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    title: 'Renewal reminders',
    desc: 'We track your renewal dates and remind you before benefits lapse — a gap nobody else addresses.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: 'Document checklists',
    desc: 'Know exactly what to gather before you start each application. No more abandoned forms.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
]

const STEPS = [
  {
    num: '01',
    titleKey: 'landing_step1_title',
    descKey: 'landing_step1_desc',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    num: '02',
    titleKey: 'landing_step2_title',
    descKey: 'landing_step2_desc',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    titleKey: 'landing_step3_title',
    descKey: 'landing_step3_desc',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
]

export default function Landing() {
  const { t } = useTranslation()
  useRevealAll()

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center bg-neutral-950 border-b border-neutral-800 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="relative max-w-screen-xl mx-auto px-8 w-full py-24">
          <div className="max-w-5xl">
            <p className="animate-hero-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-8">
            </p>
            <h1 className="animate-hero-2 glow-text text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.0] tracking-tight mb-8">
              {t('landing_headline').split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="animate-hero-3 text-neutral-400 text-lg sm:text-xl max-w-2xl leading-relaxed mb-12">
              {t('landing_sub')}
            </p>
            <div className="animate-hero-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/intake"
                className="group inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-base px-8 py-4 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/10"
              >
                {t('landing_cta')}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/tracker"
                className="text-neutral-500 hover:text-neutral-200 font-medium text-base transition-colors"
              >
                {t('landing_tracker')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-800">
            {STATS.map(({ value, label }) => (
              <div key={label} className="reveal py-14 px-8 text-center">
                <div className="text-4xl font-black text-white mb-2">{value}</div>
                <div className="text-neutral-500 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-8 py-28">
          <div className="reveal mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-3">Process</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white">{t('landing_how_title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800 stagger">
            {STEPS.map(({ num, titleKey, descKey, icon }) => (
              <div key={num} className="reveal bg-neutral-950 p-10 hover:bg-neutral-900 transition-colors group">
                <div className="flex items-start justify-between mb-8">
                  <p className="text-6xl font-black text-neutral-800 select-none group-hover:text-neutral-700 transition-colors">{num}</p>
                  <div className="text-neutral-700 group-hover:text-neutral-400 transition-colors">{icon}</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{t(titleKey)}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ── */}
      <section className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-8 py-28">
          <div className="reveal mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-3">Coverage</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white">{t('landing_programs_title')}</h2>
            <p className="text-neutral-500 text-sm mt-3">All checked in one session — no separate searches.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger">
            {PROGRAMS.map(p => (
              <div
                key={p.id}
                className="reveal bg-neutral-950 border border-neutral-800 rounded-md p-6 flex flex-col gap-3 hover:border-neutral-600 hover:-translate-y-0.5 hover:bg-neutral-900 transition-all"
              >
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                  <span className="text-neutral-950 text-xs font-black">{(p.name || p.id).slice(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-white">{p.name || p.id.toUpperCase()}</span>
                <span className="text-xs text-neutral-600 uppercase tracking-wide">{p.category}</span>
                {p.estimatedValue && (
                  <span className="text-xs text-neutral-500 font-medium">{p.estimatedValue}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiators ── */}
      <section className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-8 py-28">
          <div className="reveal mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-3">Why Compass</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white">What makes us different</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800 stagger">
            {DIFFERENTIATORS.map(({ title, desc, icon }) => (
              <div key={title} className="reveal bg-neutral-950 p-8 hover:bg-neutral-900 transition-colors group">
                <div className="text-neutral-700 group-hover:text-white transition-colors mb-5">{icon}</div>
                <h3 className="font-bold text-white mb-3">{title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — inverted bright section for impact ── */}
      <section className="bg-white">
        <div className="max-w-screen-xl mx-auto px-8 py-32 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
          <div className="reveal">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-950 leading-tight mb-4">
              Ready to find<br />your benefits?
            </h2>
            <p className="text-neutral-600 text-base max-w-md">
              Takes about 3 minutes. No account, no email, no personal data stored.
            </p>
          </div>
          <div className="reveal flex-shrink-0">
            <Link
              to="/intake"
              className="group inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-base px-10 py-4 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              {t('landing_cta')}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  )
}
