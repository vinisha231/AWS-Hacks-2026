import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS } from '../data/programs'
import Layout from '../components/Layout'

const STATUS_OPTIONS = ['not_started', 'in_progress', 'applied', 'approved', 'renewal_due']
const STATUS_COLORS = {
  not_started:  { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Not started' },
  in_progress:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'In progress' },
  applied:      { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Applied' },
  approved:     { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved ✓' },
  renewal_due:  { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Renewal due' },
}

function statusLabel(status) {
  return STATUS_COLORS[status]?.label || 'Not started'
}

function getRenewalDate(updatedAt, renewalMonths) {
  if (!updatedAt) return null
  const d = new Date(updatedAt)
  d.setMonth(d.getMonth() + renewalMonths)
  return d
}

function daysUntil(date) {
  if (!date) return null
  const diff = Math.round((date - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tracker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tracker, setTrackerStatus, clearTracker, savedPrograms } = useStore()
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const trackedIds = Object.keys(tracker)
  const trackedPrograms = trackedIds.map(id => {
    const program = PROGRAMS.find(p => p.id === id)
    const entry = tracker[id]
    if (!program) return null
    return { ...program, ...entry }
  }).filter(Boolean)

  const approvedCount = trackedPrograms.filter(p => p.status === 'approved').length
  const appliedCount  = trackedPrograms.filter(p => p.status === 'applied').length
  const totalApproved = trackedPrograms
    .filter(p => p.status === 'approved')
    .reduce((s, p) => {
      const result = savedPrograms.find(r => r.id === p.id)
      return s + (result?.estimatedAnnual || p.estimatedAnnual?.(1, 2500, []) || 0)
    }, 0)

  const handleStatusChange = (id, status) => {
    setTrackerStatus(id, status)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-1">{t('tracker_headline')}</h1>
          <p className="text-slate-500">{t('tracker_sub')}</p>
        </div>

        {/* Summary stats */}
        {trackedPrograms.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Programs tracked" value={trackedPrograms.length} color="text-blue-600" />
            <StatCard label="Applied" value={appliedCount + approvedCount} color="text-violet-600" />
            <StatCard label="Approved value" value={totalApproved > 0 ? `$${(totalApproved/1000).toFixed(1)}k/yr` : '—'} color="text-emerald-600" />
          </div>
        )}

        {/* Programs list */}
        {trackedPrograms.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🧭</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{t('tracker_empty')}</h3>
            <p className="text-slate-500 mb-6">{t('tracker_empty_sub')}</p>
            <Link
              to="/intake"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-block"
            >
              {t('tracker_find')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trackedPrograms.map(program => {
              const colors = STATUS_COLORS[program.status] || STATUS_COLORS.not_started
              const renewal = program.status === 'approved'
                ? getRenewalDate(program.updatedAt, program.renewalMonths)
                : null
              const daysLeft = renewal ? daysUntil(renewal) : null

              return (
                <div key={program.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <span
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: program.bgColor }}
                    >
                      {program.icon}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-bold text-slate-900">{t(program.nameKey)}</h3>
                          <p className="text-slate-500 text-xs">{t(program.fullKey)}</p>
                        </div>

                        {/* Status badge */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${colors.bg} ${colors.text}`}>
                          {statusLabel(program.status)}
                        </span>
                      </div>

                      {/* Renewal alert */}
                      {renewal && daysLeft !== null && daysLeft <= 60 && (
                        <div className={`mt-2 text-xs rounded-lg px-3 py-2 font-medium flex items-center gap-2
                          ${daysLeft <= 14 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                        >
                          {daysLeft <= 14 ? '🚨' : '⏰'}
                          Renewal due {daysLeft <= 0 ? 'NOW' : `in ${daysLeft} days`} —{' '}
                          {new Date(renewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}

                      {renewal && daysLeft !== null && daysLeft > 60 && (
                        <p className="mt-1.5 text-xs text-slate-400">
                          Next renewal: {renewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({daysLeft} days)
                        </p>
                      )}

                      {/* Status selector + Apply */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <select
                          value={program.status || 'not_started'}
                          onChange={e => handleStatusChange(program.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white outline-none focus:border-blue-400 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{statusLabel(s)}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => navigate(`/apply/${program.id}`)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View application →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Clear all */}
            <div className="text-center pt-2">
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                  {t('tracker_clear')}
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center gap-4">
                  <p className="text-red-700 text-sm font-medium">Clear all tracked programs?</p>
                  <button
                    onClick={() => { clearTracker(); setShowConfirmClear(false) }}
                    className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="text-slate-500 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Find more */}
        {trackedPrograms.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/intake"
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
            >
              + Check for more benefits →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
