import { NextResponse } from 'next/server';
import { getEventBySlug, getEventSettings, isFormOpen, insertSubmission, listSubmissions } from '../../../../../lib/db';
import { isAdminRequest } from '../../../../../lib/auth';
import { sendConfirmationEmail } from '../../../../../lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return NextResponse.json({ ok: false, error: 'Événement introuvable' }, { status: 404 });
  }

  const settings = await getEventSettings(event.id);
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

  await insertSubmission(event.id, {
    nom, fonction, organisation, email, telephone, present, accompagnants, atelier, delegation_note,
  });

  let emailSent = false;
  let emailError = null;
  if (present) {
    try {
      const result = await sendConfirmationEmail({ settings, nom, email });
      emailSent = !!result.sent;
      if (!result.sent) emailError = result.reason || 'unknown';
    } catch (e) {
      console.error('Échec envoi email de confirmation:', e);
      emailError = e?.message || String(e);
    }
  }

  const payload = { ok: true, emailSent };
  if (emailError && isAdminRequest(req)) {
    payload.emailError = emailError;
  }

  return NextResponse.json(payload);
}

export async function GET(req, { params }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return NextResponse.json({ ok: false, error: 'Événement introuvable' }, { status: 404 });
  }
  const rows = await listSubmissions(event.id);
  return NextResponse.json({ ok: true, rows });
}
