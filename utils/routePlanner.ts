// ============================================================
// Chakrava — Smart Route Planner
// Nearest-neighbor TSP heuristic for MVP
// ============================================================
import type { Bin, Vehicle, CollectionTask, RouteStop, RoutePlan } from '../types';
import { haversineKm } from './formatters';

/**
 * Build a prioritized collection route using nearest-neighbor algorithm.
 *
 * Steps:
 * 1. Sort tasks by overflow risk priority (critical first)
 * 2. Starting from vehicle position, pick nearest unvisited critical bin
 * 3. Repeat until all assigned tasks are ordered
 *
 * This is O(n²) — suitable for the typical panchayat scale (5–30 bins).
 */
export const planRoute = (
  vehicle: Vehicle,
  tasks: CollectionTask[],
  bins: Bin[],
): RoutePlan => {
  if (tasks.length === 0) {
    return { vehicle, stops: [], total_distance_km: 0, estimated_duration_min: 0 };
  }

  // Map bin_id → Bin for quick lookup
  const binMap = new Map<string, Bin>(bins.map(b => [b.id, b]));

  // Pair each task with its bin, skip if bin not found
  type TaskBin = { task: CollectionTask; bin: Bin };
  const remaining: TaskBin[] = tasks
    .filter(t => binMap.has(t.bin_id))
    .map(t => ({ task: t, bin: binMap.get(t.bin_id)! }));

  // Priority weights: critical=0, high=1, medium=2, low=3
  const priorityWeight: Record<string, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  };

  const stops: RouteStop[] = [];
  let curLat = vehicle.lat;
  let curLng = vehicle.lng;
  let totalDist = 0;
  let order = 1;

  while (remaining.length > 0) {
    // Find the nearest bin, weighted slightly by overflow risk
    let bestIdx = 0;
    let bestScore = Infinity;

    remaining.forEach((tb, idx) => {
      const dist = haversineKm(curLat, curLng, tb.bin.lat, tb.bin.lng);
      // Weight: 70% distance, 30% priority
      const pw = priorityWeight[tb.task.overflow_risk] ?? 2;
      const score = dist * 0.7 + pw * 0.3;
      if (score < bestScore) { bestScore = score; bestIdx = idx; }
    });

    const chosen = remaining.splice(bestIdx, 1)[0];
    const dist_km = haversineKm(curLat, curLng, chosen.bin.lat, chosen.bin.lng);
    totalDist += dist_km;

    stops.push({
      order,
      bin: chosen.bin,
      task: chosen.task,
      distance_from_prev_km: dist_km,
    });

    curLat = chosen.bin.lat;
    curLng = chosen.bin.lng;
    order++;
  }

  // Estimate: avg 20 km/h in village roads + 5 min per collection stop
  const drive_min = (totalDist / 20) * 60;
  const collect_min = stops.length * 5;
  const estimated_duration_min = Math.round(drive_min + collect_min);

  return { vehicle, stops, total_distance_km: totalDist, estimated_duration_min };
};
