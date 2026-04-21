// Cloudflare Pages Function for appointments backed by D1
// Route: /appointments

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function textResponse(message, status = 200) {
  return new Response(message, { status, headers: CORS_HEADERS });
}

function sanitizeField(value, maxLength) {
  return (value || '').toString().trim().slice(0, maxLength);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    const { results } = await db
      .prepare(
        `SELECT id, created_at, name, phone, date, time, doctor, type, reason, insurance,
                COALESCE(status, 'pending') AS status
         FROM appointments
         ORDER BY date ASC, time ASC, created_at ASC`
      )
      .all();
    return jsonResponse(results || []);
  } catch (err) {
    console.error('D1 GET /appointments failed', err);
    return textResponse('Internal error', 500);
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return textResponse('Invalid JSON body', 400);
  }

  const name      = sanitizeField(payload.name, 100);
  const phone     = sanitizeField(payload.phone, 20);
  const date      = sanitizeField(payload.date, 20);
  const time      = sanitizeField(payload.time, 20);
  const doctor    = sanitizeField(payload.doctor, 150);
  const type      = sanitizeField(payload.type, 100);
  const reason    = sanitizeField(payload.reason, 500);
  const insurance = sanitizeField(payload.insurance, 100);
  const status    = ['pending', 'confirmed', 'cancelled'].includes(payload.status)
    ? payload.status : 'pending';

  if (!name || !date || !time) {
    return textResponse('name, date and time are required', 400);
  }

  try {
    const info = await db
      .prepare(
        `INSERT INTO appointments (name, phone, date, time, doctor, type, reason, insurance, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(name, phone, date, time, doctor, type, reason, insurance, status)
      .run();

    const insertedId = info.meta.last_row_id;
    const { results } = await db
      .prepare(
        `SELECT id, created_at, name, phone, date, time, doctor, type, reason, insurance,
                COALESCE(status, 'pending') AS status
         FROM appointments WHERE id = ?`
      )
      .bind(insertedId)
      .all();

    const created = results?.[0] ?? { id: insertedId, name, phone, date, time, doctor, type, reason, insurance, status };
    return jsonResponse(created, 201);
  } catch (err) {
    console.error('D1 POST /appointments failed', err);
    return textResponse('Internal error', 500);
  }
}

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const id = Number(new URL(context.request.url).searchParams.get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    return textResponse('Valid id is required', 400);
  }

  try {
    const result = await db
      .prepare('DELETE FROM appointments WHERE id = ?')
      .bind(id)
      .run();

    if (!result.meta?.changes) return textResponse('Appointment not found', 404);
    return jsonResponse({ success: true, id });
  } catch (err) {
    console.error('D1 DELETE /appointments failed', err);
    return textResponse('Internal error', 500);
  }
}
