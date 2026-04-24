import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { FJLogo, WeekSelector, NotifBell } from './Shared.jsx';
import { getWeekKey, getShops } from '../api/client.js';

export function AppShell() {
  const { user, logout, isAdmin, isHeadOffice, isOpsManager } = useAuth();
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(getWeekKey());
  const [currentShop, setCurrentShop] = useState(() => {
    const shops = getShops();
    if (user?.shops === 'all') return shops[0]?.shopNo;
    return user?.shops?.[0];
  });
  const shops = getShops().filter(s => s.active && (user?.shops === 'all' || (user?.shops || []).includes(s.shopNo)));
  const shop = shops.find(s => s.shopNo === currentShop);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <header className="app-topbar no-print">
        <FJLogo size={28} color="#F5B47A"/>
        <span className="topbar-logo-text">ProMap</span>
        <div className="topbar-divider"/>
        {/* Shop selector */}
        {shops.length > 1 ? (
          <select
            className="fj-select"
            style={{background:'transparent',border:'1px solid rgba(245,180,122,0.4)',color:'var(--off-white)',fontSize:13}}
            value={currentShop}
            onChange={e => setCurrentShop(Number(e.target.value))}
          >
            {shops.map(s => <option key={s.shopNo} value={s.shopNo}>{s.name}</option>)}
          </select>
        ) : (
          <span className="topbar-shop">{shop?.name}</span>
        )}
        <WeekSelector currentWeek={currentWeek} onWeekChange={setCurrentWeek} shopNo={currentShop}/>
        <NotifBell shopNo={currentShop} userId={user?.id}/>
        <button className="topbar-user-btn" title={`${user?.name} (${user?.role})`}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{color:'var(--off-white)',borderColor:'rgba(243,223,209,0.3)'}}>
          Sign out
        </button>
      </header>

      <div className="app-body">
        {/* SIDEBAR */}
        <nav className="app-sidebar no-print">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Planning</div>
            <NavLink to="/setup" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">⚙</span> Setup
            </NavLink>
            <NavLink to="/forecast" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">📊</span> Forecast
            </NavLink>
            <NavLink to="/catering" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🎯</span> Catering
            </NavLink>
            <NavLink to="/breakfast" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🌅</span> Breakfast
            </NavLink>
            <NavLink to="/lunch" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🌿</span> Lunch
            </NavLink>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-label">Production</div>
            <NavLink to="/pcr" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">📋</span> PCR
            </NavLink>
            <NavLink to="/sections" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">👥</span> Section Planner
            </NavLink>
            <NavLink to="/foh" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🏪</span> FOH Planner
            </NavLink>
            <NavLink to="/inhouse" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🧪</span> In-House Prep
            </NavLink>
            <NavLink to="/orders" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">📦</span> Order Sheets
            </NavLink>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-label">Analytics</div>
            <NavLink to="/par" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">📈</span> Hourly PAR
            </NavLink>
            {isOpsManager && (
              <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">📉</span> Reports
              </NavLink>
            )}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-label">End of Day</div>
            <NavLink to="/eod" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
              <span className="icon">🌙</span> Carry-overs
            </NavLink>
          </div>
          {isAdmin && (
            <div className="sidebar-section">
              <div className="sidebar-section-label">Admin</div>
              <NavLink to="/admin/products" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">🛒</span> Products
              </NavLink>
              <NavLink to="/admin/batches" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">⚗</span> Batches
              </NavLink>
              <NavLink to="/admin/shops" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">🏬</span> Shops
              </NavLink>
              <NavLink to="/admin/users" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">👤</span> Users
              </NavLink>
              <NavLink to="/admin/suppliers" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">🚚</span> Suppliers
              </NavLink>
              <NavLink to="/admin/mappings" className={({isActive}) => `sidebar-link ${isActive?'active':''}`}>
                <span className="icon">🔗</span> Dish Mappings
              </NavLink>
            </div>
          )}
        </nav>

        {/* MAIN CONTENT */}
        <main className="app-main">
          <Outlet context={{ currentWeek, setCurrentWeek, currentShop, setCurrentShop, shop, shops }}/>
        </main>
      </div>
    </div>
  );
}
