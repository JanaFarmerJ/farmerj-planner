import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getWeekKey, getWeekStatus, getPreviousWeeks, getWeekDays, getWeekMonday, notificationsApi } from '../api/client.js';
import { format } from 'date-fns';

// ── FARMER J LOGO SVG ─────────────────────────────────────────────────────────
export function FJLogo({ size = 32, color = '#F5B47A' }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond shape */}
      <polygon points="60,4 116,45 60,86 4,45" fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round"/>
      {/* Fork/pitchfork handle at top */}
      <line x1="60" y1="4" x2="60" y2="14" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <rect x="55" y="12" width="10" height="5" rx="1" fill="none" stroke={color} strokeWidth="2.5"/>
      {/* FAR text */}
      <text x="12" y="52" fontFamily="'Work Sans', sans-serif" fontWeight="700" fontSize="18" letterSpacing="2" fill={color}>FAR</text>
      {/* M (as pitchfork) */}
      <line x1="60" y1="35" x2="60" y2="55" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="54" y1="35" x2="54" y2="48" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="66" y1="35" x2="66" y2="48" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M54 35 Q60 32 66 35" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* ER.J text */}
      <text x="70" y="52" fontFamily="'Work Sans', sans-serif" fontWeight="700" fontSize="18" letterSpacing="2" fill={color}>ER.J</text>
    </svg>
  );
}

// ── WEEK SELECTOR ─────────────────────────────────────────────────────────────
export function WeekSelector({ currentWeek, onWeekChange, shopNo }) {
  const prevWeeks = getPreviousWeeks(1);
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeek = getWeekKey(nextWeekDate);

  const prev = prevWeeks[0];
  const curr = getWeekKey();

  const fmt = (wk) => {
    const mon = getWeekMonday(wk);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    return `${format(mon,'d MMM')}–${format(sun,'d MMM')}`;
  };

  return (
    <div className="topbar-week-selector">
      <button className={`week-btn ${currentWeek === prev ? 'active' : ''}`} onClick={() => onWeekChange(prev)}>
        {fmt(prev)} <span className="week-badge locked">Locked</span>
      </button>
      <button className={`week-btn ${currentWeek === curr ? 'active' : ''}`} onClick={() => onWeekChange(curr)}>
        {fmt(curr)} <span className="week-badge current">Current</span>
      </button>
      <button className={`week-btn ${currentWeek === nextWeek ? 'active' : ''}`} onClick={() => onWeekChange(nextWeek)}>
        {fmt(nextWeek)} <span className="week-badge next">Next</span>
      </button>
    </div>
  );
}

// ── DAY SELECTOR TABS ─────────────────────────────────────────────────────────
export function DayTabs({ weekKey, selectedDay, onDayChange, shopNo, planApi }) {
  const days = getWeekDays(weekKey);
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return (
    <div className="day-tabs no-print">
      {days.map((d, i) => {
        const status = planApi?.getDayStatus(shopNo, weekKey, i) || 'notStarted';
        return (
          <button
            key={i}
            className={`day-tab ${selectedDay === i ? 'active' : ''} ${status}`}
            onClick={() => onDayChange(i)}
          >
            {dayNames[i]} {format(d,'d')}
          </button>
        );
      })}
    </div>
  );
}

// ── COPY / CLEAR BAR ──────────────────────────────────────────────────────────
export function CopyBar({ onCopyAll, onCopyProducts, onCopyBatches, onClear, onClearWeek, weekLocked }) {
  if (weekLocked) return null;
  return (
    <div className="copy-bar no-print">
      <span className="text-sm text-muted" style={{marginRight:4}}>Copy:</span>
      <button className="btn btn-xs" onClick={onCopyAll}>All</button>
      <button className="btn btn-xs" onClick={onCopyProducts}>Products</button>
      <button className="btn btn-xs" onClick={onCopyBatches}>Batches</button>
      <span style={{marginLeft:8,marginRight:4}} className="text-sm text-muted">Clear:</span>
      <button className="btn btn-xs clear" onClick={onClear}>Day</button>
      <button className="btn btn-xs clear" onClick={onClearWeek}>Week</button>
    </div>
  );
}

// ── CONFIRM BANNER ────────────────────────────────────────────────────────────
export function ConfirmBanner({ confirmed, label, onConfirm, locked }) {
  if (locked) return <div className="confirm-banner locked">🔒 Week locked — view only</div>;
  if (confirmed) return <div className="confirm-banner confirmed">✓ {label} confirmed</div>;
  return (
    <div className="confirm-banner unconfirmed">
      <span>⚠ {label} not yet confirmed — quantities are recommendations only</span>
      <button className="btn btn-accent btn-sm" onClick={onConfirm}>Confirm {label}</button>
    </div>
  );
}

// ── PCR GATE ──────────────────────────────────────────────────────────────────
export function PCRGate({ breakfastConfirmed, lunchConfirmed, tab }) {
  const missing = [];
  if (!breakfastConfirmed) missing.push('Breakfast');
  if (!lunchConfirmed) missing.push('Lunch');
  if (missing.length === 0) return null;
  return (
    <div className="pcr-gate">
      <h3>⚠ {tab} not available yet</h3>
      <p>{missing.join(' and ')} must be confirmed before this sheet can be printed.</p>
      <p className="text-sm text-muted">Confirm your quantities on the {missing.join(' and ')} tab first.</p>
    </div>
  );
}

// ── ADJUSTMENT % CONTROL ──────────────────────────────────────────────────────
export function AdjControl({ value, onChange, locked }) {
  if (locked) return <span className="adj-control">{value}%</span>;
  return (
    <div className="adj-control">
      <button className="adj-btn" onClick={() => onChange(Math.max(50, value - 5))}>−</button>
      <span>{value}%</span>
      <button className="adj-btn" onClick={() => onChange(Math.min(200, value + 5))}>+</button>
    </div>
  );
}

// ── NOTIFICATION BELL ─────────────────────────────────────────────────────────
export function NotifBell({ shopNo, userId }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef();

  useEffect(() => {
    setNotifs(notificationsApi.getUnread(shopNo, userId));
  }, [shopNo, userId, open]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{position:'relative'}} ref={ref}>
      <button className="topbar-notif-btn" onClick={() => setOpen(!open)}>
        🔔
        {notifs.length > 0 && <span className="notif-dot"/>}
      </button>
      {open && (
        <div className="notif-panel">
          {notifs.length === 0 ? (
            <div style={{padding:'16px',textAlign:'center',color:'var(--text-muted)',fontSize:'13px'}}>No new notifications</div>
          ) : notifs.map(n => (
            <div key={n.id} className="notif-item">
              <div className="notif-dot-menu"/>
              <div className="notif-text">
                <strong>{n.summary}</strong>
                <div className="notif-time">{new Date(n.changedAt).toLocaleDateString('en-GB', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <button className="notif-dismiss" onClick={() => { notificationsApi.dismiss(n.id, userId); setNotifs(ns => ns.filter(x => x.id !== n.id)); }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PRINT HEADER ─────────────────────────────────────────────────────────────
export function PrintHeader({ shopName, title, date }) {
  return (
    <div className="print-header">
      <div>
        <div className="print-logo-text">FARMER J — ProMap</div>
        <div style={{fontSize:'10px',color:'#666',marginTop:2}}>{shopName}</div>
      </div>
      <div style={{textAlign:'center',fontWeight:700}}>{title}</div>
      <div style={{textAlign:'right',fontSize:'12px',color:'#444'}}>{date}</div>
    </div>
  );
}

// ── PREP BADGE ────────────────────────────────────────────────────────────────
export function PrepBadge({ timing }) {
  const labels = { TODAY:'Today', TOMORROW:'Tomorrow', '2-DAY':'2-Day', '3-DAY':'3-Day' };
  const cls = { TODAY:'prep-black', TOMORROW:'prep-purple', '2-DAY':'prep-blue', '3-DAY':'prep-teal' };
  return <span className={`prep-badge ${cls[timing] || 'prep-grey'}`}>{labels[timing] || timing}</span>;
}

// ── SECTION SELECTOR (for PCR/FOH day selection) ──────────────────────────────
export function DaySelector({ label, value, onChange, weekKey }) {
  const days = getWeekDays(weekKey);
  const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>{label}:</span>
      <select className="fj-select" value={value} onChange={e => onChange(Number(e.target.value))}>
        {days.map((d, i) => (
          <option key={i} value={i}>{dayNames[i]} {format(d,'d MMM')}</option>
        ))}
      </select>
    </div>
  );
}

// ── LOCKED OVERLAY ────────────────────────────────────────────────────────────
export function LockedOverlay() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,31,16,0.4)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:50, backdropFilter:'blur(2px)'
    }}>
      <div style={{
        background:'white', borderRadius:12, padding:'24px 32px',
        textAlign:'center', maxWidth:320
      }}>
        <div style={{fontSize:32,marginBottom:12}}>🔒</div>
        <div style={{fontSize:16,fontWeight:700,color:'var(--forest)',marginBottom:8}}>Week Locked</div>
        <div style={{fontSize:13,color:'var(--text-muted)'}}>This week has been locked. You can view but not edit any data.</div>
      </div>
    </div>
  );
}
