import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import Layout from '../components/Layout'
import { PROGRAMS } from '../data/programs'

const STATS = [
  { value: '$6,200', label: 'Average annual benefits missed' },
  { value: '10+',    label: 'Programs checked at once' },
  { value: '3 min',  label: 'Average time to complete' },
  { value: '75+',    label: 'Languages supported' },
]

const DIFFERENTIATORS = [
  { title: 'Cross-program view',       desc: 'We show you SNAP + Medicaid + LIHEAP + EITC in one session. Most tools only check one at a time.' },
  { title: 'Real multilingual support', desc: 'Not just Spanish. We support Haitian Creole, Vietnamese, Somali, Arabic — the languages that matter most.' },
  { title: '"I don\'t know what I need"', desc: 'You don\'t have to know what to search for. Just answer a few questions and we\'ll find everything.' },
  { title: 'Pre-filled applications',  desc: 'Your answers auto-populate each form so you don\'t have to type the same info six times.' },
  { title: 'Renewal reminders',        desc: 'We track your renewal dates and remind you before benefits lapse — a gap nobody else addresses.' },
  { title: 'Document checklists',      desc: 'Know exactly what to gather before you start each application. No more abandoned forms.' },
]

export default function Landing() {
  const { t } = useTranslation()

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="min-h-[92vh] flex flex-col justify-center bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 w-full py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
              {t('landing_badge')}
            </p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-neutral-950 leading-[1.0] tracking-tight mb-8">
              {t('landing_headline').split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="text-neutral-500 text-lg sm:text-xl max-w-2xl leading-relaxed mb-12">
              {t('landing_sub')}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/intake"
                className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-base px-8 py-4 rounded-md transition-colors"
              >
                {t('landing_cta')}
              </Link>
              <Link
                to="/tracker"
                className="text-neutral-500 hover:text-neutral-900 font-medium text-base transition-colors"
              >
                {t('landing_tracker')} →
              </Link>
            </div>
            <p className="text-neutral-400 text-sm mt-6">{t('landing_cta_sub')}</p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-800">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-12 px-8 text-center">
                <div className="text-4xl font-black text-white mb-2">{value}</div>
                <div className="text-neutral-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Process</p>
            <h2 className="text-4xl font-black text-neutral-950">{t('landing_how_title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
            {[
              { num: '01', titleKey: 'landing_step1_title', descKey: 'landing_step1_desc' },
              { num: '02', titleKey: 'landing_step2_title', descKey: 'landing_step2_desc' },
              { num: '03', titleKey: 'landing_step3_title', descKey: 'landing_step3_desc' },
            ].map(({ num, titleKey, descKey }) => (
              <div key={num} className="bg-white p-10">
                <p className="text-5xl font-black text-neutral-100 mb-8 select-none">{num}</p>
                <h3 className="text-lg font-bold text-neutral-950 mb-3">{t(titleKey)}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ── */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Coverage</p>
            <h2 className="text-4xl font-black text-neutral-950">{t('landing_programs_title')}</h2>
            <p className="text-neutral-500 text-sm mt-3">All checked in one session — no separate searches.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PROGRAMS.map(p => (
              <div key={p.id} className="bg-white border border-neutral-200 rounded-md p-5 flex flex-col gap-3 hover:border-neutral-400 transition-colors">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-sm font-semibold text-neutral-900">{p.name || p.id.toUpperCase()}</span>
                <span className="text-xs text-neutral-400 uppercase tracking-wide">{p.category}</span>
                {p.estimatedValue && (
                  <span className="text-xs text-neutral-500 font-medium">{p.estimatedValue}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiators ── */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Why Compass</p>
            <h2 className="text-4xl font-black text-neutral-950">What makes us different</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
            {DIFFERENTIATORS.map(({ title, desc }) => (
              <div key={title} className="bg-white p-8">
                <h3 className="font-bold text-neutral-950 mb-3">{title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 py-28 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              Ready to find<br />your benefits?
            </h2>
            <p className="text-neutral-400 text-base max-w-md">
              Takes about 3 minutes. No account, no email, no personal data stored.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/intake"
              className="bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-base px-10 py-4 rounded-md transition-colors inline-block"
            >
              {t('landing_cta')}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  )
}
