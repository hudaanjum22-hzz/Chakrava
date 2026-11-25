// ============================================================
// Chakrava — Overflow Prediction Engine
// Rule-based for MVP; structured for future ML integration.
// ============================================================
import type { Bin, OverflowPrediction, OverflowRisk } from '../types';
import { formatHours } from './formatters';

/**
 * Calculate overflow risk for a single bin.
 *
 * Formula:
 *   ETA (hours) = (100 - fill_pct) / fill_rate_per_hour
 *
 * Risk thresholds:
 *   critical  → ETA < 2 hours  OR fill_pct >= 90
 *   high      → ETA < 6 hours  OR fill_pct >= 75
 *   medium    → ETA < 24 hours OR fill_pct >= 50
 *   low       → otherwise
 */
export const predictOverflow = (bin: Bin): OverflowPrediction => {
  const { id, fill_pct, fill_rate_per_hour } = bin;

  let eta_hours: number | null = null;
  if (fill_rate_per_hour > 0) {
    eta_hours = (100 - fill_pct) / fill_rate_per_hour;
  }

  const risk = classifyRisk(fill_pct, eta_hours);
  const display_eta =
    eta_hours === null
      ? 'Rate unknown'
      : fill_pct >= 100
        ? 'Overflowing now!'
        : `~${formatHours(eta_hours)}`;

  return { bin_id: id, fill_pct, fill_rate_per_hour, eta_hours, risk, display_eta };
};

/** Classify risk level from fill % and ETA */
const classifyRisk = (fill_pct: number, eta_hours: number | null): OverflowRisk => {
  if (fill_pct >= 90 || (eta_hours !== null && eta_hours < 2))  return 'critical';
  if (fill_pct >= 75 || (eta_hours !== null && eta_hours < 6))  return 'high';
  if (fill_pct >= 50 || (eta_hours !== null && eta_hours < 24)) return 'medium';
  return 'low';
};

/** Predict overflow for a list of bins, sorted by urgency */
export const predictAllBins = (bins: Bin[]): OverflowPrediction[] =>
  bins
    .map(predictOverflow)
    .sort((a, b) => {
      // Null ETA (no rate) goes last
      if (a.eta_hours === null) return 1;
      if (b.eta_hours === null) return -1;
      return a.eta_hours - b.eta_hours;
    });

/** Get risk label for display */
export const riskLabel: Record<OverflowRisk, string> = {
  critical: '🔴 Critical',
  high:     '🟠 High Risk',
  medium:   '🟡 Medium',
  low:      '🟢 Low',
};

/** Get risk color */
export const riskColor: Record<OverflowRisk, string> = {
  critical: '#E74C3C',
  high:     '#F39C12',
  medium:   '#F1C40F',
  low:      '#27AE60',
};
