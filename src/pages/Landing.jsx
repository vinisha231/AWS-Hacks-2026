import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import Layout from '../components/Layout'
import LanguagePicker from '../components/LanguagePicker'
import { PROGRAMS } from '../data/programs'

const CATEGORY_COLORS = {
  food:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  health:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  housing:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
  energy:    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  financial: { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  education: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

const STATS = [
  { value: '$6,200', label: 'Average annual benefits missed' },
  { value: '10+',    label: 'Programs checked at once' },
  { value: '3 min',  label: 'Average time to complete' },
  { value: '75+',    label: 'Languages supported' },
]

export default function Landing() {
  const { t } = useTranslation()

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <p className="text-blue-700 text-sm font-semibold uppercase tracking-widest mb-4">
            {t('landing_badge')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            {t('landing_headline').split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            {t('landing_sub')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/intake"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base px-8 py-3 rounded-lg transition-colors"
            >
              {t('landing_cta')}
            </Link>
            <Link
              to="/tracker"
              className="text-slate-600 hover:text-slate-900 font-medium text-base px-6 py-3 transition-colors"
            >
              {t('landing_tracker')}
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-4">{t('landing_cta_sub')}</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center py-6 sm:py-0 px-4">
                <div className="text-3xl font-black text-slate-900">{value}</div>
                <div className="text-slate-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">{t('landing_how_title')}</h2>
          <p className="text-slate-500 text-center text-sm mb-10 max-w-xl mx-auto">No jargon. No paperwork. Just answers.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', titleKey: 'landing_step1_title', descKey: 'landing_step1_desc', icon: '💬' },
              { num: '02', titleKey: 'landing_step2_title', descKey: 'landing_step2_desc', icon: '✅' },
              { num: '03', titleKey: 'landing_step3_title', descKey: 'landing_step3_desc', icon: '📋' },
            ].map(({ num, titleKey, descKey, icon }) => (
              <div key={num} className="bg-slate-50 border border-slate-200 rounded-lg p-8">
                <div className="text-3xl mb-4">{icon}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Step {num}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{t(titleKey)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Programs we check ── */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">{t('landing_programs_title')}</h2>
          <p className="text-slate-500 text-center text-sm mb-10">All checked in one session — no separate searches.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PROGRAMS.map(p => {
              const colors = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.financial
              return (
                <div key={p.id} className={`${colors.bg} border ${colors.border} rounded-lg p-4 flex flex-col gap-2`}>
                  <span className="text-2xl">{p.icon}</span>
                  <span className={`text-sm font-semibold ${colors.text}`}>{p.name || p.id.toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${colors.bg} ${colors.border} ${colors.text} self-start capitalize`}>{p.category}</span>
                  {p.estimatedValue && (
                    <span className="text-xs text-slate-500">{p.estimatedValue}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Differentiators ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            What makes Compass different
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'Cross-program view', desc: 'We show you SNAP + Medicaid + LIHEAP + EITC in one session. Most tools only check one at a time.' },
              { icon: '🌍', title: 'Real multilingual support', desc: 'Not just Spanish. We support Haitian Creole, Vietnamese, Somali, Arabic — the languages that matter most.' },
              { icon: '💬', title: '"I don\'t know what I need"', desc: 'You don\'t have to know what to search for. Just answer a few questions and we\'ll find everything.' },
              { icon: '📋', title: 'Pre-filled applications', desc: 'Your answers auto-populate each form so you don\'t have to type the same info six times.' },
              { icon: '🔔', title: 'Renewal reminders', desc: 'We track your renewal dates and remind you before benefits lapse — a gap nobody else addresses.' },
              { icon: '📁', title: 'Document checklists', desc: 'Know exactly what to gather before you start each application. No more abandoned forms.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="border border-slate-200 rounded-lg p-6">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="bg-slate-900 py-14 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to find your benefits?</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">It takes about 3 minutes. No account, no email, no personal data stored.</p>
        <Link
          to="/intake"
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base px-8 py-3 rounded-lg transition-colors inline-block"
        >
          {t('landing_cta')}
        </Link>
      </div>
    </Layout>
  )
}
