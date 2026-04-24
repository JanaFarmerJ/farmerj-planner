import { useState } from 'react';
import { catalogue, shopApi, usersApi, SUPPLIERS, DISH_MAPPINGS } from '../../api/client.js';

// ── PRODUCTS ADMIN ────────────────────────────────────────────────────────────
export function AdminProductsPage() {
  const [products, setProducts] = useState(() => catalogue.getProducts());
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) || p.plu.includes(filter)
  );

  const save = (product) => {
    catalogue.saveProduct(product);
    setProducts(catalogue.getProducts());
    setEditing(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage the product catalogue — changes notify all shops</div>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing({plu:'',name:'',dp:'L',unit:'each',category:'',active:true})}>
          + Add Product
        </button>
      </div>

      <div style={{marginBottom:16}}>
        <input className="fj-input" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search by name or PLU…" style={{width:300}}/>
      </div>

      {editing && (
        <div style={{background:'var(--surface)',border:'2px solid var(--peach)',borderRadius:'var(--r-lg)',padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,marginBottom:12}}>{editing.plu ? 'Edit Product' : 'New Product'}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            {[
              ['PLU',         'plu',      'text'],
              ['Name',        'name',     'text'],
              ['Unit',        'unit',     'text'],
              ['Category',    'category', 'text'],
            ].map(([label, field, type]) => (
              <div key={field}>
                <label className="login-label">{label}</label>
                <input className="fj-input" type={type} value={editing[field]||''}
                  onChange={e => setEditing(prev=>({...prev,[field]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <label className="login-label">Day Part</label>
              <select className="fj-select w-full" value={editing.dp||'L'} onChange={e=>setEditing(prev=>({...prev,dp:e.target.value}))}>
                <option value="B">Breakfast</option>
                <option value="L">Lunch</option>
                <option value="C">Catering</option>
              </select>
            </div>
            <div>
              <label className="login-label">Active</label>
              <select className="fj-select w-full" value={editing.active?'true':'false'} onChange={e=>setEditing(prev=>({...prev,active:e.target.value==='true'}))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn btn-accent" onClick={() => save(editing)}>Save Product</button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="fj-table">
          <thead><tr>
            <th>PLU</th><th>Name</th><th>Day Part</th><th>Category</th><th>Unit</th><th>Active</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,50).map(p => (
              <tr key={p.plu}>
                <td className="unit">{p.plu}</td>
                <td style={{fontWeight:500}}>{p.name}</td>
                <td><span style={{padding:'2px 6px',borderRadius:4,background:'var(--forest)',color:'var(--peach)',fontSize:11,fontWeight:700}}>{p.dp}</span></td>
                <td className="unit">{p.category}</td>
                <td className="unit">{p.unit}</td>
                <td>{p.active?<span style={{color:'var(--status-confirmed)'}}>✓</span>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                <td>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditing({...p})}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'8px 16px',fontSize:12,color:'var(--text-muted)',borderTop:'1px solid var(--border)'}}>
          Showing {Math.min(50,filtered.length)} of {filtered.length} products
        </div>
      </div>
    </div>
  );
}

// ── BATCHES ADMIN ─────────────────────────────────────────────────────────────
export function AdminBatchesPage() {
  const [batches, setBatches] = useState(() => catalogue.getBatches());
  const [filter, setFilter] = useState('');

  const filtered = batches.filter(b =>
    b.name.toLowerCase().includes(filter.toLowerCase()) || b.plu.includes(filter)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Batches</div>
          <div className="page-subtitle">Manage batch recipes — changes notify all shops</div>
        </div>
      </div>

      <div style={{marginBottom:16}}>
        <input className="fj-input" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search by name or PLU…" style={{width:300}}/>
      </div>

      <div className="card">
        <table className="fj-table">
          <thead><tr>
            <th>PLU</th><th style={{width:280}}>Name</th><th>DP</th>
            <th>Timing</th><th className="number">Size</th><th>Unit</th>
            <th className="number">gpc</th><th className="number">gpp</th>
            <th className="number">Shelf (h)</th><th>PCR Pg</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,60).map(b => (
              <tr key={b.plu}>
                <td className="unit" style={{fontSize:11}}>{b.plu}</td>
                <td style={{fontWeight:500}}>{b.name}</td>
                <td><span style={{padding:'2px 5px',borderRadius:4,background:'var(--forest)',color:'var(--peach)',fontSize:11,fontWeight:700}}>{b.dp}</span></td>
                <td><span style={{fontSize:11,color:b.prepTiming==='TODAY'?'var(--prep-today)':b.prepTiming==='TOMORROW'?'var(--prep-tomorrow)':'var(--prep-blue)',fontWeight:600}}>{b.prepTiming}</span></td>
                <td className="number">{b.size}</td>
                <td className="unit">{b.unit}</td>
                <td className="number">{b.gpc||'—'}</td>
                <td className="number">{b.gpp||'—'}</td>
                <td className="number">{b.shelfLifeHours}</td>
                <td className="unit">{b.pcrPage||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'8px 16px',fontSize:12,color:'var(--text-muted)',borderTop:'1px solid var(--border)'}}>
          {filtered.length} batches
        </div>
      </div>
    </div>
  );
}

// ── SHOPS ADMIN ───────────────────────────────────────────────────────────────
export function AdminShopsPage() {
  const [shops, setShops] = useState(() => shopApi.getAll());
  const [editing, setEditing] = useState(null);

  const save = (shop) => {
    shopApi.save(shop);
    setShops(shopApi.getAll());
    setEditing(null);
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Shops</div></div>
      </div>

      {editing && (
        <div style={{background:'var(--surface)',border:'2px solid var(--peach)',borderRadius:'var(--r-lg)',padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,marginBottom:12}}>Edit Shop: {editing.name}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
            {[['Shop No','shopNo','number'],['Name','name','text'],['Region','region','text']].map(([l,f,t])=>(
              <div key={f}><label className="login-label">{l}</label>
                <input className="fj-input" type={t} value={editing[f]||''} onChange={e=>setEditing(p=>({...p,[f]:t==='number'?Number(e.target.value):e.target.value}))}/>
              </div>
            ))}
            <div>
              <label className="login-label">Second Make Line</label>
              <select className="fj-select w-full" value={editing.hasSecondLine?'true':'false'} onChange={e=>setEditing(p=>({...p,hasSecondLine:e.target.value==='true'}))}>
                <option value="true">Yes</option><option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="login-label">Floors</label>
              <select className="fj-select w-full" value={editing.floors||1} onChange={e=>setEditing(p=>({...p,floors:Number(e.target.value)}))}>
                <option value={1}>1 Floor</option><option value={2}>2 Floors</option>
              </select>
            </div>
            <div>
              <label className="login-label">Active</label>
              <select className="fj-select w-full" value={editing.active?'true':'false'} onChange={e=>setEditing(p=>({...p,active:e.target.value==='true'}))}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn btn-accent" onClick={() => save(editing)}>Save</button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="fj-table">
          <thead><tr><th>No</th><th>Name</th><th>Region</th><th>2nd Line</th><th>Floors</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {shops.map(s => (
              <tr key={s.shopNo}>
                <td style={{fontWeight:700,color:'var(--forest)'}}>{s.shopNo}</td>
                <td style={{fontWeight:500}}>{s.name}</td>
                <td className="unit">{s.region}</td>
                <td>{s.hasSecondLine?<span style={{color:'var(--status-confirmed)'}}>✓</span>:'—'}</td>
                <td className="unit">{s.floors}</td>
                <td>{s.active?<span style={{color:'var(--status-confirmed)'}}>✓</span>:'—'}</td>
                <td><button className="btn btn-ghost btn-xs" onClick={() => setEditing({...s})}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── USERS ADMIN ───────────────────────────────────────────────────────────────
export function AdminUsersPage() {
  const [users, setUsers] = useState(() => usersApi.getAll());
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Users</div></div>
        <button className="btn btn-accent">+ Invite User</button>
      </div>
      <div className="card">
        <table className="fj-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Shops</th><th>Must Change PW</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:600}}>{u.name}</td>
                <td className="unit">{u.email}</td>
                <td><span style={{padding:'2px 7px',borderRadius:4,background:'var(--forest)',color:'var(--peach)',fontSize:11,fontWeight:700}}>{u.role}</span></td>
                <td className="unit">{u.shops === 'all' ? 'All' : (u.shops||[]).join(', ')}</td>
                <td>{u.mustChangePassword?<span style={{color:'var(--status-partial)',fontWeight:600}}>Yes</span>:'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SUPPLIERS ADMIN ───────────────────────────────────────────────────────────
export function AdminSuppliersPage() {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Suppliers</div></div></div>
      <div className="card">
        <table className="fj-table">
          <thead><tr><th>Supplier</th><th>Order Note</th><th>Cut-off</th><th>Products</th></tr></thead>
          <tbody>
            {SUPPLIERS.map(s => (
              <tr key={s.id}>
                <td style={{fontWeight:600}}>{s.name}</td>
                <td className="unit" style={{fontSize:12}}>{s.orderNote}</td>
                <td className="unit">{s.cutoffTime}</td>
                <td className="unit">{s.products?.length||0} items</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DISH MAPPINGS ADMIN ───────────────────────────────────────────────────────
export function AdminMappingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dish Code Mappings</div>
          <div className="page-subtitle">Map promo/variant codes to canonical production PLUs</div>
        </div>
      </div>
      <div className="card">
        <table className="fj-table">
          <thead><tr><th>From Code</th><th>→ To Code</th><th>Note</th></tr></thead>
          <tbody>
            {DISH_MAPPINGS.map((m,i) => (
              <tr key={i}>
                <td className="unit" style={{fontFamily:'monospace'}}>{m.fromCode}</td>
                <td className="unit" style={{fontFamily:'monospace',color:'var(--forest)',fontWeight:600}}>{m.toCode}</td>
                <td style={{fontSize:13,color:'var(--text-muted)'}}>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
