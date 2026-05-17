const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

/**
 * Call the Bedrock-powered Lambda to get state-specific program recommendations.
 * Falls back to static programs if the API is unavailable.
 */
export async function fetchBedrockEligibility(answers) {
  if (!API_BASE) throw new Error('No API endpoint configured')

  const response = await fetch(`${API_BASE}/eligibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({ answers }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const data = await response.json()
  const programs = data.programs || []

  // Normalize fields so Results.jsx works with both Bedrock and static programs
  return programs.map(p => ({
    ...p,
    nameKey: p.nameKey || p.name || p.id,
    descKey: p.descKey || p.description || '',
    whyKey:  p.whyKey  || p.why          || '',
    fullKey: p.fullKey || p.fullName     || p.name || '',
    documents:      p.documents      || [],
    renewalMonths:  p.renewalMonths  ?? 12,
    waitlist:       p.waitlist       ?? false,
    applicationUrl: p.applicationUrl || 'https://benefits.gov',
    estimatedAnnual: Number(p.estimatedAnnual) || 0,
  }))
}
