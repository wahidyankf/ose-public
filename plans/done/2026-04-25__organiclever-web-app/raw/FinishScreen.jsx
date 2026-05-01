// FinishScreen.jsx — post-workout summary
const FinishScreen = ({ session, onDone }) => {
  const durationMins = session.durationSecs ? Math.round(session.durationSecs / 60) : 0;
  const totalSets = (session.exercises || []).reduce((n, e) => n + (e.sets?.length || 0), 0);
  const totalVol  = (session.exercises || []).reduce((n, e) =>
    n + (e.sets || []).reduce((m, s) => {
      if (!s.weight) return m;
      const w = String(s.weight);
      const kg = w.includes('+')
        ? w.split('+').reduce((a,x) => a + (parseFloat(x)||0), 0)
        : parseFloat(w) || 0;
      return m + kg * (s.reps || s.duration ? (s.reps || 1) : 0);
    }, 0), 0);

  const completedAll = (session.exercises || []).every(e =>
    (e.sets?.length || 0) >= e.targetSets);

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', padding:'0 20px 32px' }}>
      <AppHeader title="Nice work." subtitle="Workout complete" />

      {/* Hero card */}
      <div style={{
        background:'linear-gradient(160deg, var(--hue-teal-wash), var(--color-card))',
        borderRadius:24, padding:24, textAlign:'center', border:'1px solid var(--color-border)',
        marginBottom:14,
      }}>
        <div style={{
          width:72, height:72, borderRadius:22, background:'var(--hue-teal)', color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto',
          boxShadow:'0 8px 24px oklch(68% 0.10 195 / 0.3)',
        }}>
          <Icon name="check" size={38} />
        </div>
        <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.015em', marginTop:14 }}>
          {session.routineName}
        </div>
        {completedAll && (
          <div style={{ fontSize:13, color:'var(--hue-teal-ink)', marginTop:4, fontWeight:600 }}>
            All sets completed.
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatCard label="Duration"  value={durationMins}        unit="min"  hue="honey"      icon="clock"    />
        <StatCard label="Sets done" value={totalSets}            unit="sets" hue="teal"       icon="dumbbell" />
        <StatCard label="Volume"    value={totalVol>0 ? (totalVol>=1000 ? (totalVol/1000).toFixed(1) : totalVol) : '—'}
          unit={totalVol>=1000 ? 'k kg' : (totalVol>0?'kg':'—')} hue="plum" icon="trend" />
        <StatCard label="Exercises" value={(session.exercises||[]).length} unit="done" hue="sage" icon="zap" />
      </div>

      {/* Exercise breakdown */}
      {(session.exercises || []).length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.01em', marginBottom:10 }}>
            Exercise breakdown
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {session.exercises.map((ex, i) => {
              const done = ex.sets?.length || 0;
              const pct  = ex.targetSets > 0 ? Math.min(done/ex.targetSets,1) : 0;
              return (
                <div key={i} style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
                  borderRadius:14, padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700, fontSize:14 }}>{ex.name}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12,
                      color: pct>=1 ? 'var(--hue-sage-ink)' : 'var(--color-muted-foreground)',
                      fontWeight:700 }}>{done}/{ex.targetSets} sets</span>
                  </div>
                  <div style={{ height:4, background:'var(--warm-100)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${pct*100}%`, height:'100%',
                      background: pct>=1 ? 'var(--hue-sage)' : 'var(--hue-teal)',
                      borderRadius:2, transition:'width 600ms ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop:'auto' }}>
        <Button variant="teal" size="xl" fullWidth onClick={onDone}>
          Back to home
        </Button>
      </div>
    </div>
  );
};
window.FinishScreen = FinishScreen;
