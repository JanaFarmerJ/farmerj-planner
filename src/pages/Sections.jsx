import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { sectionsApi, planApi, catalogue, getWeekDays, getWeekStatus } from '../api/client.js';
import { DaySelector, PrintHeader } from '../components/Shared.jsx';

const DUTIES = ['Salad Bar', 'Grill', 'Rice/Grains', 'Hot Counter', 'Cold Counter', 'Runner', 'Till 1', 'Till 2', 'Coffee Bar', 'Dish Wash', 'Floor', 'Prep 1', 'Prep 2', 'Prep 3', 'Raw', 'Cast Iron'];

export function SectionsPage() {
  const { currentWeek, currentShop, shop } = useOutletContext();
  const [selectedDay, setSelectedDay] = useState(0);
  const [sections, setSections] = useState([]);
  const [printSelected, setPrintSelected] = useState({});
  const weekStatus = getWeekStatus(currentWeek);
  const locked = weekStatus === 'locked';
  const weekDays = getWeekDays(currentWeek);

  // Products for tick list (all confirmed lunch items)
  const products = catalogue.getProducts().filter(p => (p.dp==='L' || p.dp==='B') && p.active && !p.cateringType && p.category !== 'FOH');

  useEffect(() => {
    const data = sectionsApi.getDaySections(currentShop, currentWeek, selectedDay);
    setSections(data.sections || []);
  }, [currentShop, currentWeek, selectedDay]);

  const save = (newSections) => {
    if (locked) return;
    sectionsApi.saveDaySections(currentShop, currentWeek, selectedDay, { sections: newSections });
  };

  const addSection = () => {
    if (locked) return;
    const newSection = {
      id: Date.now(),
      name: `Section ${sections.length + 1}`,
      shift: 'AM',
      teamMember: '',
      duties: [],
      tasks: '',
      allocatedItems: [],
      tickList: []
    };
    const updated = [...sections, newSection];
    setSections(updated);
    save(updated);
  };

  const removeSection = (id) => {
    if (locked) return;
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    save(updated);
  };

  const updateSection = (id, field, value) => {
    if (locked) return;
    const updated = sections.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSections(updated);
    save(updated);
  };

  // Exclusive allocation: get all items already allocated to other sections
  const getAllocatedElsewhere = (currentSectionId) => {
    const allocated = new Set();
    sections.forEach(s => {
      if (s.id !== currentSectionId) {
        (s.allocatedItems || []).forEach(plu => allocated.add(plu));
      }
    });
    return allocated;
  };

  const toggleAllocation = (sectionId, plu) => {
    if (locked) return;
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      const current = s.allocatedItems || [];
      const newItems = current.includes(plu)
        ? current.filter(p => p !== plu)
        : [...current, plu];
      return { ...s, allocatedItems: newItems };
    });
    setSections(updated);
    save(updated);
  };

  const togglePrint = (id) => {
    setPrintSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const printedSections = sections.filter(s => printSelected[s.id]);
  const shiftColours = { AM: 'var(--forest)', PM: 'var(--rust)' };

  return (
    <div>
      <PrintHeader shopName={shop?.name} title={`Section Planner — ${format(weekDays[selectedDay],'EEEE d MMM yyyy')}`} date={format(new Date(),'d MMM yyyy')}/>

      <div className="page-header">
        <div>
          <div className="page-title">Section Planner</div>
          <div className="page-subtitle">{shop?.name} — Assign team members, duties, and production items to each section</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!locked && <button className="btn btn-accent" onClick={addSection}>+ Add Section</button>}
          {printedSections.length > 0 && (
            <button className="btn btn-primary no-print" onClick={() => window.print()}>
              🖨 Print {printedSections.length} section{printedSections.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {locked && <div className="confirm-banner locked mb-4">🔒 Week locked — view only</div>}

      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="no-print">
        <DaySelector label="Day" value={selectedDay} onChange={setSelectedDay} weekKey={currentWeek}/>
        <div style={{fontSize:12,color:'var(--text-muted)'}}>
          Select sections to print using the checkboxes below
        </div>
      </div>

      {sections.length === 0 && (
        <div style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}>
          <div style={{fontSize:32,marginBottom:12}}>👥</div>
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>No sections yet</div>
          <div style={{fontSize:13,marginBottom:16}}>Add sections to plan team assignments and production tasks</div>
          {!locked && <button className="btn btn-accent" onClick={addSection}>+ Add First Section</button>}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))',gap:16}}>
        {sections.map(section => {
          const allocatedElsewhere = getAllocatedElsewhere(section.id);
          const sectionAllocated = new Set(section.allocatedItems || []);
          const isPrint = printSelected[section.id];

          return (
            <div
              key={section.id}
              className="card"
              style={{
                borderColor: isPrint ? 'var(--peach)' : 'var(--border)',
                borderWidth: isPrint ? 2 : 1,
              }}
            >
              {/* Section header */}
              <div className="card-header" style={{background: shiftColours[section.shift] || 'var(--forest)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                  {/* Print checkbox */}
                  <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}} title="Select to print">
                    <input
                      type="checkbox"
                      checked={!!isPrint}
                      onChange={() => togglePrint(section.id)}
                      style={{width:16,height:16,accentColor:'var(--peach)',cursor:'pointer'}}
                    />
                    <span style={{fontSize:10,color:'rgba(243,223,209,0.6)',fontWeight:600,letterSpacing:'0.05em'}}>PRINT</span>
                  </label>

                  <input
                    className="fj-input"
                    style={{background:'transparent',border:'none',color:'var(--off-white)',fontWeight:700,fontSize:14,flex:1,padding:'2px 4px'}}
                    value={section.name}
                    onChange={e => updateSection(section.id, 'name', e.target.value)}
                    disabled={locked}
                    placeholder="Section name"
                  />
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {/* AM/PM toggle */}
                  <button
                    style={{
                      background: section.shift==='AM' ? 'rgba(245,180,122,0.3)' : 'transparent',
                      border:'1px solid rgba(243,223,209,0.3)',
                      color:'var(--off-white)',
                      borderRadius:4, padding:'3px 10px',
                      fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'
                    }}
                    onClick={() => updateSection(section.id, 'shift', 'AM')}
                    disabled={locked}
                  >AM</button>
                  <button
                    style={{
                      background: section.shift==='PM' ? 'rgba(245,180,122,0.3)' : 'transparent',
                      border:'1px solid rgba(243,223,209,0.3)',
                      color:'var(--off-white)',
                      borderRadius:4, padding:'3px 10px',
                      fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'
                    }}
                    onClick={() => updateSection(section.id, 'shift', 'PM')}
                    disabled={locked}
                  >PM</button>
                  {!locked && (
                    <button onClick={() => removeSection(section.id)} style={{background:'none',border:'none',color:'rgba(243,223,209,0.5)',cursor:'pointer',fontSize:16,lineHeight:1,padding:'0 4px'}}>✕</button>
                  )}
                </div>
              </div>

              <div style={{padding:12}}>
                {/* Team member */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:4}}>Team Member</label>
                  <input
                    className="fj-input"
                    value={section.teamMember || ''}
                    onChange={e => updateSection(section.id, 'teamMember', e.target.value)}
                    disabled={locked}
                    placeholder="Name..."
                    style={{fontSize:14,fontWeight:600}}
                  />
                </div>

                {/* Duties */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6}}>Duties / Stations</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {DUTIES.map(duty => {
                      const selected = (section.duties||[]).includes(duty);
                      return (
                        <button
                          key={duty}
                          onClick={() => {
                            if (locked) return;
                            const current = section.duties || [];
                            updateSection(section.id, 'duties', selected ? current.filter(d=>d!==duty) : [...current,duty]);
                          }}
                          style={{
                            padding:'3px 8px',fontSize:11,borderRadius:4,cursor:'pointer',fontFamily:'inherit',fontWeight:selected?700:400,
                            background:selected?'var(--forest)':'var(--surface-2)',
                            color:selected?'var(--off-white)':'var(--text-muted)',
                            border:`1px solid ${selected?'var(--forest)':'var(--border)'}`,
                            transition:'all 0.1s'
                          }}
                          disabled={locked}
                        >{duty}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Tasks / Notes */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:4}}>Tasks / Notes</label>
                  <textarea
                    className="fj-input"
                    value={section.tasks || ''}
                    onChange={e => updateSection(section.id, 'tasks', e.target.value)}
                    disabled={locked}
                    placeholder="Specific tasks or notes for this section..."
                    rows={2}
                    style={{resize:'vertical',fontSize:12}}
                  />
                </div>

                {/* Allocated items — exclusive */}
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6}}>
                    Production Items
                    <span style={{marginLeft:6,fontSize:10,color:'var(--text-light)'}}>— items allocated to another section are greyed out</span>
                  </label>
                  <div className="tick-list">
                    {products.slice(0, 20).map(p => {
                      const isHere = sectionAllocated.has(p.plu);
                      const isElsewhere = allocatedElsewhere.has(p.plu);
                      return (
                        <div
                          key={p.plu}
                          className={`tick-item ${isHere ? 'unallocated' : isElsewhere ? 'allocated' : ''}`}
                          style={{cursor: isElsewhere || locked ? 'default' : 'pointer'}}
                          onClick={() => { if (!isElsewhere && !locked) toggleAllocation(section.id, p.plu); }}
                        >
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <input
                              type="checkbox"
                              checked={isHere}
                              readOnly
                              style={{width:14,height:14,accentColor:'var(--peach)',pointerEvents:'none'}}
                            />
                            <span style={{fontSize:13,color:isElsewhere?'var(--text-muted)':isHere?'var(--forest)':'inherit'}}>{p.name}</span>
                          </div>
                          {isElsewhere && <span style={{fontSize:10,color:'var(--text-light)'}}>→ other section</span>}
                          {isHere && <span style={{fontSize:10,color:'var(--status-confirmed)',fontWeight:600}}>✓ assigned</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print-only view: only selected sections */}
      {printedSections.length > 0 && (
        <div style={{display:'none'}} className="print-only-sections">
          {printedSections.map(s => (
            <div key={s.id} style={{pageBreakAfter:'always',padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',borderBottom:'2px solid #1B361D',paddingBottom:8,marginBottom:12}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:'#1B361D'}}>{s.name} — {s.shift}</div>
                  <div style={{fontSize:14,color:'#444',marginTop:2}}>{shop?.name} | {format(weekDays[selectedDay],'EEEE d MMM yyyy')}</div>
                </div>
                <div style={{fontSize:14,color:'#1B361D',fontWeight:600}}>{s.teamMember || '___________________'}</div>
              </div>
              <div style={{marginBottom:12}}>
                <strong style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Duties:</strong>
                <span style={{marginLeft:8,fontSize:13}}>{(s.duties||[]).join(', ') || '—'}</span>
              </div>
              {s.tasks && (
                <div style={{marginBottom:12}}>
                  <strong style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Tasks:</strong>
                  <div style={{marginTop:4,fontSize:13,whiteSpace:'pre-wrap'}}>{s.tasks}</div>
                </div>
              )}
              {(s.allocatedItems||[]).length > 0 && (
                <div>
                  <strong style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Production Items:</strong>
                  {(s.allocatedItems||[]).map(plu => {
                    const p = products.find(x => x.plu === plu);
                    return p ? (
                      <div key={plu} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid #eee'}}>
                        <div style={{width:16,height:16,border:'2px solid #1B361D',borderRadius:2}}/>
                        <span style={{fontSize:13}}>{p.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
