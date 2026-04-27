// /appointments  GET · POST · DELETE?id=
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Accept',
};
const json  = (d, s=200) => new Response(JSON.stringify(d), { status:s, headers:{'Content-Type':'application/json;charset=utf-8',...CORS} });
const text  = (m, s=200) => new Response(m, { status:s, headers:CORS });
const clean = (v, n)     => (v||'').toString().trim().slice(0,n);

export const onRequestOptions = () => new Response(null,{status:204,headers:CORS});

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB
      .prepare(`SELECT id,created_at,name,phone,date,time,doctor,type,reason,insurance,
                       COALESCE(status,'pending') AS status
                FROM appointments ORDER BY date,time,created_at`)
      .all();
    return json(results||[]);
  } catch(e) { return text('Internal error',500); }
}

export async function onRequestPost({ request, env }) {
  let p;
  try { p = await request.json(); } catch { return text('Invalid JSON',400); }

  const name      = clean(p.name,100);
  const phone     = clean(p.phone,20);
  const date      = clean(p.date,20);
  const time      = clean(p.time,20);
  const doctor    = clean(p.doctor,150);
  const type      = clean(p.type,100);
  const reason    = clean(p.reason,500);
  const insurance = clean(p.insurance,100);
  const status    = ['pending','confirmed','cancelled'].includes(p.status) ? p.status : 'pending';

  if (!name||!date||!time) return text('name, date and time are required',400);

  // Block duplicate slot (same date+time+doctor, non-cancelled)
  const dup = await env.DB
    .prepare(`SELECT id FROM appointments WHERE date=? AND time=? AND doctor=? AND status!='cancelled' LIMIT 1`)
    .bind(date,time,doctor).first();
  if (dup) return text('That slot is already booked',409);

  try {
    const info = await env.DB
      .prepare(`INSERT INTO appointments(name,phone,date,time,doctor,type,reason,insurance,status)
                VALUES(?,?,?,?,?,?,?,?,?)`)
      .bind(name,phone,date,time,doctor,type,reason,insurance,status)
      .run();
    const row = await env.DB
      .prepare(`SELECT id,created_at,name,phone,date,time,doctor,type,reason,insurance,
                       COALESCE(status,'pending') AS status
                FROM appointments WHERE id=?`)
      .bind(info.meta.last_row_id).first();
    return json(row||{id:info.meta.last_row_id,name,date,time,status},201);
  } catch(e) {
    if (e.message?.includes('UNIQUE')) return text('That slot is already booked',409);
    return text('Internal error',500);
  }
}

export async function onRequestDelete({ request, env }) {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)||id<=0) return text('Valid id required',400);
  try {
    const r = await env.DB.prepare('DELETE FROM appointments WHERE id=?').bind(id).run();
    if (!r.meta?.changes) return text('Not found',404);
    return json({success:true,id});
  } catch { return text('Internal error',500); }
}
