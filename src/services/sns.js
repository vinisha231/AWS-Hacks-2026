/**
 * Amazon SNS notification service.
 * Sends renewal reminders via API Gateway → Lambda → SNS.
 * Set VITE_SNS_ENDPOINT to your API Gateway URL to go live.
 */

const ENDPOINT = import.meta.env.VITE_SNS_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

export async function scheduleRenewalReminder({ programId, programName, renewalDate, phone, email }) {
  if (!ENDPOINT) {
    // Demo mode — simulate a successful SNS schedule
    await new Promise(r => setTimeout(r, 800))
    return { success: true, demo: true, messageId: 'demo-' + Date.now() }
  }

  const res = await fetch(`${ENDPOINT}/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      programId,
      programName,
      renewalDate,
      phone:  phone  || null,
      email:  email  || null,
      reminderDaysBefore: 30,
      message: `Reminder: Your ${programName} benefit renewal is due on ${new Date(renewalDate).toLocaleDateString()}. Visit Compass to start your renewal.`,
    }),
  })

  if (!res.ok) throw new Error(`SNS schedule failed: ${res.status}`)
  return res.json()
}
