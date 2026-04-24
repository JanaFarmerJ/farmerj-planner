import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { setupApi, getWeekDays, getPreviousWeeks, getWeekMonday, getWeekStatus } from '../api/client.js';
import { validateWeekSelection } from '../engine/calculations.js';
import { PrintHeader } from '../components/Shared.jsx';

export function SetupPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [setup, setSetup] = useState({ selectedWeeks: [] });
  const [saved, setSaved] = useState(false);
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';

  useEffect(() => {
    setSetup(setupApi.getSetup(currentShop, currentWeek));
    setSaved(false);
  }, [currentShop, currentWeek]);

  const prevWeeks = getPreviousWeeks(5);
  const { warning } = validateWeekSelection(setup.selectedWeeks || []);

  const toggleWeek = (wk) => {
    if (locked) return;
    setSetup(s => {
      const sel = s.selectedWeeks || [];
      const next = sel.includes(wk) ? sel.filter(w => w !== wk) : [...sel, wk];
      return { ...s, selectedWeeks: next };
    });
    setSaved(false);
  };

  const save = () => {
    setupApi.saveSetup(currentShop, currentWeek, setup);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const weekDays = getWeekDays(currentWeek);

  return (
    <div>
      <PrintHeader shopName={shop?.name} title="Setup" date={format(new Date(),'d MMM yyyy')}/>

      <div className="page-header">
        <div>
          <div className="page-title">Setup</div>
          <div className="page-subtitle">{shop?.name} — Select which previous weeks to use for production averages</div>
        </div>
        {!locked && (
          <button className="btn btn-accent" onClick={save}>
            {saved ? '✓ Saved' : 'Save Setup'}
          </button>
        )}
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      {/* Week grid */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Current Week — {format(weekDays[0],'d MMM')} to {format(weekDays[6],'d MMM yyyy')}</span>
        </div>
        <div style={{padding:16}}>
          <div className="week-grid">
            {weekDays.map((d, i) => {
              const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
              return (
                <div key={i} className="day-card" style={{cursor:'default'}}>
                  <div className="day-name">{dayNames[i]}</div>
                  <div className="day-date">{format(d,'d')}</div>
                  <div className="day-status text-muted">{format(d,'MMM')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Average week selection */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Select Average Weeks (up to 3 recommended)</span>
        </div>
        <div style={{padding:16}}>
          {warning && (
            <div style={{
              background:'var(--rust-20)', border:'1px solid rgba(204,89,59,0.3)',
              borderRadius:'var(--r)', padding:'10px 14px', marginBottom:12,
              fontSize:13, color:'var(--rust)'
            }}>
              ⚠ {warning}
            </div>
          )}
          <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>
            Select which previous weeks to use for calculating your daily production averages.
            Tick the weeks that best represent typical trading. Avoid weeks affected by bank holidays, menu launches, or closures.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {prevWeeks.map(wk => {
              const mon = getWeekMonday(wk);
              const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
              const selected = (setup.selectedWeeks || []).includes(wk);
              return (
                <label key={wk} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                  background: selected ? 'rgba(245,180,122,0.1)' : 'var(--surface)',
                  border: `1px solid ${selected ? 'rgba(245,180,122,0.5)' : 'var(--border)'}`,
                  borderRadius:'var(--r)', cursor: locked ? 'default' : 'pointer',
                  transition:'all 0.15s'
                }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleWeek(wk)}
                    disabled={locked}
                    style={{width:16,height:16,accentColor:'var(--peach)'}}
                  />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>
                      {format(mon,'d MMM')} – {format(sun,'d MMM yyyy')}
                    </div>
                    <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Week {wk.split('-W')[1]}</div>
                  </div>
                  {/* Phase 2: show actual sales totals here */}
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,color:'var(--text-muted)'}}>Sales data</div>
                    <div style={{fontSize:11,color:'var(--text-light)'}}>Available in Phase 2</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{marginTop:12,fontSize:12,color:'var(--text-muted)',fontStyle:'italic'}}>
            💡 Note: Catering sales are included in total daily figures but are excluded from product-level averages.
            Due to the irregular nature of catering orders, including them could negatively impact your production settings.
          </div>
        </div>
      </div>

      {/* Important note */}
      <div style={{
        background:'var(--forest-10)', border:'1px solid var(--border)',
        borderRadius:'var(--r)', padding:16, fontSize:13
      }}>
        <strong>⚠ Important:</strong> Your selected average must align with the forecast agreed with your General Manager and/or Operations Manager.
        Once confirmed, save your selection before proceeding to set up catering orders and production.
      </div>
    </div>
  );
}
