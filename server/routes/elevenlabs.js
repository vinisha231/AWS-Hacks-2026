import express from 'express'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

router.post('/speak', async (req, res) => {
  const { text, voiceId } = req.body
  const id = voiceId || DEFAULT_VOICE_ID
  const key = process.env.ELEVENLABS_API_KEY

  console.log('ElevenLabs speak request — voice:', id, '| key prefix:', key?.slice(0, 8))

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${id}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.35, similarity_boost: 0.90, style: 0.65, use_speaker_boost: true, speed: 1.15 }
        })
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs error:', response.status, err)
      return res.status(response.status).json({ error: err })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.set('Content-Type', 'audio/mpeg')
    res.set('Content-Length', buffer.length)
    res.send(buffer)
  } catch (err) {
    console.error('ElevenLabs fetch error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/clone-voice', upload.array('samples'), async (req, res) => {
  const { personName } = req.body
  const form = new FormData()
  form.append('name', `${personName} - Ember`)
  form.append('description', `Voice clone for ${personName}`)
  req.files.forEach(f => {
    const blob = new Blob([f.buffer], { type: f.mimetype })
    form.append('files', blob, f.originalname)
  })
  form.append('labels', JSON.stringify({ use: 'ember_support' }))

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: form
    })
    const data = await response.json()
    res.json({ voiceId: data.voice_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
