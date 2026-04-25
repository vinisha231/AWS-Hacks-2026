import express from 'express'

const router = express.Router()
const CONNECTION = 'Username-Password-Authentication'

// Read at request-time so dotenv is already loaded
const cfg = () => ({
  DOMAIN: process.env.AUTH0_DOMAIN,
  CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
})

function toEmail(username) {
  return `${username.toLowerCase().trim()}@ember.app`
}

// Create account — calls Auth0 /dbconnections/signup (no secret needed)
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
      const msg = data.description || data.message || 'Signup failed'
      if (msg.includes('already exists') || msg.includes('registered')) {
        return res.status(409).json({ error: 'Username already taken.' })
      }
      return res.status(400).json({ error: msg })
    }
    // Auto-login after signup
    return loginUser(username, password, res)
  } catch (e) {
    console.error('SIGNUP ERROR:', e.message, e.cause)
    res.status(500).json({ error: e.message, cause: e.cause?.message, code: e.cause?.code })
  }
})

// Sign in — Auth0 Resource Owner Password Grant
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
      const msg = data.error_description || data.error || 'Login failed'
      if (msg.includes('Wrong email or password') || msg.includes('invalid_grant')) {
        return res.status(401).json({ error: 'Wrong username or password.' })
      }
      return res.status(401).json({ error: msg })
    }

    // Decode sub from id_token (base64)
    const payload = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64').toString())

    res.json({
      access_token: data.access_token,
      id_token: data.id_token,
      sub: payload.sub,
      username: payload['user_metadata']?.username || username,
      expires_in: data.expires_in
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export default router
