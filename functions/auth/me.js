// GET /auth/me — returns current admin from session cookie
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Cookie'};
const json = (d,s=200) => new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json;charset=utf-8',...CORS}});

function getSessionToken(req) {
  const cookie = req.headers.get('Cookie')||'';
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return m?.[1]||null;
}

export const onRequestOptions = () => new Response(null,{status:204,headers:CORS});

export async function onRequestGet({ request, env }) {
  const token = getSessionToken(request);
  if (!token) return json({admin:null},200);

  const now = new Date().toISOString();
  const row = await env.DB
    .prepare(`SELECT a.id,a.username,a.full_name,a.role
              FROM sessions s JOIN admins a ON a.id=s.admin_id
              WHERE s.token=? AND s.expires_at > ? LIMIT 1`)
    .bind(token, now).first();

  return json({ admin: row||null });
}
