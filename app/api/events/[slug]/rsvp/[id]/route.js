import { NextResponse } from 'next/server';
import { getEventBySlug, deleteSubmission } from '../../../../../../lib/db';
import { isAdminRequest } from '../../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return NextResponse.json({ ok: false, error: 'Événement introuvable' }, { status: 404 });
  }
  const id = parseInt(params.id, 10);
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Identifiant invalide' }, { status: 400 });
  }
  const deleted = await deleteSubmission(event.id, id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Réponse introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
