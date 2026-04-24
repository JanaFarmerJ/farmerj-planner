import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { planApi, catalogue, getWeekDays, getWeekStatus } from '../api/client.js';
import { PCRGate, DaySelector, PrintHeader, PrepBadge } from '../components/Shared.jsx';
import { calcTrayCount } from '../engine/calculations.js';

const PCR_PAGES = ['Production Today', 'Preparation Today', 'Breakfast'];

export function PCRPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [pcrPage, setPcrPage] = useState(0);
  const [productionDay, setProductionDay] = useState(0);
  const weekStatus = getWeekStatus(currentWeek);
  const weekDays = getWeekDays(currentWeek);

  const dayPlan = planApi.getDayPlan(currentShop, currentWeek, productionDay);
  const bfConfirmed = dayPlan.breakfastConfirmed || false;
  const lunchConfirmed = dayPlan.lunchConfirmed || false;

  const products = catalogue.getProducts();
  const batches = catalogue.getBatches();

  const getQty = (plu, isBatch = false) => {
    const source = isBatch ? dayPlan.batches : dayPlan.products;
    const item = source?.[plu];
    if (item?.confirmed !== undefined) return item.confirmed;
    if (item?.planned !== undefined) return item.planned;
    return 0;
  };

  return (
    <div>
      <PrintHeader
        shopName={shop?.name}
        title={`PCR — ${PCR_PAGES[pcrPage]} — ${format(weekDays[productionDay],'EEEE d MMM yyyy')}`}
        date={format(new Date(),'d MMM yyyy')}
      />

      <div className="page-header">
        <div>
          <div className="page-title">PCR — Production Control Record</div>
          <div className="page-subtitle">{shop?.name}</div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>

      {/* PCR page selector tabs */}
      <div className="day-tabs no-print mb-3" style={{marginBottom:16}}>
        {PCR_PAGES.map((p, i) => (
          <button key={i} className={`day-tab ${pcrPage === i ? 'active' : ''}`} onClick={() => setPcrPage(i)}>
            Page {i+1}: {p}
          </button>
        ))}
      </div>

      {/* Day selector */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="no-print">
        <DaySelector label="Production Day" value={productionDay} onChange={setProductionDay} weekKey={currentWeek}/>
      </div>

      {/* Gate check */}
      {pcrPage === 0 && !lunchConfirmed && (
        <PCRGate breakfastConfirmed={bfConfirmed} lunchConfirmed={lunchConfirmed} tab="PCR Page 1 (Production Today)"/>
      )}
      {pcrPage === 1 && !lunchConfirmed && (
        <PCRGate breakfastConfirmed={bfConfirmed} lunchConfirmed={lunchConfirmed} tab="PCR Page 2 (Preparation Today)"/>
      )}
      {pcrPage === 2 && !bfConfirmed && (
        <PCRGate breakfastConfirmed={bfConfirmed} lunchConfirmed={true} tab="PCR Page 3 (Breakfast)"/>
      )}

      {/* PAGE 1 — Production Today */}
      {pcrPage === 0 && lunchConfirmed && (
        <PCRPage1 products={products} batches={batches} getQty={getQty} weekDays={weekDays} productionDay={productionDay}/>
      )}

      {/* PAGE 2 — Preparation Today (for tomorrow) */}
      {pcrPage === 1 && lunchConfirmed && (
        <PCRPage2 products={products} batches={batches} getQty={getQty} weekDays={weekDays} productionDay={productionDay} currentWeek={currentWeek} currentShop={currentShop}/>
      )}

      {/* PAGE 3 — Breakfast */}
      {pcrPage === 2 && bfConfirmed && (
        <PCRPage3 products={products} batches={batches} getQty={getQty} weekDays={weekDays} productionDay={productionDay}/>
      )}
    </div>
  );
}

function PCRPage1({ products, batches, getQty, weekDays, productionDay }) {
  const mainsBatches = batches.filter(b => b.pcrPage === 1 && b.pcrColumn === 'mains');
  const batchBatches = batches.filter(b => b.pcrPage === 1 && b.pcrColumn === 'batch');
  const saladBatches = batches.filter(b => b.pcrPage === 1 && b.pcrColumn === 'salads');
  const baseProducts = products.filter(p => p.pcrPage === 1 && p.pcrColumn === 'bases');
  const mainsProducts = products.filter(p => p.pcrPage === 1 && p.pcrColumn === 'mains');

  return (
    <div>
      <div style={{textAlign:'center',fontWeight:800,fontSize:15,color:'var(--forest)',marginBottom:16,padding:'8px',background:'var(--off-white)',borderRadius:'var(--r)'}}>
        PAGE 1 — PRODUCTION TODAY ({format(weekDays[productionDay],'EEEE d MMM').toUpperCase()})
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Left column — Mains */}
        <div>
          <div className="card mb-3">
            <div className="card-header" style={{background:'var(--forest)'}}>
              <span className="card-title" style={{color:'var(--peach)'}}>Mains — Confirmed Production</span>
            </div>
            <table className="fj-table">
              <thead><tr>
                <th>Main Item</th>
                <th className="number">Qty</th>
                <th className="number">Trays</th>
              </tr></thead>
              <tbody>
                {mainsProducts.map(p => {
                  const qty = getQty(p.plu);
                  const trays = calcTrayCount(qty, p.traySize, p.trayCalc);
                  return qty > 0 ? (
                    <tr key={p.plu}>
                      <td style={{fontWeight:600}}>{p.name}</td>
                      <td className="number" style={{fontWeight:700,fontSize:16}}>{qty}</td>
                      <td className="number" style={{color:'var(--text-muted)'}}>{trays || '—'}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>

          {/* Bases */}
          <div className="card">
            <div className="card-header" style={{background:'var(--forest)'}}>
              <span className="card-title" style={{color:'var(--peach)'}}>Bases</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Base</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {baseProducts.map(p => {
                  const qty = getQty(p.plu);
                  return (
                    <tr key={p.plu}>
                      <td>{p.name}</td>
                      <td className="number" style={{fontWeight:700}}>{qty || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — Batches & Salads */}
        <div>
          <div className="card mb-3">
            <div className="card-header" style={{background:'var(--prep-today)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>
                <span style={{marginRight:8}}>■</span>Today's Batches
              </span>
            </div>
            <table className="fj-table">
              <thead><tr>
                <th>Batch Item</th>
                <th>Unit</th>
                <th className="number">Qty</th>
              </tr></thead>
              <tbody>
                {batchBatches.filter(b=>b.prepTiming==='TODAY').map(b => (
                  <tr key={b.plu} style={{borderLeft:`3px solid var(--prep-today)`}}>
                    <td style={{fontWeight:500}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header" style={{background:'var(--prep-tomorrow)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>
                <span style={{marginRight:8}}>■</span>Prepare Today (for Tomorrow)
              </span>
            </div>
            <table className="fj-table">
              <thead><tr>
                <th>Batch Item</th>
                <th>Unit</th>
                <th className="number">Qty</th>
              </tr></thead>
              <tbody>
                {[...batchBatches, ...mainsBatches].filter(b=>b.prepTiming==='TOMORROW').map(b => (
                  <tr key={b.plu} style={{borderLeft:`3px solid var(--prep-tomorrow)`}}>
                    <td style={{fontWeight:500}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salads row */}
      {saladBatches.length > 0 && (
        <div className="card mt-3">
          <div className="card-header" style={{background:'var(--prep-blue)',color:'white'}}>
            <span className="card-title" style={{color:'white'}}>12-Hour Salad Batches</span>
          </div>
          <table className="fj-table">
            <thead><tr>
              <th>Salad Batch</th>
              <th>Unit</th>
              <th className="number">Qty</th>
              <th>Timing</th>
            </tr></thead>
            <tbody>
              {saladBatches.map(b => (
                <tr key={b.plu}>
                  <td style={{fontWeight:500}}>{b.name}</td>
                  <td className="unit">{b.unit}</td>
                  <td className="number" style={{fontWeight:700}}>{getQty(b.plu, true) || '—'}</td>
                  <td><PrepBadge timing={b.prepTiming}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:20}}>
        {['Prepared By','Checked By','Date'].map(label => (
          <div key={label} style={{borderBottom:'2px solid var(--border)',paddingBottom:4}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:20}}>{label}:</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PCRPage2({ products, batches, getQty, weekDays, productionDay, currentWeek, currentShop }) {
  const tomorrowIdx = (productionDay + 1) % 7;
  const tomorrowPlan = planApi.getDayPlan(currentShop, currentWeek, tomorrowIdx);
  const getTomorrowQty = (plu, isBatch=false) => {
    const source = isBatch ? tomorrowPlan.batches : tomorrowPlan.products;
    const item = source?.[plu];
    if (item?.confirmed !== undefined) return item.confirmed;
    if (item?.planned !== undefined) return item.planned;
    return 0;
  };

  const tomorrowBatches = batches.filter(b => b.pcrPage === 2);
  const lunchBatches = tomorrowBatches.filter(b => b.dp === 'L' || b.dp === 'BL');
  const bfBatches = tomorrowBatches.filter(b => b.dp === 'B');

  return (
    <div>
      <div style={{textAlign:'center',fontWeight:800,fontSize:15,color:'var(--prep-tomorrow)',marginBottom:16,padding:'8px',background:'rgba(107,63,160,0.08)',borderRadius:'var(--r)',border:'1px solid rgba(107,63,160,0.2)'}}>
        PAGE 2 — PREPARATION TODAY for TOMORROW ({format(weekDays[tomorrowIdx],'EEEE d MMM').toUpperCase()})
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <div className="card">
            <div className="card-header" style={{background:'var(--prep-tomorrow)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>Lunch Prep — For Tomorrow</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Batch Item</th><th>Unit</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {lunchBatches.map(b => (
                  <tr key={b.plu} style={{borderLeft:'3px solid var(--prep-tomorrow)'}}>
                    <td style={{fontWeight:500,color:'var(--prep-tomorrow)'}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getTomorrowQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header" style={{background:'var(--prep-tomorrow)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>Breakfast Prep — For Tomorrow AM</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Batch Item</th><th>Unit</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {bfBatches.map(b => (
                  <tr key={b.plu} style={{borderLeft:'3px solid var(--prep-tomorrow)'}}>
                    <td style={{fontWeight:500,color:'var(--prep-tomorrow)'}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getTomorrowQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:20}}>
        {['Prepared By','Checked By','Date'].map(label => (
          <div key={label} style={{borderBottom:'2px solid var(--border)',paddingBottom:4}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:20}}>{label}:</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PCRPage3({ products, batches, getQty, weekDays, productionDay }) {
  const bfProducts = products.filter(p => p.dp === 'B' && p.active);
  const bfBatchesToday = batches.filter(b => (b.dp==='B'||b.dp==='BL') && b.pcrPage===3 && b.prepTiming==='TODAY');
  const bfBatchesTomorrow = batches.filter(b => (b.dp==='B'||b.dp==='BL') && b.pcrPage===3 && b.prepTiming!=='TODAY');

  return (
    <div>
      <div style={{textAlign:'center',fontWeight:800,fontSize:15,color:'var(--forest)',marginBottom:16,padding:'8px',background:'rgba(245,180,122,0.15)',borderRadius:'var(--r)',border:'1px solid rgba(245,180,122,0.4)'}}>
        PAGE 3 — BREAKFAST PRODUCTION ({format(weekDays[productionDay],'EEEE d MMM').toUpperCase()})
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <div className="card mb-3">
            <div className="card-header" style={{background:'var(--forest)'}}>
              <span className="card-title" style={{color:'var(--peach)'}}>Breakfast Products — Today</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Product</th><th>Unit</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {bfProducts.filter(p=>p.category!=='Extras').map(p => {
                  const qty = getQty(p.plu);
                  return (
                    <tr key={p.plu}>
                      <td style={{fontWeight:qty>0?600:400,color:qty>0?'var(--forest)':'var(--text-muted)'}}>{p.name}</td>
                      <td className="unit">{p.unit}</td>
                      <td className="number" style={{fontWeight:700}}>{qty || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card mb-3">
            <div className="card-header" style={{background:'var(--prep-today)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>Today's Batches (prep now)</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Batch</th><th>Unit</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {bfBatchesToday.map(b => (
                  <tr key={b.plu}>
                    <td style={{fontWeight:500}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header" style={{background:'var(--prep-tomorrow)',color:'white'}}>
              <span className="card-title" style={{color:'white'}}>Tomorrow's Prep (prep PM)</span>
            </div>
            <table className="fj-table">
              <thead><tr><th>Batch</th><th>Unit</th><th className="number">Qty</th></tr></thead>
              <tbody>
                {bfBatchesTomorrow.map(b => (
                  <tr key={b.plu}>
                    <td style={{fontWeight:500,color:'var(--prep-tomorrow)'}}>{b.name}</td>
                    <td className="unit">{b.unit}</td>
                    <td className="number" style={{fontWeight:700}}>{getQty(b.plu, true) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:20}}>
        {['Prepared By','Checked By','Date'].map(label => (
          <div key={label} style={{borderBottom:'2px solid var(--border)',paddingBottom:4}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:20}}>{label}:</div>
          </div>
        ))}
      </div>
    </div>
  );
}
