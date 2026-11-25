// ============================================================
// Chakrava — Demo Mode Data Service
// All CRUD operations against in-memory demo state.
// ============================================================
import { DEMO_BINS, DEMO_VEHICLES, DEMO_TASKS, DEMO_RECORDS } from '../constants/DemoData';
import type { Bin, Vehicle, CollectionTask, CollectionRecord } from '../types';
import { clamp } from '../utils/formatters';
import { predictOverflow } from '../utils/overflowPredictor';

// In-memory mutable state (lives for the app session)
let bins: Bin[]                 = DEMO_BINS.map(b => ({ ...b }));
let vehicles: Vehicle[]         = DEMO_VEHICLES.map(v => ({ ...v }));
let tasks: CollectionTask[]     = DEMO_TASKS.map(t => ({ ...t }));
let records: CollectionRecord[] = DEMO_RECORDS.map(r => ({ ...r }));

// ─── Bins ─────────────────────────────────────────────────────
export const getBins = (): Bin[] => [...bins];

export const getBinById = (id: string): Bin | undefined =>
  bins.find(b => b.id === id);

export const getBinByCode = (code: string): Bin | undefined =>
  bins.find(b => b.bin_code === code);

export const updateBinFill = (id: string, fill_pct: number): void => {
  bins = bins.map(b => {
    if (b.id !== id) return b;
    const newFill = clamp(fill_pct, 0, 100);
    const status =
      newFill >= 85 ? 'critical' :
      newFill >= 55 ? 'attention' : 'normal';
    return { ...b, fill_pct: newFill, status };
  });
};

/** Simulate sensor update: randomly increment each bin's fill level */
export const simulateSensorUpdate = (): Bin[] => {
  bins = bins.map(b => {
    const delta = b.fill_rate_per_hour * (0.5 + Math.random()); // 0.5–1.5h equivalent
    const newFill = clamp(b.fill_pct + delta, 0, 100);
    const status =
      newFill >= 85 ? 'critical' :
      newFill >= 55 ? 'attention' : 'normal';
    return { ...b, fill_pct: newFill, status };
  });
  // Refresh task priorities
  refreshTaskPriorities();
  return [...bins];
};

/** Recompute task overflow_risk and eta after fill level changes */
const refreshTaskPriorities = (): void => {
  tasks = tasks
    .filter(t => t.status !== 'completed')
    .map(t => {
      const bin = bins.find(b => b.id === t.bin_id);
      if (!bin) return t;
      const pred = predictOverflow(bin);
      return { ...t, overflow_risk: pred.risk, eta_hours: pred.eta_hours ?? undefined };
    })
    .sort((a, b) => (a.eta_hours ?? 999) - (b.eta_hours ?? 999))
    .map((t, i) => ({ ...t, priority: i + 1 }));
};

// ─── Vehicles ─────────────────────────────────────────────────
export const getVehicles = (): Vehicle[] => [...vehicles];

export const getVehicleById = (id: string): Vehicle | undefined =>
  vehicles.find(v => v.id === id);

export const updateVehicleLocation = (
  id: string, lat: number, lng: number,
): void => {
  vehicles = vehicles.map(v =>
    v.id === id
      ? { ...v, lat, lng, last_updated_at: new Date().toISOString() }
      : v,
  );
};

export const setVehicleOnDuty = (id: string, on_duty: boolean): void => {
  vehicles = vehicles.map(v =>
    v.id === id
      ? { ...v, is_on_duty: on_duty, status: on_duty ? 'on_route' : 'idle',
          last_updated_at: new Date().toISOString() }
      : v,
  );
};

/** Simulate vehicle GPS drift (called on a timer) */
export const driftVehicles = (): Vehicle[] => {
  vehicles = vehicles.map(v => {
    if (!v.is_on_duty) return v;
    const drift = () => (Math.random() - 0.5) * 0.0005;
    return {
      ...v,
      lat: v.lat + drift(),
      lng: v.lng + drift(),
      last_updated_at: new Date().toISOString(),
    };
  });
  return [...vehicles];
};

// ─── Tasks ────────────────────────────────────────────────────
export const getTasks = (): CollectionTask[] => [...tasks];

export const getTasksForVehicle = (vehicleId: string): CollectionTask[] =>
  tasks.filter(t => t.vehicle_id === vehicleId && t.status !== 'completed');

export const getTasksWithBins = (): CollectionTask[] =>
  tasks.map(t => ({ ...t, bin: bins.find(b => b.id === t.bin_id) }));

// ─── Collection Records ───────────────────────────────────────
export const getRecords = (): CollectionRecord[] =>
  [...records].sort(
    (a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
  );

export const getRecordsForDriver = (driverId: string): CollectionRecord[] =>
  getRecords().filter(r => r.driver_id === driverId);

/** Record a completed QR scan collection */
export const recordCollection = (params: {
  bin_id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_code: string;
  fill_pct_at_collection: number;
}): CollectionRecord => {
  const bin = bins.find(b => b.id === params.bin_id);
  const record: CollectionRecord = {
    id: `rec-${Date.now()}`,
    ...params,
    bin_code:  bin?.bin_code,
    bin_label: bin?.label,
    bin_area:  bin?.area,
    collected_at: new Date().toISOString(),
    verified_by_qr: true,
  };
  records = [record, ...records];

  // Reset bin fill and mark task complete
  updateBinFill(params.bin_id, 5);
  bins = bins.map(b =>
    b.id === params.bin_id
      ? { ...b, last_collected_at: new Date().toISOString() }
      : b,
  );
  tasks = tasks.map(t =>
    t.bin_id === params.bin_id ? { ...t, status: 'completed' } : t,
  );

  return record;
};

/** Dashboard summary stats */
export const getDashboardStats = () => ({
  total_bins:          bins.length,
  critical_bins:       bins.filter(b => b.status === 'critical').length,
  pending_collections: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
  active_vehicles:     vehicles.filter(v => v.is_on_duty).length,
  completed_today:     records.filter(r => {
    const d = new Date(r.collected_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length,
});
