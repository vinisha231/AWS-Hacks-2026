import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import geminiRoutes from './routes/gemini.js'
import elevenlabsRoutes from './routes/elevenlabs.js'
import { initSocket } from './socket.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

initSocket(io)

app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api/gemini', geminiRoutes)
app.use('/api/elevenlabs', elevenlabsRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`🔥 Ember server running on :${PORT}`))
