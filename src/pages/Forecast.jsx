import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { planApi, getWeekDays, getWeekStatus } from '../api/client.js';
import { validateForecast } from '../engine/calculations.js';
import { DayTabs, PrintHeader } from '../components/Shared.jsx';

const DAY_PARTS = ['Breakfast','Lunch','Off-Peak','Evening'];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function ForecastPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [forecasts, setForecasts] = useState({});
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';

  useEffect(() => {
    const plan = planApi.getWeekPlan(currentShop, currentWeek);
    const f = {};
    for (let i = 0; i < 7; i++) {
      f[i] = plan[i]?.forecast || { totalMain:0, totalCatering:0, breakfast:0, lunch:0, offpeak:0, evening:0 };
    }
    setForecasts(f);
  }, [currentShop, currentWeek]);

  const updateForecast = (field, value) => {
    if (locked) return;
    setForecasts(prev => {
      const day = { ...(prev[selectedDay] || {}) };
      day[field] = Number(value) || 0;
      const updated = { ...prev, [selectedDay]: day };
      // Save
      const dayPlan = planApi.getDayPlan(currentShop, currentWeek, selectedDay);
      dayPlan.forecast = day;
      planApi.saveDayPlan(currentShop, currentWeek, selectedDay, dayPlan);
      return updated;
    });
  };

  const f = forecasts[selectedDay] || {};
  const dayParts = { breakfast: f.breakfast||0, lunch: f.lunch||0, offpeak: f.offpeak||0, evening: f.evening||0 };
  const { valid, diff, sum } = validateForecast(f.totalMain || 0, dayParts);
  const weekDays = getWeekDays(currentWeek);

  return (
    <div>
      <PrintHeader shopName={shop?.name} title="Forecast" date={format(weekDays[selectedDay], 'd MMM yyyy')}/>

      <div className="page-header">
        <div>
          <div className="page-title">Forecast</div>
          <div className="page-subtitle">{shop?.name} — Enter your sales forecast for each day</div>
        </div>
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      <DayTabs weekKey={currentWeek} selectedDay={selectedDay} onDayChange={setSelectedDay} shopNo={currentShop} planApi={planApi}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Main forecast */}
        <div className="card">
          <div className="card-header" style={{background:'var(--forest)'}}>
            <span className="card-title" style={{color:'var(--off-white)'}}>📊 Sales Forecast</span>
            <span style={{fontSize:12,color:'rgba(243,223,209,0.6)',marginLeft:'auto'}}>Excluding Buffet for 6</span>
          </div>
          <div style={{padding:16}}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>
                Total Forecast (excl. Buffet for 6)
              </label>
              <input
                type="number"
                className="fj-input"
                value={f.totalMain || ''}
                onChange={e => updateForecast('totalMain', e.target.value)}
                disabled={locked}
                placeholder="e.g. 28000"
                style={{fontSize:18,fontWeight:700,padding:'10px 12px'}}
              />
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>
                Enter expected total sales revenue excluding catering orders
              </div>
            </div>

            {/* Day part breakdown */}
            <div style={{borderTop:'1px solid var(--border)',paddingTop:14}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)'}}>
                Day Part Breakdown
              </div>
              {DAY_PARTS.map(part => {
                const key = part.toLowerCase().replace('-','');
                return (
                  <div key={part} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <label style={{width:80,fontSize:13,fontWeight:500}}>{part}</label>
                    <input
                      type="number"
                      className="fj-input"
                      style={{width:120}}
                      value={f[key] || ''}
                      onChange={e => updateForecast(key, e.target.value)}
                      disabled={locked}
                      placeholder="£0"
                    />
                    {f.totalMain > 0 && f[key] > 0 && (
                      <span style={{fontSize:12,color:'var(--text-muted)'}}>
                        {Math.round((f[key] / f.totalMain) * 100)}%
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Validation */}
              <div style={{
                marginTop:12, padding:'10px 12px',
                background: valid ? 'rgba(22,163,74,0.08)' : 'var(--rust-20)',
                border: `1px solid ${valid ? 'rgba(22,163,74,0.3)' : 'rgba(204,89,59,0.3)'}`,
                borderRadius:'var(--r)', fontSize:13
              }}>
                {valid ? (
                  <span className="forecast-match">✓ Day part totals match forecast (£{sum.toLocaleString()})</span>
                ) : (
                  <span className="forecast-mismatch">
                    ⚠ Day part totals (£{sum.toLocaleString()}) don't match forecast (£{(f.totalMain||0).toLocaleString()})
                    {' '}— difference: £{diff.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Catering forecast */}
        <div className="card">
          <div className="card-header" style={{background:'var(--rust)'}}>
            <span className="card-title" style={{color:'white'}}>🎯 Catering Forecast</span>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginLeft:'auto'}}>Buffet for 6 only</span>
          </div>
          <div style={{padding:16}}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>
                Catering Forecast (Buffet for 6)
              </label>
              <input
                type="number"
                className="fj-input"
                value={f.totalCatering || ''}
                onChange={e => updateForecast('totalCatering', e.target.value)}
                disabled={locked}
                placeholder="e.g. 2000"
                style={{fontSize:18,fontWeight:700,padding:'10px 12px'}}
              />
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>
                Expected catering revenue. This is tracked separately and does not affect production averages.
              </div>
            </div>

            <div style={{
              background:'var(--surface-2)', border:'1px solid var(--border)',
              borderRadius:'var(--r)', padding:12, fontSize:12, color:'var(--text-muted)'
            }}>
              <strong>Why separate?</strong><br/>
              The production % adjustment only affects average sold calculations.
              Catering quantities are fixed by actual orders and are added on top of average production —
              they should never distort your in-store planning numbers.
            </div>
          </div>
        </div>
      </div>

      {/* Weekly forecast summary */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title">Weekly Forecast Summary</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="fj-table">
            <thead>
              <tr>
                <th>Day</th>
                <th style={{textAlign:'right'}}>Forecast</th>
                <th style={{textAlign:'right'}}>Breakfast</th>
                <th style={{textAlign:'right'}}>Lunch</th>
                <th style={{textAlign:'right'}}>Off-Peak</th>
                <th style={{textAlign:'right'}}>Evening</th>
                <th style={{textAlign:'right'}}>Catering</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>
              {[0,1,2,3,4,5,6].map(i => {
                const fd = forecasts[i] || {};
                const dp = {breakfast:fd.breakfast||0,lunch:fd.lunch||0,offpeak:fd.offpeak||0,evening:fd.evening||0};
                const v = validateForecast(fd.totalMain||0, dp);
                return (
                  <tr key={i} style={{cursor:'pointer',fontWeight:i===selectedDay?700:'normal'}} onClick={()=>setSelectedDay(i)}>
                    <td>{DAY_NAMES[i]} {format(getWeekDays(currentWeek)[i],'d MMM')}</td>
                    <td className="number">£{(fd.totalMain||0).toLocaleString()}</td>
                    <td className="number">£{(fd.breakfast||0).toLocaleString()}</td>
                    <td className="number">£{(fd.lunch||0).toLocaleString()}</td>
                    <td className="number">£{(fd.offpeak||0).toLocaleString()}</td>
                    <td className="number">£{(fd.evening||0).toLocaleString()}</td>
                    <td className="number">£{(fd.totalCatering||0).toLocaleString()}</td>
                    <td>
                      {fd.totalMain > 0 ? (
                        v.valid
                          ? <span style={{color:'var(--status-confirmed)',fontSize:12}}>✓</span>
                          : <span style={{color:'var(--rust)',fontSize:12}}>⚠</span>
                      ) : <span style={{color:'var(--text-light)',fontSize:12}}>—</span>}
                    </td>
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
