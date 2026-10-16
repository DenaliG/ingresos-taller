import { get, put } from '@vercel/blob';
import { sesionValida, json } from './_lib.js';
const RUTA = 'ventas/datos.json';

export async function GET(req) {
  if (!sesionValida(req)) return json({ error: 'no autorizado' }, 401);
  try {
    const r = await get(RUTA, { access: 'private', useCache: false });
    if (!r || !r.stream) return json({ data: [] });
    return json({ data: JSON.parse(await new Response(r.stream).text()) });
  } catch (e) {
    return json({ error: 'lectura' }, 500);
  }
}

export async function PUT(req) {
  if (!sesionValida(req)) return json({ error: 'no autorizado' }, 401);
  let a;
  try { a = await req.json(); } catch { return json({ error: 'json' }, 400); }
  if (!Array.isArray(a) || a.length > 50000) return json({ error: 'datos' }, 400);
  const d = a
    .filter((x) => x && Number.isFinite(+x.id) && +x.monto > 0 && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha))
    .map((x) => ({
      id: +x.id,
      tipo: x.tipo === 'Reparación' ? 'Reparación' : 'Venta',
      fecha: x.fecha,
      met: x.met === 'Transferencia' ? 'Transferencia' : 'Efectivo',
      monto: +x.monto,
      fact: !!x.fact,
    }));
  try {
    await put(RUTA, JSON.stringify(d), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    return json({ ok: true, n: d.length });
  } catch (e) {
    return json({ error: 'escritura' }, 500);
  }
}
