declare const process: { env: Record<string, string | undefined> };
import { rateLimit } from './_lib/rateLimit';

type Coordinate = { lat: number; lng: number };
const validPoint = (p: any): p is Coordinate =>
  p && Number.isFinite(Number(p.lat)) && Number(p.lat) >= -90 && Number(p.lat) <= 90 &&
  Number.isFinite(Number(p.lng)) && Number(p.lng) >= -180 && Number(p.lng) <= 180;

function inside(point: Coordinate, poly: Coordinate[]) {
  let result = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    const crosses = (a.lng > point.lng) !== (b.lng > point.lng) &&
      point.lat < ((b.lat - a.lat) * (point.lng - a.lng)) / (b.lng - a.lng) + a.lat;
    if (crosses) result = !result;
  }
  return result;
}

async function verifyUser(req: any) {
  const auth = String(req.headers?.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL) || !((process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)) return null;
  try {
    const response = await fetch(`${((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL)}/auth/v1/user`, {
      headers: { apikey: ((process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) || process.env.VITE_SUPABASE_PUBLISHABLE_KEY), Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (!rateLimit(req, res, 'api-firms.ts', 30)) return res.status(429).json({ error: 'Too many requests; please retry shortly.' });

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // FIRMS field queries contain farm-location data; require a verified session by default.
  if (process.env.REQUIRE_AUTH_FOR_FIRMS !== 'false') {
    const user = await verifyUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });
  }

  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return res.status(503).json({ error: 'FIRMS_MAP_KEY is not configured' });

  res.setHeader?.('Cache-Control', 'no-store');
  const body = req.body;
  const field = body?.field;
  if (!field || typeof field !== 'object' || !validPoint(field)) {
    return res.status(400).json({ error: 'field requires valid latitude and longitude' });
  }
  const radius = body?.radius_km === undefined ? 12 : Number(body.radius_km);
  if (!Number.isFinite(radius) || radius < 1 || radius > 50) {
    return res.status(400).json({ error: 'radius_km must be between 1 and 50' });
  }

  const polygon = Array.isArray(field.geometry) ? field.geometry : [];
  if (polygon.length && (polygon.length < 3 || polygon.length > 500 ||
      polygon.some((point: any) => !validPoint(point)))) {
    return res.status(400).json({ error: 'field.geometry must contain 3–500 valid coordinates' });
  }

  const dLat = radius / 111;
  const dLng = radius / (111 * Math.max(0.2, Math.cos(Number(field.lat) * Math.PI / 180)));
  const bbox = `${Number(field.lng) - dLng},${Number(field.lat) - dLat},${Number(field.lng) + dLng},${Number(field.lat) + dLat}`;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_NOAA21_NRT/${bbox}/1`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) return res.status(502).json({ error: 'FIRMS request failed' });
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/);
    const headers = (lines.shift() || '').split(',');
    const observations = lines.slice(0, 500).map(line => {
      const columns = line.split(',');
      return Object.fromEntries(headers.map((header, index) => [header, columns[index]]));
    });
    const parsed = observations.map(item => ({
      ...item,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    })).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const matched = polygon.length >= 3
      ? parsed.filter(item => inside({ lat: item.latitude, lng: item.longitude }, polygon))
      : [];

    return res.status(200).json({
      source: 'NASA FIRMS',
      sensor: 'VIIRS_NOAA21_NRT',
      count: parsed.length,
      matched_count: matched.length,
      radius_km: radius,
      polygon_checked: polygon.length >= 3,
      verification_status: 'DETECTION_SCREENING_NOT_PROOF_OF_NO_BURNING',
      observations: parsed,
      matched_observations: matched,
      queried_at: new Date().toISOString(),
    });
  } catch {
    return res.status(502).json({ error: 'FIRMS is unavailable; retry later' });
  }
}
