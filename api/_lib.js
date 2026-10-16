import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
const secreto = () => process.env.SESSION_SECRET || '';
const firmar = (v) => createHmac('sha256', secreto()).update(v).digest('hex');
export const COOKIE = 'cem';
export function crearSesion() {
  const exp = String(Date.now() + 30 * 864e5);
  return exp + '.' + firmar(exp);
}
export function sesionValida(req) {
  if (secreto().length < 16) return false;
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)cem=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(firmar(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
const h = (s) => createHash('sha256').update(String(s)).digest();
export const iguales = (a, b) => timingSafeEqual(h(a), h(b));
export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
