require('dotenv').config();

console.log('=== Telegram Configuration ===');
console.log('BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET');

async function testTelegram() {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('❌ Telegram not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
    return;
  }

  try {
    console.log('\n=== Sending Test Message ===');
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: '🔐 <b>Test Message</b>\n\nThis is a test message from Admin Panel!',
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Telegram message sent successfully!');
      console.log('Message ID:', result.result.message_id);
    } else {
      console.error('❌ Telegram error:', result.description);
    }
  } catch (error) {
    console.error('❌ Telegram send failed:', error.message);
  }
}

testTelegram();
