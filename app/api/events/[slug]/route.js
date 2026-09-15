import { NextResponse } from 'next/server';
import { getEventBySlug, deleteEvent } from '../../../../lib/db';
import { isAdminRequest } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return NextResponse.json({ ok: false, error: 'Événement introuvable' }, { status: 404 });
  }
  await deleteEvent(event.id);
  return NextResponse.json({ ok: true });
}
