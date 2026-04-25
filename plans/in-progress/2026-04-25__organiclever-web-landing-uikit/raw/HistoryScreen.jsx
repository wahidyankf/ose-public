// HistoryScreen.jsx — past sessions + weekly activity chart + exercise progress

// ── WeeklyBarChart ─────────────────────────────────────────────────────────────
const WeeklyBarChart = ({ days }) => {
  const maxMins = Math.max(...days.map(d => d.durationMins), 1);
  const today = new Date().toDateString();
  return (
    <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
      borderRadius:20, padding:'16px 16px 12px' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--color-muted-foreground)',
        marginBottom:14, textTransform:'uppercase', letterSpacing:'.06em', fontSize:11 }}>
        This week
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
        {days.map((d, i) => {
          const isToday = d.date.toDateString() === today;
          const h = d.durationMins > 0 ? Math.max(8, Math.round((d.durationMins/maxMins)*72)) : 3;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:6 }}>
              <div style={{ position:'relative', width:'100%', display:'flex',
                alignItems:'flex-end', justifyContent:'center', height:72 }}>
                {d.sessions > 0 && (
                  <div style={{ position:'absolute', top: 72-h-20, fontSize:10, fontWeight:700,
                    color: isToday ? 'var(--hue-teal-ink)' : 'var(--color-muted-foreground)' }}>
                    {d.durationMins}m
                  </div>
                )}
                <div style={{
                  width:'70%', height:`${h}px`, borderRadius:6,
                  background: d.sessions > 0
                    ? (isToday ? 'var(--hue-teal)' : 'var(--hue-teal-wash)')
                    : 'var(--warm-100)',
                  border: d.sessions > 0 ? 'none' : '1px solid var(--warm-200)',
                  transition:'height 400ms ease-out',
                }} />
              </div>
              <div style={{ fontSize:11, fontWeight: isToday ? 800 : 500,
                color: isToday ? 'var(--hue-teal-ink)' : 'var(--color-muted-foreground)' }}>
                {d.label}
              </div>
              {d.sessions > 1 && (
                <div style={{ width:5,height:5,borderRadius:'50%',background:'var(--hue-teal)',marginTop:-4 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── SessionCard ────────────────────────────────────────────────────────────────
const SessionCard = ({ session }) => {
  const [expanded, setExpanded] = React.useState(false);
  const isCustom = session.type === 'custom';
  const isWorkout = session.type === 'workout';
  const TYPE_META = {
    workout:  { hue:'teal',       icon:'dumbbell' },
    reading:  { hue:'plum',       icon:'book'     },
    learning: { hue:'honey',      icon:'zap'      },
    meal:     { hue:'terracotta', icon:'flame'    },
    focus:    { hue:'sky',        icon:'timer'    },
    custom:   { hue: session.payload?.hue || 'sage', icon: session.payload?.icon || 'zap' },
  };
  const typeMeta = TYPE_META[session.type] || TYPE_META.custom;
  const customHue  = typeMeta.hue;
  const customIcon = typeMeta.icon;
  const durationMins = session.payload?.durationMins
    || (session.payload?.durationSecs ? Math.round(session.payload.durationSecs/60) : 0);
  const totalSets = isWorkout
    ? (session.payload?.exercises || []).reduce((n,e) => n+(e.sets?.length||0), 0) : 0;
  const dateStr = new Date(session.startedAt).toLocaleDateString('en', {
    weekday:'short', month:'short', day:'numeric',
  });
  const timeStr = new Date(session.startedAt).toLocaleTimeString('en', {
    hour:'numeric', minute:'2-digit',
  });

  return (
    <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
      borderRadius:16, overflow:'hidden' }}>
      {/* Header row */}
      <button onClick={() => setExpanded(v=>!v)} style={{
        width:'100%', display:'grid', gridTemplateColumns:'1fr auto', gap:12,
        padding:14, border:0, background:'transparent', cursor:'pointer',
        fontFamily:'inherit', textAlign:'left', color:'var(--color-foreground)',
        WebkitTapHighlightColor:'transparent',
      }}>
        <div>
          <div style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:8 }}>
            {isCustom && (
              <span style={{ width:22, height:22, borderRadius:6, background:`var(--hue-${customHue})`,
                color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={customIcon} size={13} />
              </span>
            )}
            {
              session.type==='reading'  ? (session.payload?.title   || 'Reading session')  :
              session.type==='learning' ? (session.payload?.subject || 'Learning session') :
              session.type==='meal'     ? (session.payload?.name    || 'Meal')             :
              session.type==='focus'    ? (session.payload?.task    || 'Focus session')    :
              isCustom                  ? (session.payload?.name    || 'Custom event')     :
              (session.payload?.routineName || 'Quick workout')
            }
          </div>
          <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:3,
            display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <span>{dateStr} · {timeStr}</span>
            {durationMins > 0 && <><span style={{ width:3,height:3,borderRadius:'50%',background:'var(--warm-300)' }} /><span>{durationMins} min</span></>}
            {totalSets > 0 && <><span style={{ width:3,height:3,borderRadius:'50%',background:'var(--warm-300)' }} /><span>{totalSets} sets</span></>}
          </div>
        </div>
        <Icon name={expanded?'chevron-up':'chevron-down'} size={18}
          style={{ color:'var(--color-muted-foreground)', marginTop:2 }} />
      </button>

      {/* Expanded exercise list */}
      {expanded && (
        <div style={{ borderTop:'1px solid var(--color-border)', padding:'10px 14px 14px',
          display:'flex', flexDirection:'column', gap:8 }}>
          {/* Non-workout event detail */}
          {!isWorkout && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {session.type==='reading' && session.payload?.completionPct != null && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, height:6, background:'var(--warm-100)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${session.payload.completionPct}%`, height:'100%', background:'var(--hue-plum)', borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--hue-plum-ink)' }}>{session.payload.completionPct}%</span>
                </div>
              )}
              {session.type==='reading' && session.payload?.pages && (
                <div style={{ fontSize:13, color:'var(--color-muted-foreground)' }}>{session.payload.pages} pages · {session.payload.author}</div>
              )}
              {(session.type==='learning') && session.payload?.rating && (
                <div style={{ fontSize:13 }}>Quality: {'⭐'.repeat(session.payload.rating)}</div>
              )}
              {session.type==='meal' && session.payload?.mealType && (
                <div style={{ fontSize:13, fontWeight:600, color:'var(--hue-terracotta-ink)' }}>{session.payload.mealType}</div>
              )}
              {session.type==='meal' && session.payload?.energyLevel && (
                <div style={{ fontSize:13, color:'var(--color-muted-foreground)' }}>Energy after: {'⚡'.repeat(session.payload.energyLevel)}</div>
              )}
              {session.type==='focus' && session.payload?.quality && (
                <div style={{ fontSize:13 }}>Focus quality: {'🧠'.repeat(session.payload.quality)}</div>
              )}
              {session.payload?.notes && (
                <div style={{ fontSize:13, color:'var(--color-muted-foreground)', lineHeight:1.5,
                  padding:'6px 0', borderTop:'1px solid var(--color-border)', marginTop:2 }}>
                  {session.payload.notes}
                </div>
              )}
            </div>
          )}
          {isWorkout && (session.payload?.exercises||[]).map((ex, i) => {
            const done = ex.sets?.length||0;
            return (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
                  marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>{ex.name}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12,
                    color: done>=ex.targetSets ? 'var(--hue-sage-ink)' : 'var(--color-muted-foreground)' }}>
                    {done}/{ex.targetSets} sets
                  </span>
                </div>
                {/* Set chips */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {(ex.sets||[]).map((s, si) => {
                    const label = s.duration != null
                      ? `${Math.floor(s.duration/60)?Math.floor(s.duration/60)+'m ':''}${s.duration%60}s`
                      : [s.reps != null ? `${s.reps} reps` : null, s.weight ? `@ ${s.weight} kg` : null]
                          .filter(Boolean).join(' ');
                    return (
                      <span key={si} style={{
                        fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8,
                        background:'var(--hue-teal-wash)', color:'var(--hue-teal-ink)',
                        fontFamily:'var(--font-mono)',
                      }}>
                        {label}{s.restSeconds ? ` · ${s.restSeconds}s rest` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── ExerciseProgressChart ──────────────────────────────────────────────────────
const ExerciseProgressChart = ({ sessions }) => {
  // Build a map of exercise name → [{ date, maxWeight, totalSets }]
  const exerciseMap = {};
  [...sessions].reverse().forEach(s => {
    (s.exercises||[]).forEach(ex => {
      if (!ex.name) return;
      if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
      const maxW = (ex.sets||[]).reduce((m, set) => {
        if (!set.weight) return m;
        const kg = set.weight.includes('+')
          ? set.weight.split('+').reduce((a,x) => a+parseFloat(x)||0, 0)
          : parseFloat(set.weight)||0;
        return Math.max(m, kg);
      }, 0);
      exerciseMap[ex.name].push({
        date: new Date(s.startedAt), maxWeight: maxW,
        sets: ex.sets?.length||0, targetSets: ex.targetSets,
      });
    });
  });

  // Only show exercises with weight data and more than 1 session
  const tracked = Object.entries(exerciseMap)
    .filter(([, pts]) => pts.length > 1 && pts.some(p => p.maxWeight > 0))
    .slice(0, 4);

  if (tracked.length === 0) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.01em' }}>Progress</div>
      {tracked.map(([exName, pts]) => {
        const weights = pts.map(p => p.maxWeight).filter(w => w>0);
        const minW = Math.min(...weights), maxW = Math.max(...weights, minW+1);
        const W=260, H=60, pad=8;
        const xScale = (i) => pad + (i/(pts.length-1||1)) * (W-2*pad);
        const yScale = (w) => H - pad - ((w-minW)/(maxW-minW||1)) * (H-2*pad);
        const pathD = pts.map((p,i) => `${i===0?'M':'L'}${xScale(i)},${yScale(p.maxWeight)}`).join(' ');
        const latest = pts[pts.length-1];
        const delta = pts.length>1 ? latest.maxWeight - pts[pts.length-2].maxWeight : 0;

        return (
          <div key={exName} style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
            borderRadius:16, padding:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontWeight:700, fontSize:14 }}>{exName}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800,
                  color:'var(--hue-teal-ink)' }}>{latest.maxWeight}kg</span>
                {delta !== 0 && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 6px', borderRadius:6,
                    background: delta>0 ? 'var(--hue-sage-wash)' : 'var(--hue-terracotta-wash)',
                    color: delta>0 ? 'var(--hue-sage-ink)' : 'var(--hue-terracotta-ink)' }}>
                    {delta>0?'+':''}{delta}kg
                  </span>
                )}
              </div>
            </div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
              <path d={pathD} fill="none" stroke="var(--hue-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p,i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(p.maxWeight)} r="4"
                  fill={i===pts.length-1 ? 'var(--hue-teal)' : 'var(--color-card)'}
                  stroke="var(--hue-teal)" strokeWidth="2" />
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ── LongTermChart ─────────────────────────────────────────────────────────────
const HISTORY_RANGES = [
  { label:'7d', days:7,   bucket:'day'  },
  { label:'30d', days:30,  bucket:'day'  },
  { label:'3m',  days:90,  bucket:'week' },
  { label:'6m',  days:180, bucket:'week' },
  { label:'1y',  days:365, bucket:'month' },
];

const LongTermChart = ({ sessions, range }) => {
  const { days, bucket } = range;
  const now = new Date();
  const since = new Date(now - days * 86400000);

  // Build buckets
  const buckets = [];
  if (bucket === 'day') {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      buckets.push({ label: d.toLocaleDateString('en', { weekday:'short' }),
        start: new Date(d.toDateString()), end: new Date(new Date(d.toDateString()).getTime() + 86400000) });
    }
  } else if (bucket === 'week') {
    const numWeeks = Math.ceil(days / 7);
    for (let i = numWeeks - 1; i >= 0; i--) {
      const end = new Date(now - i * 7 * 86400000);
      const start = new Date(end - 7 * 86400000);
      buckets.push({ label: start.toLocaleDateString('en', { month:'short', day:'numeric' }), start, end });
    }
  } else {
    const numMonths = Math.ceil(days / 30);
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ label: d.toLocaleDateString('en', { month:'short' }), start: d, end });
    }
  }

  // Count events per bucket, broken down by type for stacked bars
  const TYPES = ['workout','reading','learning','meal','focus','custom'];
  const TYPE_COLOR = {
    workout:'var(--hue-teal)', reading:'var(--hue-plum)',
    learning:'var(--hue-honey)', meal:'var(--hue-terracotta)',
    focus:'var(--hue-sky)', custom:'var(--hue-sage)',
  };
  const data = buckets.map(b => {
    const inRange = sessions.filter(s => {
      const t = new Date(s.startedAt);
      return t >= b.start && t < b.end;
    });
    const durationMins = inRange.reduce((n, s) => {
      const mins = s.payload?.durationMins
        || (s.payload?.durationSecs ? Math.round(s.payload.durationSecs/60) : 0);
      return n + mins;
    }, 0);
    const byType = {};
    TYPES.forEach(t => { byType[t] = inRange.filter(e => e.type === t).length; });
    return { label: b.label, sessions: inRange.length, durationMins, byType };
  });

  const maxMins = Math.max(...data.map(d => d.durationMins), 1);
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);
  const showMinutes = data.some(d => d.durationMins > 0);
  const maxVal = showMinutes ? maxMins : maxSessions;

  // Only show every Nth label to avoid crowding
  const labelStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;

  return (
    <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
      borderRadius:20, padding:'16px 16px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--color-muted-foreground)',
          textTransform:'uppercase', letterSpacing:'.06em' }}>Activity · {range.label}</div>
        <div style={{ fontSize:11, color:'var(--color-muted-foreground)' }}>
          {showMinutes ? 'minutes' : 'events'}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap: data.length > 30 ? 2 : 4, height:80 }}>
        {data.map((d, i) => {
          const val = showMinutes ? d.durationMins : d.sessions;
          const totalH = val > 0 ? Math.max(4, Math.round((val / maxVal) * 72)) : 2;
          const showLabel = i % labelStep === 0;
          // For minutes mode we don't have per-type minutes; render as a single neutral bar.
          // For sessions mode, stack by type.
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:4, minWidth:0 }}>
              <div style={{ width:'80%', height:`${totalH}px`, borderRadius:4, overflow:'hidden',
                display:'flex', flexDirection:'column-reverse',
                background: d.sessions > 0 ? 'transparent' : 'var(--warm-100)',
                border: d.sessions > 0 ? 'none' : '1px solid var(--warm-200)',
                transition:'height 400ms ease-out', alignSelf:'flex-end',
              }}>
                {d.sessions > 0 && !showMinutes && TYPES.map(t => {
                  const n = d.byType[t]; if (!n) return null;
                  return <div key={t} style={{ flex:n, background:TYPE_COLOR[t] }} />;
                })}
                {d.sessions > 0 && showMinutes && (
                  <div style={{ width:'100%', height:'100%', background:'var(--color-foreground)', opacity:0.85 }} />
                )}
              </div>
              {showLabel && (
                <div style={{ fontSize:9, fontWeight:500, color:'var(--color-muted-foreground)',
                  whiteSpace:'nowrap', overflow:'hidden', maxWidth:'100%', textAlign:'center' }}>
                  {d.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── ProgressSection ──────────────────────────────────────────────────────────
const METRICS = [
  { id:'maxWeight',  label:'Max weight',   unit:'kg',  key:'maxWeight',  pr:'isPR_weight' },
  { id:'est1RM',     label:'Est. 1RM',     unit:'kg',  key:'best1RM',    pr:'isPR_1rm' },
  { id:'volume',     label:'Volume',       unit:'kg',  key:'volume',     pr:'isPR_vol' },
  { id:'maxReps',    label:'Max reps',     unit:'reps',key:'maxReps',    pr:'isPR_reps' },
];

const ProgressLineChart = ({ points, metricKey, prKey, unit, isPRActive }) => {
  if (points.length < 1) return null;
  const vals = points.map(p => p[metricKey]||0);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals.filter(v=>v>0), 0);
  const W=280, H=70, padL=4, padR=4, padT=14, padB=4;
  const xScale = i => padL + (i/(points.length-1||1))*(W-padL-padR);
  const yScale = v => H - padB - ((v-minV)/(maxV-minV||1))*(H-padT-padB);
  const pathD = points.map((p,i)=>`${i===0?'M':'L'}${xScale(i).toFixed(1)},${yScale(p[metricKey]||0).toFixed(1)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block', overflow:'visible' }}>
      {/* Area fill */}
      <defs>
        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(68% 0.10 195)" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="oklch(68% 0.10 195)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${pathD} L${xScale(points.length-1).toFixed(1)},${H} L${padL},${H} Z`}
        fill="url(#tealGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--hue-teal)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p,i) => {
        const isPR = isPRActive && p[prKey];
        const cx = xScale(i), cy = yScale(p[metricKey]||0);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={isPR?5:3}
              fill={isPR?'var(--hue-honey)':'var(--hue-teal)'}
              stroke="var(--color-card)" strokeWidth="1.5" />
            {isPR && (
              <text x={cx} y={cy-9} textAnchor="middle"
                fontSize="10" fill="var(--hue-honey-ink)">★</text>
            )}
          </g>
        );
      })}
      {/* Value labels: first, last, and PRs */}
      {points.map((p,i) => {
        const show = i===0 || i===points.length-1 || (isPRActive && p[prKey]);
        if (!show) return null;
        const v = p[metricKey]||0;
        const cx = xScale(i), cy = yScale(v);
        const anchor = i===0?'start':i===points.length-1?'end':'middle';
        return (
          <text key={`lbl-${i}`} x={cx} y={cy-8} textAnchor={anchor}
            fontSize="9" fontWeight="700" fill="var(--color-muted-foreground)">
            {v>=1000?(v/1000).toFixed(1)+'k':v}{unit==='kg'?'kg':''}
          </text>
        );
      })}
    </svg>
  );
};

const ExerciseProgressCard = ({ name, data }) => {
  const { points, isDuration } = data;

  // Pick the first metric that has actual data as default
  const firstUsableMetric = METRICS.find(m => points.some(p => (p[m.key]||0) > 0))?.id || 'maxReps';
  const [metric, setMetric] = React.useState(firstUsableMetric);
  const [showPR, setShowPR]  = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

  if (isDuration) {
    const vals = points.map(p=>p.maxDuration||0);
    const maxV = Math.max(...vals,1);
    const W=280,H=70,padL=4,padR=4,padT=14,padB=4;
    const xS = i=>padL+(i/(points.length-1||1))*(W-padL-padR);
    const yS = v=>H-padB-((v)/(maxV))*(H-padT-padB);
    const pathD = points.map((p,i)=>`${i===0?'M':'L'}${xS(i).toFixed(1)},${yS(p.maxDuration||0).toFixed(1)}`).join(' ');
    const latest = points[points.length-1];
    return (
      <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
        borderRadius:16, overflow:'hidden' }}>
        {/* Collapsible header — same pattern as reps card */}
        <button onClick={()=>setExpanded(e=>!e)} style={{
          width:'100%', padding:'12px 14px', border:0, background:'transparent',
          cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex',
          alignItems:'center', justifyContent:'space-between', gap:8,
        }}>
          <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {latest?.isPR && <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px',
              borderRadius:8, background:'var(--hue-honey-wash)', color:'var(--hue-honey-ink)' }}>★ PR</span>}
            <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800,
              color:'var(--hue-teal-ink)' }}>{fmtTime(latest?.maxDuration||0)}</span>
            <Icon name={expanded?'chevron-up':'chevron-down'} size={16}
              style={{ color:'var(--color-muted-foreground)' }} />
          </div>
        </button>
        {expanded && (
          <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--color-border)' }}>
            <div style={{ marginTop:10 }}>
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
                <path d={`${pathD} L${xS(points.length-1).toFixed(1)},${H} L${padL},${H} Z`}
                  fill="oklch(68% 0.10 195 / 0.12)" />
                <path d={pathD} fill="none" stroke="var(--hue-teal)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p,i) => (
                  <circle key={i} cx={xS(i)} cy={yS(p.maxDuration||0)} r={p.isPR?5:3}
                    fill={p.isPR?'var(--hue-honey)':'var(--hue-teal)'}
                    stroke="var(--color-card)" strokeWidth="1.5" />
                ))}
              </svg>
              <div style={{ fontSize:11, color:'var(--color-muted-foreground)', marginTop:6 }}>
                {points.length} session{points.length!==1?'s':''} · max duration
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeMetric = METRICS.find(m=>m.id===metric) || METRICS.find(m => points.some(p=>(p[m.key]||0)>0)) || METRICS[0];
  const latest = points[points.length-1];
  const best = latest ? (latest[activeMetric.key]||0) : 0;
  const delta = points.length>1 ? (best||0)-(points[points.length-2][activeMetric.key]||0) : 0;
  const bestDisplay = best>=1000 ? (best/1000).toFixed(1)+'k' : String(best);
  const bestUnit = activeMetric.unit==='kg' ? 'kg' : ' reps';

  return (
    <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
      borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <button onClick={()=>setExpanded(e=>!e)} style={{
        width:'100%', padding:'12px 14px', border:0, background:'transparent',
        cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex',
        alignItems:'center', justifyContent:'space-between', gap:8,
      }}>
        <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {latest?.isPR && <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px',
            borderRadius:8, background:'var(--hue-honey-wash)', color:'var(--hue-honey-ink)' }}>★ PR</span>}
          {delta !== 0 && (
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:8,
              background: delta>0 ? 'var(--hue-sage-wash)' : 'var(--hue-terracotta-wash)',
              color: delta>0 ? 'var(--hue-sage-ink)' : 'var(--hue-terracotta-ink)' }}>
              {delta>0?'+':''}{delta}{activeMetric.unit==='kg'?'kg':''}
            </span>
          )}
          <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800,
            color:'var(--hue-teal-ink)' }}>
            {bestDisplay}{bestUnit}
          </span>
          <Icon name={expanded?'chevron-up':'chevron-down'} size={16}
            style={{ color:'var(--color-muted-foreground)' }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--color-border)' }}>
          {/* Metric toggle */}
          <div style={{ display:'flex', gap:5, margin:'10px 0 10px', flexWrap:'wrap' }}>
            {METRICS.filter(m => points.some(p => (p[m.key]||0)>0)).map(m => (
              <button key={m.id} onClick={()=>setMetric(m.id)} style={{
                minHeight:28, padding:'0 10px', borderRadius:8, border:'1px solid',
                borderColor: metric===m.id ? 'var(--hue-teal)' : 'var(--color-border)',
                background: metric===m.id ? 'var(--hue-teal)' : 'transparent',
                color: metric===m.id ? '#fff' : 'var(--color-muted-foreground)',
                fontFamily:'inherit', fontWeight:700, fontSize:11, cursor:'pointer',
                transition:'all 150ms',
              }}>{m.label}</button>
            ))}
            <button onClick={()=>setShowPR(v=>!v)} style={{
              minHeight:28, padding:'0 10px', borderRadius:8, border:'1px solid',
              borderColor: showPR ? 'var(--hue-honey)' : 'var(--color-border)',
              background: showPR ? 'var(--hue-honey-wash)' : 'transparent',
              color: showPR ? 'var(--hue-honey-ink)' : 'var(--color-muted-foreground)',
              fontFamily:'inherit', fontWeight:700, fontSize:11, cursor:'pointer',
              transition:'all 150ms',
            }}>★ PR</button>
          </div>

          {/* Chart */}
          {points.length > 0 && (
            <ProgressLineChart
              points={points}
              metricKey={activeMetric.key}
              prKey={activeMetric.pr}
              unit={activeMetric.unit}
              isPRActive={showPR}
            />
          )}

          {/* Session log */}
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
            {[...points].reverse().slice(0,5).map((p,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', fontSize:12, padding:'4px 0',
                borderBottom:'1px solid var(--color-border)' }}>
                <span style={{ color:'var(--color-muted-foreground)' }}>
                  {p.date.toLocaleDateString('en',{month:'short',day:'numeric'})}
                </span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {p.isPR && <span style={{ fontSize:10 }}>★</span>}
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>
                    {p.maxWeight>0?`${p.maxWeight}kg`:''}
                    {p.maxReps>0?` × ${p.maxReps}reps`:''}
                    {p.volume>0?` · ${p.volume>=1000?(p.volume/1000).toFixed(1)+'k':p.volume}kg vol`:''}
                    {p.best1RM>0?` · 1RM~${p.best1RM}kg`:''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── HistoryScreen ──────────────────────────────────────────────────────────────
const HistoryScreen = ({ refreshKey }) => {
  const [sessions, setSessions] = React.useState([]);
  const [rangeIdx, setRangeIdx] = React.useState(0);

  React.useEffect(() => {
    setSessions(DB.getSessions());
  }, [refreshKey]);

  const range = HISTORY_RANGES[rangeIdx];

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'20px 20px 4px' }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.015em' }}>History</div>
        <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>
          {sessions.length} session{sessions.length!==1?'s':''} logged
        </div>
      </div>

      <div style={{ padding:'12px 20px 32px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Range picker + chart */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:'14px 14px 12px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:6 }}>
            {HISTORY_RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setRangeIdx(i)} style={{
                flex:1, minHeight:30, borderRadius:8, border:'1px solid',
                borderColor: rangeIdx===i ? 'var(--hue-teal)' : 'var(--color-border)',
                background: rangeIdx===i ? 'var(--hue-teal)' : 'transparent',
                color: rangeIdx===i ? '#fff' : 'var(--color-muted-foreground)',
                fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer',
                transition:'all 150ms',
              }}>{r.label}</button>
            ))}
          </div>
          <LongTermChart sessions={sessions} range={range} />
        </div>



        <div>
          <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.01em', marginBottom:10 }}>
            Sessions
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--color-muted-foreground)' }}>
              <Icon name="history" size={40} style={{ opacity:0.2, display:'block', margin:'0 auto 12px' }} />
              <div style={{ fontSize:14, fontWeight:600 }}>No events yet.</div>
              <div style={{ fontSize:13, marginTop:4 }}>Tap + to log your first event — workouts, reading, learning, meals, focus, or your own.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {sessions.map(s => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.HistoryScreen = HistoryScreen;
