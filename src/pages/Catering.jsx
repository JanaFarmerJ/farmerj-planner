import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { cateringApi, catalogue, getWeekDays, getWeekStatus } from '../api/client.js';
import { DayTabs, PrintHeader } from '../components/Shared.jsx';

const ORDER_SLOTS = [0, 1, 2, 3];

export function CateringPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [dayData, setDayData] = useState({ orders: [{},{},{},{}] });
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';
  const weekDays = getWeekDays(currentWeek);

  const buffet6 = catalogue.getProducts().filter(p => p.cateringType === 'buffet6' && p.active);
  const bundles = catalogue.getProducts().filter(p => p.cateringType === 'bundles' && p.active);
  const allCatering = [...buffet6, ...bundles];

  useEffect(() => {
    const data = cateringApi.getDayCatering(currentShop, currentWeek, selectedDay);
    setDayData(data);
  }, [currentShop, currentWeek, selectedDay]);

  const updateOrder = (orderIdx, plu, qty) => {
    if (locked) return;
    setDayData(prev => {
      const orders = [...(prev.orders || [{},{},{},{}])];
      if (!orders[orderIdx]) orders[orderIdx] = {};
      if (!orders[orderIdx].items) orders[orderIdx] = { ...orders[orderIdx], items: {} };
      orders[orderIdx] = {
        ...orders[orderIdx],
        items: { ...orders[orderIdx].items, [plu]: Number(qty) || 0 }
      };
      const updated = { ...prev, orders };
      cateringApi.saveDayCatering(currentShop, currentWeek, selectedDay, updated);
      return updated;
    });
  };

  const updateOrderRef = (orderIdx, ref) => {
    if (locked) return;
    setDayData(prev => {
      const orders = [...(prev.orders || [{},{},{},{}])];
      if (!orders[orderIdx]) orders[orderIdx] = {};
      orders[orderIdx] = { ...orders[orderIdx], ref };
      const updated = { ...prev, orders };
      cateringApi.saveDayCatering(currentShop, currentWeek, selectedDay, updated);
      return updated;
    });
  };

  const clearOrder = (orderIdx) => {
    if (locked) return;
    setDayData(prev => {
      const orders = [...(prev.orders || [{},{},{},{}])];
      orders[orderIdx] = {};
      const updated = { ...prev, orders };
      cateringApi.saveDayCatering(currentShop, currentWeek, selectedDay, updated);
      return updated;
    });
  };

  const clearDay = () => {
    if (locked) return;
    cateringApi.clearDay(currentShop, currentWeek, selectedDay);
    setDayData({ orders: [{},{},{},{}] });
  };

  const orders = dayData.orders || [{},{},{},{}];

  // Daily totals across all orders
  const totals = {};
  orders.forEach(o => {
    Object.entries(o.items || {}).forEach(([plu, qty]) => {
      totals[plu] = (totals[plu] || 0) + (Number(qty) || 0);
    });
  });

  const hasAnyOrders = orders.some(o => o.ref || Object.values(o.items || {}).some(v => v > 0));

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Catering — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>
      <div className="page-header">
        <div>
          <div className="page-title">Catering Orders</div>
          <div className="page-subtitle">{shop?.name} — Buffet for 6 &amp; Bundles (up to 4 orders per day)</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!locked && hasAnyOrders && (
            <button className="btn btn-ghost btn-sm" onClick={clearDay}>Clear Day</button>
          )}
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      <div className="confirm-banner unconfirmed mb-4" style={{background:'rgba(204,89,59,0.06)',borderColor:'rgba(204,89,59,0.3)'}}>
        <span>⚠ Catering orders are <strong>not</strong> included in production averages and do not auto-clear week to week. Clear manually when orders are fulfilled.</span>
      </div>

      <DayTabs weekKey={currentWeek} selectedDay={selectedDay} onDayChange={setSelectedDay} shopNo={currentShop} planApi={null}/>

      {/* 4 order slots */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {ORDER_SLOTS.map(orderIdx => {
          const order = orders[orderIdx] || {};
          const hasItems = Object.values(order.items || {}).some(v => v > 0);
          return (
            <div key={orderIdx} className="card">
              <div className="card-header" style={{background: order.ref ? 'var(--forest)' : 'var(--surface-2)'}}>
                <span className="card-title" style={{color: order.ref ? 'var(--peach)' : 'var(--text-muted)'}}>
                  Order {orderIdx + 1}
                </span>
                <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                  <input
                    className="fj-input"
                    style={{width:160,fontSize:12,padding:'4px 8px',background:order.ref?'rgba(245,180,122,0.15)':'var(--surface)'}}
                    placeholder="Order reference *"
                    value={order.ref || ''}
                    onChange={e => updateOrderRef(orderIdx, e.target.value)}
                    disabled={locked}
                  />
                  {!locked && hasItems && (
                    <button className="btn btn-xs" style={{background:'var(--rust-20)',color:'var(--rust)'}} onClick={() => clearOrder(orderIdx)}>Clear</button>
                  )}
                </div>
              </div>
              {!order.ref && (
                <div style={{padding:'8px 14px',fontSize:11,color:'var(--rust)',background:'var(--rust-20)',borderBottom:'1px solid rgba(204,89,59,0.2)'}}>
                  ⚠ Order reference required before this order can be included in production
                </div>
              )}
              <div style={{padding:12}}>
                {/* Buffet for 6 */}
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:8,paddingBottom:4,borderBottom:'1px solid var(--border)'}}>
                  Buffet for 6
                </div>
                {buffet6.map(p => {
                  const qty = order.items?.[p.plu] || '';
                  return (
                    <div key={p.plu} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:13,fontWeight: qty>0 ? 600 : 400, color: qty>0 ? 'var(--forest)' : 'var(--text-muted)'}}>{p.name}</span>
                      <input
                        type="number"
                        className="table-input"
                        style={{width:60,color:qty>0?'var(--forest)':'inherit',fontWeight:qty>0?700:'normal'}}
                        value={qty}
                        onChange={e => updateOrder(orderIdx, p.plu, e.target.value)}
                        disabled={locked}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                    </div>
                  );
                })}
                {/* Bundles */}
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',margin:'10px 0 8px',paddingBottom:4,borderBottom:'1px solid var(--border)'}}>
                  Bundles
                </div>
                {bundles.map(p => {
                  const qty = order.items?.[p.plu] || '';
                  return (
                    <div key={p.plu} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:13,fontWeight: qty>0 ? 600 : 400, color: qty>0 ? 'var(--forest)' : 'var(--text-muted)'}}>{p.name}</span>
                      <input
                        type="number"
                        className="table-input"
                        style={{width:60,color:qty>0?'var(--forest)':'inherit',fontWeight:qty>0?700:'normal'}}
                        value={qty}
                        onChange={e => updateOrder(orderIdx, p.plu, e.target.value)}
                        disabled={locked}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily totals summary */}
      {Object.values(totals).some(v => v > 0) && (
        <div className="card">
          <div className="card-header" style={{background:'var(--forest)'}}>
            <span className="card-title" style={{color:'var(--off-white)'}}>Daily Totals — {format(weekDays[selectedDay],'EEEE d MMM')}</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="fj-table">
              <thead><tr>
                <th>Item</th>
                <th>Category</th>
                <th className="number">Total Qty</th>
              </tr></thead>
              <tbody>
                {allCatering.filter(p => totals[p.plu] > 0).map(p => (
                  <tr key={p.plu}>
                    <td style={{fontWeight:600}}>{p.name}</td>
                    <td className="unit">{p.category}</td>
                    <td className="number" style={{fontWeight:700,color:'var(--rust)'}}>{totals[p.plu]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px 16px',fontSize:12,color:'var(--text-muted)',borderTop:'1px solid var(--border)',background:'var(--surface-2)'}}>
            These quantities are added on top of your production averages on the Lunch page.
          </div>
        </div>
      )}
    </div>
  );
}
