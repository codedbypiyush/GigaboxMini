import type {TrackingStatus} from '../../store/slices/trackingSlice';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type TrackingSnapshot = {
  status: Exclude<TrackingStatus, null>;
  elapsedMs: number;
  progress: number;
  courier: LatLng;
  store: LatLng;
  customer: LatLng;
  etaLabel: string;
};

/**
 * Demo timeline (kept short so reviewers can see full progression quickly).
 * Status is always derived from Date.now() - orderPlacedAt — never from a timer alone.
 */
export const TRACKING_PHASES_MS = {
  PLACED: 15_000,
  PACKED: 35_000,
  OUT_FOR_DELIVERY: 90_000,
  DELIVERED: 90_000,
} as const;

// Fixed demo route (Bengaluru corridor).
export const STORE_COORDINATE: LatLng = {
  latitude: 12.9716,
  longitude: 77.5946,
};

export const CUSTOMER_COORDINATE: LatLng = {
  latitude: 12.9352,
  longitude: 77.6245,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function interpolateCoordinate(from: LatLng, to: LatLng, t: number): LatLng {
  const progress = clamp(t, 0, 1);
  return {
    latitude: lerp(from.latitude, to.latitude, progress),
    longitude: lerp(from.longitude, to.longitude, progress),
  };
}

export function getElapsedMs(
  orderPlacedAt: number,
  now: number = Date.now(),
): number {
  return Math.max(0, now - orderPlacedAt);
}

export function getStatusFromElapsed(
  elapsedMs: number,
): Exclude<TrackingStatus, null> {
  if (elapsedMs < TRACKING_PHASES_MS.PLACED) {
    return 'PLACED';
  }
  if (elapsedMs < TRACKING_PHASES_MS.PACKED) {
    return 'PACKED';
  }
  if (elapsedMs < TRACKING_PHASES_MS.OUT_FOR_DELIVERY) {
    return 'OUT_FOR_DELIVERY';
  }
  return 'DELIVERED';
}

export function getDeliveryProgress(elapsedMs: number): number {
  const start = TRACKING_PHASES_MS.PACKED;
  const end = TRACKING_PHASES_MS.OUT_FOR_DELIVERY;
  if (elapsedMs <= start) {
    return 0;
  }
  if (elapsedMs >= end) {
    return 1;
  }
  return (elapsedMs - start) / (end - start);
}

export function getCourierCoordinate(elapsedMs: number): LatLng {
  const status = getStatusFromElapsed(elapsedMs);

  if (status === 'PLACED' || status === 'PACKED') {
    return STORE_COORDINATE;
  }

  if (status === 'DELIVERED') {
    return CUSTOMER_COORDINATE;
  }

  return interpolateCoordinate(
    STORE_COORDINATE,
    CUSTOMER_COORDINATE,
    getDeliveryProgress(elapsedMs),
  );
}

export function getEtaLabel(elapsedMs: number): string {
  const status = getStatusFromElapsed(elapsedMs);
  if (status === 'DELIVERED') {
    return 'Delivered';
  }

  const remainingMs = TRACKING_PHASES_MS.OUT_FOR_DELIVERY - elapsedMs;
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `~${minutes} min`;
}

/**
 * Pure snapshot calculator. Call this whenever the UI becomes visible again
 * (AppState active, screen focus). Do not treat setInterval as source of truth.
 */
export function getTrackingSnapshot(
  orderPlacedAt: number,
  now: number = Date.now(),
): TrackingSnapshot {
  const elapsedMs = getElapsedMs(orderPlacedAt, now);

  return {
    status: getStatusFromElapsed(elapsedMs),
    elapsedMs,
    progress: getDeliveryProgress(elapsedMs),
    courier: getCourierCoordinate(elapsedMs),
    store: STORE_COORDINATE,
    customer: CUSTOMER_COORDINATE,
    etaLabel: getEtaLabel(elapsedMs),
  };
}

export const STATUS_ORDER: Exclude<TrackingStatus, null>[] = [
  'PLACED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

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
