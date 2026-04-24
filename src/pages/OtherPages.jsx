// ─── FOH PLANNER ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { planApi, catalogue, getWeekDays, getWeekStatus } from '../api/client.js';
import { DaySelector, PrintHeader } from '../components/Shared.jsx';

export function FOHPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [productionDay, setProductionDay] = useState(0);
  const weekDays = getWeekDays(currentWeek);
  const weekStatus = getWeekStatus(currentWeek);

  const fohProducts = catalogue.getProducts().filter(p => p.category === 'FOH' && p.active);
  const dayPlan = planApi.getDayPlan(currentShop, currentWeek, productionDay);

  // FOH groups
  const groups = [...new Set(fohProducts.map(p => p.fohGroup))].filter(Boolean);

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`FOH Planner — ${format(weekDays[productionDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">FOH Planner</div>
          <div className="page-subtitle">{shop?.name} — Front of house production items: dressings, toppings, cookies, cakes</div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="no-print">
        <DaySelector label="Service Day" value={productionDay} onChange={setProductionDay} weekKey={currentWeek}/>
      </div>

      {groups.map(group => (
        <div key={group} className="card mb-3">
          <div className="card-header"><span className="card-title">{group}</span></div>
          <table className="fj-table">
            <thead><tr>
              <th>Item</th>
              <th>Shelf Life</th>
              <th className="number">On Hand</th>
              <th className="number">To Prepare</th>
              <th className="number">Total After Prep</th>
              <th>Checked</th>
            </tr></thead>
            <tbody>
              {fohProducts.filter(p=>p.fohGroup===group).map(p => (
                <tr key={p.plu}>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td className="unit">{p.shelfLifeHours}h</td>
                  <td className="number"><input type="number" className="table-input" min="0" step="1" placeholder="0"/></td>
                  <td className="number"><input type="number" className="table-input" min="0" step="1" placeholder="0"/></td>
                  <td className="number" style={{fontWeight:600,color:'var(--forest)'}}>—</td>
                  <td>
                    <input type="checkbox" style={{width:16,height:16,accentColor:'var(--peach)'}}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── IN-HOUSE PREP ────────────────────────────────────────────────────────────
export function InHousePrepPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const weekDays = getWeekDays(currentWeek);

  const dressings = catalogue.getBatches().filter(b => b.dp === 'L' && b.prepGroup && b.active);
  const groups = [1, 2, 3];
  const groupLabels = {
    1: 'Group 1 — Short Shelf Life (2-3 days) · Prep: Mon / Wed / Fri',
    2: 'Group 2 — Medium Shelf Life (3-4 days) · Prep: Mon / Wed / Fri',
    3: 'Group 3 — Long Shelf Life (5-7 days) · Prep: Tue / Fri'
  };

  return (
    <div>
      <PrintHeader shopName={shop?.name} title="In-House Prep — Dressings" date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">In-House Prep</div>
          <div className="page-subtitle">{shop?.name} — Smart Kitchen dressing schedule</div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>

      <div style={{
        background:'rgba(245,180,122,0.1)', border:'1px solid rgba(245,180,122,0.4)',
        borderRadius:'var(--r)', padding:'10px 16px', marginBottom:20, fontSize:13
      }}>
        <strong>Smart Kitchen Principles:</strong> Dressings are batched using a rolling schedule based on shelf life to minimise waste and ensure consistent flavour.
        Always prep in full batches. Never prep a dressing that still has more than 24 hours remaining.
      </div>

      {groups.map(g => {
        const grpDressings = dressings.filter(d => d.prepGroup === g);
        return (
          <div key={g} className="card mb-4">
            <div className="card-header" style={{background:'var(--forest)'}}>
              <span className="card-title" style={{color:'var(--peach)'}}>{groupLabels[g]}</span>
            </div>
            <table className="fj-table">
              <thead><tr>
                <th>Dressing</th>
                <th>Batch Size</th>
                <th>Shelf Life</th>
                <th className="number">On Hand (g)</th>
                <th className="number">Batches to Prep</th>
                <th>Prep Today</th>
                <th>Checked</th>
              </tr></thead>
              <tbody>
                {grpDressings.map(b => (
                  <tr key={b.plu}>
                    <td style={{fontWeight:500,color:'var(--prep-tomorrow)'}}>{b.name}</td>
                    <td className="unit">{b.size}{b.unit}</td>
                    <td className="unit">{b.shelfLifeHours}h ({Math.round(b.shelfLifeHours/24)}d)</td>
                    <td className="number"><input type="number" className="table-input" min="0" step="100" placeholder="0"/></td>
                    <td className="number"><input type="number" className="table-input" min="0" step="0.5" placeholder="0"/></td>
                    <td>
                      <select className="fj-select" style={{padding:'3px 6px',fontSize:12}}>
                        <option value="">—</option>
                        {weekDays.map((d,i)=>(<option key={i} value={i}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]} {format(d,'d')}</option>))}
                      </select>
                    </td>
                    <td>
                      <input type="checkbox" style={{width:16,height:16,accentColor:'var(--peach)'}}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── ORDER SHEETS ─────────────────────────────────────────────────────────────
import { SUPPLIERS, DELIVERY_SCHEDULE } from '../api/client.js';

export function OrderSheetsPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedSupplier, setSelectedSupplier] = useState(SUPPLIERS[0]?.id);
  const weekDays = getWeekDays(currentWeek);
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const supplier = SUPPLIERS.find(s => s.id === selectedSupplier);

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Order Sheet — ${supplier?.name}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">Order Sheets</div>
          <div className="page-subtitle">{shop?.name} — Place and track supplier orders</div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>

      {/* Delivery schedule reminder */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Delivery Schedule</span></div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead><tr><th>Order Day</th><th>Delivery Day</th><th>Covers</th><th>Cut-off</th></tr></thead>
            <tbody>
              {DELIVERY_SCHEDULE.map(ds => (
                <tr key={ds.orderDay}>
                  <td style={{fontWeight:600}}>{ds.orderDay}</td>
                  <td>{ds.deliveryDay}</td>
                  <td>{ds.covers.join(', ')}</td>
                  <td className="unit">{supplier?.cutoffTime || '11:00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {supplier?.orderNote && (
          <div style={{padding:'8px 16px',background:'var(--peach-20)',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--forest)',fontWeight:600}}>
            ⚠ {supplier.orderNote}
          </div>
        )}
      </div>

      {/* Supplier selector */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}} className="no-print">
        <span style={{fontSize:13,fontWeight:600}}>Supplier:</span>
        <select className="fj-select" value={selectedSupplier} onChange={e=>setSelectedSupplier(e.target.value)}>
          {SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* 7-day order grid */}
      <div className="card">
        <div className="card-header" style={{background:'var(--forest)'}}>
          <span className="card-title" style={{color:'var(--peach)'}}>{supplier?.name}</span>
          <span style={{marginLeft:'auto',fontSize:12,color:'rgba(243,223,209,0.6)'}}>Order Note: {supplier?.orderNote}</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead><tr>
              <th>Product</th>
              <th>Pack Size</th>
              {weekDays.map((d,i) => (
                <th key={i} className="number">{dayNames[i]}<br/><span style={{fontWeight:400,fontSize:10}}>{format(d,'d')}</span></th>
              ))}
              <th className="number">Total</th>
            </tr></thead>
            <tbody>
              {(supplier?.products || []).length === 0 ? (
                <tr><td colSpan={10} style={{textAlign:'center',color:'var(--text-muted)',padding:20}}>No products configured for this supplier</td></tr>
              ) : (supplier?.products || []).map((p,pi) => (
                <tr key={pi}>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td className="unit">{p.packSize}</td>
                  {weekDays.map((_,i) => (
                    <td key={i} className="number">
                      <input type="number" className="table-input" style={{width:55}} min="0" step="1" placeholder="0"/>
                    </td>
                  ))}
                  <td className="number" style={{fontWeight:700,color:'var(--forest)'}}>0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:'10px 16px',background:'var(--surface-2)',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)'}}>
          Enter the number of packs/units to order for each day. Total column auto-sums when Phase 2 SQL integration is live.
        </div>
      </div>
    </div>
  );
}

// ─── HOURLY PAR ───────────────────────────────────────────────────────────────
import { HOURLY_PROFILE_BREAKFAST, HOURLY_PROFILE_LUNCH } from '../api/client.js';

const HOURS = Array.from({length:16}, (_,i) => i+6); // 6am–10pm

export function PARPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const weekDays = getWeekDays(currentWeek);
  const dayPlan = planApi.getDayPlan(currentShop, currentWeek, selectedDay);

  const lunchProducts = catalogue.getProducts().filter(p => p.dp==='L' && p.active && !p.cateringType && HOURLY_PROFILE_LUNCH[p.plu]);
  const bfProducts = catalogue.getProducts().filter(p => p.dp==='B' && p.active && HOURLY_PROFILE_BREAKFAST[p.plu]);

  const getTotal = (plu) => {
    const item = dayPlan.products?.[plu];
    return item?.confirmed || item?.planned || 0;
  };

  const getHourlyQty = (plu, hour, profile) => {
    const total = getTotal(plu);
    const profileData = profile[plu];
    if (!profileData || !total) return 0;
    const pct = profileData[hour] || 0;
    return Math.round(total * pct / profileData.reduce((s,v)=>s+(v||0),0) * 10) / 10;
  };

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Hourly PAR — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">Hourly PAR</div>
          <div className="page-subtitle">{shop?.name} — Hourly production and replenishment guide</div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="no-print">
        <DaySelector label="Day" value={selectedDay} onChange={setSelectedDay} weekKey={currentWeek}/>
      </div>

      <div className="card mb-4">
        <div className="card-header" style={{background:'var(--forest)'}}>
          <span className="card-title" style={{color:'var(--peach)'}}>Lunch PAR — {format(weekDays[selectedDay],'EEEE d MMM yyyy')}</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead><tr>
              <th style={{minWidth:200}}>Product</th>
              <th className="number">Total</th>
              {HOURS.map(h => <th key={h} className="number" style={{minWidth:45}}>{h}:00</th>)}
            </tr></thead>
            <tbody>
              {lunchProducts.map(p => {
                const total = getTotal(p.plu);
                return (
                  <tr key={p.plu} style={{opacity:total>0?1:0.4}}>
                    <td style={{fontWeight:total>0?600:400}}>{p.name}</td>
                    <td className="number" style={{fontWeight:700}}>{total||'—'}</td>
                    {HOURS.map(h => {
                      const qty = getHourlyQty(p.plu, h, HOURLY_PROFILE_LUNCH);
                      return (
                        <td key={h} className="number" style={{
                          fontSize:12,
                          color: qty>5?'var(--rust)':qty>2?'var(--forest)':'var(--text-muted)',
                          fontWeight: qty>5?700:400
                        }}>{qty||'—'}</td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── END OF DAY ───────────────────────────────────────────────────────────────
import { carryoverApi } from '../api/client.js';

export function EndOfDayPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [carryovers, setCarryovers] = useState({});
  const [saved, setSaved] = useState(false);
  const weekDays = getWeekDays(currentWeek);
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';

  const batches = catalogue.getBatches().filter(b => b.active && b.shelfLifeHours < 168);

  useEffect(() => {
    setCarryovers(carryoverApi.getDayCarryovers(currentShop, currentWeek, selectedDay));
    setSaved(false);
  }, [currentShop, currentWeek, selectedDay]);

  const update = (plu, qty) => {
    if (locked) return;
    setCarryovers(prev => ({ ...prev, [plu]: { qty: Number(qty)||0, unit:'g' } }));
    setSaved(false);
  };

  const saveAll = () => {
    carryoverApi.saveDayCarryovers(currentShop, currentWeek, selectedDay, carryovers);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`End of Day — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">End of Day — Carry-overs</div>
          <div className="page-subtitle">{shop?.name} — Optional stock check to recalibrate the depletion model</div>
        </div>
        {!locked && <button className="btn btn-accent" onClick={saveAll}>{saved?'✓ Saved':'Save Stock Check'}</button>}
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      <div style={{
        background:'var(--peach-20)', border:'1px solid var(--peach-40)',
        borderRadius:'var(--r)', padding:'12px 16px', marginBottom:20, fontSize:13
      }}>
        <strong>Optional:</strong> Enter remaining stock quantities at end of service.
        The system will use these to recalibrate tomorrow's depletion estimates.
        You can enter any day — there is no mandatory stock count day.
      </div>

      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="no-print">
        <DaySelector label="Day" value={selectedDay} onChange={setSelectedDay} weekKey={currentWeek}/>
      </div>

      <div className="card">
        <div className="card-header" style={{background:'var(--forest)'}}>
          <span className="card-title" style={{color:'var(--peach)'}}>Stock Check — {format(weekDays[selectedDay],'EEEE d MMM yyyy')}</span>
        </div>
        <table className="fj-table">
          <thead><tr>
            <th style={{width:280}}>Batch Item</th>
            <th>Shelf Life</th>
            <th>Unit</th>
            <th className="number">Remaining (g/units)</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            {[...new Set(batches.map(b=>b.dp))].sort().flatMap(dp => [
              <tr key={`dp-${dp}`} className="section-row"><td colSpan={5}>{dp==='B'?'Breakfast':dp==='L'?'Lunch':'Mixed'}</td></tr>,
              ...batches.filter(b=>b.dp===dp).map(b => {
                const entry = carryovers[b.plu];
                const qty = entry?.qty || '';
                const isLow = qty !== '' && Number(qty) < (b.size * 0.2);
                return (
                  <tr key={b.plu}>
                    <td style={{fontWeight:500}}>{b.name}</td>
                    <td className="unit">{b.shelfLifeHours}h</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number">
                      <input
                        type="number"
                        className="table-input"
                        value={qty}
                        onChange={e => update(b.plu, e.target.value)}
                        disabled={locked}
                        min="0"
                        placeholder="—"
                      />
                    </td>
                    <td>
                      {isLow ? (
                        <span style={{fontSize:11,color:'var(--rust)',fontWeight:600}}>⚠ Low</span>
                      ) : qty !== '' ? (
                        <span style={{fontSize:11,color:'var(--status-confirmed)'}}>✓</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
import { reportsApi } from '../api/client.js';

export function ReportsPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const summary = reportsApi.getWeekSummary(currentShop, currentWeek);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">{shop?.name} — Forecast accuracy, variance, and production history</div>
        </div>
      </div>

      <div className="stats-row mb-4">
        <div className="stat-card">
          <div className="stat-label">Days Confirmed</div>
          <div className="stat-value">{summary.confirmedDays}/{summary.totalDays}</div>
          <div className="stat-sub">This week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmation Rate</div>
          <div className="stat-value">{Math.round(summary.confirmationRate*100)}%</div>
          <div className="stat-sub">Breakfast + Lunch</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Shops</div>
          <div className="stat-value">—</div>
          <div className="stat-sub">Phase 2</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Variance</div>
          <div className="stat-value">—</div>
          <div className="stat-sub">Available Phase 2</div>
        </div>
      </div>

      <div style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', padding:32, textAlign:'center', color:'var(--text-muted)'
      }}>
        <div style={{fontSize:32,marginBottom:12}}>📉</div>
        <div style={{fontSize:16,fontWeight:700,color:'var(--forest)',marginBottom:8}}>Full Reporting in Phase 2</div>
        <div style={{fontSize:13,maxWidth:400,margin:'0 auto'}}>
          Phase 2 will include: variance reports, forecast accuracy tracking, cross-shop comparisons,
          waste tracking, and week-on-week production trends — all pulling from live SQL data.
        </div>
      </div>
    </div>
  );
}
