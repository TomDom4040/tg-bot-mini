require('dotenv').config();

const BOT_TOKEN = '8435259716:AAGW9FVJaNEMWfyfJB_wTC7IQO4yLdYM7TU';

async function getChatId() {
  try {
    console.log('🔍 Получаем обновления от бота...');
    console.log('📱 Сначала напишите боту любое сообщение в Telegram!');
    console.log('⏳ Ждем 10 секунд...\n');
    
    // Ждем 10 секунд
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (data.ok && data.result.length > 0) {
      const lastMessage = data.result[data.result.length - 1];
      const chatId = lastMessage.message.chat.id;
      const username = lastMessage.message.from.username || lastMessage.message.from.first_name;
      
      console.log('✅ Chat ID найден!');
      console.log('👤 Пользователь:', username);
      console.log('🆔 Chat ID:', chatId);
      console.log('\n📝 Добавьте этот Chat ID в файл .env:');
      console.log(`TELEGRAM_CHAT_ID=${chatId}`);
      
      return chatId;
    } else {
      console.log('❌ Сообщения не найдены');
      console.log('💡 Убедитесь, что вы написали боту сообщение!');
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return null;
  }
}

getChatId();




