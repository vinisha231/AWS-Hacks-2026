const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

export async function scheduleRenewalReminder({ programId, programName, renewalDate, phone, email, userName }) {
  if (!API_BASE) {
    await new Promise(r => setTimeout(r, 800))
    return { success: true, demo: true, messageId: 'demo-' + Date.now() }
  }

  const res = await fetch(`${API_BASE}/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({
      programId,
      programName,
      renewalDate,
      phone:              phone    || null,
      userName:           userName || 'there',
      reminderDaysBefore: 30,
    }),
  })

  if (!res.ok) throw new Error(`SNS notify failed: ${res.status}`)
  return res.json()
}
