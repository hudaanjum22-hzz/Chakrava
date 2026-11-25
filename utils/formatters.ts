// ============================================================
// Chakrava — Utility: Date, distance, % formatters
// ============================================================

/** Format a fill percentage as a string with % sign */
export const formatFill = (pct: number): string => `${Math.round(pct)}%`;

/** Format an ISO date string as a short relative time (e.g. "2h ago") */
export const formatRelativeTime = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/** Format an ISO date string as "DD MMM YYYY, HH:MM" */
export const formatDateTime = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/** Format a decimal hours value as "Xh Ym" */
export const formatHours = (hours: number): string => {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/** Haversine distance in km between two lat/lng points */
export const haversineKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Format km distance as "X.X km" or "XXX m" */
export const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

/** Clamp a number between min and max */
export const clamp = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, val));
