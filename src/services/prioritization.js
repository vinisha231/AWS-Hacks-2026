import { getFPL } from '../data/programs'

function clamp(v, a = 0, b = 5) { return Math.max(a, Math.min(b, v)) }

function parseTimeToBenefit(str) {
  if (!str) return 3
  const s = String(str).toLowerCase()
  if (s.includes('same') || s.includes('expedited') || s.includes('same week') || s.includes('<1') || s.includes('days')) return 5
  if (s.includes('week') && !s.includes('month')) return 4
  if (s.includes('2–8') || s.includes('2-8') || s.includes('month') || s.includes('months')) return 2
  if (s.includes('years') || s.includes('waitlist')) return 1
  return 3
}

function urgencyForProgram(program, answers) {
  // Basic urgency signals
  const highRisk = answers.housingStatus === 'homeless' || (answers.monthlyIncome || 0) <= 100
  const hasChildren = (answers.householdMembers || []).some(m => ['infant','toddler','school_child','teen','pregnant'].includes(m))
  if (program.category === 'housing') {
    if (highRisk) return 5
    if (answers.housingStatus === 'renting') return 4
    return 3
  }
  if (program.category === 'food') {
    if (highRisk) return 5
    if (hasChildren || (answers.employment === 'unemployed')) return 4
    return 3
  }
  if (program.category === 'health') {
    if (answers.healthCoverage === 'none') return 5
    return 3
  }
  // Financial programs
  if (program.category === 'financial') {
    if ((answers.employment === 'recently_unemployed' || answers.employment === 'unemployed')) return 4
    return 2
  }
  return 2
}

function eligibilityConfidence(program, answers) {
  // If program.check exists and passes, high confidence.
  try {
    const pass = typeof program.check === 'function' ? program.check(answers) : !!program.matches
    if (pass) return 5
  } catch (e) {
    // fallback
  }
  // If program has FPL-related checks, approximate confidence by closeness to limit
  // Use monthlyIncome & householdSize heuristics
  const income = (answers.monthlyIncome || 0) * 12
  const fpl = getFPL(answers.householdSize || 1)
  if (income <= fpl * 1.3) return 4
  if (income <= fpl * 1.6) return 3
  if (income <= fpl * 2.5) return 2
  return 1
}

function benefitValueScore(program, maxValue) {
  const est = Number(program.estimatedAnnual) || 0
  if (!maxValue || maxValue === 0) return 2
  const pct = est / maxValue
  if (pct >= 0.75) return 5
  if (pct >= 0.5) return 4
  if (pct >= 0.25) return 3
  if (pct > 0) return 2
  return 1
}

export function prioritize(programs = [], answers = {}, eligibilityMeta = {}) {
  const enriched = programs.map(p => ({ ...p }))
  // compute max estimated for normalization
  const maxEst = enriched.reduce((s, p) => Math.max(s, Number(p.estimatedAnnual) || 0), 0) || 1

  // detect crisis mode / high risk
  const highRisk = (answers.housingStatus === 'homeless') || ((answers.monthlyIncome || 0) <= 100) || (answers.householdSize && (answers.monthlyIncome || 0) === 0)

  // process each program
  const processed = enriched.map(p => {
    const timeScore = clamp(parseTimeToBenefit(p.timeToBenefit), 0, 5)
    const urgency = clamp(urgencyForProgram(p, answers), 0, 5)
    const eligibility = clamp(eligibilityConfidence(p, answers), 0, 5)
    const valueScore = clamp(benefitValueScore(p, maxEst), 0, 5)

    const final = (
      (urgency * 0.35) +
      (eligibility * 0.35) +
      (timeScore * 0.2) +
      (valueScore * 0.1)
    )

    return {
      ...p,
      scores: {
        urgency,
        eligibility,
        time: timeScore,
        value: valueScore,
        final: Number(final.toFixed(3)),
      },
    }
  })

  // SNAP fallback wiring: if SNAP delayed or low confidence, suggest nonprofits
  const snapProg = processed.find(p => p.id === 'snap')
  const nonprofits = eligibilityMeta?.nonprofits || []
  let fallbackSuggestions = []
  if (snapProg) {
    const snapDelay = (() => {
      const t = snapProg.timeToBenefit || ''
      const s = String(t).toLowerCase()
      if (s.includes('30')) return 30
      if (s.includes('week')) return 14
      if (s.includes('month')) return 30
      if (s.includes('years') || s.includes('waitlist')) return 999
      return 14
    })()
    const lowConfidence = snapProg.scores.eligibility <= 2
    const delayed = snapDelay > 14
    if (lowConfidence || delayed || eligibilityMeta?.snapFallback) {
      // suggest nonprofits (prefer provided list)
      fallbackSuggestions = nonprofits.length > 0 ? nonprofits : [
        { name: 'Local Food Bank', description: 'Emergency food and meals', phone: null, website: null, type: 'food' },
        { name: '211 / United Way', description: 'Connects to local services', phone: '211', website: 'https://www.211.org', type: 'crisis' },
      ]
    }
  }

  // Crisis override: if highRisk, promote nonprofits & emergency resources above others
  let finalList = processed.slice()
  if (highRisk) {
    // put nonprofit-like programs (category not government) first — use eligibilityMeta.nonprofits as synthetic programs
    const emergency = []
    const others = []
    finalList.forEach(p => {
      if (p.category === 'housing' || p.category === 'food' || p.id === 'era') emergency.push(p)
      else others.push(p)
    })
    // Add nonprofit placeholders from eligibilityMeta at top
    const nonprofitProgs = (eligibilityMeta?.nonprofits || []).map((n, i) => ({
      id: `nonprofit_${i}`,
      name: n.name || n.title || 'Local partner',
      fullName: n.name || n.title || 'Local partner',
      desc: n.description || n.desc || 'Community resource',
      category: n.type || 'nonprofit',
      nonprofit: true,
      external: true,
      website: n.website,
      phone: n.phone,
      scores: { urgency: 5, eligibility: 5, time: 5, value: 3, final: 5 },
    }))
    finalList = [...nonprofitProgs, ...emergency, ...others]
  } else {
    // normal sort by final score desc
    finalList.sort((a, b) => (b.scores.final || 0) - (a.scores.final || 0))
  }

  // Assign tiers
  const tiered = finalList.map(p => {
    const f = p.scores?.final ?? 0
    let tier = 'long-term'
    if (f >= 4.0) tier = 'immediate'
    else if (f >= 3.0) tier = 'short-term'
    else tier = 'long-term'
    return { ...p, tier }
  })

  // attach fallback suggestions to top-level result
  return {
    programs: tiered,
    fallback: fallbackSuggestions,
    highRisk,
  }
}
