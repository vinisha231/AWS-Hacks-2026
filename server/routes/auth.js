import express from 'express'

const router = express.Router()
const CONNECTION = 'Username-Password-Authentication'

const cfg = () => ({
  DOMAIN: process.env.AUTH0_DOMAIN,
  CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
})

function toEmail(username) {
  return `${username.toLowerCase().trim()}@ember.app`
}

function extractMsg(data) {
  // Auth0 password policy error has a human-readable `policy` field
  if (data?.code === 'invalid_password' || data?.name === 'PasswordStrengthError') {
    return 'Password needs: 8+ characters, uppercase letter, and a special character (e.g. TestPass123!)'
  }
  const v = data?.error_description || data?.message || data?.error || 'Unknown error'
  return typeof v === 'string' ? v : JSON.stringify(v)
}

router.post('/signup', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })

  try {
    const { DOMAIN, CLIENT_ID } = cfg()
    const r = await fetch(`https://${DOMAIN}/dbconnections/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        email: toEmail(username),
        password,
        connection: CONNECTION,
        user_metadata: { username }
      })
    })
    const data = await r.json()
    if (!r.ok) {
      const msg = extractMsg(data)
      if (msg.includes('already exists') || msg.includes('registered')) {
        return res.status(409).json({ error: 'Username already taken.' })
      }
      return res.status(400).json({ error: msg })
    }
    return loginUser(username, password, res)
  } catch (e) {
    console.error('SIGNUP ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
  return loginUser(username, password, res)
})

async function loginUser(username, password, res) {
  try {
    const { DOMAIN, CLIENT_ID, CLIENT_SECRET } = cfg()
    const r = await fetch(`https://${DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        realm: CONNECTION,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: toEmail(username),
        password,
        scope: 'openid profile email',
        audience: `https://${DOMAIN}/api/v2/`
      })
    })
    const data = await r.json()
    if (!r.ok) {
      const msg = extractMsg(data)
      if (msg.toLowerCase().includes('wrong') || msg.includes('invalid_grant')) {
        return res.status(401).json({ error: 'Wrong username or password.' })
      }
      return res.status(401).json({ error: msg })
    }

    const payload = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64').toString())
    res.json({
      access_token: data.access_token,
      id_token: data.id_token,
      sub: payload.sub,
      username: payload?.['user_metadata']?.username || username,
      expires_in: data.expires_in
    })
  } catch (e) {
    console.error('LOGIN ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}

export default router
