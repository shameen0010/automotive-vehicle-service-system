import fetch from 'node-fetch';
export async function emitFinanceEvent(type, payload) {
  try {
    if (!process.env.FINANCE_WEBHOOK_URL) return;
    await fetch(process.env.FINANCE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    });
  } catch (e) { console.warn('Finance webhook failed:', e.message); }
}
