import crypto from 'crypto';

const SALT = 'benin-rsvp-salt-v1';
export const ADMIN_COOKIE = 'benin_rsvp_admin';

const DEFAULT_ADMIN_PASSWORD = 'Sey@Synelia';

function adminSecret() {
  return process.env.APP_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function expected() {
  return crypto.createHmac('sha256', SALT).update(adminSecret()).digest('hex');
}

export function validPassword(password) {
  const secret = adminSecret();
  if (!secret) return false;
  return password === secret;
}

export function cookieValue() {
  return expected();
}

export function isAdminRequest(req) {
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  return cookie === expected();
}
