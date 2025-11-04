require('dotenv').config();
const fetch = require('node-fetch');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

console.log('=== Server Telegram Test ===');
console.log('BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('CHAT_ID:', TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET');

async function testServerTelegram() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('❌ Telegram not configured');
    return false;
  }

  try {
    console.log('\n=== Sending Test Message ===');
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: '🔐 <b>Test from Server</b>\n\nThis is a test message from the main server!',
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Telegram message sent successfully!');
      console.log('Message ID:', result.result.message_id);
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

testServerTelegram();




