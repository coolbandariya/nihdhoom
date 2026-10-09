import type { Field } from '../types';

/**
 * Five plain-language stages used on the map legend, map filters and the
 * evidence review. Every FieldStatus maps to exactly one stage.
 */
export type FieldStage = 'registered' | 'booked' | 'baling' | 'cleared' | 'verified';

export const FIELD_STAGES: FieldStage[] = ['registered', 'booked', 'baling', 'cleared', 'verified'];

export const STAGE_META: Record<FieldStage, { label: string; fill: string; stroke: string; dashed?: boolean }> = {
  // Colours are tuned to stay readable on satellite imagery.
  registered: { label: 'Registered', fill: '#fffbf3', stroke: '#ffffff', dashed: true },
  booked: { label: 'Booked', fill: '#5b7bea', stroke: '#c7d3ff' },
  baling: { label: 'Baling', fill: '#f08a24', stroke: '#ffd2a3' },
  cleared: { label: 'Cleared', fill: '#7fd19b', stroke: '#d6f5e0' },
  verified: { label: 'Verified', fill: '#1f9e55', stroke: '#a8e6bf' },
};

export function fieldStage(status: Field['status']): FieldStage {
  switch (status) {
    case 'REGISTERED':
      return 'registered';
    case 'BOOKED':
    case 'MACHINE_ASSIGNED':
    case 'ON_THE_WAY':
    case 'SCHEDULED':
      return 'booked';
    case 'BALING_IN_PROGRESS':
      return 'baling';
    case 'CLEARED_PENDING_AUDIT':
      return 'cleared';
    case 'VERIFIED_NON_BURN':
      return 'verified';
    default:
      return 'registered';
  }
}

/** Valid [lat, lng] ring for a field, or an empty array when the geometry is unusable. */
export function fieldRing(field: Field): [number, number][] {
  return (field.geometry || [])
    .filter((p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)))
    .map((p) => [Number(p.lat), Number(p.lng)] as [number, number]);
}
