import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only plugin: provides a local /translate endpoint backed by Amazon Translate.
// In production, set VITE_API_ENDPOINT to the deployed Lambda API Gateway URL instead.
function awsTranslatePlugin() {
  return {
    name: 'aws-translate',
    configureServer(server) {
      server.middlewares.use('/translate', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          return res.end()
        }
        if (req.method !== 'POST') return next()

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { TranslateClient, TranslateTextCommand } = await import('@aws-sdk/client-translate')
            const { texts, target } = JSON.parse(body)

            const region = process.env.VITE_AWS_REGION || process.env.AWS_REGION || 'us-east-1'
            const credentials = process.env.AWS_ACCESS_KEY_ID
              ? {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
                }
              : undefined // falls back to default credential chain (~/.aws, instance role, etc.)

            const client = new TranslateClient({ region, ...(credentials ? { credentials } : {}) })

            const translated = await Promise.all(
              texts.map(async text => {
                if (!text || !text.trim()) return text
                const cmd = new TranslateTextCommand({
                  Text: text,
                  SourceLanguageCode: 'en',
                  TargetLanguageCode: target.split('-')[0], // Amazon Translate uses base codes
                })
                const result = await client.send(cmd)
                return result.TranslatedText
              })
            )

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ translated }))
          } catch (err) {
            console.error('[translate plugin]', err.message)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), awsTranslatePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react:  ['react', 'react-dom'],
          router: ['react-router-dom'],
          store:  ['zustand'],
        }
      }
    },
    chunkSizeWarningLimit: 200,
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    headers: { 'Cache-Control': 'public, max-age=31536000' }
  }
})
