// /admin/users — superadmin only: list + create staff accounts
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Accept,Cookie'};
const json  = (d,s=200) => new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json;charset=utf-8',...CORS}});
const text  = (m,s=200) => new Response(m,{status:s,headers:CORS});

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getToken(req) {
  const c=req.headers.get('Cookie')||'';
  return c.match(/(?:^|;\s*)session=([^;]+)/)?.[1]||null;
}

async function requireSuperAdmin(request,env) {
  const token=getToken(request);
  if (!token) return null;
  const now=new Date().toISOString();
  const a=await env.DB
    .prepare(`SELECT a.id,a.role FROM sessions s JOIN admins a ON a.id=s.admin_id
              WHERE s.token=? AND s.expires_at>? LIMIT 1`)
    .bind(token,now).first();
  return a?.role==='superadmin'?a:null;
}

export const onRequestOptions = ()=>new Response(null,{status:204,headers:CORS});

export async function onRequestGet({request,env}) {
  if (!await requireSuperAdmin(request,env)) return text('Forbidden',403);
  const {results}=await env.DB.prepare('SELECT id,username,full_name,role,created_at FROM admins ORDER BY id').all();
  return json(results||[]);
}

export async function onRequestPost({request,env}) {
  if (!await requireSuperAdmin(request,env)) return text('Forbidden',403);
  let p; try{p=await request.json();}catch{return text('Invalid JSON',400);}
  const username  =(p.username||'').trim().toLowerCase();
  const password  =(p.password||'').trim();
  const full_name =(p.full_name||'').trim();
  const role      =['superadmin','staff'].includes(p.role)?p.role:'staff';
  if (!username||!password||password.length<8) return text('username and password(>=8) required',400);
  const SALT='albacete-salt';
  const hash=await sha256hex(`${password}:${SALT}`);
  try {
    const info=await env.DB
      .prepare('INSERT INTO admins(username,password_hash,full_name,role) VALUES(?,?,?,?)')
      .bind(username,hash,full_name,role).run();
    return json({id:info.meta.last_row_id,username,full_name,role},201);
  } catch(e) {
    if (e.message?.includes('UNIQUE')) return text('Username already exists',409);
    return text('Internal error',500);
  }
}

export async function onRequestDelete({request,env}) {
  if (!await requireSuperAdmin(request,env)) return text('Forbidden',403);
  const id=Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)||id<=0) return text('Valid id required',400);
  // Prevent deleting yourself — we don't track caller id here so just block id=1
  const r=await env.DB.prepare('DELETE FROM admins WHERE id=? AND id!=1').bind(id).run();
  if (!r.meta?.changes) return text('Not found or protected',404);
  return json({success:true,id});
}
