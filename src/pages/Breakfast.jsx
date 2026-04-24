import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { planApi, catalogue, cateringApi, getWeekDays, getWeekStatus } from '../api/client.js';
import { calcSuggestedProduct, calcSuggestedBatch, getPrepColour, shouldPrepToday } from '../engine/calculations.js';
import { DayTabs, CopyBar, ConfirmBanner, AdjControl, PrepBadge, PrintHeader } from '../components/Shared.jsx';

const DAYS_OF_WEEK = [0,1,2,3,4,5,6]; // Sun=0 in JS but our array is Mon=0

export function BreakfastPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [dayPlans, setDayPlans] = useState({});
  const [adjustPct, setAdjustPct] = useState(100);
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';

  const products = catalogue.getProducts().filter(p => p.dp === 'B' && p.active && p.category !== 'FOH');
  const batches = catalogue.getBatches().filter(b => (b.dp === 'B' || b.dp === 'BL') && b.active);
  const weekDays = getWeekDays(currentWeek);

  // Day of week (JS): Mon=1, but we display Mon as index 0, so add 1
  const jsDoW = (dayIdx) => (dayIdx + 1) % 7 === 0 ? 7 : (dayIdx + 1); // 1=Mon...7=Sun
  const doW = (dayIdx) => { const d = weekDays[dayIdx]; return d.getDay(); }; // 0=Sun,1=Mon

  useEffect(() => {
    const plans = {};
    for (let i = 0; i < 7; i++) {
      plans[i] = planApi.getDayPlan(currentShop, currentWeek, i);
    }
    setDayPlans(plans);
  }, [currentShop, currentWeek]);

  const day = dayPlans[selectedDay] || {};
  const confirmed = day.breakfastConfirmed || false;

  const getProductSuggestion = (plu, dayIdx) => {
    const d = doW(dayIdx);
    const adj = dayPlans[dayIdx]?.adjustPct || adjustPct;
    return calcSuggestedProduct(plu, d, adj, 0, []);
  };

  const getBatchSuggestion = (batch, dayIdx) => {
    const confirmedProducts = {};
    products.forEach(p => {
      const plan = dayPlans[dayIdx]?.products?.[p.plu];
      confirmedProducts[p.plu] = plan?.confirmed || plan?.planned || getProductSuggestion(p.plu, dayIdx).suggested;
    });
    const totalCovers = Object.values(confirmedProducts).reduce((s,v) => s+v, 0);
    return calcSuggestedBatch(batch, confirmedProducts, totalCovers);
  };

  const updateProduct = (plu, field, value) => {
    if (locked || confirmed) return;
    setDayPlans(prev => {
      const day = { ...prev[selectedDay] };
      if (!day.products) day.products = {};
      if (!day.products[plu]) day.products[plu] = {};
      day.products[plu][field] = Number(value) || 0;
      const updated = { ...prev, [selectedDay]: day };
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, day);
      return updated;
    });
  };

  const updateBatch = (plu, field, value) => {
    if (locked) return;
    setDayPlans(prev => {
      const day = { ...prev[selectedDay] };
      if (!day.batches) day.batches = {};
      if (!day.batches[plu]) day.batches[plu] = {};
      day.batches[plu][field] = Number(value) || 0;
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, day);
      return { ...prev, [selectedDay]: day };
    });
  };

  const handleCopy = (type) => {
    planApi.copyRecommendations(currentShop, currentWeek, selectedDay, type);
    setDayPlans(prev => ({ ...prev, [selectedDay]: planApi.getDayPlan(currentShop, currentWeek, selectedDay) }));
  };

  const handleConfirm = () => {
    planApi.confirmBreakfast(currentShop, currentWeek, selectedDay);
    setDayPlans(prev => ({ ...prev, [selectedDay]: planApi.getDayPlan(currentShop, currentWeek, selectedDay) }));
  };

  const handleClearDay = () => {
    planApi.clearDay(currentShop, currentWeek, selectedDay);
    setDayPlans(prev => ({ ...prev, [selectedDay]: planApi.getDayPlan(currentShop, currentWeek, selectedDay) }));
  };

  const handleClearWeek = () => {
    planApi.clearWeek(currentShop, currentWeek);
    const plans = {};
    for (let i = 0; i < 7; i++) plans[i] = planApi.getDayPlan(currentShop, currentWeek, i);
    setDayPlans(plans);
  };

  const updateAdjPct = (val) => {
    setAdjustPct(val);
    if (locked) return;
    const d = { ...(dayPlans[selectedDay] || {}) };
    d.adjustPct = val;
    planApi.saveDayPlan(currentShop, currentWeek, selectedDay, d);
    setDayPlans(prev => ({ ...prev, [selectedDay]: d }));
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Breakfast — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>

      <div className="page-header">
        <div>
          <div className="page-title">Breakfast</div>
          <div className="page-subtitle">{shop?.name} — Plan breakfast production for each day</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>Averages %:</span>
          <AdjControl value={dayPlans[selectedDay]?.adjustPct || adjustPct} onChange={updateAdjPct} locked={locked || confirmed}/>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      <DayTabs weekKey={currentWeek} selectedDay={selectedDay} onDayChange={setSelectedDay} shopNo={currentShop} planApi={planApi}/>

      <ConfirmBanner
        confirmed={confirmed}
        label="Breakfast"
        onConfirm={handleConfirm}
        locked={locked}
      />

      <CopyBar
        onCopyAll={() => handleCopy('all')}
        onCopyProducts={() => handleCopy('products')}
        onCopyBatches={() => handleCopy('batches')}
        onClear={handleClearDay}
        onClearWeek={handleClearWeek}
        weekLocked={locked}
      />

      {/* PRODUCTS section */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Products</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>
            {format(weekDays[selectedDay],'EEEE d MMM yyyy')}
          </span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead>
              <tr>
                <th style={{width:300}}>Product Name</th>
                <th>Unit / Measure</th>
                <th className="number">Average Sold</th>
                <th className="number">Suggested</th>
                <th className="number">Planned Production</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <>
                  <tr key={`cat-${cat}`} className="section-row"><td colSpan={5}>{cat}</td></tr>
                  {products.filter(p => p.category === cat).map(p => {
                    const { avg, suggested } = getProductSuggestion(p.plu, selectedDay);
                    const plan = day?.products?.[p.plu];
                    const planned = plan?.planned !== undefined ? plan.planned : suggested;
                    const isModified = plan?.planned !== undefined && plan.planned !== suggested;
                    return (
                      <tr key={p.plu}>
                        <td style={{fontStyle: avg === 0 ? 'italic' : 'normal'}}>{p.name}</td>
                        <td className="unit">{p.unit}</td>
                        <td className="number">{avg > 0 ? avg.toFixed(1) : '—'}</td>
                        <td className="number" style={{color:'var(--text-muted)'}}>{suggested > 0 ? suggested : '—'}</td>
                        <td className="number">
                          {confirmed ? (
                            <span style={{fontWeight:700}}>{planned}</span>
                          ) : (
                            <input
                              type="number"
                              className={`table-input ${isModified ? 'modified' : ''}`}
                              value={planned || ''}
                              onChange={e => updateProduct(p.plu, 'planned', e.target.value)}
                              disabled={locked}
                              min="0"
                              step="1"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BATCHES section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Batches</span>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',fontSize:11,color:'var(--text-muted)'}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span className="prep-badge prep-black">Today</span> Prep for service</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span className="prep-badge prep-purple">Tomorrow</span> Prep PM for tomorrow AM</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span className="prep-badge prep-grey">Skip</span> Covered by shelf life</span>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead>
              <tr>
                <th style={{width:280}}>Batch / Prep Item</th>
                <th>Unit / Measure</th>
                <th>Timing</th>
                <th className="number">Suggested</th>
                <th className="number">Planned Production</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const { suggested, fullBatches, halfBatches } = getBatchSuggestion(b, selectedDay);
                const plan = day?.batches?.[b.plu];
                const planned = plan?.planned !== undefined ? plan.planned : suggested;
                const isModified = plan?.planned !== undefined;
                const colourClass = getPrepColour(b.prepTiming, true);
                const isSkip = colourClass === 'prep-grey';

                return (
                  <tr key={b.plu} className={`${b.prepTiming === 'TODAY' ? 'row-today' : b.prepTiming === 'TOMORROW' ? 'row-tomorrow' : ''} ${isSkip ? 'row-skip' : ''}`}>
                    <td>
                      <span style={{color: b.prepTiming === 'TODAY' ? 'var(--prep-today)' : b.prepTiming === 'TOMORROW' ? 'var(--prep-tomorrow)' : 'inherit', fontWeight: isSkip ? 400 : 500}}>
                        {b.name}
                      </span>
                    </td>
                    <td className="unit">{b.unit}</td>
                    <td><PrepBadge timing={b.prepTiming}/></td>
                    <td className="number">
                      {suggested > 0 ? (
                        <span>
                          {fullBatches > 0 && <span>{fullBatches} full</span>}
                          {halfBatches > 0 && <span> + ½</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="number">
                      <input
                        type="number"
                        className={`table-input ${isModified ? 'modified' : ''}`}
                        value={planned || ''}
                        onChange={e => updateBatch(b.plu, 'planned', e.target.value)}
                        disabled={locked}
                        min="0"
                        step="0.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Prep guide legend */}
        <div style={{padding:'10px 16px',background:'var(--surface-2)',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)'}}>
          <strong>Daily Prep Guide:</strong>
          <span style={{margin:'0 12px',color:'var(--prep-today)'}}>■ Black = Prep for today's service</span>
          <span style={{margin:'0 12px',color:'var(--prep-tomorrow)'}}>■ Purple = Prep today for tomorrow</span>
          <span style={{margin:'0 12px',color:'var(--prep-skip)'}}>■ Grey = Do not prep — shelf life covers it</span>
        </div>
      </div>
    </div>
  );
}
