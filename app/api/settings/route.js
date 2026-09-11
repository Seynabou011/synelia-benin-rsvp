import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSettings, updateSettings } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  const dbg = await sql`SELECT current_database() AS db, inet_server_addr()::text AS addr`;
  return NextResponse.json({ ok: true, settings, dbg: dbg.rows[0], envHost: (process.env.POSTGRES_URL || '').split('@')[1] });
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
  };
  const settings = await updateSettings(partial);
  return NextResponse.json({ ok: true, settings });
}
