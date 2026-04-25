// HomeScreen.jsx — Generic life event journal

const EVENT_MODULES = [
  { id:'workout',  label:'Workout',  icon:'dumbbell', hue:'teal'      },
  { id:'reading',  label:'Reading',  icon:'book',     hue:'plum'      },
  { id:'learning', label:'Learning', icon:'zap',      hue:'honey'     },
  { id:'meal',     label:'Meal',     icon:'flame',    hue:'terracotta'},
  { id:'focus',    label:'Focus',    icon:'timer',    hue:'sky'       },
];

// ── Week rhythm strip ─────────────────────────────────────────────────────────
const WeekRhythmStrip = ({ last7Days, recentEvents }) => {
  const today = new Date().toDateString();
  const dayMap = {};
  (recentEvents||[]).forEach(ev => {
    const d = new Date(ev.startedAt).toDateString();
    if (!dayMap[d]) dayMap[d] = {};
    const type = ev.type === 'workout' ? 'workout'
               : ev.type === 'reading' ? 'reading'
               : ev.type === 'learning' ? 'learning'
               : ev.type === 'meal'     ? 'meal'
               : ev.type === 'focus'    ? 'focus'
               : 'custom';
    dayMap[d][type] = (dayMap[d][type]||0)+1;
  });
  const TYPE_COLORS = {
    workout:'var(--hue-teal)', reading:'var(--hue-plum)',
    learning:'var(--hue-honey)', meal:'var(--hue-terracotta)',
    focus:'var(--hue-sky)', custom:'var(--hue-sage)',
  };
  return (
    <div style={{ display:'flex', gap:5, alignItems:'flex-end' }}>
      {last7Days.map((d, i) => {
        const isToday = d.date.toDateString() === today;
        const types = Object.entries(dayMap[d.date.toDateString()]||{});
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:2, minHeight:32 }}>
              {types.length > 0 ? types.map(([type, count]) => (
                <div key={type} style={{ height:Math.min(count*8,20), borderRadius:3,
                  background:TYPE_COLORS[type]||'var(--hue-sage)',
                  opacity:isToday?1:0.7, minHeight:6 }} />
              )) : (
                <div style={{ height:4, borderRadius:2, background:'var(--warm-100)',
                  border:'1px solid var(--warm-200)', marginTop:'auto' }} />
              )}
            </div>
            <div style={{ fontSize:9, fontWeight:isToday?800:500,
              color:isToday?'var(--hue-teal-ink)':'var(--color-muted-foreground)' }}>
              {isToday?'Today':d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Event entry row ───────────────────────────────────────────────────────────
const EventEntry = ({ event, onClick }) => {
  const TYPE_META = {
    workout:  { hue:'teal',       icon:'dumbbell', label: e => e.payload?.routineName || 'Workout'         },
    reading:  { hue:'plum',       icon:'book',     label: e => e.payload?.title       || 'Reading session'  },
    learning: { hue:'honey',      icon:'zap',      label: e => e.payload?.subject     || 'Learning session' },
    meal:     { hue:'terracotta', icon:'flame',     label: e => e.payload?.name        || 'Meal'             },
    focus:    { hue:'sky',        icon:'timer',     label: e => e.payload?.task        || 'Focus session'    },
    custom:   { hue:'sage',       icon:'zap',       label: e => e.payload?.name        || 'Custom event'     },
  };
  const meta = TYPE_META[event.type] || TYPE_META.custom;
  const hue  = event.type === 'custom' ? (event.payload?.hue || 'sage') : meta.hue;
  const icon = event.type === 'custom' ? (event.payload?.icon || 'zap')  : meta.icon;
  const name = meta.label(event);

  const mins = event.payload?.durationMins
    || (event.payload?.durationSecs ? Math.round(event.payload.durationSecs/60) : null);
  const sets = event.type==='workout'
    ? (event.payload?.exercises||[]).reduce((n,e)=>n+(e.sets?.length||0),0) : null;

  const timeStr = new Date(event.startedAt).toLocaleTimeString('en',{hour:'numeric',minute:'2-digit'});

  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0',
      borderBottom:'1px solid var(--color-border)', cursor: onClick ? 'pointer' : 'default',
      transition:'opacity 150ms', WebkitTapHighlightColor:'transparent' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.opacity='0.75'; }}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      <div style={{ width:34, height:34, borderRadius:10, background:`var(--hue-${hue})`,
        color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={17} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
        <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:1,
          display:'flex', gap:8, alignItems:'center' }}>
          <span>{timeStr}</span>
          {mins>0 && <><span style={{ width:3,height:3,borderRadius:'50%',background:'var(--warm-300)',flexShrink:0 }}/><span>{mins} min</span></>}
          {sets>0 && <><span style={{ width:3,height:3,borderRadius:'50%',background:'var(--warm-300)',flexShrink:0 }}/><span>{sets} sets</span></>}
        </div>
      </div>
      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:7,
        background:`var(--hue-${hue}-wash)`, color:`var(--hue-${hue}-ink)`,
        textTransform:'uppercase', letterSpacing:'.04em', flexShrink:0 }}>
        {event.type}
      </span>
    </div>
  );
};

// ── Module stats for Workout ──────────────────────────────────────────────────
const VOLUME_RANGES = [{label:'7d',days:7},{label:'30d',days:30},{label:'3m',days:90},{label:'6m',days:180},{label:'1y',days:365}];

const WorkoutModuleView = ({ routines, onStartRoutine, onNewRoutine, onEditRoutine, refreshKey }) => {
  const [stats,    setStats]    = React.useState({workoutsThisWeek:0,streak:0,totalMins:0,totalSets:0});
  const [volRange, setVolRange] = React.useState(30);
  const [volumeKg, setVolumeKg] = React.useState(0);

  React.useEffect(() => {
    setStats(DB.getWeeklyStats());
    setVolumeKg(DB.getVolume(volRange));
  }, [refreshKey, volRange]);

  const fmt = m => m>=60?`${Math.floor(m/60)}h ${m%60}`:String(m);
  const fmtKg = kg => kg>=1000?`${(kg/1000).toFixed(1)}k`:String(kg);

  return (
    <>
      <div style={{ padding:'8px 20px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <StatCard label="Sessions" value={stats.workoutsThisWeek} unit="/ 7d" hue="teal" icon="dumbbell"
          info="Workout sessions logged in the last 7 rolling days." />
        <StatCard label="Streak" value={stats.streak} unit="wks" hue="terracotta" icon="flame"
          info="Consecutive weeks with 2+ workout sessions." />
        <StatCard label="Time moved" value={fmt(stats.totalMins)} unit="min" hue="honey" icon="clock"
          info="Total workout time in the last 7 days." />
        <StatCard label="Sets done" value={stats.totalSets} unit="sets" hue="sage" icon="zap"
          info="Total sets in the last 7 days." />
      </div>
      <div style={{ padding:'8px 20px 0' }}>
        <div style={{ background:'var(--color-card)', borderRadius:18, padding:12,
          border:'1px solid var(--color-border)', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32,height:32,borderRadius:10,background:'var(--hue-plum)',color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Icon name="trend" size={17} />
              </div>
              <div>
                <div style={{ fontSize:20,fontWeight:800,letterSpacing:'-0.015em',fontFamily:'var(--font-mono)' }}>
                  {fmtKg(volumeKg)}<span style={{ fontSize:12,fontWeight:700,marginLeft:4,fontFamily:'var(--font-sans)',color:'var(--color-muted-foreground)' }}>kg</span>
                </div>
                <div style={{ fontSize:11,color:'var(--color-muted-foreground)',fontWeight:600 }}>
                  Volume · {VOLUME_RANGES.find(r=>r.days===volRange)?.label}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {VOLUME_RANGES.map(r => (
                <button key={r.days} onClick={() => setVolRange(r.days)} style={{
                  minHeight:26, padding:'0 8px', borderRadius:7, border:'1px solid',
                  borderColor: volRange===r.days?'var(--hue-plum)':'var(--color-border)',
                  background: volRange===r.days?'var(--hue-plum)':'transparent',
                  color: volRange===r.days?'#fff':'var(--color-muted-foreground)',
                  fontFamily:'inherit', fontWeight:700, fontSize:11, cursor:'pointer',
                }}>{r.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:'12px 20px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ fontSize:13, fontWeight:800 }}>Event templates</div>
          <InfoTip title="Event templates" text="Reusable workout plans. Tap to start, pencil to edit." />
        </div>
        <Button size="sm" variant="outline" leading={<Icon name="plus" size={15} />} onClick={onNewRoutine}>New</Button>
      </div>
      <div style={{ padding:'4px 20px 28px', display:'flex', flexDirection:'column', gap:8 }}>
        {routines.length===0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--color-muted-foreground)', fontSize:14 }}>
            No templates yet. Tap "New" to create one.
          </div>
        ) : routines.map(r => (
          <RoutineCard key={r.id} routine={r} onOpen={()=>onStartRoutine(r)} onEdit={()=>onEditRoutine(r)} />
        ))}
      </div>
    </>
  );
};

// ── Generic module view ───────────────────────────────────────────────────────
const GenericModuleView = ({ mod, recentEvents }) => {
  const TYPE_MAP = { meal:'meal', meals:'meal' };
  const eventType = TYPE_MAP[mod.id] || mod.id;
  const events = recentEvents.filter(e => e.type === eventType);
  const EMOJIS = { reading:'📚', learning:'🧠', meal:'🍽️', focus:'⏱' };
  return (
    <div style={{ padding:'8px 20px 32px' }}>
      {events.length===0 ? (
        <div style={{ padding:'32px 0', textAlign:'center', color:'var(--color-muted-foreground)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>{EMOJIS[mod.id]||'📋'}</div>
          <div style={{ fontSize:14, fontWeight:700 }}>No {mod.label.toLowerCase()} events yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Tap + to log your first {mod.label.toLowerCase()} session</div>
        </div>
      ) : (
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:16, padding:'0 14px' }}>
          {events.map((ev,i) => <EventEntry key={ev.id||i} event={ev} onClick={() => setSelectedEvent(ev)} />)}
        </div>
      )}
    </div>
  );
};


// ── EventDetailSheet ─────────────────────────────────────────────────────
const EventDetailSheet = ({ event, onClose }) => {
  if (!event) return null;
  const TYPE_META = {
    workout:  { hue:'teal',       icon:'dumbbell', title: e => e.payload?.routineName || 'Workout' },
    reading:  { hue:'plum',       icon:'book',     title: e => e.payload?.title       || 'Reading'  },
    learning: { hue:'honey',      icon:'zap',      title: e => e.payload?.subject     || 'Learning' },
    meal:     { hue:'terracotta', icon:'flame',     title: e => e.payload?.name        || 'Meal'     },
    focus:    { hue:'sky',        icon:'timer',     title: e => e.payload?.task        || 'Focus'    },
    custom:   { hue:'sage',       icon:'zap',       title: e => e.payload?.name        || 'Custom'   },
  };
  const meta = TYPE_META[event.type] || TYPE_META.custom;
  const hue  = event.type==='custom' ? (event.payload?.hue||'sage') : meta.hue;
  const icon = event.type==='custom' ? (event.payload?.icon||'zap') : meta.icon;
  const mins = event.payload?.durationMins || (event.payload?.durationSecs ? Math.round(event.payload.durationSecs/60) : null);
  const dateStr = new Date(event.startedAt).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
  const timeStr = new Date(event.startedAt).toLocaleTimeString('en',{hour:'numeric',minute:'2-digit'});

  const fields = [];
  if (event.type==='reading') {
    if (event.payload?.author)        fields.push(['Author', event.payload.author]);
    if (event.payload?.pages)         fields.push(['Pages read', event.payload.pages]);
    if (event.payload?.completionPct != null) fields.push(['Progress', event.payload.completionPct+'%']);
  }
  if (event.type==='learning') {
    if (event.payload?.source)  fields.push(['Source', event.payload.source]);
    if (event.payload?.rating)  fields.push(['Quality', '⭐'.repeat(event.payload.rating)]);
  }
  if (event.type==='meal') {
    if (event.payload?.mealType)   fields.push(['Meal type', event.payload.mealType]);
    if (event.payload?.energyLevel) fields.push(['Energy after', '⚡'.repeat(event.payload.energyLevel)]);
  }
  if (event.type==='focus') {
    if (event.payload?.quality) fields.push(['Focus quality', '🧠'.repeat(event.payload.quality)]);
  }
  if (event.type==='workout') {
    const sets = (event.payload?.exercises||[]).reduce((n,e)=>n+(e.sets?.length||0),0);
    if (sets) fields.push(['Sets done', sets]);
  }
  if (mins) fields.push(['Duration', mins+' min']);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400,
      background:'oklch(14% 0.01 60 / 0.45)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
      animation:'fadeIn 150ms ease-out',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--color-card)',
        borderRadius:'24px 24px 0 0',
        padding:'20px 20px calc(24px + env(safe-area-inset-bottom,0))',
        boxShadow:'var(--shadow-lg)', animation:'slideUp 200ms ease-out',
        display:'flex', flexDirection:'column', gap:14, maxHeight:'80vh', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:13,background:`var(--hue-${hue})`,
              color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon name={icon} size={22} />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.01em' }}>
                {meta.title(event)}
              </div>
              <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:2 }}>
                {dateStr} · {timeStr}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:36,height:36,borderRadius:10,border:0,
            background:'var(--color-secondary)',cursor:'pointer',display:'flex',
            alignItems:'center',justifyContent:'center',color:'var(--color-muted-foreground)' }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {fields.map(([label, value]) => (
              <div key={label} style={{ background:'var(--color-secondary)', borderRadius:12,
                padding:'10px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--color-muted-foreground)',
                  textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:15, fontWeight:800 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reading progress bar */}
        {event.type==='reading' && event.payload?.completionPct != null && (
          <div style={{ height:8, background:'var(--warm-100)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:`${event.payload.completionPct}%`, height:'100%',
              background:`var(--hue-${hue})`, borderRadius:4, transition:'width 600ms' }} />
          </div>
        )}

        {/* Workout exercises */}
        {event.type==='workout' && (event.payload?.exercises||[]).length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--color-muted-foreground)',
              textTransform:'uppercase', letterSpacing:'.06em' }}>Exercises</div>
            {(event.payload.exercises).map((ex,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', fontSize:13, padding:'6px 0',
                borderBottom:'1px solid var(--color-border)' }}>
                <span style={{ fontWeight:600 }}>{ex.name}</span>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted-foreground)' }}>
                  {ex.sets?.length||0}/{ex.targetSets} sets
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {event.payload?.notes && (
          <div style={{ background:'var(--color-secondary)', borderRadius:12, padding:'12px 14px',
            fontSize:13, lineHeight:1.6, color:'var(--color-foreground)' }}>
            {event.payload.notes}
          </div>
        )}

        {/* Labels */}
        {(event.labels||[]).filter(l => l !== event.type).length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {(event.labels||[]).filter(l => l !== event.type).map(l => (
              <span key={l} style={{ fontSize:11, fontWeight:700, padding:'3px 9px',
                borderRadius:20, background:`var(--hue-${hue}-wash)`,
                color:`var(--hue-${hue}-ink)` }}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── HomeScreen ────────────────────────────────────────────────────────────────
const HomeScreen = ({ onStartRoutine, onNewRoutine, onEditRoutine, refreshKey, onGoSettings }) => {
  const [routines,     setRoutines]     = React.useState([]);
  const [last7Days,    setLast7Days]    = React.useState([]);
  const [recentEvents, setRecentEvents] = React.useState([]);
  const [totalWeek,    setTotalWeek]    = React.useState(0);
  const [darkMode,     setDarkMode]     = React.useState(() => DB.getSettings().darkMode||false);
  const [activeModule, setActiveModule] = React.useState(null); // null = overview
  const [selectedEvent,setSelectedEvent]= React.useState(null);
  const [visibleCount, setVisibleCount]  = React.useState(10);
  const loaderRef = React.useRef(null);
  const settings = DB.getSettings();

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    DB.saveSettings({ darkMode: next });
    document.documentElement.setAttribute('data-theme', next?'dark':'');
  };

  React.useEffect(() => {
    setRoutines(DB.getRoutines());
    setLast7Days(DB.getLast7Days());
    const events = DB.getEvents();
    setRecentEvents(events);
    const week = new Date(Date.now()-7*86400000);
    setTotalWeek(events.filter(e=>new Date(e.startedAt)>=week).length);
    setVisibleCount(10); // reset on refresh
  }, [refreshKey]);

  React.useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(n => n + 10);
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [recentEvents.length]);

  const dayName = new Date().toLocaleDateString('en',{weekday:'long'});
  const dateStr = new Date().toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
  const mod = EVENT_MODULES.find(m=>m.id===activeModule);

  // Has the user actually used the workout module recently? (gates workout-template card)
  const monthAgo = Date.now() - 30 * 86400000;
  const hasRecentWorkouts = recentEvents.some(e => e.type === 'workout' && new Date(e.startedAt).getTime() > monthAgo);

  // Group recent events by date for the overview (paginated)
  const visibleEvents = recentEvents.slice(0, visibleCount);
  const hasMore = visibleCount < recentEvents.length;
  const eventsByDate = {};
  visibleEvents.forEach(ev => {
    const d = new Date(ev.startedAt).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'});
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
            textTransform:'uppercase', color:'var(--color-muted-foreground)', marginBottom:4 }}>
            {dayName} · {dateStr}
          </div>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1.1 }}>
            {settings.name}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={toggleDark} style={{ width:40,height:40,borderRadius:12,border:'1px solid var(--color-border)',
            background:'var(--color-card)',display:'flex',alignItems:'center',justifyContent:'center',
            cursor:'pointer',color:'var(--color-foreground)' }}>
            <Icon name={darkMode?'sun':'moon'} size={18} />
          </button>
          <button onClick={onGoSettings} style={{ width:40,height:40,borderRadius:12,border:'1px solid var(--color-border)',
            background:'var(--color-card)',display:'flex',alignItems:'center',justifyContent:'center',
            cursor:'pointer',color:'var(--color-foreground)' }}>
            <Icon name="user" size={18} />
          </button>
        </div>
      </div>

      {/* Week rhythm */}
      <div style={{ margin:'14px 20px 0', background:'var(--color-card)',
        border:'1px solid var(--color-border)', borderRadius:18, padding:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:800,letterSpacing:'.08em',
              textTransform:'uppercase',color:'var(--color-muted-foreground)' }}>Last 7 days</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:3 }}>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:22,fontWeight:800,letterSpacing:'-0.02em' }}>
                {totalWeek}
              </span>
              <span style={{ fontSize:13,color:'var(--color-muted-foreground)',fontWeight:600 }}>
                event{totalWeek!==1?'s':''} logged
              </span>
            </div>
          </div>
          <InfoTip title="Week rhythm"
            text="Each bar = a day. Colors show event types: teal=workout, plum=reading, honey=learning, red=meal, blue=focus." />
        </div>
        <WeekRhythmStrip last7Days={last7Days} recentEvents={recentEvents} />
      </div>

      {/* Workout templates — only shown when user has logged a workout in the last 30 days */}
      {!activeModule && routines.length > 0 && hasRecentWorkouts && (
        <div style={{ padding:'14px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.06em',
                textTransform:'uppercase', color:'var(--color-muted-foreground)' }}>Workout templates</div>
              <InfoTip title="Workout templates"
                text="Reusable workout plans. Tap to start a session, pencil to edit. Templates for other event types coming soon." />
            </div>
            <Button size="sm" variant="outline" leading={<Icon name="plus" size={15} />}
              onClick={onNewRoutine}>New</Button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {routines.slice(0,3).map(r => (
              <RoutineCard key={r.id} routine={r}
                onOpen={() => onStartRoutine(r)}
                onEdit={() => onEditRoutine(r)} />
            ))}
            {routines.length > 3 && (
              <div style={{ textAlign:'center', fontSize:13, color:'var(--color-muted-foreground)',
                fontWeight:600, padding:'4px 0' }}>+{routines.length-3} more</div>
            )}
          </div>
        </div>
      )}

      {/* Module filter tabs */}
      <div style={{ padding:'14px 20px 0' }}>
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          <button onClick={() => setActiveModule(null)} style={{
            display:'flex', alignItems:'center', gap:5, flexShrink:0,
            padding:'6px 12px', borderRadius:20, border:'1px solid',
            borderColor: !activeModule ? 'var(--color-foreground)' : 'var(--color-border)',
            background: !activeModule ? 'var(--color-foreground)' : 'var(--color-card)',
            color: !activeModule ? 'var(--color-background)' : 'var(--color-muted-foreground)',
            fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all 150ms',
          }}>All</button>
          {EVENT_MODULES.map(m => {
            const active = activeModule === m.id;
            return (
              <button key={m.id} onClick={() => setActiveModule(active?null:m.id)} style={{
                display:'flex', alignItems:'center', gap:5, flexShrink:0,
                padding:'6px 12px', borderRadius:20, border:'1px solid',
                borderColor: active?`var(--hue-${m.hue})`:'var(--color-border)',
                background: active?`var(--hue-${m.hue}-wash)`:'var(--color-card)',
                color: active?`var(--hue-${m.hue}-ink)`:'var(--color-muted-foreground)',
                fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all 150ms',
              }}>
                <Icon name={m.icon} size={13} />{m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout-specific stats (only when workout filter active) */}
      {activeModule === 'workout' && (
        <WorkoutModuleView
          routines={routines}
          onStartRoutine={onStartRoutine}
          onNewRoutine={onNewRoutine}
          onEditRoutine={onEditRoutine}
          refreshKey={refreshKey}
        />
      )}

      {/* Other module views */}
      {activeModule && activeModule !== 'workout' && mod && (
        <GenericModuleView mod={mod} recentEvents={recentEvents} />
      )}

      {/* Overview: recent events log (when no filter) */}
      {!activeModule && (
        <div style={{ margin:'12px 20px 32px' }}>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)', marginBottom:10 }}>Recent events</div>
          {recentEvents.length===0 ? (
            <div style={{ padding:'32px 0', textAlign:'center', color:'var(--color-muted-foreground)' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:14, fontWeight:700 }}>Your life log is empty</div>
              <div style={{ fontSize:13, marginTop:4 }}>Tap + to log your first event</div>
            </div>
          ) : (
            <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
              borderRadius:16, padding:'0 14px' }}>
              {Object.entries(eventsByDate).map(([date, evs]) => (
                <div key={date}>
                  <div style={{ fontSize:11,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',
                    color:'var(--color-muted-foreground)',padding:'10px 0 4px' }}>{date}</div>
                  {evs.map((ev,i) => <EventEntry key={ev.id||i} event={ev} onClick={() => setSelectedEvent(ev)} />)}
                </div>
              ))}
              {hasMore && (
                <div ref={loaderRef} style={{ padding:'12px 0', textAlign:'center',
                  fontSize:13, color:'var(--color-muted-foreground)', fontWeight:500 }}>
                  Loading more…
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Event detail sheet */}
      {selectedEvent && (
        <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

window.HomeScreen = HomeScreen;
window.EventDetailSheet = EventDetailSheet;
