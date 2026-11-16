// Cloudflare Pages Function: POST /api/lead → повідомлення в Telegram.
// Змінні в Cloudflare Pages (Settings → Variables and secrets → Production):
//   TELEGRAM_BOT_TOKEN — токен бота від @BotFather (Secret)
//   TELEGRAM_CHAT_ID   — chat id, куди слати заявки (можна кілька через кому)

const SITE_NAME = 'Техкарта';
const FORMATS = ["Кав'ярня", 'Шаурма', 'Піцерія', 'Суші', 'Бургерна', 'Пекарня', 'Кафе', 'Інше'];
const AREAS = ['до 20 м²', '20–40 м²', '40–60 м²', '60–80 м²', 'більше 80 м²'];
const PLACES = ['Так', 'Шукаю', 'Ще не думав'];
const SITUATIONS = ['Є ідея і бюджет', 'Є приміщення', 'Заклад працює, треба перезапуск'];

const clean = (v, max) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const pick = (v, list) => (list.includes(v) ? v : '');

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  if (data.company) return json({ ok: true }); // honeypot

  const name = clean(data.name, 60);
  const contact = clean(data.contact, 40);
  const city = clean(data.city, 60);
  const format = pick(data.format, FORMATS);
  const area = pick(data.area, AREAS);
  const place = pick(data.place, PLACES);
  const situation = pick(data.situation, SITUATIONS);

  const okContact = /^@?[a-zA-Z][\w]{4,31}$/.test(contact) || contact.replace(/\D/g, '').length >= 10;
  if (!/\p{L}{2}/u.test(name) || !okContact) return json({ ok: false }, 422);

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatIds = String(env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chatIds.length) return json({ ok: false, error: 'not configured' }, 500);

  const lines = [
    `🔔 Нова заявка на прорахунок — ${SITE_NAME}`, '',
    `Ім'я: ${name}`,
    `Контакт: ${contact}`,
    situation && `Ситуація: ${situation}`,
    format && `Формат: ${format}`,
    area && `Площа: ${area}`,
    city && `Місто: ${city}`,
    place && `Приміщення є: ${place}`,
  ].filter(Boolean);

  const results = await Promise.all(chatIds.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: lines.join('\n') }),
    })
  ));
  const ok = results.some((r) => r.ok);
  return json({ ok }, ok ? 200 : 502);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
