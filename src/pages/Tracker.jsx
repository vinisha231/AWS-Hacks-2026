import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS } from '../data/programs'
import { scheduleRenewalReminder } from '../services/sns'
import Layout from '../components/Layout'

const STATUS_OPTIONS = ['not_started', 'in_progress', 'applied', 'approved', 'renewal_due']
const STATUS_META = {
  not_started: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200', label: 'Not started',    icon: '○' },
  in_progress:  { bg: 'bg-neutral-100',  text: 'text-neutral-700', border: 'border-neutral-300', label: 'In progress',  icon: '◑' },
  applied:      { bg: 'bg-neutral-800',  text: 'text-white',       border: 'border-neutral-800', label: 'Applied',      icon: '◉' },
  approved:     { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200',label: 'Approved ✓',   icon: '●' },
  renewal_due:  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200', label: 'Renewal due',   icon: '⚠' },
}

function getRenewalDate(approvedAt, renewalMonths) {
  if (!approvedAt) return null
  const d = new Date(approvedAt)
  d.setMonth(d.getMonth() + renewalMonths)
  return d
}

function daysUntil(date) {
  return Math.round((date - new Date()) / (1000 * 60 * 60 * 24))
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── SNS Reminder Modal ──────────────────────────────────────────────────────
function ReminderModal({ program, renewalDate, onClose, onScheduled }) {
  const { settings } = useStore()
  const [phone, setPhone] = useState(settings.phone || '')
  const [email, setEmail] = useState(settings.email || '')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [demo, setDemo] = useState(false)

  const submit = async () => {
    if (!phone && !email) return
    setLoading(true)
    try {
      const result = await scheduleRenewalReminder({
        programId: program.id,
        programName: program.nameKey,
        renewalDate: renewalDate.toISOString(),
        phone, email,
      })
      setDemo(result.demo)
      setDone(true)
      onScheduled(renewalDate.toISOString())
    } catch (e) {
      setDone(true)
      setDemo(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="text-3xl mb-3">🔔</div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Set Renewal Reminder</h2>
            <p className="text-slate-500 text-sm mb-6">
              We'll send you a reminder <strong>30 days before</strong> your renewal is due on{' '}
              <strong>{fmtDate(renewalDate.toISOString())}</strong> via Amazon SNS.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  📱 SMS (phone number)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  ✉️ Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5">Powered by Amazon SNS. Enter at least one contact method.</p>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading || (!phone && !email)}
                className="flex-1 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? 'Scheduling...' : 'Schedule Reminder'}
              </button>
              <button onClick={onClose} className="px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Reminder Scheduled!</h2>
            <p className="text-slate-500 text-sm mb-2">
              You'll be notified 30 days before your renewal date:
            </p>
            <p className="font-bold text-neutral-950 mb-4">{fmtDate(renewalDate.toISOString())}</p>
            {demo && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4">
                Demo mode — connect VITE_SNS_ENDPOINT to send real SNS notifications.
              </p>
            )}
            <button onClick={onClose} className="bg-neutral-950 text-white font-bold px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── History timeline ─────────────────────────────────────────────────────────
function HistoryTimeline({ history, t }) {
  if (!history?.length) return <p className="text-xs text-slate-400 italic">{t ? t('tracker_no_history') : 'No history yet.'}</p>

  return (
    <div className="flex flex-col gap-0">
      {[...history].reverse().map((entry, i) => {
        const meta = STATUS_META[entry.status] || STATUS_META.not_started
        const isLast = i === history.length - 1
        return (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex flex-col items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${meta.bg} ${meta.text} ${meta.border} flex-shrink-0`}>
                {meta.icon}
              </span>
              {!isLast && <div className="w-0.5 h-4 bg-slate-200 my-0.5" />}
            </div>
            <div className="pb-3">
              <p className={`text-xs font-bold ${meta.text}`}>{meta.label}</p>
              <p className="text-xs text-slate-400">{fmtDate(entry.timestamp)} · {fmtTime(entry.timestamp)}</p>
              {entry.note && <p className="text-xs text-slate-500 mt-0.5 italic">{entry.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Program card ─────────────────────────────────────────────────────────────
function ProgramCard({ program, entry, onStatusChange, onReminderScheduled, t }) {
  const navigate = useNavigate()
  const [showHistory, setShowHistory] = useState(false)
  const [showReminder, setShowReminder] = useState(false)

  const meta = STATUS_META[entry.status] || STATUS_META.not_started

  // Renewal date calculated from when status was set to 'approved'
  const approvedEvent = [...(entry.history || [])].reverse().find(h => h.status === 'approved')
  const renewal = approvedEvent ? getRenewalDate(approvedEvent.timestamp, program.renewalMonths) : null
  const daysLeft = renewal ? daysUntil(renewal) : null

  const urgent   = daysLeft !== null && daysLeft <= 14
  const warning  = daysLeft !== null && daysLeft > 14 && daysLeft <= 60

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        {/* Urgency bar */}
        {urgent  && <div className="h-1 bg-red-500 w-full" />}
        {warning && <div className="h-1 bg-amber-400 w-full" />}

        <div className="p-5">
          <div className="flex items-start gap-4">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: program.bgColor }}>
              {program.icon}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">{t(program.nameKey)}</h3>
                  <p className="text-slate-500 text-xs">{t(program.fullKey)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
              </div>

              {/* Renewal alerts */}
              {urgent && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mb-3 flex items-center gap-2 font-medium">
                  🚨 {daysLeft <= 0 ? t('tracker_urgent_now') : t('tracker_urgent_days', { days: daysLeft })} — {fmtDate(renewal.toISOString())}
                </div>
              )}
              {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2 mb-3 flex items-center gap-2 font-medium">
                  ⏰ {t('tracker_warning_days', { days: daysLeft })} — {fmtDate(renewal.toISOString())}
                </div>
              )}
              {renewal && daysLeft !== null && daysLeft > 60 && (
                <p className="text-xs text-slate-400 mb-3">
                  {t('tracker_next_renewal', { date: fmtDate(renewal.toISOString()), days: daysLeft })}
                </p>
              )}

              {/* SNS reminder badge */}
              {entry.snsReminderSet && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-full px-3 py-1 mb-3">
                  <span>🔔</span> {t('tracker_sns_set', { date: fmtDate(entry.snsReminderDate) })}
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status selector */}
                <select
                  value={entry.status}
                  onChange={e => onStatusChange(program.id, e.target.value)}
                  className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 text-neutral-600 bg-white outline-none focus:border-neutral-950 cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>

                <button onClick={() => navigate(`/apply/${program.id}`)} className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors">
                  {t('tracker_application')}
                </button>

                {/* Show reminder button when approved and has renewal date */}
                {renewal && !entry.snsReminderSet && (
                  <button
                    onClick={() => setShowReminder(true)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
                  >
                    🔔 {t('tracker_set_reminder')}
                  </button>
                )}

                {/* History toggle */}
                <button
                  onClick={() => setShowHistory(s => !s)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-auto flex items-center gap-1"
                >
                  {showHistory ? '▲' : '▼'} {t('tracker_history_label', { count: entry.history?.length || 0 })}
                </button>
              </div>

              {/* History */}
              {showHistory && (
                <div className="mt-4 pl-2 border-l-2 border-slate-100 animate-fade-in">
                  <HistoryTimeline history={entry.history} t={t} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReminder && renewal && (
        <ReminderModal
          program={program}
          renewalDate={renewal}
          onClose={() => setShowReminder(false)}
          onScheduled={(date) => { onReminderScheduled(program.id, date); setShowReminder(false) }}
        />
      )}
    </>
  )
}

// ── Full history tab ──────────────────────────────────────────────────────────
function FullHistory({ tracker, t }) {
  const allEvents = []
  Object.entries(tracker).forEach(([programId, entry]) => {
    const program = PROGRAMS.find(p => p.id === programId)
    if (!program) return
    ;(entry.history || []).forEach(h => {
      allEvents.push({ ...h, program })
    })
  })
  allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  if (!allEvents.length) return (
    <div className="text-center py-12 text-slate-400 text-sm">{t ? t('tracker_no_activity') : 'No activity yet.'}</div>
  )

  // Group by date
  const grouped = {}
  allEvents.forEach(e => {
    const day = new Date(e.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(e)
  })

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([day, events]) => (
        <div key={day}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{day}</p>
          <div className="flex flex-col gap-2">
            {events.map((e, i) => {
              const meta = STATUS_META[e.status] || STATUS_META.not_started
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl flex-shrink-0">{e.program.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{e.program.id.toUpperCase()}</p>
                    <p className="text-slate-500 text-xs">{e.note || (t ? t('tracker_status_updated') : 'Status updated')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                      {meta.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{fmtTime(e.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Tracker() {
  const { t } = useTranslation()
  const { tracker, setTrackerStatus, setSnsReminder, clearTracker, savedPrograms } = useStore()
  const [tab, setTab] = useState('active')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const trackedIds = Object.keys(tracker)
  const trackedPrograms = trackedIds.map(id => {
    const program = PROGRAMS.find(p => p.id === id)
    const entry = tracker[id]
    if (!program) return null
    return { program, entry }
  }).filter(Boolean)

  const approvedCount = trackedPrograms.filter(({ entry }) => entry.status === 'approved').length
  const appliedCount  = trackedPrograms.filter(({ entry }) => entry.status === 'applied').length
  const totalApproved = trackedPrograms
    .filter(({ entry }) => entry.status === 'approved')
    .reduce((s, { program }) => {
      const result = savedPrograms.find(r => r.id === program.id)
      return s + (result?.estimatedAnnual || 0)
    }, 0)

  const renewalAlerts = trackedPrograms.filter(({ program, entry }) => {
    const approved = [...(entry.history || [])].reverse().find(h => h.status === 'approved')
    if (!approved) return false
    const renewal = getRenewalDate(approved.timestamp, program.renewalMonths)
    return renewal && daysUntil(renewal) <= 30
  }).length

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{t('tracker_headline')}</h1>
            <p className="text-slate-500">{t('tracker_sub')}</p>
          </div>
          <Link to="/intake" className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            {t('tracker_find_more')}
          </Link>
        </div>

        {trackedPrograms.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label={t('tracker_stat_tracked')} value={trackedPrograms.length} color="text-neutral-950" />
              <StatCard label={t('tracker_stat_applied')} value={appliedCount + approvedCount} color="text-neutral-950" />
              <StatCard label={t('tracker_stat_value')} value={totalApproved > 0 ? `$${(totalApproved/1000).toFixed(1)}k/yr` : '—'} color="text-emerald-700" />
              <StatCard
                label={t('tracker_stat_alerts')}
                value={renewalAlerts}
                color={renewalAlerts > 0 ? 'text-amber-600' : 'text-slate-400'}
                highlight={renewalAlerts > 0}
              />
            </div>

            {/* Tabs */}
            <div className="flex bg-neutral-100 rounded-lg p-1 mb-6">
              {[
                { key: 'active',  label: t('tracker_tab_active', { count: trackedPrograms.length }) },
                { key: 'history', label: t('tracker_tab_history') },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all
                    ${tab === key ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {trackedPrograms.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🧭</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{t('tracker_empty')}</h3>
            <p className="text-slate-500 mb-6">{t('tracker_empty_sub')}</p>
            <Link to="/intake" className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-block">
              {t('tracker_find')}
            </Link>
          </div>
        )}

        {/* Active tab */}
        {tab === 'active' && trackedPrograms.length > 0 && (
          <div className="flex flex-col gap-4">
            {trackedPrograms.map(({ program, entry }) => (
              <ProgramCard
                key={program.id}
                program={program}
                entry={entry}
                t={t}
                onStatusChange={(id, status) => setTrackerStatus(id, status)}
                onReminderScheduled={(id, date) => setSnsReminder(id, date)}
              />
            ))}

            <div className="text-center pt-2">
              {!showConfirmClear ? (
                <button onClick={() => setShowConfirmClear(true)} className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
                  {t('tracker_clear')}
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center gap-4 flex-wrap">
                  <p className="text-red-700 text-sm font-medium">{t('tracker_clear_confirm')}</p>
                  <button onClick={() => { clearTracker(); setShowConfirmClear(false) }} className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                    {t('tracker_clear_yes')}
                  </button>
                  <button onClick={() => setShowConfirmClear(false)} className="text-slate-500 text-xs font-medium">{t('tracker_cancel')}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && <FullHistory tracker={tracker} t={t} />}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color, highlight }) {
  return (
    <div className={`bg-white border rounded-2xl p-4 text-center ${highlight ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
