# Запрос для BugBot: ReplyKeyboard не скрывается при отправке msg3B

## Контекст
Telegram бот на Node.js использует Telegraf v4.16.3. При отправке сообщения msg3B (Price message) в ветке B необходимо скрыть ReplyKeyboard, но она не скрывается.

## Проблема
Когда пользователь отправляет объявление и бот отвечает сообщением msg3B с inline-кнопками (строки ~968-988 в index.js), ReplyKeyboard остается видимой на экране пользователя. Ожидается, что она должна быть скрыта.

## Технические детали
- **Библиотека**: Telegraf v4.16.3
- **Node.js**: (используется встроенный fetch Node.js 18+)
- **Файл**: index.js, строки ~968-988 (для одиночных сообщений) и ~908-935 (для альбомов)

## Текущий код (не работает)
```javascript
if (st.flow === 'B') {
  // Агрессивное удаление ReplyKeyboard: сначала создаем, потом удаляем
  const k1 = await ctx.reply('‎', {
    disable_notification: true,
    reply_markup: {
      keyboard: [[{ text: '‎' }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  }).catch(() => null);
  
  await new Promise(r => setTimeout(r, 100));
  
  const k2 = await ctx.reply('‎', {
    disable_notification: true,
    reply_markup: { remove_keyboard: true }
  }).catch(() => null);
  
  // Отправляем msg3B с inline-кнопками
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(cfg.btnBFreePlacement || 'бесплатное размещение', 'b:freePlacement')],
    [Markup.button.callback(cfg.btnBProceedMedia || 'Отправить медиа', 'b:proceedMedia')]
  ]);
  await ctx.reply(cfg.msg3B || 'Продолжим?', { ...keyboard, ...MSG_OPTS });
  
  // Удаляем служебные сообщения
  setTimeout(() => {
    if (k1) bot.telegram.deleteMessage(k1.chat.id, k1.message_id).catch(() => {});
    if (k2) bot.telegram.deleteMessage(k2.chat.id, k2.message_id).catch(() => {});
  }, 600);
  return;
}
```

## Что уже было испробовано
1. ✅ Попытка объединить `inline_keyboard` и `remove_keyboard` в одном `reply_markup` - не работает (Telegram API не поддерживает)
2. ✅ Отправка отдельного сообщения с `remove_keyboard: true` перед msg3B - не работает
3. ✅ Агрессивный подход: создание временной ReplyKeyboard, затем удаление через 100ms - не работает

## Важные детали
- ReplyKeyboard появляется автоматически при вводе текста пользователем (это стандартное поведение Telegram клиентов)
- Бот никогда явно не устанавливает ReplyKeyboard - она появляется автоматически от клиента Telegram
- В коде есть функция `hideKeyboardAggressively` (строка 746), которая работает в других местах, но аналогичный подход здесь не помогает
- Проблема возникает именно при отправке msg3B с inline-кнопками

## Вопрос для BugBot
Как правильно скрыть ReplyKeyboard при отправке сообщения с inline-кнопками в Telegraf v4? Возможно ли это вообще, если ReplyKeyboard была показана автоматически клиентом Telegram, а не установлена ботом явно?

## Ожидаемое поведение
При отправке msg3B ReplyKeyboard должна быть скрыта, а пользователь должен видеть только inline-кнопки под сообщением.
