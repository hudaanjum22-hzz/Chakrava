// ============================================================
// Chakrava — TypeScript entity interfaces
// ============================================================

export type UserRole = 'admin' | 'driver';

export type BinStatus = 'normal' | 'attention' | 'critical';
export type VehicleStatus = 'idle' | 'on_route' | 'collecting' | 'off_duty';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type OverflowRisk = 'low' | 'medium' | 'high' | 'critical';

// ─── Auth ────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  vehicle_id?: string;
  avatar_url?: string;
  phone?: string;
}

// ─── Bin ─────────────────────────────────────────────────────
export interface Bin {
  id: string;
  bin_code: string;         // e.g. "BIN-001" — also encoded in QR
  label: string;            // Human-readable name
  area: string;             // Village / ward name
  lat: number;
  lng: number;
  capacity_litres: number;
  fill_pct: number;         // 0–100
  fill_rate_per_hour: number; // % per hour (simulated)
  status: BinStatus;
  last_collected_at: string; // ISO date string
  notes?: string;
}

export interface SensorReading {
  id: string;
  bin_id: string;
  fill_pct: number;
  recorded_at: string;
  source: 'sensor' | 'demo';
}

// ─── Vehicle ─────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  vehicle_code: string;     // e.g. "VH-01"
  driver_id?: string;
  driver_name?: string;
  lat: number;
  lng: number;
  status: VehicleStatus;
  is_on_duty: boolean;
  last_updated_at: string;
}

// ─── Collection Task ─────────────────────────────────────────
export interface CollectionTask {
  id: string;
  bin_id: string;
  bin?: Bin;
  vehicle_id?: string;
  vehicle?: Vehicle;
  priority: number;         // 1 = highest
  status: TaskStatus;
  assigned_at: string;
  due_at?: string;
  overflow_risk: OverflowRisk;
  eta_hours?: number;       // Predicted hours to overflow
}

// ─── Collection Record ───────────────────────────────────────
export interface CollectionRecord {
  id: string;
  bin_id: string;
  bin_code?: string;
  bin_label?: string;
  bin_area?: string;
  driver_id: string;
  driver_name?: string;
  vehicle_id: string;
  vehicle_code?: string;
  collected_at: string;
  fill_pct_at_collection: number;
  verified_by_qr: boolean;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  total_bins: number;
  critical_bins: number;
  pending_collections: number;
  active_vehicles: number;
  completed_today: number;
}

// ─── Overflow Prediction ─────────────────────────────────────
export interface OverflowPrediction {
  bin_id: string;
  fill_pct: number;
  fill_rate_per_hour: number;
  eta_hours: number | null;   // null = rate is 0
  risk: OverflowRisk;
  display_eta: string;        // Human-readable: "2h 30m"
}

// ─── Route Plan ──────────────────────────────────────────────
export interface RouteStop {
  order: number;
  bin: Bin;
  task: CollectionTask;
  distance_from_prev_km: number;
}

export interface RoutePlan {
  vehicle: Vehicle;
  stops: RouteStop[];
  total_distance_km: number;
  estimated_duration_min: number;
}
