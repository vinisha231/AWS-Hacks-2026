import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = express.Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

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
  "newFlaggedTopics": ["<topics detected that should be avoided>"],
  "interventionNeeded": <true|false>,
  "contextFlags": {
    "isNighttime": <true|false>,
    "seemsIsolated": <true|false>,
    "highStress": <true|false>
  }
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    res.json(JSON.parse(clean))
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
- Is COMPLETELY NEW territory with zero association to past habits or trauma
- Targets the depleted hormone: ${depletedHormone}
- NEVER references these flagged topics: ${JSON.stringify(flaggedTriggers)}
- Avoid activities already used today: ${JSON.stringify(usedActivities)}
- Favor categories with high resonance scores: ${JSON.stringify(sparkProfile)}

Context flags: ${JSON.stringify(contextFlags)}

Hormone guidance:
- dopamine: novelty, micro-achievements, curiosity, learning one tiny new thing
- serotonin: grounding, present moment, something beautiful in the world
- oxytocin: one tiny act of connection or warmth (no pressure, just warmth)
- endorphins: physical movement, breath, body awareness

Return ONLY this JSON, no preamble, no markdown:
{
  "title": "<short compelling title under 6 words>",
  "instruction": "<warm, specific, encouraging 2-sentence instruction>",
  "durationMinutes": 7,
  "hormoneTarget": "${depletedHormone}",
  "category": "language|movement|creativity|curiosity|mindfulness",
  "openingLine": "<the exact warm 1-2 sentence spoken message Ember delivers aloud>"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    res.json(JSON.parse(clean))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
