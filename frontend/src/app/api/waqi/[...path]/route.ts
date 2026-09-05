import { NextRequest, NextResponse } from 'next/server';

const WAQI_BASE = 'https://api.waqi.info';

function getToken(): string {
  const token = process.env.WAQI_API_TOKEN;
  if (!token) throw new Error('WAQI_API_TOKEN is not set in .env.local');
  return token;
}

/**
 * Proxy all GET /api/waqi/* requests to api.waqi.info,
 * appending the token server-side so it never leaks to the browser.
 *
 * Usage from the client:
 *   GET /api/waqi/feed/bengaluru   → https://api.waqi.info/feed/bengaluru/?token=...
 *   GET /api/waqi/search/?keyword=bengaluru → https://api.waqi.info/search/?keyword=bengaluru&token=...
 *   GET /api/waqi/geo:12.97/77.59  → https://api.waqi.info/feed/geo:12.97;77.59/?token=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const token = getToken();

    // Reconstruct the WAQI endpoint path
    // The catch-all [...path] splits on /, so /api/waqi/feed/bengaluru → ["feed", "bengaluru"]
    // For geo coords like "geo:12.97/77.59", the browser sends it as a single segment
    const waqiPath = path.join('/');

    // Forward any query params from the client request
    const searchParams = new URLSearchParams(request.nextUrl.searchParams.toString());
    searchParams.set('token', token);

    const url = `${WAQI_BASE}/${waqiPath}/?${searchParams.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Cache for 5 minutes to avoid hammering the API
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: 'error', message: `WAQI API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('WAQI proxy error:', err);
    return NextResponse.json(
      { status: 'error', message: String(err) },
      { status: 500 }
    );
  }
}
