// POST /auth/logout
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Cookie'};
const json = (d,s=200,extra={}) => new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json;charset=utf-8',...CORS,...extra}});

function getSessionToken(req) {
  const cookie = req.headers.get('Cookie')||'';
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return m?.[1]||null;
}

export const onRequestOptions = () => new Response(null,{status:204,headers:CORS});

export async function onRequestPost({ request, env }) {
  const token = getSessionToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(token).run();
  const clear = 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
  return json({ok:true},200,{'Set-Cookie':clear});
}
