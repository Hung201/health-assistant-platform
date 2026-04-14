import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

type Role = 'admin' | 'doctor' | 'patient';

function redirectToLogin(req: NextRequest) {
  const next = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
  const url = new URL(`/login?next=${next}`, req.url);
  return NextResponse.redirect(url);
}

async function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null; // when missing, caller will do presence-only
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key);
  return payload as { sub?: string; email?: string; roles?: string[] };
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('access_token')?.value;
  if (!token) return redirectToLogin(req);

  // Verify + role-check only when JWT_SECRET is configured for the frontend runtime.
  // If missing, we still require authentication via cookie, and rely on:
  // - backend guards for API access
  // - client RequireRole for UI gating
  if (process.env.JWT_SECRET) {
    let payload: { roles?: string[] } | null = null;
    try {
      payload = await verifyJwt(token);
    } catch {
      return redirectToLogin(req);
    }
    const roles = payload?.roles ?? [];
    const requireRole = (role: Role) => roles.includes(role);
    if (path.startsWith('/admin') && !requireRole('admin')) return redirectToLogin(req);
    if (path.startsWith('/doctor') && !requireRole('doctor')) return redirectToLogin(req);
    if (path.startsWith('/patient') && !requireRole('patient')) return redirectToLogin(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/doctor/:path*', '/patient/:path*', '/app/:path*'],
};

