import { NextResponse } from 'next/server';

/**
 * Creates a NextResponse with no-cache headers to prevent browser caching
 */
export function createNoCacheResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
}

