import type {TrackingStatus} from '../../store/slices/trackingSlice';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type TrackingSnapshot = {
  status: Exclude<TrackingStatus, null>;
  courier: LatLng;
  store: LatLng;
  customer: LatLng;
  etaLabel: string;
};

/** Elapsed-time thresholds (ms). Status comes from time, not from the ticker. */
const PHASE = {
  PLACED: 15_000,
  PACKED: 35_000,
  OUT_FOR_DELIVERY: 90_000,
} as const;

export const STORE: LatLng = {latitude: 12.9716, longitude: 77.5946};
export const CUSTOMER: LatLng = {latitude: 12.9352, longitude: 77.6245};

export const STATUS_ORDER: Exclude<TrackingStatus, null>[] = [
  'PLACED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const TICK_MS = 2500;

function statusFromElapsed(ms: number): Exclude<TrackingStatus, null> {
  if (ms < PHASE.PLACED) {
    return 'PLACED';
  }
  if (ms < PHASE.PACKED) {
    return 'PACKED';
  }
  if (ms < PHASE.OUT_FOR_DELIVERY) {
    return 'OUT_FOR_DELIVERY';
  }
  return 'DELIVERED';
}

function courierFromElapsed(ms: number): LatLng {
  const status = statusFromElapsed(ms);
  if (status === 'PLACED' || status === 'PACKED') {
    return STORE;
  }
  if (status === 'DELIVERED') {
    return CUSTOMER;
  }

  const t = (ms - PHASE.PACKED) / (PHASE.OUT_FOR_DELIVERY - PHASE.PACKED);
  const p = Math.min(1, Math.max(0, t));
  return {
    latitude: STORE.latitude + (CUSTOMER.latitude - STORE.latitude) * p,
    longitude: STORE.longitude + (CUSTOMER.longitude - STORE.longitude) * p,
  };
}

/**
 * Source of truth for tracking UI.
 * Call on every tick AND when app returns to foreground.
 */
export function getTrackingSnapshot(
  orderPlacedAt: number,
  now = Date.now(),
): TrackingSnapshot {
  const elapsed = Math.max(0, now - orderPlacedAt);
  const status = statusFromElapsed(elapsed);
  const remaining = PHASE.OUT_FOR_DELIVERY - elapsed;

  return {
    status,
    courier: courierFromElapsed(elapsed),
    store: STORE,
    customer: CUSTOMER,
    etaLabel:
      status === 'DELIVERED'
        ? 'Delivered'
        : `~${Math.max(1, Math.ceil(remaining / 60_000))} min`,
  };
}

export function formatStatusLabel(status: Exclude<TrackingStatus, null>) {
  switch (status) {
    case 'PLACED':
      return 'Order placed';
    case 'PACKED':
      return 'Packed at store';
    case 'OUT_FOR_DELIVERY':
      return 'Out for delivery';
    case 'DELIVERED':
      return 'Delivered';
    default:
      return status;
  }
}
