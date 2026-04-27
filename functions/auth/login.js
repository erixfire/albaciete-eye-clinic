// POST /auth/login  { username, password }
// Returns Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Strict

const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Accept' };
const json = (d,s=200,extra={}) => new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json;charset=utf-8',...CORS,...extra}});
const SESSION_TTL_H = 8; // hours

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function randomToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export const onRequestOptions = () => new Response(null,{status:204,headers:CORS});

export async function onRequestPost({ request, env }) {
  let p;
  try { p = await request.json(); } catch { return json({error:'Invalid JSON'},400); }

  const username = (p.username||'').trim().toLowerCase();
  const password = (p.password||'').trim();
  if (!username||!password) return json({error:'username and password required'},400);

  // Hash submitted password the same way as stored
  const SALT = 'albacete-salt'; // change this to a CF Secret in production
  const hash = await sha256hex(`${password}:${SALT}`);

  const admin = await env.DB
    .prepare(`SELECT id,username,full_name,role FROM admins WHERE username=? AND password_hash=? LIMIT 1`)
    .bind(username, hash).first();

  if (!admin) return json({error:'Invalid credentials'},401);

  const token     = randomToken();
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_H * 3600 * 1000);

  await env.DB
    .prepare(`INSERT INTO sessions(token,admin_id,expires_at) VALUES(?,?,?)`)
    .bind(token, admin.id, expiresAt.toISOString())
    .run();

  const cookie = [
    `session=${token}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
    `Path=/`,
    `Max-Age=${SESSION_TTL_H*3600}`,
  ].join('; ');

  return json(
    { ok:true, admin:{ id:admin.id, username:admin.username, full_name:admin.full_name, role:admin.role } },
    200,
    { 'Set-Cookie': cookie }
  );
}
