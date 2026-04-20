// Cloudflare Pages Function for appointments backed by D1
// Route: /appointments
// Bind a D1 database named DB in your Cloudflare Pages project settings.

/**
 * Schema suggestion (run once in D1):
 *
 * CREATE TABLE IF NOT EXISTS appointments (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 *   name TEXT NOT NULL,
 *   phone TEXT,
 *   date TEXT,
 *   time TEXT,
 *   doctor TEXT,
 *   type TEXT,
 *   reason TEXT,
 *   insurance TEXT
 * );
 */

export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    const { results } = await db
      .prepare(
        `SELECT id, created_at, name, phone, date, time, doctor, type, reason, insurance
         FROM appointments
         ORDER BY date ASC, time ASC, created_at ASC`
      )
      .all();

    return new Response(JSON.stringify(results || []), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('D1 GET /appointments failed', err);
    return new Response('Internal error', { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const name = (payload.name || '').toString().trim();
  const phone = (payload.phone || '').toString().trim();
  const date = (payload.date || '').toString().trim();
  const time = (payload.time || '').toString().trim();
  const doctor = (payload.doctor || '').toString().trim();
  const type = (payload.type || '').toString().trim();
  const reason = (payload.reason || '').toString().trim();
  const insurance = (payload.insurance || '').toString().trim();

  if (!name || !date || !time) {
    return new Response('name, date and time are required', { status: 400 });
  }

  try {
    const info = await db
      .prepare(
        `INSERT INTO appointments (name, phone, date, time, doctor, type, reason, insurance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(name, phone, date, time, doctor, type, reason, insurance)
      .run();

    const insertedId = info.meta.last_row_id;

    const { results } = await db
      .prepare(
        `SELECT id, created_at, name, phone, date, time, doctor, type, reason, insurance
         FROM appointments
         WHERE id = ?`
      )
      .bind(insertedId)
      .all();

    const created = results && results[0] ? results[0] : { id: insertedId, name, phone, date, time, doctor, type, reason, insurance };

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('D1 POST /appointments failed', err);
    return new Response('Internal error', { status: 500 });
  }
}
