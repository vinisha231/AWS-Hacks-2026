import express from 'express'
import axios from 'axios'
import multer from 'multer'

const router = express.Router()
const XI_KEY = process.env.ELEVENLABS_API_KEY
const upload = multer({ storage: multer.memoryStorage() })

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

router.post('/speak', async (req, res) => {
  const { text, voiceId } = req.body
  const id = voiceId || DEFAULT_VOICE_ID

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${id}/stream`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': XI_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    )
    res.set('Content-Type', 'audio/mpeg')
    res.send(Buffer.from(response.data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/clone-voice', upload.array('samples'), async (req, res) => {
  const { personName } = req.body
  const { default: FormData } = await import('form-data')
  const form = new FormData()

  form.append('name', `${personName} - Ember`)
  form.append('description', `Voice clone for ${personName}`)
  req.files.forEach(f => form.append('files', f.buffer, f.originalname))
  form.append('labels', JSON.stringify({ use: 'ember_support' }))

  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      form,
      { headers: { ...form.getHeaders(), 'xi-api-key': XI_KEY } }
    )
    res.json({ voiceId: response.data.voice_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
