import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/auth';

export async function GET(req) {
  return NextResponse.json({ isAdmin: isAdminRequest(req) });
}
