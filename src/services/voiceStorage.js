// IndexedDB storage for voice check-ins — stores last 30 locally
const DB = 'ember-voice'
const STORE = 'checkins'
const MAX = 30

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        s.createIndex('ts', 'ts')
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

export async function saveCheckin({ audioBlob, transcript, mood, response, affirmation, riskScore }) {
  const db = await open()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)

  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null

  store.add({
    ts: Date.now(),
    audioBlob,
    audioUrl,
    transcript,
    mood,
    response,
    affirmation,
    riskScore,
  })

  // Trim to MAX
  const all = await new Promise(r => { const req = store.getAll(); req.onsuccess = () => r(req.result) })
  if (all.length > MAX) {
    const toDelete = all.sort((a, b) => a.ts - b.ts).slice(0, all.length - MAX)
    toDelete.forEach(item => store.delete(item.id))
  }

  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
}

export async function getCheckins() {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).index('ts').getAll()
    req.onsuccess = () => resolve(req.result.reverse())
    req.onerror = reject
  })
}
