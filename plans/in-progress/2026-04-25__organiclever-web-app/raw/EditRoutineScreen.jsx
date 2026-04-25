// EditRoutineScreen.jsx — create / edit a routine with full CRUD on groups + exercises

// ── ExerciseEditRow ────────────────────────────────────────────────────────────
const ExerciseEditRow = ({ exercise, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [expanded, setExpanded] = React.useState(false);
  const { name, targetSets, targetReps, weight, bilateral, dayStreak, restSeconds,
    type='reps', targetDuration, timerMode='countdown' } = exercise;
  const isDuration = type === 'duration';

  return (
    <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
      borderRadius:14, overflow:'hidden', transition:'box-shadow 150ms' }}>
      {/* Collapsed header row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', cursor:'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <Icon name="grip" size={16} style={{ color:'var(--color-muted-foreground)', flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {name || <span style={{ opacity:0.4 }}>Unnamed exercise</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--color-muted-foreground)', fontFamily:'var(--font-mono)', marginTop:1 }}>
            {isDuration
              ? `${targetSets}× ${targetDuration ? fmtTime(targetDuration) : '—'} (${timerMode})`
              : `${targetSets}×${targetReps}${bilateral?' LR':''}${weight ? ` @ ${weight} kg` : ''}${restSeconds ? ` · ${restSeconds}s rest` : ''}`
            }
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {!isFirst && (
            <button onClick={e => { e.stopPropagation(); onMoveUp(); }} style={{
              width:28,height:28,borderRadius:8,border:0,background:'var(--color-secondary)',
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--color-muted-foreground)' }}>
              <Icon name="arrow-up" size={14} />
            </button>
          )}
          {!isLast && (
            <button onClick={e => { e.stopPropagation(); onMoveDown(); }} style={{
              width:28,height:28,borderRadius:8,border:0,background:'var(--color-secondary)',
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--color-muted-foreground)' }}>
              <Icon name="arrow-down" size={14} />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{
            width:28,height:28,borderRadius:8,border:0,background:'var(--hue-terracotta-wash)',
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            color:'var(--hue-terracotta-ink)' }}>
            <Icon name="trash" size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); setExpanded(v=>!v); }} style={{
            width:28,height:28,borderRadius:8,border:0,background:'var(--color-secondary)',
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            color:'var(--color-muted-foreground)' }}>
            <Icon name={expanded?'chevron-up':'chevron-down'} size={14} />
          </button>
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div style={{ padding:'0 12px 14px', display:'flex', flexDirection:'column', gap:10,
          borderTop:'1px solid var(--color-border)' }}>
          <TextInput label="Exercise name" value={name} onChange={v => onUpdate({ name:v })} style={{ marginTop:10 }} />

          {/* Type toggle */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Type</div>
            <div style={{ display:'flex', gap:6 }}>
              {['reps','duration'].map(t => (
                <button key={t} onClick={() => onUpdate({ type:t })} style={{
                  flex:1, minHeight:36, borderRadius:10, fontFamily:'inherit', fontWeight:700,
                  fontSize:13, cursor:'pointer', border:'1px solid',
                  borderColor: type===t ? 'var(--hue-teal)' : 'var(--color-border)',
                  background: type===t ? 'var(--hue-teal-wash)' : 'var(--color-card)',
                  color: type===t ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
                  transition:'all 150ms', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                  <Icon name={t==='duration'?'timer':'zap'} size={14} />
                  {t === 'reps' ? 'Reps' : 'Duration'}
                </button>
              ))}
            </div>
          </div>

          {/* Sets (shared) */}
          <TextInput label="Sets" type="number" value={targetSets}
            onChange={v => onUpdate({ targetSets:Number(v)||1 })} small />

          {isDuration ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <TextInput label="Target duration (sec)" type="number" value={targetDuration??''}
                onChange={v => onUpdate({ targetDuration: v ? Number(v) : null })}
                placeholder="e.g. 30" small />
              <div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Timer mode</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[['countdown','Count down'],['countup','Count up']].map(([val,label]) => (
                    <button key={val} onClick={() => onUpdate({ timerMode:val })} style={{
                      flex:1, minHeight:36, borderRadius:10, fontFamily:'inherit', fontWeight:700,
                      fontSize:13, cursor:'pointer', border:'1px solid',
                      borderColor: timerMode===val ? 'var(--hue-teal)' : 'var(--color-border)',
                      background: timerMode===val ? 'var(--hue-teal-wash)' : 'var(--color-card)',
                      color: timerMode===val ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
                      transition:'all 150ms',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <TextInput label="Reps" type="number" value={targetReps}
                  onChange={v => onUpdate({ targetReps:Number(v)||1 })} small />
                <TextInput label="Weight (kg)" type="text" value={weight??''}
                  onChange={v => onUpdate({ weight:v||null })} placeholder="e.g. 8" small />
              </div>
              <Toggle value={bilateral} onChange={v => onUpdate({ bilateral:v })} label="Bilateral (LR)" />
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, alignItems:'end' }}>
            <TextInput label="Rest time (sec)" type="number" value={restSeconds??''} min="10" max="600"
              onChange={v => onUpdate({ restSeconds: v ? Number(v) : null })} placeholder="Default" small />
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>Day streak</div>
                <InfoTip title="Day streak (auto)"
                  text="Tracks how many consecutive days you've completed this exercise at target reps and weight. Increments automatically when you finish a session the day after the last one. Gaps of 1 day hold the streak; gaps of 2+ days reduce it by 1 per missed day (minimum 0)." />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18,
                  color: (dayStreak||0) > 0 ? 'var(--hue-honey-ink)' : 'var(--color-muted-foreground)' }}>
                  {dayStreak||0}
                </span>
                <span style={{ fontSize:12, color:'var(--color-muted-foreground)', fontWeight:500 }}>
                  {(dayStreak||0) === 1 ? 'day' : 'days'}
                </span>
                <span style={{ fontSize:11, color:'var(--color-muted-foreground)', fontStyle:'italic' }}>
                  (auto)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── EditRoutineScreen ─────────────────────────────────────────────────────────
const EditRoutineScreen = ({ routine: initialRoutine, onSave, onDelete, onBack }) => {
  const isNew = !initialRoutine;

  const [name,   setName]   = React.useState(initialRoutine?.name || '');
  const [hue,    setHue]    = React.useState(initialRoutine?.hue  || 'teal');
  const [groups, setGroups] = React.useState(() =>
    isNew ? [{ id: DB.uuid(), name: 'Main', exercises: [] }]
          : JSON.parse(JSON.stringify(initialRoutine.groups || []))
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // ── group helpers ──────────────────────────────────────────────────────────
  const updateGroup = (gIdx, patch) =>
    setGroups(gs => gs.map((g,i) => i===gIdx ? { ...g, ...patch } : g));

  const addGroup = () =>
    setGroups(gs => [...gs, { id: DB.uuid(), name: 'Circuit A', exercises: [] }]);

  const deleteGroup = (gIdx) =>
    setGroups(gs => gs.filter((_,i) => i!==gIdx));

  // ── exercise helpers ───────────────────────────────────────────────────────
  const addExercise = (gIdx) => {
    const ex = { id: DB.uuid(), name:'', targetSets:3, targetReps:10, weight:null,
      bilateral:false, dayStreak:0, restSeconds:null };
    setGroups(gs => gs.map((g,i) =>
      i===gIdx ? { ...g, exercises: [...g.exercises, ex] } : g));
  };

  const updateExercise = (gIdx, eIdx, patch) =>
    setGroups(gs => gs.map((g,i) => i!==gIdx ? g : {
      ...g, exercises: g.exercises.map((e,j) => j===eIdx ? { ...e, ...patch } : e),
    }));

  const deleteExercise = (gIdx, eIdx) =>
    setGroups(gs => gs.map((g,i) => i!==gIdx ? g : {
      ...g, exercises: g.exercises.filter((_,j) => j!==eIdx),
    }));

  const moveExercise = (gIdx, eIdx, dir) => {
    setGroups(gs => gs.map((g,i) => {
      if (i !== gIdx) return g;
      const exs = [...g.exercises];
      const swapIdx = eIdx + dir;
      if (swapIdx < 0 || swapIdx >= exs.length) return g;
      [exs[eIdx], exs[swapIdx]] = [exs[swapIdx], exs[eIdx]];
      return { ...g, exercises: exs };
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const routine = {
      ...(initialRoutine || {}),
      id:   initialRoutine?.id || DB.uuid(),
      name: name.trim(), hue, groups,
    };
    DB.saveRoutine(routine);
    onSave(routine);
  };

  const handleDelete = () => {
    if (initialRoutine?.id) DB.deleteRoutine(initialRoutine.id);
    onDelete();
  };

  const totalEx = groups.reduce((n,g) => n+(g.exercises?.length||0), 0);

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <AppHeader
        title={isNew ? 'New event template' : 'Edit event template'}
        subtitle={`${totalEx} exercise${totalEx!==1?'s':''} across ${groups.length} group${groups.length!==1?'s':''}`}
        onBack={onBack}
        trailing={
          <Button variant="teal" size="sm" disabled={!name.trim()} onClick={handleSave}>
            <Icon name="save" size={16} /> Save
          </Button>
        }
      />

      <div style={{ padding:'0 20px 40px', display:'flex', flexDirection:'column', gap:20 }}>
        {/* Basic info */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <TextInput label="Template name" value={name} onChange={setName} placeholder="e.g. Kettlebell day" />
          <div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Color</div>
            <HuePicker value={hue} onChange={setHue} />
          </div>
        </div>

        {/* Groups */}
        {groups.map((group, gIdx) => (
          <div key={group.id} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Group header */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  value={group.name}
                  onChange={e => updateGroup(gIdx, { name: e.target.value })}
                  placeholder="e.g. Circuit A, Round 1, Warmup…"
                  style={{ flex:1, height:36, borderRadius:10, border:'1px solid var(--color-border)',
                    background:'var(--color-card)', padding:'0 10px', fontFamily:'var(--font-sans)',
                    fontWeight:800, fontSize:13, letterSpacing:'.06em', textTransform:'uppercase',
                    color:'var(--color-muted-foreground)', outline:'none' }}
                  onFocus={e => e.target.style.boxShadow='0 0 0 3px oklch(68% 0.10 195 / 0.3)'}
                  onBlur={e => e.target.style.boxShadow=''}
                />
                {groups.length > 1 && (
                  <button onClick={() => deleteGroup(gIdx)} style={{
                    width:36,height:36,borderRadius:10,border:0,background:'var(--hue-terracotta-wash)',
                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                    color:'var(--hue-terracotta-ink)' }}>
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
              {/* Rest after group */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                background:'var(--color-secondary)', borderRadius:10 }}>
                <Icon name="timer" size={14} style={{ color:'var(--color-muted-foreground)', flexShrink:0 }} />
                <span style={{ fontSize:12, fontWeight:600, color:'var(--color-muted-foreground)', flex:1 }}>Rest after group</span>
                <InfoTip title="Rest after group"
                  text="Extra rest inserted after completing all exercises in this group before moving to the next. Useful between circuits." />
                <div style={{ display:'flex', gap:4 }}>
                  {[null, 0, 30, 60, 90].map(s => (
                    <button key={String(s)} onClick={() => updateGroup(gIdx, { restAfterSeconds: s })} style={{
                      minHeight:28, padding:'0 8px', borderRadius:8, border:'1px solid',
                      borderColor: (group.restAfterSeconds??null)===s ? 'var(--hue-teal)' : 'var(--color-border)',
                      background: (group.restAfterSeconds??null)===s ? 'var(--hue-teal)' : 'var(--color-card)',
                      color: (group.restAfterSeconds??null)===s ? '#fff' : 'var(--color-muted-foreground)',
                      fontFamily:'inherit', fontWeight:700, fontSize:11, cursor:'pointer', transition:'all 150ms',
                    }}>{s === null ? 'None' : s === 0 ? 'No rest' : `${s}s`}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {group.exercises.map((ex, eIdx) => (
                <ExerciseEditRow key={ex.id} exercise={ex}
                  isFirst={eIdx===0} isLast={eIdx===group.exercises.length-1}
                  onUpdate={patch => updateExercise(gIdx, eIdx, patch)}
                  onDelete={() => deleteExercise(gIdx, eIdx)}
                  onMoveUp={() => moveExercise(gIdx, eIdx, -1)}
                  onMoveDown={() => moveExercise(gIdx, eIdx, 1)} />
              ))}
            </div>

            <Button variant="outline" size="sm" fullWidth
              leading={<Icon name="plus" size={15} />}
              onClick={() => addExercise(gIdx)}>
              Add exercise to {group.name}
            </Button>
          </div>
        ))}

        {/* Add group */}
        <Button variant="secondary" size="md" fullWidth
          leading={<Icon name="plus-circle" size={18} />} onClick={addGroup}>
          Add group
        </Button>

        {/* Delete routine */}
        {!isNew && (
          <div style={{ marginTop:8, paddingTop:16, borderTop:'1px solid var(--color-border)' }}>
            {!showDeleteConfirm ? (
              <Button variant="outline" size="md" fullWidth
                style={{ borderColor:'var(--color-destructive)', color:'var(--color-destructive)' }}
                leading={<Icon name="trash" size={16} />}
                onClick={() => setShowDeleteConfirm(true)}>
                Delete routine
              </Button>
            ) : (
              <div style={{ background:'var(--hue-terracotta-wash)', borderRadius:14,
                padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--hue-terracotta-ink)' }}>
                  Delete "{name}"? This can't be undone.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Button variant="outline" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" fullWidth onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

window.EditRoutineScreen = EditRoutineScreen;
