import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(
    { ok: true, settings },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
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
  };
  const settings = await updateSettings(partial);
  return NextResponse.json(
    { ok: true, settings },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
