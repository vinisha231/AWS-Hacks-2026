import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import geminiRoutes from './routes/gemini.js'
import elevenlabsRoutes from './routes/elevenlabs.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/gemini', geminiRoutes)
app.use('/api/elevenlabs', elevenlabsRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.listen(3001, () => console.log('🔥 Ember server running on :3001'))
