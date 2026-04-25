const BASE = 'http://localhost:3001/api/gemini'

export async function analyzeMood({ transcript, flaggedTriggers, journeyStage, pastBlockers }) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 6 ? 'late night' : hour < 12 ? 'morning'
    : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

  const res = await fetch(`${BASE}/analyze-mood`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, flaggedTriggers, timeOfDay, journeyStage, pastBlockers })
  })
  return res.json()
}

export async function generateSpark({
  depletedHormone = 'serotonin',
  contextFlags = {},
  sparkProfile = {},
  usedActivities = [],
  flaggedTriggers = [],
  journeyStage = null,
  pastBlockers = []
}) {
  const res = await fetch(`${BASE}/generate-spark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      depletedHormone, contextFlags, sparkProfile,
      usedActivities, flaggedTriggers, journeyStage, pastBlockers
    })
  })
  return res.json()
}
