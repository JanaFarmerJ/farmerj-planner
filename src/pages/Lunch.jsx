import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { planApi, catalogue, cateringApi, getWeekDays, getWeekStatus, shopApi } from '../api/client.js';
import { calcSuggestedProduct, calcSuggestedBatch, getPrepColour } from '../engine/calculations.js';
import { DayTabs, CopyBar, ConfirmBanner, AdjControl, PrepBadge, PrintHeader } from '../components/Shared.jsx';

export function LunchPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [dayPlans, setDayPlans] = useState({});
  const [secondLineOn, setSecondLineOn] = useState(false);
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';
  const weekDays = getWeekDays(currentWeek);

  const shopData = shopApi.getAll().find(s => s.shopNo === currentShop);
  const hasSecondLine = shopData?.hasSecondLine || false;

  const products = catalogue.getProducts().filter(p => p.dp === 'L' && p.active && !p.cateringType && p.category !== 'FOH');
  const batches  = catalogue.getBatches().filter(b => (b.dp === 'L') && b.active && !b.prepGroup);
  const dressings = catalogue.getBatches().filter(b => b.dp === 'L' && b.active && b.prepGroup);

  const doW = (dayIdx) => { const d = weekDays[dayIdx]; return d.getDay(); };

  useEffect(() => {
    const plans = {};
    for (let i = 0; i < 7; i++) plans[i] = planApi.getDayPlan(currentShop, currentWeek, i);
    setDayPlans(plans);
  }, [currentShop, currentWeek]);

  const day = dayPlans[selectedDay] || {};
  const confirmed = day.lunchConfirmed || false;
  const adjPct = day.adjustPct || 100;

  const getProductSuggestion = (plu, dayIdx) => {
    const cateringTotals = cateringApi.getDayCateringTotals(currentShop, currentWeek, dayIdx);
    const cateringQty = cateringTotals[plu] || 0;
    return calcSuggestedProduct(plu, doW(dayIdx), dayPlans[dayIdx]?.adjustPct || 100, cateringQty);
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

  const updateProduct = (plu, field, val) => {
    if (locked || confirmed) return;
    setDayPlans(prev => {
      const d = { ...prev[selectedDay] };
      if (!d.products) d.products = {};
      if (!d.products[plu]) d.products[plu] = {};
      d.products[plu][field] = Number(val) || 0;
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, d);
      return { ...prev, [selectedDay]: d };
    });
  };

  const updateBatch = (plu, field, val) => {
    if (locked) return;
    setDayPlans(prev => {
      const d = { ...prev[selectedDay] };
      if (!d.batches) d.batches = {};
      if (!d.batches[plu]) d.batches[plu] = {};
      d.batches[plu][field] = Number(val) || 0;
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, d);
      return { ...prev, [selectedDay]: d };
    });
  };

  const updateSecondLine = (plu, line, val) => {
    if (locked) return;
    setDayPlans(prev => {
      const d = { ...prev[selectedDay] };
      if (!d.secondLine) d.secondLine = {};
      d.secondLine[plu] = { ...(d.secondLine[plu]||{}), [line]: Number(val)||0 };
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, d);
      return { ...prev, [selectedDay]: d };
    });
  };

  const handleCopy = (type) => {
    planApi.copyRecommendations(currentShop, currentWeek, selectedDay, type);
    setDayPlans(prev => ({ ...prev, [selectedDay]: planApi.getDayPlan(currentShop, currentWeek, selectedDay) }));
  };

  const handleConfirm = () => {
    planApi.confirmLunch(currentShop, currentWeek, selectedDay);
    setDayPlans(prev => ({ ...prev, [selectedDay]: planApi.getDayPlan(currentShop, currentWeek, selectedDay) }));
  };

  const handleClearDay = () => {
    planApi.clearDay(currentShop, currentWeek, selectedDay);
    setDayPlans(prev => ({ ...prev, [selectedDay]: {} }));
  };

  const handleClearWeek = () => {
    planApi.clearWeek(currentShop, currentWeek);
    const plans = {};
    for (let i = 0; i < 7; i++) plans[i] = {};
    setDayPlans(plans);
  };

  const mains    = products.filter(p => p.category === 'Mains' || p.category === 'Sides');
  const salads   = products.filter(p => p.category === 'Salads');
  const bases    = products.filter(p => p.category === 'Bases');
  const prep     = products.filter(p => p.category === 'Prep' || p.category === 'Extras');

  const showMainLine = hasSecondLine && secondLineOn;
  const cateringTotals = cateringApi.getDayCateringTotals(currentShop, currentWeek, selectedDay);

  const ProductRow = ({ p, showCatering = false }) => {
    const { avg, suggested, cateringQty, combined } = getProductSuggestion(p.plu, selectedDay);
    const plan = day?.products?.[p.plu];
    const planned = plan?.planned !== undefined ? plan.planned : combined;
    const isModified = plan?.planned !== undefined;
    const sl = day?.secondLine?.[p.plu];

    return (
      <tr key={p.plu}>
        <td>
          <div style={{fontWeight:500}}>{p.name}</div>
        </td>
        <td className="unit">{p.unit}</td>
        <td className="number">{avg > 0 ? avg.toFixed(1) : '—'}</td>
        {showCatering && <td className="number" style={{color:'var(--rust)'}}>{cateringQty > 0 ? cateringQty : '—'}</td>}
        {showCatering && <td className="number" style={{fontWeight:600}}>{combined > 0 ? combined : '—'}</td>}
        <td className="number">
          {confirmed ? (
            <span style={{fontWeight:700}}>{planned}</span>
          ) : (
            <input type="number" className={`table-input ${isModified?'modified':''}`}
              value={planned||''} onChange={e=>updateProduct(p.plu,'planned',e.target.value)}
              disabled={locked} min="0" step="1"/>
          )}
        </td>
        {showMainLine && p.onSecondLine && (
          <>
            <td className="number">
              <input type="number" className="table-input"
                value={sl?.mainLine||''} onChange={e=>updateSecondLine(p.plu,'mainLine',e.target.value)}
                disabled={locked} min="0" step="1" placeholder="Main"/>
            </td>
            <td className="number">
              <input type="number" className="table-input"
                value={sl?.secondLine||''} onChange={e=>updateSecondLine(p.plu,'secondLine',e.target.value)}
                disabled={locked} min="0" step="1" placeholder="2nd"/>
            </td>
          </>
        )}
      </tr>
    );
  };

  const BatchRow = ({ b }) => {
    const { suggested, fullBatches, halfBatches } = getBatchSuggestion(b, selectedDay);
    const plan = day?.batches?.[b.plu];
    const planned = plan?.planned !== undefined ? plan.planned : suggested;
    const isModified = plan?.planned !== undefined;
    return (
      <tr key={b.plu} className={b.prepTiming==='TODAY'?'row-today':b.prepTiming==='TOMORROW'?'row-tomorrow':''}>
        <td style={{color:b.prepTiming==='TODAY'?'var(--prep-today)':b.prepTiming==='TOMORROW'?'var(--prep-tomorrow)':'inherit',fontWeight:500}}>
          {b.name}
        </td>
        <td className="unit">{b.unit}</td>
        <td><PrepBadge timing={b.prepTiming}/></td>
        <td className="number">
          {fullBatches > 0 && `${fullBatches} full`}
          {halfBatches > 0 && ' + ½'}
          {!fullBatches && !halfBatches && '—'}
        </td>
        <td className="number">
          <input type="number" className={`table-input ${isModified?'modified':''}`}
            value={planned||''} onChange={e=>updateBatch(b.plu,'planned',e.target.value)}
            disabled={locked} min="0" step="0.5"/>
        </td>
      </tr>
    );
  };

  const tableHeaders = (showCatering, showSecondLine) => (
    <thead><tr>
      <th style={{width:280}}>Product Name</th>
      <th>Unit</th>
      <th className="number">Avg Sold</th>
      {showCatering && <th className="number" style={{color:'var(--rust)'}}>Catering</th>}
      {showCatering && <th className="number">Combined</th>}
      <th className="number">Planned</th>
      {showSecondLine && <><th className="number">Main Line</th><th className="number">2nd Line</th></>}
    </tr></thead>
  );

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Lunch — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">Lunch</div>
          <div className="page-subtitle">{shop?.name} — Plan all-day service production</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>Production %:</span>
          <AdjControl value={adjPct} onChange={v => {
            if (!locked) {
              const d = {...(dayPlans[selectedDay]||{}),adjustPct:v};
              planApi.saveDayPlan(currentShop, currentWeek, selectedDay, d);
              setDayPlans(prev=>({...prev,[selectedDay]:d}));
            }
          }} locked={locked||confirmed}/>
          {hasSecondLine && !locked && (
            <button
              className={`second-line-toggle ${secondLineOn?'active':''}`}
              onClick={() => setSecondLineOn(!secondLineOn)}
            >
              ⚡ {secondLineOn ? 'Second Line ON' : 'Second Line OFF'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}
      <DayTabs weekKey={currentWeek} selectedDay={selectedDay} onDayChange={setSelectedDay} shopNo={currentShop} planApi={planApi}/>
      <ConfirmBanner confirmed={confirmed} label="Lunch" onConfirm={handleConfirm} locked={locked}/>
      <CopyBar onCopyAll={()=>handleCopy('all')} onCopyProducts={()=>handleCopy('products')} onCopyBatches={()=>handleCopy('batches')} onClear={handleClearDay} onClearWeek={handleClearWeek} weekLocked={locked}/>

      {/* PRODUCTS — Mains & Sides */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Mains & Sides</span>
          {showMainLine && <span style={{marginLeft:8,fontSize:11,background:'rgba(245,180,122,0.2)',color:'var(--forest)',padding:'2px 8px',borderRadius:4,fontWeight:600}}>Second Line Active</span>}
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            {tableHeaders(true, showMainLine)}
            <tbody>
              {mains.map(p => <ProductRow key={p.plu} p={p} showCatering={true}/>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCTS — Salads */}
      <div className="card mb-3">
        <div className="card-header"><span className="card-title">Salads</span></div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            {tableHeaders(false, false)}
            <tbody>{salads.map(p => <ProductRow key={p.plu} p={p}/>)}</tbody>
          </table>
        </div>
      </div>

      {/* PRODUCTS — Bases */}
      <div className="card mb-3">
        <div className="card-header"><span className="card-title">Bases</span></div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            {tableHeaders(false, false)}
            <tbody>{bases.map(p => <ProductRow key={p.plu} p={p}/>)}</tbody>
          </table>
        </div>
      </div>

      {/* BATCHES */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Batches</span>
          <div style={{marginLeft:'auto',display:'flex',gap:8,fontSize:11,color:'var(--text-muted)'}}>
            <span><span className="prep-badge prep-black">Today</span> Prep for service</span>
            <span><span className="prep-badge prep-purple">Tomorrow</span> Prep PM for tomorrow</span>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead><tr>
              <th style={{width:280}}>Batch Item</th>
              <th>Unit</th>
              <th>Timing</th>
              <th className="number">Suggested</th>
              <th className="number">Planned</th>
            </tr></thead>
            <tbody>
              <tr className="section-row"><td colSpan={5}>Today's Batches</td></tr>
              {batches.filter(b=>b.prepTiming==='TODAY').map(b => <BatchRow key={b.plu} b={b}/>)}
              <tr className="section-row"><td colSpan={5}>Tomorrow's Batches (prep PM today)</td></tr>
              {batches.filter(b=>b.prepTiming==='TOMORROW').map(b => <BatchRow key={b.plu} b={b}/>)}
              <tr className="section-row"><td colSpan={5}>12-Hour Batches (2-Day prep)</td></tr>
              {batches.filter(b=>b.prepTiming==='2-DAY').map(b => <BatchRow key={b.plu} b={b}/>)}
            </tbody>
          </table>
        </div>
        <div style={{padding:'10px 16px',background:'var(--surface-2)',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)'}}>
          <strong>Important:</strong> Dressing calculations are recorded on the day they are scheduled to be prepared — not the day they will be used.
          Accuracy matters — any miscalculation can disrupt both production and stock control.
        </div>
      </div>

      {/* DRESSINGS */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Dressings</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>Managed via In-House Prep tab</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead><tr>
              <th style={{width:260}}>Dressing</th>
              <th>Unit</th>
              <th>Prep Group</th>
              <th className="number">Suggested</th>
              <th className="number">Planned</th>
            </tr></thead>
            <tbody>
              {[1,2,3].map(g => {
                const grpDressings = dressings.filter(d => d.prepGroup === g);
                const grpLabels = {1:'Group 1 — Short shelf life (2-3 days)',2:'Group 2 — Medium shelf life (3-4 days)',3:'Group 3 — Long shelf life (5-7 days)'};
                return (
                  <>
                    <tr key={`g${g}`} className="section-row"><td colSpan={5}>{grpLabels[g]}</td></tr>
                    {grpDressings.map(b => {
                      const { suggested } = getBatchSuggestion(b, selectedDay);
                      const plan = day?.batches?.[b.plu];
                      const planned = plan?.planned !== undefined ? plan.planned : suggested;
                      return (
                        <tr key={b.plu} className={b.prepTiming==='TOMORROW'?'row-tomorrow':''}>
                          <td style={{color:'var(--prep-tomorrow)',fontWeight:500}}>{b.name}</td>
                          <td className="unit">{b.unit}</td>
                          <td><span style={{fontSize:11,color:'var(--text-muted)'}}>Group {b.prepGroup}</span></td>
                          <td className="number">{suggested > 0 ? suggested.toFixed(1) : '—'}</td>
                          <td className="number">
                            <input type="number" className="table-input" value={planned||''}
                              onChange={e=>updateBatch(b.plu,'planned',e.target.value)}
                              disabled={locked} min="0" step="0.5"/>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
