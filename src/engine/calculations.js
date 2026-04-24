// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────
// Implements ProMap calculation logic from Excel analysis
//
// FLOW:
//   avgSold × adjustPct% = suggestedQty (products)
//   confirmedProductQty × recipe = suggestedBatchQty
//   suggestedBatchQty - carryOver = adjustedBatch
//
// BATCH COLOUR CODING (derived from prepTiming + shelf life):
//   TODAY    → black    (prep for current service)
//   TOMORROW → purple   (prep this PM for tomorrow)
//   2-DAY    → blue     (prep now for day after tomorrow)
//   3-DAY    → teal     (prep now for 3 days ahead)
//   DO-NOT-PREP → grey  (shelf life still covers it — Smart Kitchen Principles)

import { AVG_SOLD } from '../data/seed.js';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── AVERAGE CALCULATION ───────────────────────────────────────────────────────
// Used on Setup and Breakfast/Lunch tabs
// Excludes Buffet for 6 / Bundles (handled by SQL — seed data already excludes them)
export function calcAvgSold(plu, dayOfWeek, selectedWeeks = []) {
  // Phase 1: use seed averages (day of week 0=Sun, 1=Mon, etc.)
  // Phase 2: calculate from live SQL data filtered to selectedWeeks
  const avg = AVG_SOLD[plu];
  if (!avg) return 0;
  return avg[dayOfWeek] || 0;
}

// ── SUGGESTED PRODUCT QUANTITY ─────────────────────────────────────────────────
// suggestedQty = ceil(avgSold × adjustPct / 100)
// Combined = suggestedQty + cateringQty (catering adds ON TOP, not included in %)
export function calcSuggestedProduct(plu, dayOfWeek, adjustPct = 100, cateringQty = 0, selectedWeeks = []) {
  const avg = calcAvgSold(plu, dayOfWeek, selectedWeeks);
  const suggested = Math.ceil(avg * adjustPct / 100);
  const combined = suggested + cateringQty;
  return { avg, suggested, cateringQty, combined, adjustPct };
}

// ── SUGGESTED BATCH QUANTITY ───────────────────────────────────────────────────
// Driven by confirmed finished product quantities (NOT by covers)
// driverPlu: null → total covers × gpc | 'PLU' → product qty × gpp or upp
export function calcSuggestedBatch(batch, confirmedProducts, totalCovers) {
  let gramsNeeded = 0;

  if (batch.driverPlu === null) {
    // Driven by total covers
    gramsNeeded = (totalCovers || 0) * (batch.gpc || 0);
  } else if (batch.gpp) {
    // Driven by specific product grams per product unit
    const driverQty = confirmedProducts[batch.driverPlu] || 0;
    gramsNeeded = driverQty * batch.gpp;
  } else if (batch.upp) {
    // Driven by specific product units per product unit
    const driverQty = confirmedProducts[batch.driverPlu] || 0;
    return {
      unitsNeeded: driverQty * batch.upp,
      batchSize: batch.size,
      fullBatches: Math.ceil(driverQty * batch.upp),
      halfBatches: 0,
      suggested: driverQty * batch.upp,
    };
  }

  if (gramsNeeded === 0) return { unitsNeeded:0, fullBatches:0, halfBatches:0, suggested:0 };

  const batchSize = batch.size || 1000;
  const fullBatches = Math.floor(gramsNeeded / batchSize);
  const remainder = gramsNeeded % batchSize;
  // Half batch: remainder > 40% of batch size
  const halfBatches = remainder > batchSize * 0.4 ? 1 : 0;
  const suggested = fullBatches + (halfBatches * 0.5);

  return { gramsNeeded, batchSize, fullBatches, halfBatches, suggested, remainder };
}

// ── PREP COLOUR CODING ────────────────────────────────────────────────────────
// Returns colour class based on prepTiming and whether item should be prepped today
// shouldPrepToday is determined by shelf life logic (Smart Kitchen Principles)
export function getPrepColour(prepTiming, shouldPrepToday = true) {
  if (!shouldPrepToday) return 'prep-grey';   // Do not prep — shelf life covers it
  switch (prepTiming) {
    case 'TODAY':    return 'prep-black';    // Black — prep for today's service
    case 'TOMORROW': return 'prep-purple';   // Purple — prep today for tomorrow
    case '2-DAY':    return 'prep-blue';     // Blue — prep today for day after
    case '3-DAY':    return 'prep-teal';     // Teal — prep today for 3 days ahead
    default:         return 'prep-black';
  }
}

// ── SMART KITCHEN — SHOULD PREP TODAY ─────────────────────────────────────────
// Determines if a batch needs prepping today based on:
//   1. Last prep date and shelf life remaining
//   2. Prep group schedule (for dressings)
//   3. Current day of week
export function shouldPrepToday(batch, lastPrepDate, today = new Date()) {
  if (!batch.shelfLifeHours) return true; // No shelf life data — always show
  if (!lastPrepDate) return true; // Never prepped — must prep today

  const hoursElapsed = (today - new Date(lastPrepDate)) / 3600000;
  const hoursRemaining = batch.shelfLifeHours - hoursElapsed;

  // Still covered by previous batch — don't prep today
  if (hoursRemaining > 24) return false;

  return true;
}

// ── DRESSING PREP SCHEDULE ───────────────────────────────────────────────────
// Smart Kitchen Principles — which days each group preps
// prepGroup 1: Mon→Tue/Wed, Wed→Thu/Fri, Fri→Sat/Sun/Mon
// prepGroup 2: Mon→Mon-Wed, Wed→Thu/Fri, Fri→Sat/Sun
// prepGroup 3: Tue→Wed-Fri, Fri→Sat-Tue
export function getDressingPrepDays(prepGroup) {
  switch (prepGroup) {
    case 1: return [1, 3, 5]; // Mon, Wed, Fri
    case 2: return [1, 3, 5]; // Mon, Wed, Fri
    case 3: return [2, 5];    // Tue, Fri
    default: return [1,2,3,4,5,6,0];
  }
}

export function isDressingPrepDay(prepGroup, dayOfWeek) {
  return getDressingPrepDays(prepGroup).includes(dayOfWeek);
}

export function getDressingCoversDays(prepGroup, prepDay) {
  // Returns which days this prep covers
  switch (prepGroup) {
    case 1:
      if (prepDay === 1) return [2,3]; // Mon preps for Tue/Wed
      if (prepDay === 3) return [4,5]; // Wed preps for Thu/Fri
      if (prepDay === 5) return [6,0,1]; // Fri preps for Sat/Sun/Mon
      break;
    case 2:
      if (prepDay === 1) return [1,2,3]; // Mon preps for Mon-Wed
      if (prepDay === 3) return [4,5];   // Wed preps for Thu/Fri
      if (prepDay === 5) return [6,0];   // Fri preps for Sat/Sun
      break;
    case 3:
      if (prepDay === 2) return [3,4,5]; // Tue preps for Wed-Fri
      if (prepDay === 5) return [6,0,1,2]; // Fri preps for Sat-Tue
      break;
  }
  return [];
}

// ── IN-HOUSE PREP CALCULATION ─────────────────────────────────────────────────
// For each dressing/batch item, calculate to-prepare quantity for the week
// coverDays: array of day indices this prep needs to cover
// onHand: current stock
export function calcInHousePrep(batch, weekDailyPlanned, coverDays, onHand = 0) {
  const totalNeeded = coverDays.reduce((sum, dayIdx) => {
    return sum + (weekDailyPlanned[dayIdx] || 0);
  }, 0);
  const toPrepare = Math.max(0, totalNeeded - onHand);
  const batchCount = batch.size > 0 ? toPrepare / batch.size : toPrepare;
  return { totalNeeded, onHand, toPrepare, batchCount: Math.ceil(batchCount * 2) / 2 }; // round to 0.5
}

// ── PCR TRAY CALCULATION ──────────────────────────────────────────────────────
export function calcTrayCount(qty, traySize, trayCalc) {
  if (!traySize || !trayCalc) return null;
  if (trayCalc === 'multiply') return Math.ceil(qty / traySize);
  if (trayCalc === 'divide') return Math.ceil(qty * traySize);
  return qty;
}

// ── TOTAL COVERS ──────────────────────────────────────────────────────────────
// Total confirmed covers for a day (sum of all confirmed lunch product quantities)
export function calcTotalCovers(confirmedLunch) {
  return Object.values(confirmedLunch || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}

// ── FORECAST VALIDATION ───────────────────────────────────────────────────────
// Day part totals must equal total forecast
export function validateForecast(total, dayParts) {
  const sum = Object.values(dayParts || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const diff = Math.abs(total - sum);
  return { valid: diff < 0.01, diff, sum };
}

// ── DEPLETION ESTIMATE ────────────────────────────────────────────────────────
// Estimates remaining stock based on prep qty, days elapsed, and avg daily usage
export function estimateRemaining(prepQty, prepDate, batch, avgDailyUsage) {
  if (!prepDate || !prepQty) return null;
  const daysElapsed = (Date.now() - new Date(prepDate)) / 86400000;
  const used = daysElapsed * (avgDailyUsage || (batch.usagePerCover || 0) * 100);
  const remaining = Math.max(0, prepQty - used);
  const expiresAt = new Date(prepDate).getTime() + batch.shelfLifeHours * 3600000;
  const hoursUntilExpiry = (expiresAt - Date.now()) / 3600000;
  return { remaining, hoursUntilExpiry, isLow: remaining < (avgDailyUsage || 200) };
}

// ── WEEK SELECTOR RECOMMENDATION ─────────────────────────────────────────────
// Returns a warning if manager selects more than 3 weeks
export function validateWeekSelection(selectedWeeks) {
  if (selectedWeeks.length > 3) {
    return { warning: 'Using more than 3 weeks may include outdated data. Consider selecting only the most recent 3 weeks.' };
  }
  return { warning: null };
}
