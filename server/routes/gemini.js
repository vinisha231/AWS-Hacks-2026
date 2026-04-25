import express from 'express'

const router = express.Router()

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  const raw = data.candidates[0].content.parts[0].text
  return raw.replace(/```json|```/g, '').trim()
}

router.post('/analyze-mood', async (req, res) => {
  const { transcript, flaggedTriggers, timeOfDay } = req.body
  const prompt = `
You are Ember's emotional intelligence engine for addiction recovery.
Analyze this voice check-in transcript and return ONLY valid JSON.

Transcript: "${transcript}"
Time of day: ${timeOfDay}
Topics to flag (trauma-linked, DO NOT suggest): ${JSON.stringify(flaggedTriggers)}

Return ONLY this JSON shape, no preamble, no markdown:
{
  "riskScore": <0-100>,
  "depletedHormone": "dopamine|serotonin|oxytocin|endorphins",
  "emotionalState": "<1-3 words>",
  "newFlaggedTopics": [],
  "interventionNeeded": <true|false>,
  "contextFlags": {
    "isNighttime": <true|false>,
    "seemsIsolated": <true|false>,
    "highStress": <true|false>
  }
}`
  try {
    res.json(JSON.parse(await callGemini(prompt)))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate-spark', async (req, res) => {
  const { depletedHormone, contextFlags, sparkProfile, usedActivities, flaggedTriggers } = req.body
  const prompt = `
You are Ember's Spark Engine. Generate a craving redirect activity for someone in addiction recovery.

Rules:
- Takes exactly 5-7 minutes
- Requires NO social interaction if seemsIsolated is true
- Requires NO leaving home if isNighttime is true
- Targets the depleted hormone: ${depletedHormone}
- NEVER references these flagged topics: ${JSON.stringify(flaggedTriggers || [])}
- Avoid activities already used today: ${JSON.stringify(usedActivities || [])}
- Favor categories with high resonance: ${JSON.stringify(sparkProfile || {})}

Context: ${JSON.stringify(contextFlags || {})}

Hormone guidance:
- dopamine: novelty, micro-achievements, curiosity, learning one new thing
- serotonin: grounding, present moment, beauty in the world
- oxytocin: one tiny act of warmth (no pressure)
- endorphins: movement, breath, body awareness

Return ONLY this JSON, no preamble:
{
  "title": "<compelling title under 6 words>",
  "instruction": "<warm, specific, encouraging 2-sentence instruction>",
  "durationMinutes": 7,
  "hormoneTarget": "${depletedHormone}",
  "category": "language|movement|creativity|curiosity|mindfulness",
  "openingLine": "<warm 1-2 sentence spoken message Ember delivers aloud>"
}`
  try {
    res.json(JSON.parse(await callGemini(prompt)))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
