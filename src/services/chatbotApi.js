import { useStore } from '../store/store';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function chatWithBot(message, programId) {
  const { userId } = useStore();
  
  try {
    const response = await fetch(`${API_BASE}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        program_id: programId,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chatbot API error:', error);
    throw error;
  }
}
