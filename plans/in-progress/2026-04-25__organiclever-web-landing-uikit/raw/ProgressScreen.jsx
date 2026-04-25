// ProgressScreen.jsx — Event analytics with module tabs

const PROGRESS_MODULES = [
  { id:'workout', label:'Workouts', icon:'dumbbell',  hue:'teal',       status:'active' },
  { id:'reading', label:'Reading',  icon:'book',      hue:'plum',       status:'active' },
  { id:'learning',label:'Learning', icon:'zap',       hue:'honey',      status:'active' },
  { id:'meal',    label:'Meals',    icon:'flame',     hue:'terracotta', status:'active' },
  { id:'focus',   label:'Focus',    icon:'timer',     hue:'sky',        status:'active' },
];

const HISTORY_RANGES_P = [
  { label:'7d',  days:7   },
  { label:'30d', days:30  },
  { label:'3m',  days:90  },
  { label:'6m',  days:180 },
  { label:'1y',  days:365 },
];

const ProgressScreen = ({ refreshKey }) => {
  const [sessions,     setSessions]     = React.useState([]);
  const [rangeIdx,     setRangeIdx]     = React.useState(1);
  const [groupBy,      setGroupBy]      = React.useState('exercise');
  const [activeModule, setActiveModule] = React.useState('workout');

  React.useEffect(() => {
    setSessions(DB.getSessions());
  }, [refreshKey]);

  const range = HISTORY_RANGES_P[rangeIdx];
  const mod   = PROGRESS_MODULES.find(m => m.id === activeModule) || PROGRESS_MODULES[0];

  const progress = React.useMemo(() =>
    DB.getExerciseProgress(range.days),
    [sessions.length, range.days]
  );
  const exercises = Object.entries(progress).filter(([, d]) => d.points.length >= 1);

  const byRoutine = {};
  exercises.forEach(([name, data]) => {
    const rn = data.routineName || 'Quick workout';
    if (!byRoutine[rn]) byRoutine[rn] = [];
    byRoutine[rn].push([name, data]);
  });

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.015em' }}>Analytics</div>
            <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>
              Event patterns &amp; progress over time
            </div>
          </div>
          <InfoTip title="Analytics"
            text="Tracks your performance per event type over the selected time range. Tap an exercise card to expand charts. ★ marks a personal record. 1RM estimated via Brzycki formula (valid 1–10 reps)." />
        </div>
      </div>

      {/* Module tabs */}
      <div style={{ padding:'14px 20px 0' }}>
        <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:4,
          scrollbarWidth:'none', msOverflowStyle:'none' }}>
          {PROGRESS_MODULES.map(m => {
            const active = activeModule === m.id;
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
                display:'flex', alignItems:'center', gap:6, flexShrink:0,
                padding:'7px 13px', borderRadius:20, border:'1px solid',
                borderColor: active ? `var(--hue-${m.hue})` : 'var(--color-border)',
                background: active ? `var(--hue-${m.hue}-wash)` : 'var(--color-card)',
                color: active ? `var(--hue-${m.hue}-ink)` : 'var(--color-muted-foreground)',
                fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer',
                transition:'all 150ms', WebkitTapHighlightColor:'transparent',
                opacity: m.status === 'soon' ? 0.6 : 1,
              }}>
                <Icon name={m.icon} size={14} />
                {m.label}
                {m.status === 'soon' && (
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.06em',
                    textTransform:'uppercase', opacity:0.7 }}>soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming soon */}
      {mod.status === 'soon' && (
        <div style={{ margin:'16px 20px 32px', padding:'20px 18px',
          background:`var(--hue-${mod.hue}-wash)`, borderRadius:16,
          border:'1px solid var(--color-border)', display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:44, height:44, borderRadius:13, background:`var(--hue-${mod.hue})`,
            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name={mod.icon} size={22} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:`var(--hue-${mod.hue}-ink)`, marginBottom:6 }}>
              {mod.label} analytics — coming soon
            </div>
            <div style={{ fontSize:13, color:`var(--hue-${mod.hue}-ink)`, opacity:0.75, lineHeight:1.55 }}>
              {mod.desc}
            </div>
          </div>
        </div>
      )}

      {/* Shared range picker — applies to all active modules */}
      {mod.status === 'active' && (
        <div style={{ padding:'14px 20px 0' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:5, flex:1 }}>
              {HISTORY_RANGES_P.map((r, i) => (
                <button key={r.label} onClick={() => setRangeIdx(i)} style={{
                  flex:1, minHeight:32, borderRadius:8, border:'1px solid',
                  borderColor: rangeIdx===i ? `var(--hue-${mod.hue})` : 'var(--color-border)',
                  background: rangeIdx===i ? `var(--hue-${mod.hue})` : 'transparent',
                  color: rangeIdx===i ? '#fff' : 'var(--color-muted-foreground)',
                  fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer',
                  transition:'all 150ms',
                }}>{r.label}</button>
              ))}
            </div>
            {mod.id === 'workout' && (
              <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                {['exercise','routine'].map(g => (
                  <button key={g} onClick={() => setGroupBy(g)} style={{
                    minHeight:32, padding:'0 12px', borderRadius:8, border:'1px solid',
                    borderColor: groupBy===g ? 'var(--hue-plum)' : 'var(--color-border)',
                    background: groupBy===g ? 'var(--hue-plum-wash)' : 'transparent',
                    color: groupBy===g ? 'var(--hue-plum-ink)' : 'var(--color-muted-foreground)',
                    fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer',
                    transition:'all 150ms', textTransform:'capitalize',
                  }}>{g}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workout analytics */}
      {mod.status === 'active' && mod.id === 'workout' && (
        <div style={{ padding:'14px 20px 32px', display:'flex', flexDirection:'column', gap:14 }}>
          {exercises.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--color-muted-foreground)' }}>
              <Icon name="trend" size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 14px' }} />
              <div style={{ fontSize:15, fontWeight:700 }}>No workout data yet</div>
              <div style={{ fontSize:13, marginTop:4 }}>Log a workout to see progress here.</div>
            </div>
          )}
          {groupBy === 'exercise' && exercises.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {exercises.map(([name, data]) => (
                <ExerciseProgressCard key={name} name={name} data={data} />
              ))}
            </div>
          )}
          {groupBy === 'routine' && exercises.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {Object.entries(byRoutine).map(([routineName, exs]) => (
                <div key={routineName}>
                  <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em',
                    textTransform:'uppercase', color:'var(--color-muted-foreground)',
                    marginBottom:8, padding:'0 2px' }}>{routineName}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {exs.map(([name, data]) => (
                      <ExerciseProgressCard key={name} name={name} data={data} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reading progress */}
      {mod.status === 'active' && mod.id === 'reading' && (() => {
        const readingEvents = DB.getEvents({ type:'reading', ...(range.days ? { since: new Date(Date.now()-range.days*86400000) } : {}) });
        const books = {};
        readingEvents.forEach(ev => {
          const t = ev.payload?.title || 'Unknown';
          if (!books[t]) books[t] = { title:t, author:ev.payload?.author, sessions:0, totalPages:0, totalMins:0, maxPct:0 };
          books[t].sessions++;
          books[t].totalPages += ev.payload?.pages || 0;
          books[t].totalMins  += ev.payload?.durationMins || 0;
          books[t].maxPct = Math.max(books[t].maxPct, ev.payload?.completionPct || 0);
        });
        const bookList = Object.values(books);
        const totalPages = bookList.reduce((n,b)=>n+b.totalPages,0);
        const totalMins  = bookList.reduce((n,b)=>n+b.totalMins,0);
        return (
          <div style={{ padding:'14px 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
            {bookList.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--color-muted-foreground)' }}>
                <Icon name="book" size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 14px' }} />
                <div style={{ fontSize:15, fontWeight:700 }}>No reading data yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Log a reading session to see your books here.</div>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  <StatCard label="Books"    value={bookList.length}             unit="" hue="plum" icon="book"  />
                  <StatCard label="Pages"    value={totalPages}                  unit="" hue="plum" icon="trend" />
                  <StatCard label="Time"     value={totalMins>=60?Math.round(totalMins/60)+'h':totalMins} unit={totalMins>=60?'':'min'} hue="plum" icon="clock" />
                </div>
                {bookList.map(b => (
                  <div key={b.title} style={{ background:'var(--color-card)', border:'1px solid var(--color-border)', borderRadius:16, padding:14 }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{b.title}</div>
                    <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginBottom:8 }}>{b.author||'—'} · {b.sessions} session{b.sessions!==1?'s':''} · {b.totalPages} pages · {b.totalMins} min</div>
                    <div style={{ height:6, background:'var(--warm-100)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${b.maxPct}%`, height:'100%', background:'var(--hue-plum)', borderRadius:3, transition:'width 600ms' }} />
                    </div>
                    <div style={{ fontSize:11, color:'var(--hue-plum-ink)', marginTop:4, fontWeight:700 }}>{b.maxPct}% complete</div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}

      {/* Focus & Learning */}
      {mod.status === 'active' && (mod.id==='focus' || mod.id==='learning') && (() => {
        const evs = DB.getEvents({ type:mod.id, ...(range.days ? { since: new Date(Date.now()-range.days*86400000) } : {}) });
        const totalMins = evs.reduce((n,e) => n+(e.payload?.durationMins||0), 0);
        const avgQuality = evs.filter(e=>e.payload?.quality).length
          ? (evs.reduce((n,e)=>n+(e.payload?.quality||0),0)/evs.filter(e=>e.payload?.quality).length).toFixed(1) : null;
        const entries = [...evs].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,10);
        return (
          <div style={{ padding:'14px 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
            {evs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--color-muted-foreground)' }}>
                <Icon name={mod.icon} size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 14px' }} />
                <div style={{ fontSize:15, fontWeight:700 }}>No {mod.label.toLowerCase()} data yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Log a session to see your patterns here.</div>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns: avgQuality?'1fr 1fr 1fr':'1fr 1fr', gap:8 }}>
                  <StatCard label="Sessions" value={evs.length} unit="total" hue={mod.hue} icon={mod.icon} />
                  <StatCard label="Time" value={totalMins>=60?Math.round(totalMins/60)+'h':totalMins} unit={totalMins>=60?'':'min'} hue={mod.hue} icon="clock" />
                  {avgQuality && <StatCard label="Avg quality" value={avgQuality} unit="/ 5" hue={mod.hue} icon="zap" />}
                </div>
                {entries.map((ev,i) => (
                  <div key={ev.id||i} style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
                    borderRadius:14, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{ev.payload?.subject||ev.payload?.task||'Session'}</div>
                      <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:2 }}>
                        {new Date(ev.startedAt).toLocaleDateString('en',{month:'short',day:'numeric'})} · {ev.payload?.durationMins||0} min
                        {ev.payload?.source ? ` · ${ev.payload.source}` : ''}
                      </div>
                    </div>
                    {(ev.payload?.quality||ev.payload?.rating) && (
                      <span style={{ fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:7,
                        background:`var(--hue-${mod.hue}-wash)`,color:`var(--hue-${mod.hue}-ink)` }}>
                        ★ {ev.payload.quality||ev.payload.rating}/5
                      </span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}

      {/* Meal */}
      {mod.status === 'active' && mod.id==='meal' && (() => {
        const evs = DB.getEvents({ type:'meal', ...(range.days ? { since: new Date(Date.now()-range.days*86400000) } : {}) });
        const byType = {};
        evs.forEach(e => { const t=e.payload?.mealType||'Other'; if(!byType[t])byType[t]=0; byType[t]++; });
        const avgEnergy = evs.filter(e=>e.payload?.energyLevel).length
          ? (evs.reduce((n,e)=>n+(e.payload?.energyLevel||0),0)/evs.filter(e=>e.payload?.energyLevel).length).toFixed(1) : null;
        const entries = [...evs].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,12);
        return (
          <div style={{ padding:'14px 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
            {evs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--color-muted-foreground)' }}>
                <Icon name="flame" size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 14px' }} />
                <div style={{ fontSize:15, fontWeight:700 }}>No meal data yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Log a meal to see your patterns here.</div>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns: avgEnergy?'1fr 1fr':'1fr', gap:8 }}>
                  <StatCard label="Meals logged" value={evs.length} unit="total" hue="terracotta" icon="flame" />
                  {avgEnergy && <StatCard label="Avg energy" value={avgEnergy} unit="/ 5" hue="terracotta" icon="zap" />}
                </div>
                {Object.keys(byType).length > 0 && (
                  <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)', borderRadius:14, padding:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--color-muted-foreground)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>By meal type</div>
                    {Object.entries(byType).map(([type,n]) => (
                      <div key={type} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:600, minWidth:80 }}>{type}</span>
                        <div style={{ flex:1, height:6, background:'var(--warm-100)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${(n/evs.length)*100}%`, height:'100%', background:'var(--hue-terracotta)', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, color:'var(--color-muted-foreground)' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                )}
                {entries.map((ev,i) => (
                  <div key={ev.id||i} style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
                    borderRadius:14, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{ev.payload?.name||'Meal'}</div>
                      <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:2 }}>
                        {new Date(ev.startedAt).toLocaleDateString('en',{month:'short',day:'numeric'})} · {ev.payload?.mealType||''}
                      </div>
                    </div>
                    {ev.payload?.energyLevel && (
                      <span style={{ fontSize:18 }}>{'⚡'.repeat(Math.min(ev.payload.energyLevel,5))}</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};

window.ProgressScreen = ProgressScreen;
