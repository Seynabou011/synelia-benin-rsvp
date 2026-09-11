import { NextResponse } from 'next/server';
import { validPassword, cookieValue, ADMIN_COOKIE } from '../../../lib/auth';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 });
  }
  const password = body?.password || '';
  if (!validPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Mot de passe incorrect' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, cookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
