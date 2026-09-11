import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureSchema } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export async function POST(req) {
  await ensureSchema();
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 });
  }

  const nom = (body?.nom || '').trim();
  const fonction = (body?.fonction || '').trim();
  const organisation = (body?.organisation || '').trim();
  const email = (body?.email || '').trim();
  const telephone = (body?.telephone || '').trim();
  const present = body?.present !== false;
  const accompagnants = Math.max(0, parseInt(body?.accompagnants, 10) || 0);
  const atelier = present ? (body?.atelier || '').trim() : '';

  if (!nom) {
    return NextResponse.json({ ok: false, error: 'Le nom est obligatoire.' }, { status: 400 });
  }
  if (!email && !telephone) {
    return NextResponse.json({ ok: false, error: 'Merci de renseigner un email ou un téléphone.' }, { status: 400 });
  }

  await sql`
    INSERT INTO benin_rsvp (nom, fonction, organisation, email, telephone, present, accompagnants, atelier)
    VALUES (${nom}, ${fonction}, ${organisation}, ${email}, ${telephone}, ${present}, ${accompagnants}, ${atelier})
  `;

  return NextResponse.json({ ok: true });
}

export async function GET(req) {
  await ensureSchema();
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  const { rows } = await sql`SELECT * FROM benin_rsvp ORDER BY created_at DESC`;
  return NextResponse.json({ ok: true, rows });
}
