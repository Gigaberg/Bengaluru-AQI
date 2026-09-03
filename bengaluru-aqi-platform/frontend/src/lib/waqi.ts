/**
 * WAQI (World Air Quality Index) client.
 *
 * All requests go through the /api/waqi proxy route so the token
 * never reaches the browser. See src/app/api/waqi/[...path]/route.ts.
 */

import { WAQIApiResponse, WAQIStation } from './types';

/**
 * Fetch the current AQI feed for a city or station.
 * @param cityOrStation - e.g. "bengaluru", "delhi", "here" (user geo)
 */
export async function fetchWAQIFeed(cityOrStation: string): Promise<WAQIApiResponse> {
  const res = await fetch(`/api/waqi/feed/${encodeURIComponent(cityOrStation)}`);
  if (!res.ok) {
    throw new Error(`WAQI feed error: ${res.status}`);
  }
  return res.json() as Promise<WAQIApiResponse>;
}

/**
 * Fetch AQI for a geo coordinate pair.
 */
export async function fetchWAQIFeedByGeo(lat: number, lng: number): Promise<WAQIApiResponse> {
  const res = await fetch(`/api/waqi/feed/geo:${lat};${lng}`);
  if (!res.ok) {
    throw new Error(`WAQI geo feed error: ${res.status}`);
  }
  return res.json() as Promise<WAQIApiResponse>;
}

/**
 * Search WAQI for stations matching a keyword.
 */
export async function searchWAQIStations(keyword: string): Promise<{ status: string; data: WAQIStation[] }> {
  const res = await fetch(`/api/waqi/search/?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) {
    throw new Error(`WAQI search error: ${res.status}`);
  }
  return res.json() as Promise<{ status: string; data: WAQIStation[] }>;
}
