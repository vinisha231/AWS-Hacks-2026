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
    <div className="bg-slate-50 min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-indigo-200 blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          {/* Language badge + picker */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
              🌍 {t('landing_languages')}
            </span>
            <div className="scale-90 origin-center">
              <LanguagePicker />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-white/90 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('landing_badge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            {t('landing_headline').split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            {t('landing_sub')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/intake"
              className="bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              {t('landing_cta')} →
            </Link>
            <Link
              to="/tracker"
              className="text-white/80 hover:text-white font-medium text-base px-6 py-4 transition-colors"
            >
              {t('landing_tracker')}
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-4">{t('landing_cta_sub')}</p>
        </div>

        {/* Stats bar */}
        <div className="bg-white/10 border-t border-white/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-black text-slate-900 text-center mb-4">{t('landing_how_title')}</h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">No jargon. No paperwork. Just answers.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: '01', titleKey: 'landing_step1_title', descKey: 'landing_step1_desc', icon: '💬', color: 'bg-blue-50 border-blue-100' },
            { num: '02', titleKey: 'landing_step2_title', descKey: 'landing_step2_desc', icon: '✅', color: 'bg-emerald-50 border-emerald-100' },
            { num: '03', titleKey: 'landing_step3_title', descKey: 'landing_step3_desc', icon: '📋', color: 'bg-violet-50 border-violet-100' },
          ].map(({ num, titleKey, descKey, icon, color }) => (
            <div key={num} className={`rounded-2xl border p-8 ${color}`}>
              <div className="text-4xl mb-4">{icon}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step {num}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t(titleKey)}</h3>
              <p className="text-slate-600 leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Programs we check ── */}
      <div className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-2">{t('landing_programs_title')}</h2>
          <p className="text-slate-500 text-center text-sm mb-10">All checked in one session — no separate searches.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PROGRAMS.map(p => {
              const colors = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.financial
              return (
                <div key={p.id} className={`${colors.bg} border ${colors.border} rounded-2xl p-4 flex flex-col items-center text-center gap-2`}>
                  <span className="text-3xl">{p.icon}</span>
                  <span className={`text-sm font-bold ${colors.text}`}>{p.id.toUpperCase()}</span>
                  <span className="text-xs text-slate-500 capitalize">{p.category}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Differentiators ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-black text-slate-900 text-center mb-12">
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
            <div key={title} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="bg-blue-700 py-16 text-center">
        <h2 className="text-3xl font-black text-white mb-4">Ready to find your benefits?</h2>
        <p className="text-blue-200 mb-8 max-w-xl mx-auto">It takes about 3 minutes. No account, no email, no personal data stored.</p>
        <Link
          to="/intake"
          className="bg-white text-blue-700 font-bold text-lg px-10 py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all inline-block"
        >
          {t('landing_cta')} →
        </Link>
      </div>
    </div>
  )
}
