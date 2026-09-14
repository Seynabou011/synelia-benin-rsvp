import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureSchema, getSettings, isFormOpen } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await ensureSchema();

  const settings = await getSettings();
  const { open, reason } = isFormOpen(settings);
  if (!open) {
    const message =
      reason === 'pas-encore-ouvert'
        ? "Le formulaire de confirmation n'est pas encore ouvert."
        : "Le formulaire de confirmation est désormais fermé. Merci de contacter l'organisation si besoin.";
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }

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
  const accompagnants = present ? Math.max(0, Math.min(3, parseInt(body?.accompagnants, 10) || 0)) : 0;
  const atelier = present ? (body?.atelier || '').trim() : '';
  const delegation_note = !present ? (body?.delegation_note || '').trim() : '';

  if (!nom) {
    return NextResponse.json({ ok: false, error: 'Le nom est obligatoire.' }, { status: 400 });
  }
  if (!fonction) {
    return NextResponse.json({ ok: false, error: 'La fonction est obligatoire.' }, { status: 400 });
  }
  if (!organisation) {
    return NextResponse.json({ ok: false, error: "L'organisation est obligatoire." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ ok: false, error: "L'email est obligatoire." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "L'email n'est pas valide." }, { status: 400 });
  }
  if (present && !telephone) {
    return NextResponse.json({ ok: false, error: 'Le téléphone est obligatoire.' }, { status: 400 });
  }
  if (present && !atelier) {
    return NextResponse.json({ ok: false, error: "Le choix de l'atelier est obligatoire." }, { status: 400 });
  }

  await sql`
    INSERT INTO benin_rsvp (nom, fonction, organisation, email, telephone, present, accompagnants, atelier, delegation_note)
    VALUES (${nom}, ${fonction}, ${organisation}, ${email}, ${telephone}, ${present}, ${accompagnants}, ${atelier}, ${delegation_note})
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
