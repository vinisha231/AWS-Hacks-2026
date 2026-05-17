import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS } from '../data/programs'
import { scheduleRenewalReminder } from '../services/sns'
import Layout from '../components/Layout'
import { useRevealAll } from '../hooks/useReveal'

const STATUS_OPTIONS = ['not_started', 'in_progress', 'applied', 'approved', 'renewal_due']
const STATUS_META = {
  not_started: { bg: 'bg-neutral-100',   text: 'text-neutral-600',   border: 'border-neutral-200', label: 'Not started',    icon: '—' },
  in_progress:  { bg: 'bg-neutral-100',  text: 'text-neutral-700', border: 'border-neutral-300', label: 'In progress',  icon: '○' },
  applied:      { bg: 'bg-neutral-800',  text: 'text-white',       border: 'border-neutral-800', label: 'Applied',      icon: '◉' },
  approved:     { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200',label: 'Approved ✓',   icon: '●' },
  renewal_due:  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200', label: 'Renewal due',   icon: '!' },
}

const BellIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15h3" />
  </svg>
)

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
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="w-10 h-10 rounded-md bg-neutral-950 flex items-center justify-center text-white mb-3">
              <BellIcon />
            </div>
            <h2 className="text-xl font-black text-neutral-950 mb-1">Set Renewal Reminder</h2>
            <p className="text-neutral-500 text-sm mb-6">
              We'll send you a reminder <strong>30 days before</strong> your renewal is due on{' '}
              <strong>{fmtDate(renewalDate.toISOString())}</strong> via Amazon SNS.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <PhoneIcon /> SMS (phone number)
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
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <EmailIcon /> Email address
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

            <p className="text-xs text-neutral-400 mb-5">Powered by Amazon SNS. Enter at least one contact method.</p>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading || (!phone && !email)}
                className="flex-1 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? 'Scheduling...' : 'Schedule Reminder'}
              </button>
              <button onClick={onClose} className="px-5 py-3 rounded-lg border-2 border-neutral-200 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckIcon />
            </div>
            <h2 className="text-xl font-black text-neutral-950 mb-2">Reminder Scheduled!</h2>
            <p className="text-neutral-500 text-sm mb-2">
              You'll be notified 30 days before your renewal date:
            </p>
            <p className="font-bold text-neutral-950 mb-4">{fmtDate(renewalDate.toISOString())}</p>
            {demo && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mb-4">
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
  if (!history?.length) return <p className="text-xs text-neutral-400 italic">{t ? t('tracker_no_history') : 'No history yet.'}</p>

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
              {!isLast && <div className="w-0.5 h-4 bg-neutral-200 my-0.5" />}
            </div>
            <div className="pb-3">
              <p className={`text-xs font-bold ${meta.text}`}>{meta.label}</p>
              <p className="text-xs text-neutral-400">{fmtDate(entry.timestamp)} · {fmtTime(entry.timestamp)}</p>
              {entry.note && <p className="text-xs text-neutral-500 mt-0.5 italic">{entry.note}</p>}
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
      <div className="reveal bg-white border border-neutral-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        {/* Urgency bar */}
        {urgent  && <div className="h-1 bg-red-500 w-full" />}
        {warning && <div className="h-1 bg-amber-400 w-full" />}

        <div className="p-5">
          <div className="flex items-start gap-4">
            <span className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600 flex-shrink-0">
              {program.category[0].toUpperCase()}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h3 className="font-bold text-neutral-950">{t(program.nameKey)}</h3>
                  <p className="text-neutral-500 text-xs">{t(program.fullKey)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
              </div>

              {/* Renewal alerts */}
              {urgent && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2 mb-3 flex items-center gap-2 font-medium">
                  <AlertIcon /> {daysLeft <= 0 ? t('tracker_urgent_now') : t('tracker_urgent_days', { days: daysLeft })} — {fmtDate(renewal.toISOString())}
                </div>
              )}
              {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-md px-3 py-2 mb-3 flex items-center gap-2 font-medium">
                  <ClockIcon /> {t('tracker_warning_days', { days: daysLeft })} — {fmtDate(renewal.toISOString())}
                </div>
              )}
              {renewal && daysLeft !== null && daysLeft > 60 && (
                <p className="text-xs text-neutral-400 mb-3">
                  {t('tracker_next_renewal', { date: fmtDate(renewal.toISOString()), days: daysLeft })}
                </p>
              )}

              {/* SNS reminder badge */}
              {entry.snsReminderSet && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-full px-3 py-1 mb-3">
                  <BellIcon /> {t('tracker_sns_set', { date: fmtDate(entry.snsReminderDate) })}
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
                    <BellIcon /> {t('tracker_set_reminder')}
                  </button>
                )}

                {/* History toggle */}
                <button
                  onClick={() => setShowHistory(s => !s)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors ml-auto flex items-center gap-1"
                >
                  {showHistory ? '▲' : '▼'} {t('tracker_history_label', { count: entry.history?.length || 0 })}
                </button>
              </div>

              {/* History */}
              {showHistory && (
                <div className="mt-4 pl-2 border-l-2 border-neutral-100 animate-fade-in">
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
    <div className="text-center py-12 text-neutral-400 text-sm">{t ? t('tracker_no_activity') : 'No activity yet.'}</div>
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
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{day}</p>
          <div className="flex flex-col gap-2">
            {events.map((e, i) => {
              const meta = STATUS_META[e.status] || STATUS_META.not_started
              return (
                <div key={i} className="bg-white border border-neutral-200 rounded-lg px-5 py-4 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600 flex-shrink-0">
                    {e.program.category[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-950 text-sm">{e.program.id.toUpperCase()}</p>
                    <p className="text-neutral-500 text-xs">{e.note || (t ? t('tracker_status_updated') : 'Status updated')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                      {meta.label}
                    </span>
                    <p className="text-xs text-neutral-400 mt-1">{fmtTime(e.timestamp)}</p>
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

  useRevealAll()

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
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-10">
        {/* Header */}
        <div className="reveal mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-neutral-950 mb-1">{t('tracker_headline')}</h1>
            <p className="text-neutral-500">{t('tracker_sub')}</p>
          </div>
          <Link to="/intake" className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm px-5 py-2.5 rounded-md transition-colors">
            {t('tracker_find_more')}
          </Link>
        </div>

        {trackedPrograms.length > 0 && (
          <>
            {/* Stats */}
            <div className="reveal grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label={t('tracker_stat_tracked')} value={trackedPrograms.length} color="text-neutral-950" />
              <StatCard label={t('tracker_stat_applied')} value={appliedCount + approvedCount} color="text-neutral-950" />
              <StatCard label={t('tracker_stat_value')} value={totalApproved > 0 ? `$${(totalApproved/1000).toFixed(1)}k/yr` : '—'} color="text-emerald-700" />
              <StatCard
                label={t('tracker_stat_alerts')}
                value={renewalAlerts}
                color={renewalAlerts > 0 ? 'text-amber-600' : 'text-neutral-400'}
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
          <div className="reveal bg-white border-2 border-dashed border-neutral-200 rounded-lg p-12 text-center">
            <h3 className="font-bold text-neutral-950 text-lg mb-2">{t('tracker_empty')}</h3>
            <p className="text-neutral-500 mb-6">{t('tracker_empty_sub')}</p>
            <Link to="/intake" className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold px-5 py-2.5 rounded-md transition-colors inline-block">
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
                <button onClick={() => setShowConfirmClear(true)} className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
                  {t('tracker_clear')}
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center justify-center gap-4 flex-wrap">
                  <p className="text-red-700 text-sm font-medium">{t('tracker_clear_confirm')}</p>
                  <button onClick={() => { clearTracker(); setShowConfirmClear(false) }} className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                    {t('tracker_clear_yes')}
                  </button>
                  <button onClick={() => setShowConfirmClear(false)} className="text-neutral-500 text-xs font-medium">{t('tracker_cancel')}</button>
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
    <div className={`bg-white border rounded-md p-5 text-center hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${highlight ? 'border-amber-300' : 'border-neutral-200'}`}>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1.5 font-medium">{label}</div>
    </div>
  )
}
