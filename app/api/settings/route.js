import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const settings = await getSettings();
  const payload = { ok: true, settings };
  if (isAdminRequest(req)) {
    payload.emailConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  }
  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function PUT(req) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 });
  }
  const partial = {
    titre: (body?.titre ?? '').toString().trim(),
    sous_titre: (body?.sous_titre ?? '').toString().trim(),
    lieu: (body?.lieu ?? '').toString().trim(),
    date_evenement: (body?.date_evenement ?? '').toString().trim(),
    intro: (body?.intro ?? '').toString().trim(),
    atelier1_titre: (body?.atelier1_titre ?? '').toString().trim(),
    atelier1_desc: (body?.atelier1_desc ?? '').toString().trim(),
    atelier2_titre: (body?.atelier2_titre ?? '').toString().trim(),
    atelier2_desc: (body?.atelier2_desc ?? '').toString().trim(),
    date_debut: (body?.date_debut ?? '').toString().trim(),
    date_fin: (body?.date_fin ?? '').toString().trim(),
    pas_ouvert_titre: (body?.pas_ouvert_titre ?? '').toString().trim(),
    pas_ouvert_message: (body?.pas_ouvert_message ?? '').toString().trim(),
    ferme_titre: (body?.ferme_titre ?? '').toString().trim(),
    ferme_message: (body?.ferme_message ?? '').toString().trim(),
    horaires: (body?.horaires ?? '').toString().trim(),
    accueil: (body?.accueil ?? '').toString().trim(),
    programme_matin_titre: (body?.programme_matin_titre ?? '').toString().trim(),
    programme_matin_desc: (body?.programme_matin_desc ?? '').toString().trim(),
    programme_am_titre: (body?.programme_am_titre ?? '').toString().trim(),
    programme_am_desc: (body?.programme_am_desc ?? '').toString().trim(),
    privacy_note: (body?.privacy_note ?? '').toString().trim(),
    footer_text: (body?.footer_text ?? '').toString().trim(),
    event_start: (body?.event_start ?? '').toString().trim(),
    event_end: (body?.event_end ?? '').toString().trim(),
    email_subject: (body?.email_subject ?? '').toString().trim(),
    email_body: (body?.email_body ?? '').toString().trim(),
  };
  const settings = await updateSettings(partial);
  return NextResponse.json(
    { ok: true, settings },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
