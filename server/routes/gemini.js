import express from 'express'

const router = express.Router()
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function callGemini(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    const data = await res.json()

    if (res.status === 429) {
      const wait = (attempt + 1) * 3000
      console.log(`Rate limited — retrying in ${wait}ms`)
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response: ' + raw.slice(0, 100))
    return JSON.parse(match[0])
  }
  throw new Error('Max retries exceeded')
}

router.post('/analyze-mood', async (req, res) => {
  const { transcript, flaggedTriggers, timeOfDay } = req.body
  const prompt = `You are Ember's emotional intelligence engine for addiction recovery.
Analyze this voice transcript and detect signs of craving or emotional distress.

Transcript: "${transcript}"
Time: ${timeOfDay}
Avoid suggesting these topics: ${JSON.stringify(flaggedTriggers || [])}

Return ONLY valid JSON, no markdown:
{
  "riskScore": <0-100, how urgent is intervention>,
  "depletedHormone": "dopamine|serotonin|oxytocin|endorphins",
  "emotionalState": "<2-4 words describing their state>",
  "cravingDetected": <true|false>,
  "newFlaggedTopics": [],
  "interventionNeeded": <true|false>,
  "contextFlags": {
    "isNighttime": <true|false>,
    "seemsIsolated": <true|false>,
    "highStress": <true|false>
  }
}`
  try {
    res.json(await callGemini(prompt))
  } catch (err) {
    console.error('analyze-mood error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate-spark', async (req, res) => {
  const { depletedHormone, contextFlags, sparkProfile, usedActivities, flaggedTriggers } = req.body
  const prompt = `You are Ember's Spark Engine. Generate a 7-minute craving redirect activity for someone in addiction recovery.

Depleted hormone: ${depletedHormone}
Context: ${JSON.stringify(contextFlags || {})}
Topics to NEVER mention: ${JSON.stringify(flaggedTriggers || [])}
Already used today (avoid): ${JSON.stringify(usedActivities || [])}
Resonance scores (higher = preferred): ${JSON.stringify(sparkProfile || {})}

Hormone rules:
- dopamine → novelty, micro-achievement, learn one tiny new thing
- serotonin → grounding, beauty, present-moment awareness
- oxytocin → one warm connection act, no pressure
- endorphins → movement, breath, body release

Return ONLY valid JSON, no markdown:
{
  "title": "<6 words max, compelling>",
  "instruction": "<2 warm specific sentences telling them exactly what to do>",
  "durationMinutes": 7,
  "hormoneTarget": "${depletedHormone}",
  "category": "language|movement|creativity|curiosity|mindfulness",
  "openingLine": "<1-2 sentences Ember speaks aloud — warm, personal, immediate>"
}`
  try {
    res.json(await callGemini(prompt))
  } catch (err) {
    console.error('generate-spark error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/daily-checkin', async (req, res) => {
  const { transcript, flaggedTriggers } = req.body
  const prompt = `You are Ember. Someone just shared their daily check-in with you.
Respond with warmth, insight, and genuine care. Keep it brief but meaningful.

What they said: "${transcript}"
Topics to avoid: ${JSON.stringify(flaggedTriggers || [])}

Return ONLY valid JSON:
{
  "mood": "<2-3 word description>",
  "depletedHormone": "dopamine|serotonin|oxytocin|endorphins",
  "riskScore": <0-100>,
  "response": "<Your warm 2-sentence spoken response back to them>",
  "affirmation": "<One short powerful sentence to carry through their day>"
}`
  try {
    res.json(await callGemini(prompt))
  } catch (err) {
    console.error('daily-checkin error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
