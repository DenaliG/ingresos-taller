import { crearSesion, sesionValida, iguales, json } from './_lib.js';
const intentos = new Map();
const OPT = 'HttpOnly; Secure; SameSite=Strict; Path=/';

export async function GET(req) {
  return sesionValida(req) ? json({ ok: true }) : json({ ok: false }, 401);
}

export async function POST(req) {
  const { APP_USER, APP_PASSWORD, SESSION_SECRET } = process.env;
  if (!APP_USER || !APP_PASSWORD || !SESSION_SECRET || SESSION_SECRET.length < 16)
    return json({ error: 'sin configurar' }, 500);
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  const f = intentos.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - f.t > 600000) { f.n = 0; f.t = Date.now(); }
  if (f.n >= 5) return json({ error: 'demasiados intentos' }, 429);
  let b = {};
  try { b = await req.json(); } catch {}
  const u = iguales(b.user ?? '', APP_USER);
  const p = iguales(b.pass ?? '', APP_PASSWORD);
  if (!(u && p)) {
    intentos.set(ip, { n: f.n + 1, t: f.t });
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: 'credenciales' }, 401);
  }
  intentos.delete(ip);
  return json({ ok: true }, 200, { 'Set-Cookie': `cem=${crearSesion()}; ${OPT}; Max-Age=2592000` });
}

export async function DELETE() {
  return json({ ok: true }, 200, { 'Set-Cookie': `cem=; ${OPT}; Max-Age=0` });
}
