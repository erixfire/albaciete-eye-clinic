// /admin/appointments  — auth-protected CRUD
// PUT?id=  to update status
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Accept,Cookie'};
const json  = (d,s=200) => new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json;charset=utf-8',...CORS}});
const text  = (m,s=200) => new Response(m,{status:s,headers:CORS});

function getToken(req) {
  const c = req.headers.get('Cookie')||'';
  return c.match(/(?:^|;\s*)session=([^;]+)/)?.[1]||null;
}

async function requireAdmin(request, env) {
  const token = getToken(request);
  if (!token) return null;
  const now = new Date().toISOString();
  return env.DB
    .prepare(`SELECT a.id,a.role FROM sessions s JOIN admins a ON a.id=s.admin_id
              WHERE s.token=? AND s.expires_at>? LIMIT 1`)
    .bind(token,now).first();
}

export const onRequestOptions = () => new Response(null,{status:204,headers:CORS});

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request,env);
  if (!admin) return text('Unauthorized',401);
  const { results } = await env.DB
    .prepare(`SELECT id,created_at,name,phone,date,time,doctor,type,reason,insurance,
                     COALESCE(status,'pending') AS status
              FROM appointments ORDER BY date,time,created_at`)
    .all();
  return json(results||[]);
}

export async function onRequestPut({ request, env }) {
  const admin = await requireAdmin(request,env);
  if (!admin) return text('Unauthorized',401);
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)||id<=0) return text('Valid id required',400);
  let p; try { p=await request.json(); } catch { return text('Invalid JSON',400); }
  const status = ['pending','confirmed','cancelled'].includes(p.status)?p.status:null;
  if (!status) return text('Invalid status',400);
  const r = await env.DB.prepare('UPDATE appointments SET status=? WHERE id=?').bind(status,id).run();
  if (!r.meta?.changes) return text('Not found',404);
  const row = await env.DB.prepare('SELECT * FROM appointments WHERE id=?').bind(id).first();
  return json(row);
}

export async function onRequestDelete({ request, env }) {
  const admin = await requireAdmin(request,env);
  if (!admin) return text('Unauthorized',401);
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)||id<=0) return text('Valid id required',400);
  const r = await env.DB.prepare('DELETE FROM appointments WHERE id=?').bind(id).run();
  if (!r.meta?.changes) return text('Not found',404);
  return json({success:true,id});
}
