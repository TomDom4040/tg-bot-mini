// index.js — бот с ветками A/B, HTML, без превью ссылок, админка с загрузкой картинок.
// Публикация:
//  • Ветка A: объявление → targetChatId.
//  • Ветка B: объявление → targetChatId, и одновременно объявление+медиа → targetChatIdB2.
// К объявлению добавляются 2 кнопки: профиль автора (если есть username) и ваша постоянная.
// К медиа (ветка B) кнопки НЕ добавляются.
// Текстовые объявления публикуются как фото с подписью при наличии fallback-картинки A/B.
// Ветка B: «агрессивное» сворачивание экранной клавиатуры.
// Новое: в финальных сообщениях (A: msg3A, B: msgBMediaConfirm) — кнопка
//        “начать заново” (текст настраивается), по нажатию бот делает /start.

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { Telegraf, Markup } = require('telegraf');

// ── ENV ────────────────────────────────────────────────────────────────────────
const BOT_TOKEN  = process.env.BOT_TOKEN;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';
const PORT       = Number(process.env.PORT || 3000);
if (!BOT_TOKEN) { console.error('ERROR: Set BOT_TOKEN'); process.exit(1); }

// ── Init ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.urlencoded({ extended: true }));
const bot = new Telegraf(BOT_TOKEN);

// Единые опции для сообщений бота
const MSG_OPTS = { parse_mode: 'HTML', disable_web_page_preview: true };

// ── Uploads (multer) ──────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'data', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, 'fallback_' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});
app.use('/uploads', express.static(uploadDir)); // превью в админке

// ── Store ──────────────────────────────────────────────────────────────────────
const storePath = path.join(__dirname, 'data', 'messages.json');
function readStore() { try { return JSON.parse(fs.readFileSync(storePath,'utf8')); } catch { return {}; } }
function writeStore(obj) { const merged = { ...readStore(), ...obj }; fs.writeFileSync(storePath, JSON.stringify(merged, null, 2),'utf8'); }
function readConfig() {
  const s = readStore();
  const ttl = Math.max(0, Number(s.ttlSeconds || 0) || 0);
  return {
    msg1: String(s.msg1 || ''),
    btn1Text: String(s.btn1Text || 'Кнопка 1'),
    btn2Text: String(s.btn2Text || 'Кнопка 2'),
    msg2Common: String(s.msg2Common || 'Пришлите сообщение.'),

    msg3A: String(s.msg3A || 'Спасибо! Ваше объявление принято.'),

    // Цели
    targetChatId: String(s.targetChatId || '').trim(),      // основная цель
    targetChatIdB2: String(s.targetChatIdB2 || '').trim(),  // доп. цель для ветки B

    // Ветка B
    msg3B: String(s.msg3B || 'Нажмите кнопку, чтобы продолжить.'),
    btnBProceedMedia: String(s.btnBProceedMedia || 'Отправить медиа'),
    msgBAskMedia: String(s.msgBAskMedia || 'Отправьте медиа.'),
    msgBMediaConfirm: String(s.msgBMediaConfirm || 'Готово!'),

    // Кнопки под объявлением
    userBtnText: String(s.userBtnText || 'Связаться с автором'), // верхняя (профиль)
    publishBtnText: String(s.publishBtnText || ''),              // нижняя (постоянная)
    publishBtnUrl:  String(s.publishBtnUrl  || ''),

    // Кнопка “начать заново” (в финальных сообщениях)
    finalBtnText: String(s.finalBtnText || 'Начать сначала'),

    // Fallback-картинки
    fallbackImageA: String(s.fallbackImageA || ''),
    fallbackImageB: String(s.fallbackImageB || ''),

    ttlSeconds: ttl,
    deleteUserMessages: !!(s.deleteUserMessages),
  };
}
function esc(s=''){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function toPublicUrl(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const base = path.basename(p);
  const candidate = path.join(uploadDir, base);
  if (fs.existsSync(candidate)) return '/uploads/' + base;
  return '';
}
function toAbsPath(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  if (path.isAbsolute(p)) return p;
  return path.join(__dirname, p);
}

// ── Basic Auth ─────────────────────────────────────────────────────────────────
function basicAuth(req,res,next){
  const hdr=req.headers.authorization||'';
  if (hdr.startsWith('Basic ')) {
    const [u,p]=Buffer.from(hdr.slice(6),'base64').toString().split(':');
    if (u===ADMIN_USER && p===ADMIN_PASS) return next();
  }
  res.set('WWW-Authenticate','Basic realm="Bot Admin"');
  res.status(401).send('Auth required');
}

// ── Admin UI ───────────────────────────────────────────────────────────────────
app.get('/admin', basicAuth, (req,res)=>{
  const s = readConfig();
  const fallbackAUrl = toPublicUrl(s.fallbackImageA);
  const fallbackBUrl = toPublicUrl(s.fallbackImageB);

  res.send(`<!doctype html><meta charset="utf-8"><title>Bot Admin</title>
  <style>
    body{font:16px system-ui;margin:40px auto;max-width:1040px}
    textarea, input[type=text]{width:100%}
    textarea{min-height:64px}
    input[type=number]{width:140px}
    .row{margin-bottom:14px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
    .hint{color:#666}
    img.preview{max-width:240px;max-height:160px;display:block;margin-top:6px;border:1px solid #ddd;border-radius:8px}
  </style>
  <h2>админ панель</h2>
<p class="hint">
  Поддерживается HTML:<br>
  &lt;a href="https://..."&gt;ссылка&lt;/a&gt;<br>
  &lt;b&gt;жирный&lt;/b&gt;<br>
  &lt;i&gt;курсив&lt;/i&gt;
</p>
  <form method="POST" action="/admin" enctype="multipart/form-data">
    <div class="row"><label>приветственное сообщение<br><textarea name="msg1">${esc(s.msg1)}</textarea></label></div>
    <div class="grid2">
      <div class="row"><label>Текст кнопки 1<br><input type="text" name="btn1Text" value="${esc(s.btn1Text)}"></label></div>
      <div class="row"><label>Текст кнопки 2<br><input type="text" name="btn2Text" value="${esc(s.btn2Text)}"></label></div>
    </div>

    <hr><h3>2-е общее сообщение</h3>
    <div class="row"><label>msg2Common<br><textarea name="msg2Common">${esc(s.msg2Common)}</textarea></label></div>

    <hr><h3>Сценарий 1</h3>
    <div class="row"><label>Итоговое сообщение С1<br><textarea name="msg3A">${esc(s.msg3A)}</textarea></label></div>
    <div class="grid2">
      <div class="row"><label>Канал-чистовик<br><input type="text" name="targetChatId" value="${esc(s.targetChatId)}" placeholder="-100… или @username"></label></div>
      <div class="row">
        <label>Fallback-изображение (A) — URL
          <input type="text" name="fallbackImageAUrl" value="${/^https?:\/\//i.test(s.fallbackImageA)?esc(s.fallbackImageA):''}" placeholder="https://...">
        </label>
        <label style="margin-top:8px;display:block;">файл →
          <input type="file" name="fallbackA" accept="image/*">
        </label>
        ${fallbackAUrl?`<img src="${fallbackAUrl}" class="preview" alt="fallback A preview">`:''}
      </div>
    </div>

    <hr><h3>Сценарий-2</h3>
    <div class="row"><label>Сообщение-прайс<br><textarea name="msg3B">${esc(s.msg3B)}</textarea></label></div>
    <div class="grid2">
      <div class="row"><label>Кнопка "оплата"<br><input type="text" name="btnBProceedMedia" value="${esc(s.btnBProceedMedia)}"></label></div>
      <div class="row"><label>Канал для чека<br><input type="text" name="targetChatIdB2" value="${esc(s.targetChatIdB2)}" placeholder="-100… или @username"></label></div>
    </div>
    <div class="grid2">
      <div class="row"><label>сообщение "реквизиты"<br><textarea name="msgBAskMedia">${esc(s.msgBAskMedia)}</textarea></label></div>
      <div class="row"><label>финальное сообщение сц2<br><textarea name="msgBMediaConfirm">${esc(s.msgBMediaConfirm)}</textarea></label></div>
    </div>
    <div class="grid2">
      <div class="row">
        <label>Fallback-изображение (B) — URL
          <input type="text" name="fallbackImageBUrl" value="${/^https?:\/\//i.test(s.fallbackImageB)?esc(s.fallbackImageB):''}" placeholder="https://...">
        </label>
        <label style="margin-top:8px;display:block;">файл →
          <input type="file" name="fallbackB" accept="image/*">
        </label>
        ${fallbackBUrl?`<img src="${fallbackBUrl}" class="preview" alt="fallback B preview">`:''}
      </div>
    </div>

    <hr><h3>Кнопки под ОБЪЯВЛЕНИЕМ</h3>
    <div class="grid2">
      <div class="row"><label>Текст кнопки профиля (userBtnText)<br><input type="text" name="userBtnText" value="${esc(s.userBtnText)}" placeholder="Связаться с автором"></label></div>
      <div class="row"><label>Текст постоянной кнопки (publishBtnText)<br><input type="text" name="publishBtnText" value="${esc(s.publishBtnText)}" placeholder="Перейти на сайт"></label></div>
    </div>
    <div class="row"><label>URL постоянной кнопки (publishBtnUrl)<br><input type="text" name="publishBtnUrl" value="${esc(s.publishBtnUrl)}" placeholder="https://example.com"></label></div>

    <hr><h3>Финальная кнопка</h3>
    <div class="row"><label>Текст кнопки «начать заново» (finalBtnText)<br><input type="text" name="finalBtnText" value="${esc(s.finalBtnText)}" placeholder="Начать сначала"></label></div>
    <p class="hint">Эта кнопка появляется в самом финальном сообщении и имитирует команду /start.</p>

    <hr>
    <div class="grid3">
      <div class="row">
        <label>Удалять сообщения через, сек:
          <input type="number" min="0" name="ttlSeconds" value="${s.ttlSeconds}">
        </label>
        <div class="hint">0 = не удалять</div>
      </div>
      <div class="row">
        <label>
          <input type="checkbox" name="deleteUserMessages" ${s.deleteUserMessages?'checked':''}>
          Удалять сообщения пользователя (только в группах/супергруппах при праве Delete)
        </label>
      </div>
    </div>

    <button type="submit">Сохранить</button>
  </form>`);
});

// принимаем multipart с двумя файлами: fallbackA и fallbackB
app.post('/admin', basicAuth, upload.fields([{ name: 'fallbackA' }, { name: 'fallbackB' }]), (req,res)=>{
  const body = req.body || {};
  const files = req.files || {};
  const prev = readStore();

  const ttl = Math.max(0, Number(body.ttlSeconds || 0) || 0);
  const del = body.deleteUserMessages === 'on' || body.deleteUserMessages === 'true';

  let fallbackImageA = prev.fallbackImageA || '';
  let fallbackImageB = prev.fallbackImageB || '';

  if (files.fallbackA && files.fallbackA[0]) {
    fallbackImageA = path.join(uploadDir, path.basename(files.fallbackA[0].filename));
  } else if (body.fallbackImageAUrl && /^https?:\/\//i.test(body.fallbackImageAUrl.trim())) {
    fallbackImageA = body.fallbackImageAUrl.trim();
  }

  if (files.fallbackB && files.fallbackB[0]) {
    fallbackImageB = path.join(uploadDir, path.basename(files.fallbackB[0].filename));
  } else if (body.fallbackImageBUrl && /^https?:\/\//i.test(body.fallbackImageBUrl.trim())) {
    fallbackImageB = body.fallbackImageBUrl.trim();
  }

  writeStore({
    msg1: body.msg1 || '',
    btn1Text: body.btn1Text || 'Кнопка 1',
    btn2Text: body.btn2Text || 'Кнопка 2',
    msg2Common: body.msg2Common || 'Пришлите сообщение.',
    msg3A: body.msg3A || 'Спасибо!',
    targetChatId: body.targetChatId || '',
    targetChatIdB2: body.targetChatIdB2 || '',
    msg3B: body.msg3B || 'Нажмите кнопку, чтобы продолжить.',
    btnBProceedMedia: body.btnBProceedMedia || 'Отправить медиа',
    msgBAskMedia: body.msgBAskMedia || 'Отправьте медиа.',
    msgBMediaConfirm: body.msgBMediaConfirm || 'Готово!',
    userBtnText: body.userBtnText || 'Связаться с автором',
    publishBtnText: body.publishBtnText || '',
    publishBtnUrl: body.publishBtnUrl || '',
    finalBtnText: body.finalBtnText || 'Начать сначала',
    fallbackImageA,
    fallbackImageB,
    ttlSeconds: ttl,
    deleteUserMessages: del
  });

  res.redirect('/admin');
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function scheduleDelete(chatId, messageId, ttlSeconds){
  if (!ttlSeconds || ttlSeconds<=0) return;
  setTimeout(()=>{ bot.telegram.deleteMessage(chatId, messageId).catch(()=>{}); }, ttlSeconds*1000);
}

// ещё более агрессивное сворачивание клавиатуры
async function hideKeyboardAggressively(ctx) {
  try {
    const k1 = await ctx.reply('‎', {
      disable_notification: true,
      reply_markup: {
        keyboard: [[{ text: '‎' }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    await new Promise(r => setTimeout(r, 180));
    const k2 = await ctx.reply('‎', {
      disable_notification: true,
      reply_markup: { remove_keyboard: true }
    });
    setTimeout(() => {
      bot.telegram.deleteMessage(k1.chat.id, k1.message_id).catch(()=>{});
      bot.telegram.deleteMessage(k2.chat.id, k2.message_id).catch(()=>{});
    }, 1200);
  } catch {}
}

// Ссылка на профиль пользователя
function buildUserLink(fromUsername) {
  if (!fromUsername) return '';
  const u = String(fromUsername).trim().replace(/^@/, '');
  if (!u) return '';
  return `https://t.me/${u}`;
}

// Кнопки под объявлением: профиль (если есть) + постоянная
function buildPublishKeyboard(cfg, userLinkUrl) {
  const rows = [];
  if (userLinkUrl) rows.push([{ text: cfg.userBtnText || 'Связаться с автором', url: userLinkUrl }]);
  if (cfg.publishBtnText && cfg.publishBtnUrl && /^https?:\/\//i.test(cfg.publishBtnUrl.trim())) {
    rows.push([{ text: cfg.publishBtnText, url: cfg.publishBtnUrl.trim() }]);
  }
  return rows.length ? { inline_keyboard: rows } : undefined;
}

function detectHasMedia(msg) {
  return !!(msg.photo || msg.video || msg.document || msg.animation || msg.audio || msg.voice || msg.sticker);
}
function getTextFromMessage(msg) {
  return (msg.caption || msg.text || '').toString();
}

// Публикация ОБЪЯВЛЕНИЯ в указанный канал/чат
async function publishAnnouncementTo(chatId, cfg, fromChatId, msgObjOrId, variant /* 'A'|'B' */, userLinkUrl) {
  if (!chatId) return;
  let msgObj = null;
  let msgId  = null;
  if (typeof msgObjOrId === 'object') { msgObj = msgObjOrId; msgId = msgObj.message_id; }
  else { msgId = msgObjOrId; }

  const keyboard = buildPublishKeyboard(cfg, userLinkUrl);

  if (msgObj) {
    const hasMedia = detectHasMedia(msgObj);
    const text     = getTextFromMessage(msgObj);
    const fallback = (variant === 'A') ? cfg.fallbackImageA : cfg.fallbackImageB;

    if (!hasMedia && fallback) {
      let photoSource;
      if (/^https?:\/\//i.test(fallback)) photoSource = fallback;
      else {
        const abs = toAbsPath(fallback);
        photoSource = fs.existsSync(abs) ? { source: abs } : null;
      }
      if (photoSource) {
        const params = { caption: text || '', parse_mode: 'HTML' };
        if (keyboard) params.reply_markup = keyboard;
        await bot.telegram.sendPhoto(chatId, photoSource, params);
        return;
      }
    }
  }
  const params = keyboard ? { reply_markup: keyboard } : {};
  await bot.telegram.copyMessage(chatId, fromChatId, msgId, params);
}

// Публикация МЕДИА (без кнопок) в указанный канал/чат
async function publishMediaTo(chatId, fromChatId, messageId) {
  if (!chatId) return;
  await bot.telegram.copyMessage(chatId, fromChatId, messageId);
}

// ── State ──────────────────────────────────────────────────────────────────────
// Map<chatId, {flow:'A'|'B', stage:'await_ad'|'await_media', adMessageId?:number, adHasMedia?:boolean, adText?:string, fromUsername?:string}>
const state = new Map();

// Команда?
function isBotCommandMessage(ctx) {
  const t = ctx.message?.text;
  if (!t) return false;
  if (!ctx.message.entities) return t.startsWith('/');
  return ctx.message.entities.some(e => e.type === 'bot_command' && e.offset === 0);
}

// ── Команды / Кнопки ───────────────────────────────────────────────────────────
async function sendMsg1(ctx){
  const cfg = readConfig();
  state.delete(ctx.chat.id);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(cfg.btn1Text || 'Кнопка 1', 'btn:A')],
    [Markup.button.callback(cfg.btn2Text || 'Кнопка 2', 'btn:B')]
  ]);
  const sent = await ctx.reply(cfg.msg1 || 'Привет!', { ...keyboard, ...MSG_OPTS });
  scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
}
bot.start(sendMsg1);
bot.command('cancel', sendMsg1);
bot.hears(/^(привет|hello|hi)$/i, sendMsg1);

// финальная inline-кнопка «начать заново»
function finalRestartKeyboard(cfg){
  return Markup.inlineKeyboard([[ Markup.button.callback(cfg.finalBtnText || 'Начать сначала', 'restart') ]]);
}

// обработчик кнопки «начать заново»
bot.action('restart', async (ctx) => {
  try { await ctx.answerCbQuery(); } catch {}
  state.delete(ctx.chat.id);
  await sendMsg1(ctx);
});

async function afterFirstButton(ctx, flow){
  const cfg = readConfig();
  try { await ctx.editMessageReplyMarkup(undefined).catch(()=>{}); await ctx.answerCbQuery(); } catch {}
  if (cfg.msg2Common && cfg.msg2Common.trim()) {
    const sent = await ctx.reply(cfg.msg2Common, MSG_OPTS);
    scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
  }
  state.set(ctx.chat.id, { flow, stage: 'await_ad' });
}
bot.action('btn:A', async (ctx)=>{ await afterFirstButton(ctx, 'A'); });
bot.action('btn:B', async (ctx)=>{ await afterFirstButton(ctx, 'B'); });

bot.action('b:proceedMedia', async (ctx)=>{
  const cfg = readConfig();
  const st = state.get(ctx.chat.id);
  try { await ctx.answerCbQuery(); } catch {}
  if (!st || st.flow!=='B' || !st.adMessageId) {
    const sent = await ctx.reply('Давайте начнём заново: /start', MSG_OPTS);
    scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
    return;
  }
  // просим медиа и принудительно сворачиваем клавиатуру
  st.stage = 'await_media';
  if (cfg.msgBAskMedia && cfg.msgBAskMedia.trim()) {
    await hideKeyboardAggressively(ctx);
    const sent = await ctx.reply(cfg.msgBAskMedia, MSG_OPTS);
    scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
  }
});

// ── Incoming (после команд) ───────────────────────────────────────────────────
bot.on('message', async (ctx, next)=>{
  if (isBotCommandMessage(ctx)) return next();

  const cfg = readConfig();
  const st  = state.get(ctx.chat.id);

  // После общего msg2Common ждём объявление
  if (st?.stage === 'await_ad') {
    st.adMessageId = ctx.message.message_id;
    st.adHasMedia  = detectHasMedia(ctx.message);
    st.adText      = getTextFromMessage(ctx.message);
    st.fromUsername = ctx.message.from?.username || '';

    if (st.flow === 'A') {
      // Финальное сообщение пользователю + кнопка «начать заново»
      if (cfg.msg3A && cfg.msg3A.trim()) {
        const sent = await ctx.reply(cfg.msg3A, { ...MSG_OPTS, ...finalRestartKeyboard(cfg) });
        scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
      }
      // Профиль автора (если есть username)
      const userLink = buildUserLink(st.fromUsername);

      // Ветка A: объявление → targetChatId
      try {
        await publishAnnouncementTo(cfg.targetChatId, cfg, ctx.chat.id, ctx.message, 'A', userLink);
      } catch {
        try {
          const warn = await ctx.reply('Не удалось переслать объявление. Проверьте настройки публикации.', MSG_OPTS);
          scheduleDelete(warn.chat.id, warn.message_id, cfg.ttlSeconds);
        } catch {}
      }
      state.delete(ctx.chat.id);
      return;
    }

    if (st.flow === 'B') {
      await hideKeyboardAggressively(ctx);
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(cfg.btnBProceedMedia || 'Отправить медиа', 'b:proceedMedia')]
      ]);
      const sent = await ctx.reply(cfg.msg3B || 'Продолжим?', { ...keyboard, ...MSG_OPTS });
      scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
      return;
    }
  }

  // Во втором сценарии после нажатия кнопки ждём МЕДИА
  if (st?.stage === 'await_media' && st.flow === 'B' && st.adMessageId) {
    const hasMedia =
      ctx.message.photo || ctx.message.video || ctx.message.document ||
      ctx.message.animation || ctx.message.audio || ctx.message.voice;

    if (hasMedia) {
      const userLink = buildUserLink(st.fromUsername);

      // 1) Объявление → основная цель (ТОЛЬКО объявление)
      try {
        if (st.adHasMedia === false) {
          const adMsgObj = { message_id: st.adMessageId, text: st.adText };
          await publishAnnouncementTo(cfg.targetChatId, cfg, ctx.chat.id, adMsgObj, 'B', userLink);
        } else {
          await publishAnnouncementTo(cfg.targetChatId, cfg, ctx.chat.id, st.adMessageId, 'B', userLink);
        }
      } catch {}

      // 2) Объявление → доп. цель B2
      try {
        if (cfg.targetChatIdB2) {
          if (st.adHasMedia === false) {
            const adMsgObj = { message_id: st.adMessageId, text: st.adText };
            await publishAnnouncementTo(cfg.targetChatIdB2, cfg, ctx.chat.id, adMsgObj, 'B', userLink);
          } else {
            await publishAnnouncementTo(cfg.targetChatIdB2, cfg, ctx.chat.id, st.adMessageId, 'B', userLink);
          }
        }
      } catch {}

      // 3) Медиа → доп. цель B2 (без кнопок)
      try {
        if (cfg.targetChatIdB2) {
          await publishMediaTo(cfg.targetChatIdB2, ctx.chat.id, ctx.message.message_id);
        }
      } catch {}

      // Финальное сообщение пользователю + кнопка «начать заново»
      if (cfg.msgBMediaConfirm && cfg.msgBMediaConfirm.trim()) {
        const sent = await ctx.reply(cfg.msgBMediaConfirm, { ...MSG_OPTS, ...finalRestartKeyboard(cfg) });
        scheduleDelete(sent.chat.id, sent.message_id, cfg.ttlSeconds);
      }
      state.delete(ctx.chat.id);
      return;
    } else {
      if (cfg.msgBAskMedia && cfg.msgBAskMedia.trim()) {
        const remind = await ctx.reply(cfg.msgBAskMedia, MSG_OPTS);
        scheduleDelete(remind.chat.id, remind.message_id, cfg.ttlSeconds);
      }
      return;
    }
  }

  // Опциональное автоудаление в группах
  if (cfg.deleteUserMessages && ['group','supergroup'].includes(ctx.chat?.type)) {
    scheduleDelete(ctx.chat.id, ctx.message.message_id, cfg.ttlSeconds);
  }

  await next();
});

// ── Start/Stop ─────────────────────────────────────────────────────────────────
bot.launch().then(()=>console.log('Bot started (polling)'));
const server = app.listen(PORT, ()=>console.log('Admin UI on :' + PORT));

function shutdown(sig){
  console.log('Shutting down on', sig);
  try { bot.stop(sig); } catch {}
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0), 5000).unref();
}
process.on('SIGINT',  ()=>shutdown('SIGINT'));
process.on('SIGTERM', ()=>shutdown('SIGTERM'));