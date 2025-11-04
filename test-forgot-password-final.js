require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('=== Final Test Forgot Password ===');
console.log('TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET');
console.log('BASE_URL:', BASE_URL);

async function testForgotPassword() {
  const email = 'people.us20@gmail.com';
  const resetUrl = `${BASE_URL}/reset-password?token=test-token-${Date.now()}`;
  const telegramMessage = `🔐 <b>Сброс пароля</b>

Email: <code>${email}</code>
Ссылка для сброса: <a href="${resetUrl}">Сбросить пароль</a>

Ссылка действительна в течение 1 часа.`;
  
  console.log('Sending Telegram message...');
  console.log('Message:', telegramMessage);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    console.log('Telegram API response:', result);
    
    if (result.ok) {
      console.log('✅ Telegram message sent successfully!');
      console.log('Message ID:', result.result.message_id);
      return true;
    } else {
      console.error('❌ Telegram error:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Telegram send error:', error.message);
    return false;
  }
}

testForgotPassword();




