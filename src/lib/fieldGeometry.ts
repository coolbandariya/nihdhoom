import type { LatLng } from '../types';

/**
 * Small, dependency-free geometry helpers for field review.
 * Uses a local equirectangular projection around the polygon, which is
 * accurate to well under 1% at field scale (a few hundred metres).
 */

const EARTH_RADIUS_M = 6_371_008.8;
const SQ_M_PER_ACRE = 4046.8564224;
const SQ_M_PER_HECTARE = 10_000;

type XY = { x: number; y: number };

function projector(origin: LatLng) {
  const lat0 = (origin.lat * Math.PI) / 180;
  const kx = Math.cos(lat0) * (Math.PI / 180) * EARTH_RADIUS_M;
  const ky = (Math.PI / 180) * EARTH_RADIUS_M;
  return (p: LatLng): XY => ({ x: (p.lng - origin.lng) * kx, y: (p.lat - origin.lat) * ky });
}

export function validRing(points: LatLng[] | undefined | null): LatLng[] {
  return (points || []).filter((p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)))
    .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
}

export function ringCentroid(ring: LatLng[]): LatLng {
  const n = ring.length || 1;
  return {
    lat: ring.reduce((sum, p) => sum + p.lat, 0) / n,
    lng: ring.reduce((sum, p) => sum + p.lng, 0) / n,
  };
}

/** Polygon area in square metres (shoelace on the local projection). */
export function polygonAreaM2(ring: LatLng[]): number {
  if (ring.length < 3) return 0;
  const project = projector(ringCentroid(ring));
  const pts = ring.map(project);
  let sum = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonPerimeterM(ring: LatLng[]): number {
  if (ring.length < 2) return 0;
  const project = projector(ringCentroid(ring));
  const pts = ring.map(project);
  let total = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

export const m2ToAcres = (m2: number) => m2 / SQ_M_PER_ACRE;
export const m2ToHectares = (m2: number) => m2 / SQ_M_PER_HECTARE;

/** Great-circle distance in metres. */
export function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pointInRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const crosses = (a.lng > point.lng) !== (b.lng > point.lng)
      && point.lat < ((b.lat - a.lat) * (point.lng - a.lng)) / (b.lng - a.lng) + a.lat;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Distance in metres from a point to the field boundary (0 when inside). */
export function distanceToRingM(point: LatLng, ring: LatLng[]): number {
  if (ring.length < 3) return ring.length ? haversineM(point, ringCentroid(ring)) : Infinity;
  if (pointInRing(point, ring)) return 0;
  const project = projector(ringCentroid(ring));
  const p = project(point);
  const pts = ring.map(project);
  let best = Infinity;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}

/** Bearing-preserving offset of a point from an origin, in metres (x east, y north). */
export function offsetM(origin: LatLng, point: LatLng): XY {
  return projector(origin)(point);
}

/** Polygon vertices projected to metres around its centroid, for drawing. */
export function projectRing(ring: LatLng[]): XY[] {
  const project = projector(ringCentroid(ring));
  return ring.map(project);
}

export function formatDistance(m: number): string {
  if (!Number.isFinite(m)) return 'n/a';
  if (m === 0) return 'inside';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}
