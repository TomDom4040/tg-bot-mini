require('dotenv').config();

// Копируем функции из основного файла
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function sendTelegramMessage(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured');
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('Telegram message sent successfully');
      return true;
    } else {
      console.error('Telegram error:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return false;
  }
}

async function sendPasswordResetEmail(email, resetToken) {
  console.log('Attempting to send password reset for:', email);
  console.log('Reset token:', resetToken);
  
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;
  console.log('Reset URL:', resetUrl);
  
  // Отправляем через Telegram
  const telegramMessage = `
🔐 <b>Сброс пароля</b>

Email: <code>${email}</code>
Ссылка для сброса: <a href="${resetUrl}">Сбросить пароль</a>

Ссылка действительна в течение 1 часа.
  `;
  
  const telegramSent = await sendTelegramMessage(telegramMessage);
  if (telegramSent) {
    console.log('Password reset sent via Telegram');
    return true;
  }
  
  // Если ничего не работает, выводим токен в консоль
  console.log('Password reset token (fallback):', resetToken);
  return false;
}

// Тестируем
async function test() {
  console.log('=== Testing Password Reset ===');
  console.log('Email: people.us20@gmail.com');
  console.log('Token: test-token-123');
  
  const result = await sendPasswordResetEmail('people.us20@gmail.com', 'test-token-123');
  console.log('Result:', result);
}

test();
