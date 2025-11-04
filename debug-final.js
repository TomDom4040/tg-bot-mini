require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('=== Final Debug Test ===');
console.log('TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET');
console.log('BASE_URL:', BASE_URL);

async function testTelegram() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('❌ Telegram not configured');
    return false;
  }

  try {
    console.log('📤 Sending test message...');
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: '🔐 <b>Test Password Reset</b>\n\nThis is a test message!',
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Telegram message sent successfully!');
      return true;
    } else {
      console.error('❌ Telegram error:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Telegram send failed:', error.message);
    return false;
  }
}

testTelegram();




