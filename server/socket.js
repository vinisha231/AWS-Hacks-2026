const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function moderateMessage(text) {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a content moderator for an anonymous addiction recovery peer chat.
Analyze this message and return ONLY valid JSON:
{
  "safe": <true if message is OK to send, false if it must be blocked>,
  "reason": "<why it was blocked, or empty string if safe>",
  "type": "safe|pii|harassment|self_harm|explicit"
}

Block if: phone numbers, addresses, real names combined with contact info, sexual content, severe harassment, detailed self-harm methods, or doxxing attempts.
Allow: venting, strong language, emotional distress, asking for support, sharing struggles.

Message: "${text.replace(/"/g, '\\"').slice(0, 500)}"`
          }]
        }]
      })
    })
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { safe: true }
    return JSON.parse(match[0])
  } catch {
    return { safe: true }
  }
}

// waiting queue: [{ socketId, username }]
const waitingQueue = []
// rooms: { roomId: { users: [socketId, socketId] } }
const rooms = new Map()

function findRoom(socketId) {
  for (const [roomId, room] of rooms) {
    if (room.users.includes(socketId)) return roomId
  }
  return null
}

export function initSocket(io) {
  io.on('connection', (socket) => {

    // User wants to find a peer
    socket.on('peer:find', ({ username }) => {
      // Not already in a room
      if (findRoom(socket.id)) return

      const partner = waitingQueue.shift()
      if (partner && partner.socketId !== socket.id) {
        // Match found — create room
        const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        rooms.set(roomId, { users: [partner.socketId, socket.id] })

        socket.join(roomId)
        const partnerSocket = io.sockets.sockets.get(partner.socketId)
        partnerSocket?.join(roomId)

        io.to(partner.socketId).emit('peer:matched', { roomId, partnerName: 'Anonymous' })
        socket.emit('peer:matched', { roomId, partnerName: 'Anonymous' })
      } else {
        // Join waiting queue
        waitingQueue.push({ socketId: socket.id, username })
        socket.emit('peer:waiting')
      }
    })

    // Cancel waiting
    socket.on('peer:cancel', () => {
      const idx = waitingQueue.findIndex(w => w.socketId === socket.id)
      if (idx !== -1) waitingQueue.splice(idx, 1)
      socket.emit('peer:cancelled')
    })

    // Chat message
    socket.on('peer:message', async ({ roomId, text }) => {
      const room = rooms.get(roomId)
      if (!room?.users.includes(socket.id)) return

      const moderation = await moderateMessage(text)

      if (!moderation.safe) {
        // Warn sender
        socket.emit('peer:moderated', {
          reason: moderation.reason,
          type: moderation.type
        })
        // End room if severe
        if (moderation.type === 'harassment' || moderation.type === 'pii') {
          io.to(roomId).emit('peer:ended', {
            reason: `Session ended: ${moderation.type === 'pii' ? 'personal information detected' : 'community guidelines violated'}.`
          })
          cleanupRoom(io, roomId)
        }
        return
      }

      // Deliver message to both (sender sees it echoed back, partner sees it)
      io.to(roomId).emit('peer:receive', {
        from: socket.id,
        text,
        ts: Date.now()
      })
    })

    // Voice audio chunk (base64)
    socket.on('peer:audio', ({ roomId, audioBase64, mimeType }) => {
      const room = rooms.get(roomId)
      if (!room?.users.includes(socket.id)) return
      // Relay audio to partner only
      room.users.forEach(uid => {
        if (uid !== socket.id) {
          io.to(uid).emit('peer:audio', { audioBase64, mimeType, from: socket.id })
        }
      })
    })

    // Either user ends the session
    socket.on('peer:end', ({ roomId }) => {
      const room = rooms.get(roomId)
      if (!room?.users.includes(socket.id)) return
      io.to(roomId).emit('peer:ended', { reason: 'Your partner ended the session.' })
      cleanupRoom(io, roomId)
    })

    // Disconnect cleanup
    socket.on('disconnect', () => {
      // Remove from waiting queue
      const idx = waitingQueue.findIndex(w => w.socketId === socket.id)
      if (idx !== -1) waitingQueue.splice(idx, 1)

      // End any active room
      const roomId = findRoom(socket.id)
      if (roomId) {
        socket.to(roomId).emit('peer:ended', { reason: 'Your partner disconnected.' })
        cleanupRoom(io, roomId)
      }
    })
  })
}

function cleanupRoom(io, roomId) {
  const room = rooms.get(roomId)
  if (room) {
    room.users.forEach(uid => {
      io.sockets.sockets.get(uid)?.leave(roomId)
    })
    rooms.delete(roomId)
  }
}
