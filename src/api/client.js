// ─── API CLIENT ───────────────────────────────────────────────────────────────
// Phase 1: localStorage + seed data
// Phase 2: swap this file for Azure Functions client — nothing else changes
//
// All data is stored per-shop per-week: key = `fj_${shopNo}_w${weekKey}_${type}`
// weekKey = 'YYYY-Www' e.g. '2025-W19'

import { PRODUCTS, BATCHES, USERS, SHOPS, AVG_SOLD, HOURLY_PROFILE_BREAKFAST, HOURLY_PROFILE_LUNCH, DISH_MAPPINGS, SUPPLIERS, DELIVERY_SCHEDULE, SECTION_TEMPLATES } from '../data/seed.js';

const PREFIX = 'fj_';

// ── WEEK UTILITIES ────────────────────────────────────────────────────────────
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const year = monday.getFullYear();
  const start = new Date(year, 0, 1);
  const weekNum = Math.ceil(((monday - start) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2,'0')}`;
}

export function getWeekMonday(weekKey) {
  const [year, week] = weekKey.split('-W').map(Number);
  const jan1 = new Date(year, 0, 1);
  const days = (week - 1) * 7 - jan1.getDay() + 1;
  const monday = new Date(year, 0, 1 + days);
  return monday;
}

export function getWeekDays(weekKey) {
  const monday = getWeekMonday(weekKey);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function getWeekStatus(weekKey) {
  const current = getWeekKey();
  const currentNum = weekKeyToNum(current);
  const thisNum = weekKeyToNum(weekKey);
  if (thisNum < currentNum) return 'locked';
  if (thisNum === currentNum) return 'current';
  return 'next';
}

function weekKeyToNum(wk) {
  const [y, w] = wk.split('-W').map(Number);
  return y * 100 + w;
}

export function getPreviousWeeks(n = 5) {
  const weeks = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d));
  }
  return weeks;
}

// ── LOCAL STORAGE HELPERS ─────────────────────────────────────────────────────
function lsKey(shopNo, weekKey, type) {
  return `${PREFIX}${shopNo}_${weekKey}_${type}`;
}

function lsGet(key, def = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const auth = {
  login(email, password) {
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'Invalid email or password' };
    const session = { ...user, password: undefined, loginAt: Date.now() };
    lsSet(`${PREFIX}session`, session);
    return { ok: true, user: session };
  },
  logout() { localStorage.removeItem(`${PREFIX}session`); },
  getSession() { return lsGet(`${PREFIX}session`); },
  changePassword(userId, newPassword) {
    // Phase 1: update in-memory only (Phase 2: API call)
    const session = lsGet(`${PREFIX}session`);
    if (session && session.id === userId) {
      session.mustChangePassword = false;
      lsSet(`${PREFIX}session`, session);
    }
    return { ok: true };
  },
};

// ── PRODUCT CATALOGUE ─────────────────────────────────────────────────────────
export const catalogue = {
  getProducts() {
    return lsGet(`${PREFIX}products`, PRODUCTS);
  },
  getBatches() {
    return lsGet(`${PREFIX}batches`, BATCHES);
  },
  saveProduct(product) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.plu === product.plu);
    if (idx >= 0) products[idx] = product; else products.push(product);
    lsSet(`${PREFIX}products`, products);
    notifyChange('product', product.name, product.plu);
    return product;
  },
  saveBatch(batch) {
    const batches = this.getBatches();
    const idx = batches.findIndex(b => b.plu === batch.plu);
    if (idx >= 0) batches[idx] = batch; else batches.push(batch);
    lsSet(`${PREFIX}batches`, batches);
    notifyChange('batch', batch.name, batch.plu);
    return batch;
  },
  deleteProduct(plu) {
    const products = this.getProducts().filter(p => p.plu !== plu);
    lsSet(`${PREFIX}products`, products);
  },
  deleteBatch(plu) {
    const batches = this.getBatches().filter(b => b.plu !== plu);
    lsSet(`${PREFIX}batches`, batches);
  },
};

// ── SHOPS ─────────────────────────────────────────────────────────────────────
export const shopApi = {
  getAll() { return lsGet(`${PREFIX}shops`, SHOPS); },
  save(shop) {
    const shops = this.getAll();
    const idx = shops.findIndex(s => s.shopNo === shop.shopNo);
    if (idx >= 0) shops[idx] = shop; else shops.push(shop);
    lsSet(`${PREFIX}shops`, shops);
    return shop;
  },
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll() { return lsGet(`${PREFIX}users`, USERS.map(u => ({...u, password:undefined}))); },
  create(user) {
    const users = this.getAll();
    const newUser = { ...user, id: Date.now(), mustChangePassword: true };
    users.push(newUser);
    lsSet(`${PREFIX}users`, users);
    return newUser;
  },
  update(user) {
    const users = this.getAll();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    lsSet(`${PREFIX}users`, users);
    return user;
  },
  delete(id) {
    const users = this.getAll().filter(u => u.id !== id);
    lsSet(`${PREFIX}users`, users);
  },
};

// ── WEEKLY PLAN ───────────────────────────────────────────────────────────────
// planData structure per day:
// { forecastMain, forecastCatering, forecastDayParts: {breakfast,lunch,offpeak,evening},
//   avgWeeksSelected, adjustPct, breakfastConfirmed, lunchConfirmed,
//   products: {[plu]: {avgSold, catering, planned, confirmed}},
//   batches:  {[plu]: {suggested, planned, confirmed}},
//   secondLineEnabled }

export const planApi = {
  getWeekPlan(shopNo, weekKey) {
    return lsGet(lsKey(shopNo, weekKey, 'plan'), {});
  },
  getDayPlan(shopNo, weekKey, dayIdx) {
    const week = this.getWeekPlan(shopNo, weekKey);
    return week[dayIdx] || { products:{}, batches:{}, secondLineEnabled:false };
  },
  saveDayPlan(shopNo, weekKey, dayIdx, dayPlan) {
    const status = getWeekStatus(weekKey);
    if (status === 'locked') return { ok:false, error:'Week is locked' };
    const week = this.getWeekPlan(shopNo, weekKey);
    week[dayIdx] = dayPlan;
    lsSet(lsKey(shopNo, weekKey, 'plan'), week);
    return { ok: true };
  },
  confirmBreakfast(shopNo, weekKey, dayIdx) {
    const day = this.getDayPlan(shopNo, weekKey, dayIdx);
    day.breakfastConfirmed = true;
    day.breakfastConfirmedAt = Date.now();
    return this.saveDayPlan(shopNo, weekKey, dayIdx, day);
  },
  confirmLunch(shopNo, weekKey, dayIdx) {
    const day = this.getDayPlan(shopNo, weekKey, dayIdx);
    day.lunchConfirmed = true;
    day.lunchConfirmedAt = Date.now();
    return this.saveDayPlan(shopNo, weekKey, dayIdx, day);
  },
  copyRecommendations(shopNo, weekKey, dayIdx, type='all') {
    // Copies suggested quantities into planned quantities
    const day = this.getDayPlan(shopNo, weekKey, dayIdx);
    const products = catalogue.getProducts();
    const batches = catalogue.getBatches();
    if (type === 'all' || type === 'products') {
      products.forEach(p => {
        if (!day.products[p.plu]) day.products[p.plu] = {};
        day.products[p.plu].planned = day.products[p.plu].suggested || 0;
      });
    }
    if (type === 'all' || type === 'batches') {
      batches.forEach(b => {
        if (!day.batches[b.plu]) day.batches[b.plu] = {};
        day.batches[b.plu].planned = day.batches[b.plu].suggested || 0;
      });
    }
    return this.saveDayPlan(shopNo, weekKey, dayIdx, day);
  },
  clearDay(shopNo, weekKey, dayIdx) {
    return this.saveDayPlan(shopNo, weekKey, dayIdx, { products:{}, batches:{}, secondLineEnabled:false });
  },
  clearWeek(shopNo, weekKey) {
    const status = getWeekStatus(weekKey);
    if (status === 'locked') return { ok:false, error:'Week is locked' };
    lsSet(lsKey(shopNo, weekKey, 'plan'), {});
    return { ok: true };
  },
  getDayStatus(shopNo, weekKey, dayIdx) {
    const day = this.getDayPlan(shopNo, weekKey, dayIdx);
    if (day.lunchConfirmed && day.breakfastConfirmed) return 'confirmed';
    if (day.lunchConfirmed || day.breakfastConfirmed || Object.keys(day.products||{}).length > 0) return 'partial';
    return 'notStarted';
  },
};

// ── CATERING ORDERS ───────────────────────────────────────────────────────────
// Up to 4 orders per day. Orders NOT auto-cleared week to week.
// Each order: { orderRef, items: {[plu]: qty} }
export const cateringApi = {
  getDayCatering(shopNo, weekKey, dayIdx) {
    const week = lsGet(lsKey(shopNo, weekKey, 'catering'), {});
    return week[dayIdx] || { orders: [{},{},{},{}] };
  },
  saveDayCatering(shopNo, weekKey, dayIdx, data) {
    const status = getWeekStatus(weekKey);
    if (status === 'locked') return { ok:false, error:'Week is locked' };
    const week = lsGet(lsKey(shopNo, weekKey, 'catering'), {});
    week[dayIdx] = data;
    lsSet(lsKey(shopNo, weekKey, 'catering'), week);
    return { ok: true };
  },
  clearDay(shopNo, weekKey, dayIdx) {
    return this.saveDayCatering(shopNo, weekKey, dayIdx, { orders: [{},{},{},{}] });
  },
  clearWeek(shopNo, weekKey) {
    const status = getWeekStatus(weekKey);
    if (status === 'locked') return { ok:false, error:'Week is locked' };
    lsSet(lsKey(shopNo, weekKey, 'catering'), {});
    return { ok: true };
  },
  // Get planned catering qty per product for a day (sum of all 4 orders)
  getDayCateringTotals(shopNo, weekKey, dayIdx) {
    const { orders } = this.getDayCatering(shopNo, weekKey, dayIdx);
    const totals = {};
    orders.forEach(order => {
      if (!order.items) return;
      Object.entries(order.items).forEach(([plu, qty]) => {
        totals[plu] = (totals[plu] || 0) + (Number(qty) || 0);
      });
    });
    return totals;
  },
};

// ── SETUP (week average selection) ───────────────────────────────────────────
export const setupApi = {
  getSetup(shopNo, weekKey) {
    return lsGet(lsKey(shopNo, weekKey, 'setup'), { selectedWeeks: [] });
  },
  saveSetup(shopNo, weekKey, setup) {
    lsSet(lsKey(shopNo, weekKey, 'setup'), setup);
    return { ok: true };
  },
};

// ── CARRY-OVERS / DEPLETION MODEL ─────────────────────────────────────────────
// carryover entry: { [plu]: { qty, unit, enteredAt } }
// depletion tracker: { [plu]: { prepQty, prepDate, lastStockCheck, lastStockCheckDate } }
export const carryoverApi = {
  getDayCarryovers(shopNo, weekKey, dayIdx) {
    const data = lsGet(lsKey(shopNo, weekKey, 'carryovers'), {});
    return data[dayIdx] || {};
  },
  saveDayCarryovers(shopNo, weekKey, dayIdx, entries) {
    const data = lsGet(lsKey(shopNo, weekKey, 'carryovers'), {});
    data[dayIdx] = { ...entries, savedAt: Date.now() };
    lsSet(lsKey(shopNo, weekKey, 'carryovers'), data);
    // Update depletion tracker when stock check entered
    Object.entries(entries).forEach(([plu, entry]) => {
      if (entry && entry.qty !== undefined) {
        updateDepletionTracker(shopNo, plu, { lastStockCheck: entry.qty, lastStockCheckDate: Date.now() });
      }
    });
    return { ok: true };
  },
  recordBatchPrep(shopNo, plu, qty, unit) {
    updateDepletionTracker(shopNo, plu, { prepQty: qty, prepUnit: unit, prepDate: Date.now() });
  },
  getDepletionStatus(shopNo, plu) {
    const tracker = lsGet(`${PREFIX}depletion_${shopNo}`, {});
    const batch = catalogue.getBatches().find(b => b.plu === plu);
    if (!tracker[plu] || !batch) return null;
    const { prepQty, prepDate, lastStockCheck, lastStockCheckDate } = tracker[plu];
    const hoursSincePrep = (Date.now() - prepDate) / 3600000;
    const daysSincePrep = hoursSincePrep / 24;
    // Estimate remaining based on depletion
    let estimated;
    if (lastStockCheck !== undefined && lastStockCheckDate) {
      const hoursSinceCheck = (Date.now() - lastStockCheckDate) / 3600000;
      const dailyUsage = (batch.usagePerCover || 0) * 100; // rough daily usage
      estimated = Math.max(0, lastStockCheck - (hoursSinceCheck / 24) * dailyUsage);
    } else {
      const dailyUsage = (batch.usagePerCover || 0) * 100;
      estimated = Math.max(0, prepQty * (batch.size || 1) - daysSincePrep * dailyUsage);
    }
    const expiresAt = prepDate + batch.shelfLifeHours * 3600000;
    const hoursRemaining = (expiresAt - Date.now()) / 3600000;
    return { estimated, hoursRemaining, prepDate, prepQty };
  },
};

function updateDepletionTracker(shopNo, plu, updates) {
  const key = `${PREFIX}depletion_${shopNo}`;
  const tracker = lsGet(key, {});
  tracker[plu] = { ...(tracker[plu] || {}), ...updates };
  lsSet(key, tracker);
}

// ── SECTION PLANNER ───────────────────────────────────────────────────────────
export const sectionsApi = {
  getTemplates() { return SECTION_TEMPLATES; },
  getDaySections(shopNo, weekKey, dayIdx) {
    const data = lsGet(lsKey(shopNo, weekKey, 'sections'), {});
    return data[dayIdx] || { sections: [] };
  },
  saveDaySections(shopNo, weekKey, dayIdx, sectionData) {
    const status = getWeekStatus(weekKey);
    if (status === 'locked') return { ok:false, error:'Week is locked' };
    const data = lsGet(lsKey(shopNo, weekKey, 'sections'), {});
    data[dayIdx] = sectionData;
    lsSet(lsKey(shopNo, weekKey, 'sections'), data);
    return { ok: true };
  },
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll(shopNo) {
    const all = lsGet(`${PREFIX}notifications`, []);
    return all.filter(n => n.affectsAll || (n.affectsShops || []).includes(shopNo));
  },
  dismiss(notifId, userId) {
    const all = lsGet(`${PREFIX}notifications`, []);
    const idx = all.findIndex(n => n.id === notifId);
    if (idx >= 0) {
      all[idx].dismissedBy = [...(all[idx].dismissedBy || []), userId];
      lsSet(`${PREFIX}notifications`, all);
    }
  },
  getUnread(shopNo, userId) {
    return this.getAll(shopNo).filter(n => !(n.dismissedBy || []).includes(userId));
  },
};

function notifyChange(type, name, plu) {
  const notifications = lsGet(`${PREFIX}notifications`, []);
  notifications.unshift({
    id: Date.now(),
    type: 'menu_update',
    summary: `${type === 'product' ? 'Product' : 'Batch'} updated: ${name}`,
    plu,
    changedAt: Date.now(),
    affectsAll: true,
    dismissedBy: [],
  });
  // Keep last 50
  lsSet(`${PREFIX}notifications`, notifications.slice(0, 50));
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getWeekVariance(shopNo, weekKey) {
    const plan = planApi.getWeekPlan(shopNo, weekKey);
    const variance = {};
    Object.entries(plan).forEach(([dayIdx, day]) => {
      if (!day.products) return;
      Object.entries(day.products).forEach(([plu, data]) => {
        if (!variance[plu]) variance[plu] = { planned:0, confirmed:0, days:0 };
        variance[plu].planned += data.planned || 0;
        variance[plu].confirmed += data.confirmed || data.planned || 0;
        variance[plu].days++;
      });
    });
    return variance;
  },
  getWeekSummary(shopNo, weekKey) {
    const days = getWeekDays(weekKey);
    const plan = planApi.getWeekPlan(shopNo, weekKey);
    let totalConfirmed = 0, totalDays = 0, confirmedDays = 0;
    days.forEach((_, i) => {
      const status = planApi.getDayStatus(shopNo, weekKey, i);
      totalDays++;
      if (status === 'confirmed') confirmedDays++;
    });
    return { totalDays, confirmedDays, confirmationRate: totalDays ? confirmedDays/totalDays : 0 };
  },
};

// ── RE-EXPORTS ────────────────────────────────────────────────────────────────
export { PRODUCTS, BATCHES, USERS, SHOPS, AVG_SOLD, HOURLY_PROFILE_BREAKFAST, HOURLY_PROFILE_LUNCH, DISH_MAPPINGS, SUPPLIERS, DELIVERY_SCHEDULE, SECTION_TEMPLATES };
export const getProducts = () => catalogue.getProducts();
export const getBatches = () => catalogue.getBatches();
export const getShops = () => shopApi.getAll();
