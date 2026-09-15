import { NextResponse } from 'next/server';
import { listEvents, createEvent } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  const events = await listEvents();
  return NextResponse.json({ ok: true, events }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(req) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 });
  }
  const name = (body?.name || '').toString().trim();
  const slugInput = (body?.slug || '').toString().trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Le nom de l'événement est obligatoire." }, { status: 400 });
  }
  try {
    const event = await createEvent({ slug: slugInput || name, name });
    return NextResponse.json({ ok: true, event });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erreur' }, { status: 400 });
  }
}
