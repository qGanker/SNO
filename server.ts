import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateProtocolDocx } from './protocolDocx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// Токен берётся ТОЛЬКО из .env — захардкоженный токен в коде приводил к тому,
// что облачные копии этого приложения (AI Studio и т.п.) опрашивали того же бота
// и отвечали участникам «работа не найдена» из своей пустой базы.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
let botInfo: { username?: string; first_name?: string } = {};

app.use(express.json());

// Инициализация директории базы данных
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Функция очистки от дубликатов по номеру работы
function cleanAndDeduplicate(items: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of items) {
    const num = String(item.workNumber || '').trim();
    if (!num) continue;

    if (!map.has(num)) {
      map.set(num, item);
    } else {
      const existing = map.get(num);
      // Если старая запись — это дефолтная Осмоловская, заменяем её новой работой пользователя
      if (existing.authorName?.includes('Осмоловская') && !item.authorName?.includes('Осмоловская')) {
        map.set(num, item);
      } else {
        // Оставляем самую свежую запись
        map.set(num, { ...existing, ...item });
      }
    }
  }
  return Array.from(map.values());
}

// Загрузка записей из файла
function loadSubmissions(fallback: any[] = []): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      let data = JSON.parse(content);
      if (Array.isArray(data)) {
        // Навсегда удаляем демонстрационную Осмоловскую
        data = data.filter((d: any) => !d.authorName?.includes('Осмоловская'));
        return cleanAndDeduplicate(data);
      }
    }
  } catch (err) {
    console.error('Ошибка чтения базы данных (используем предыдущее состояние):', err);
    // Файл может быть повреждён (например, читается в момент записи) —
    // НЕ обнуляем базу, а отдаём последние известные данные
    return fallback;
  }

  return [];
}

let inMemorySubmissions: any[] = loadSubmissions();

function saveSubmissions(data: any[]) {
  inMemorySubmissions = cleanAndDeduplicate(data);
  try {
    // Атомарная запись: сначала во временный файл, затем переименование,
    // чтобы параллельный читатель не увидел недописанный JSON
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(inMemorySubmissions, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Ошибка сохранения базы данных:', err);
  }
}

// Список подписчиков на Server-Sent Events (SSE)
type SseClient = { id: number; res: express.Response };
let sseClients: SseClient[] = [];

function broadcastUpdate() {
  const payload = JSON.stringify({ type: 'UPDATE', data: inMemorySubmissions });
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // Игнорируем закрытые соединения
    }
  });
}

// ---------------- TELEGRAM BOT API ----------------

async function sendTelegramMessage(chatId: string | number, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '📊 Мой статус' }],
            [{ text: 'ℹ️ Помощь' }]
          ],
          resize_keyboard: true
        }
      })
    });
    return await res.json();
  } catch (err) {
    console.error(`Ошибка отправки сообщения в Telegram (chat_id: ${chatId}):`, err);
    return null;
  }
}

let isPollingActive = false;
const processedUpdateIds = new Set<number>();

// Фоновый опрос Telegram Bot API (getUpdates)
async function startTelegramPolling() {
  if (isPollingActive) return;

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram Бот] TELEGRAM_BOT_TOKEN не задан в .env — бот отключён. Получите токен у @BotFather и перезапустите сервер.');
    return;
  }
  isPollingActive = true;

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const meData = await meRes.json();
    if (meData.ok && meData.result) {
      botInfo = meData.result;
      console.log(`[Telegram Бот] Авторизован бот: @${botInfo.username} (${botInfo.first_name})`);
    } else {
      console.error(`[Telegram Бот] Не удалось авторизоваться (проверьте TELEGRAM_BOT_TOKEN в .env):`, meData.description || meData);
    }
  } catch (err) {
    console.error('[Telegram Бот] Ошибка подключения:', err);
  }

  let offset = 0;

  const poll = async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`);
      const data = await res.json();

      if (data.ok === false && data.error_code === 409) {
        console.error(
          '[Telegram Бот] КОНФЛИКТ (409): этого бота уже опрашивает другой сервер/процесс ' +
          '(например, облачная копия приложения или второй запущенный экземпляр). ' +
          'Из-за этого участники получают двойные ответы. Остановите второй экземпляр ' +
          'или выпустите новый токен через @BotFather и пропишите его в .env.'
        );
      }

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (processedUpdateIds.has(update.update_id)) {
            continue;
          }
          processedUpdateIds.add(update.update_id);
          if (processedUpdateIds.size > 2000) {
            processedUpdateIds.clear();
          }

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const username = update.message.from.username ? `@${update.message.from.username}` : '';
            const text = update.message.text.trim();

            await handleIncomingTelegramMessage(chatId, username, text);
          }
        }
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 3000));
    }

    setTimeout(poll, 800);
  };

  poll();
}

async function handleIncomingTelegramMessage(chatId: number, username: string, text: string) {
  // Всегда читаем самые актуальные данные с диска (при ошибке чтения — прежние)
  inMemorySubmissions = loadSubmissions(inMemorySubmissions);

  // 1. Проверка команды «СТАТУС» (кнопка в меню, /status или слово "статус")
  const isStatusCmd = 
    text === '/status' || 
    text.toLowerCase().includes('статус') || 
    text.includes('📊');

  if (isStatusCmd) {
    const userWorks = inMemorySubmissions.filter(s => String(s.telegramChatId) === String(chatId));

    if (userWorks.length === 0) {
      await sendTelegramMessage(chatId, 
        `ℹ️ <b>У вас пока не привязано ни одной работы СНО.</b>\n\n` +
        `Чтобы привязать работу и проверять её статус, просто <b>отправьте номер вашей работы</b> (например: <code>27</code>).`
      );
      return;
    }

    for (const w of userWorks) {
      const isDebtor = w.status === 'debtor';
      const statusText = isDebtor
        ? `⚠️ <b>ЕСТЬ ЗАДОЛЖЕННОСТИ</b>\n\n<b>Что необходимо донести:</b>\n${w.missingDebts.map((d: string) => `❌ ${d}`).join('\n')}`
        : `✅ <b>ПОЛНЫЙ КОМПЛЕКТ</b>\nВсе обязательные документы приняты проверяющим! (+)`;

      await sendTelegramMessage(chatId,
        `📊 <b>СТАТУС РАБОТЫ №${w.workNumber}</b>\n\n` +
        `👤 <b>Автор:</b> ${w.authorName}\n` +
        `📚 <b>Тема:</b> ${w.workTitle || '—'}\n` +
        `👥 <b>Группа:</b> ${w.authorGroup || '—'}\n` +
        `🏛 <b>Кафедра:</b> ${w.department || '—'}\n` +
        `👨‍🏫 <b>Науч. рук.:</b> ${w.supervisorName || '—'}\n\n` +
        `${statusText}`
      );
    }
    return;
  }

  // 2. Команда /start <номер_работы> или просто номер работы (например: 27)
  let requestedWorkNumber = '';
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      requestedWorkNumber = parts[1].replace('work_', '').trim();
    }
  } else if (/^\d+$/.test(text)) {
    requestedWorkNumber = text;
  }

  if (requestedWorkNumber) {
    // Ищем работу по номеру (берем точное непустое совпадение)
    const sub = inMemorySubmissions.find(s => String(s.workNumber).trim() === requestedWorkNumber);

    if (sub) {
      // Привязываем Telegram пользователя к этой работе
      sub.telegramChatId = chatId;
      sub.telegramUsername = username;
      saveSubmissions(inMemorySubmissions);
      broadcastUpdate();

      const isDebtor = sub.status === 'debtor';
      const statusText = isDebtor 
        ? `⚠️ <b>ЕСТЬ ЗАДОЛЖЕННОСТИ</b>\n\n<b>Что необходимо донести:</b>\n${sub.missingDebts.map((d: string) => `❌ ${d}`).join('\n')}`
        : `✅ <b>ПОЛНЫЙ КОМПЛЕКТ</b>\nВсе обязательные документы приняты проверяющим! (+)`;

      await sendTelegramMessage(chatId, 
        `🎓 <b>СНО: Работа №${sub.workNumber} успешно привязана!</b>\n\n` +
        `👤 <b>Автор:</b> ${sub.authorName}\n` +
        `📚 <b>Тема:</b> ${sub.workTitle || '—'}\n` +
        `🏛 <b>Кафедра:</b> ${sub.department || '—'}\n` +
        `👨‍🏫 <b>Науч. рук.:</b> ${sub.supervisorName || '—'}\n\n` +
        `${statusText}\n\n` +
        `<i>Вы всегда можете нажать кнопку «📊 Мой статус» ниже, чтобы проверить актуальное состояние!</i>`
      );
      return;
    } else {
      await sendTelegramMessage(chatId, 
        `❌ Работа с номером <b>№${requestedWorkNumber}</b> не найдена в реестре СНО.\n` +
        `Пожалуйста, проверьте номер работы или обратитесь в оргкомитет.`
      );
      return;
    }
  }

  // 3. Стандартное приветствие
  await sendTelegramMessage(chatId,
    `👋 <b>Здравствуйте! Это официальный бот СНО</b>\n\n` +
    `Здесь вы можете отслеживать статус проверки ваших документов и получать срочные напоминания.\n\n` +
    `🔹 <b>Чтобы привязать работу:</b>\n` +
    `Отправьте номер вашей работы (например: <code>27</code>).\n\n` +
    `🔹 <b>Кнопка «📊 Мой статус»:</b>\n` +
    `Нажмите кнопку внизу экрана или напишите <code>статус</code>, чтобы посмотреть, всё ли сдано!`
  );
}

// ---------------- API МАРШРУТЫ ----------------

// Инфо о боте
app.get('/api/telegram/info', (req, res) => {
  res.json({
    success: true,
    botUsername: botInfo.username || '',
    botName: botInfo.first_name || 'СНО Бот',
    isConfigured: !!TELEGRAM_BOT_TOKEN
  });
});

// Отправить оповещение ВСЕМ должникам
app.post('/api/telegram/notify-all', async (req, res) => {
  const debtors = inMemorySubmissions.filter(s => s.status === 'debtor');
  let sentCount = 0;
  let notLinkedCount = 0;
  const errors: string[] = [];

  for (const debtor of debtors) {
    if (debtor.telegramChatId) {
      const msg = 
        `🚨 <b>СРОЧНОЕ НАПОМИНАНИЕ СНО!</b>\n\n` +
        `Здравствуйте, <b>${debtor.authorName}</b>!\n\n` +
        `По вашей работе <b>№${debtor.workNumber}</b> (<i>«${debtor.workTitle}»</i>) необходимо <b>СРОЧНО донести</b> следующие документы:\n\n` +
        debtor.missingDebts.map((d: string) => `❌ <b>${d}</b>`).join('\n') + '\n\n' +
        `🏛 <b>Кафедра:</b> ${debtor.department || '—'}\n` +
        `👨‍🏫 <b>Науч. рук.:</b> ${debtor.supervisorName || '—'}\n\n` +
        `⚠️ <i>Пожалуйста, сдайте недостающие документы в оргкомитет в ближайшее время!</i>`;

      const result = await sendTelegramMessage(debtor.telegramChatId, msg);
      if (result && result.ok) {
        sentCount++;
      } else {
        errors.push(`№${debtor.workNumber}: ${debtor.authorName}`);
      }
    } else {
      notLinkedCount++;
    }
  }

  res.json({
    success: true,
    sentCount,
    notLinkedCount,
    totalDebtors: debtors.length,
    errors
  });
});

// Отправить оповещение конкретному должнику
app.post('/api/telegram/notify/:id', async (req, res) => {
  const id = req.params.id;
  const debtor = inMemorySubmissions.find(s => s.id === id);

  if (!debtor) {
    return res.status(404).json({ error: 'Работа не найдена' });
  }

  if (!debtor.telegramChatId) {
    return res.status(400).json({ 
      error: 'Автор ещё не привязал Telegram к этой работе',
      linkUrl: botInfo.username ? `https://t.me/${botInfo.username}?start=${debtor.workNumber}` : ''
    });
  }

  const msg = 
    `🚨 <b>НАПОМИНАНИЕ СНО!</b>\n\n` +
    `Здравствуйте, <b>${debtor.authorName}</b>!\n\n` +
    `По вашей работе <b>№${debtor.workNumber}</b> (<i>«${debtor.workTitle}»</i>) требуется сдать:\n\n` +
    debtor.missingDebts.map((d: string) => `❌ <b>${d}</b>`).join('\n') + '\n\n' +
    `👨‍🏫 <b>Науч. рук.:</b> ${debtor.supervisorName || '—'}\n\n` +
    `<i>Пожалуйста, донесите документы в оргкомитет!</i>`;

  const result = await sendTelegramMessage(debtor.telegramChatId, msg);
  if (result && result.ok) {
    res.json({ success: true, message: 'Оповещение успешно отправлено в Telegram' });
  } else {
    res.status(500).json({ error: 'Ошибка отправки через Telegram API' });
  }
});

// Получить все записи
app.get('/api/submissions', (req, res) => {
  res.json({ success: true, data: inMemorySubmissions });
});

// Добавить или обновить запись (гарантирует уникальность номера работы)
app.post('/api/submissions', (req, res) => {
  const newSubmission = req.body;
  if (!newSubmission || !newSubmission.authorName) {
    return res.status(400).json({ error: 'Имя автора обязательно' });
  }

  const workNum = String(newSubmission.workNumber || '').trim();

  // Ищем совпадение по ID или по номеру работы
  const existingIndex = inMemorySubmissions.findIndex(
    s => (newSubmission.id && s.id === newSubmission.id) ||
         (workNum && String(s.workNumber).trim() === workNum)
  );

  if (existingIndex >= 0) {
    const existing = inMemorySubmissions[existingIndex];
    inMemorySubmissions[existingIndex] = {
      ...existing,
      ...newSubmission,
      id: existing.id || newSubmission.id || `SNO_${workNum || Date.now()}`
    };
  } else {
    if (!newSubmission.id) {
      newSubmission.id = workNum ? `SNO_${workNum}` : `SNO_${Date.now()}`;
    }
    inMemorySubmissions = [newSubmission, ...inMemorySubmissions];
  }

  saveSubmissions(inMemorySubmissions);
  broadcastUpdate();
  res.json({ success: true, data: newSubmission });
});

// Обновить запись
app.put('/api/submissions/:id', (req, res) => {
  const id = req.params.id;
  const updatedSubmission = req.body;
  const index = inMemorySubmissions.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }

  inMemorySubmissions[index] = { ...inMemorySubmissions[index], ...updatedSubmission };
  saveSubmissions(inMemorySubmissions);
  broadcastUpdate();
  res.json({ success: true, data: inMemorySubmissions[index] });
});

// Удалить запись
app.delete('/api/submissions/:id', (req, res) => {
  const id = req.params.id;
  const toDelete = inMemorySubmissions.find(s => s.id === id);
  const workNumToDelete = toDelete ? String(toDelete.workNumber).trim() : '';

  inMemorySubmissions = inMemorySubmissions.filter(s => {
    if (s.id === id) return false;
    if (workNumToDelete && String(s.workNumber).trim() === workNumToDelete) return false;
    return true;
  });

  saveSubmissions(inMemorySubmissions);
  broadcastUpdate();
  res.json({ success: true });
});

// Сброс
app.post('/api/submissions/reset', (req, res) => {
  inMemorySubmissions = [];
  saveSubmissions(inMemorySubmissions);
  broadcastUpdate();
  res.json({ success: true, data: inMemorySubmissions });
});

// Выгрузка Word-протокола (шаблон + работы из базы по факультетам)
app.get('/api/export/protocol', (req, res) => {
  try {
    const docxBuffer = generateProtocolDocx(inMemorySubmissions);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Протокол_СНО_${dateStr}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="protocol_sno.docx"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(docxBuffer);
  } catch (err: any) {
    console.error('Ошибка формирования протокола:', err);
    res.status(500).json({ error: `Не удалось сформировать протокол: ${err?.message || err}` });
  }
});

// Поток событий (SSE)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now() + Math.random();
  sseClients.push({ id: clientId, res });

  res.write(`data: ${JSON.stringify({ type: 'INIT', data: inMemorySubmissions })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// ---------------- VITE MIDDLEWARE В DEV И СТАТИКА В PROD ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[СНО Сервер] Сервер запущен на http://0.0.0.0:${PORT}`);
    console.log(`[СНО Сервер] Общая база данных сохраняется в: ${DATA_FILE}`);
    // Опрос бота запускаем только после успешного захвата порта —
    // чтобы «мёртвый» экземпляр без порта не забирал сообщения бота
    startTelegramPolling();
  });
}

startServer();
