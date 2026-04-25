// WorkoutScreen.jsx — active workout: log sets, rest timer, add-hoc exercises

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtSpec = (ex) => {
  if (ex.type === 'oneoff') return 'One-off';
  if (ex.type === 'duration') {
    const dur = ex.targetDuration ? fmtTime(ex.targetDuration) : '—';
    return `${ex.targetSets} × ${dur}${ex.timerMode === 'countup' ? ' (count up)' : ''}`;
  }
  const parts = [];
  parts.push(`${ex.targetSets} × ${ex.targetReps}`);
  if (ex.bilateral) parts.push('LR');
  if (ex.targetWeight) parts.push(`@ ${ex.targetWeight} kg`);
  return parts.join(' ');
};

const fmtTime = (secs) => {
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
};

// ── SetTimerSheet ─────────────────────────────────────────────────────────────
const SetTimerSheet = ({ exercise, setNum, totalSets, onComplete, onClose }) => {
  const { name, targetDuration, timerMode = 'countdown' } = exercise;
  const isCountdown = timerMode === 'countdown' && targetDuration;
  const [running,  setRunning]  = React.useState(false);
  const [elapsed,  setElapsed]  = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (isCountdown && next >= targetDuration) {
          setRunning(false); setFinished(true);
          return targetDuration;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const displayTime  = isCountdown ? Math.max(0, targetDuration - elapsed) : elapsed;
  const progress     = targetDuration ? (isCountdown ? 1 - elapsed/targetDuration : Math.min(elapsed/targetDuration,1)) : null;
  const ringColor    = finished ? 'var(--hue-sage)' : (isCountdown && elapsed > targetDuration*0.8 ? 'var(--hue-honey)' : 'var(--hue-teal)');

  const handleDone = () => { setRunning(false); onComplete({ duration: elapsed }); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:250, background:'var(--color-background)',
      display:'flex', flexDirection:'column', animation:'fadeIn 150ms ease-out' }}>
      {/* Header */}
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:13, color:'var(--color-muted-foreground)', fontWeight:500 }}>
            Set {setNum} of {totalSets}
          </div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.015em' }}>{name}</div>
        </div>
        <button onClick={onClose} style={{ width:40,height:40,borderRadius:12,border:0,
          background:'var(--color-secondary)',cursor:'pointer',display:'flex',
          alignItems:'center',justifyContent:'center',color:'var(--color-muted-foreground)' }}>
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Timer display */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', gap:24, padding:32 }}>
        <div style={{ position:'relative' }}>
          {progress !== null && (
            <ProgressRing size={200} stroke={10} progress={progress} color={ringColor} bg='var(--warm-100)' />
          )}
          <div style={{
            position: progress !== null ? 'absolute' : 'relative',
            inset: progress !== null ? 0 : 'auto',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: progress !== null ? 48 : 64,
              fontWeight:800, letterSpacing:'-0.03em',
              color: finished ? 'var(--hue-sage-ink)' : 'var(--color-foreground)' }}>
              {fmtTime(displayTime)}
            </div>
            {targetDuration && !finished && (
              <div style={{ fontSize:13, color:'var(--color-muted-foreground)', fontWeight:500 }}>
                {isCountdown ? `target: ${fmtTime(targetDuration)}` : `goal: ${fmtTime(targetDuration)}`}
              </div>
            )}
            {finished && (
              <div style={{ fontSize:15, fontWeight:700, color:'var(--hue-sage-ink)', marginTop:4 }}>
                Target reached!
              </div>
            )}
          </div>
        </div>

        {/* Mode label */}
        <div style={{ fontSize:13, color:'var(--color-muted-foreground)', display:'flex',
          alignItems:'center', gap:6 }}>
          <Icon name="timer" size={15} />
          {isCountdown ? 'Counting down' : 'Counting up'}
          {!running && elapsed === 0 && ' — tap Start to begin'}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:'0 20px calc(32px + env(safe-area-inset-bottom,0))',
        display:'flex', flexDirection:'column', gap:10 }}>
        {!finished ? (
          <>
            <Button variant="teal" size="xl" fullWidth
              leading={<Icon name={running ? 'timer' : 'play'} size={20} filled={!running} />}
              onClick={() => setRunning(r => !r)}>
              {running ? 'Pause' : (elapsed > 0 ? 'Resume' : 'Start')}
            </Button>
            {elapsed > 0 && (
              <Button variant="outline" size="lg" fullWidth onClick={handleDone}>
                Done — log {fmtTime(elapsed)}
              </Button>
            )}
          </>
        ) : (
          <Button variant="sage" size="xl" fullWidth
            leading={<Icon name="check" size={20} />} onClick={handleDone}>
            Log {fmtTime(elapsed)} and continue
          </Button>
        )}
        {elapsed === 0 && (
          <Button variant="ghost" size="md" fullWidth onClick={onClose}
            style={{ color:'var(--color-muted-foreground)' }}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

// ── ActiveExerciseRow ─────────────────────────────────────────────────────────
const ActiveExerciseRow = ({ exercise, onCompleteSet, onEditSet, onStartTimer, isNextUp,
  onMoveUp, onMoveDown, isFirst, isLast }) => {
  const { name, targetSets, targetReps, targetWeight, bilateral, dayStreak, sets=[], type='reps' } = exercise;
  const isDuration = type === 'duration';
  const isOneOff   = type === 'oneoff';
  const doneSets = sets.length;

  return (
    <div style={{
      background:'var(--color-card)', border:`1px solid ${isNextUp?'var(--hue-teal)':'var(--color-border)'}`,
      borderRadius:16, padding:14, display:'flex', flexDirection:'column', gap:10,
      boxShadow: isNextUp ? '0 0 0 3px oklch(68% 0.10 195 / 0.12)' : 'none',
      transition:'border-color 300ms, box-shadow 300ms',
    }}>
      {/* Name row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.01em',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
          {dayStreak > 0 && (
            <span style={{ flexShrink:0, fontSize:11, fontWeight:700, padding:'2px 7px',
              borderRadius:8, background:'var(--hue-honey-wash)', color:'var(--hue-honey-ink)' }}>
              Day {dayStreak}
            </span>
          )}
          <InfoTip title="Day streak" text={`Streak continues if your next session is within 72 hours of the last. Miss 72+ hours and it resets to 1. Completing today earns at least 1.${dayStreak > 0 ? ` Current streak: ${dayStreak}.` : ''}`} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700,
            color: doneSets>=targetSets ? 'var(--hue-sage-ink)' : 'var(--color-muted-foreground)' }}>
            {doneSets}/{targetSets}
          </span>
          {!isFirst && (
            <button onClick={onMoveUp} title="Move up" style={{
              width:26, height:26, borderRadius:7, border:0,
              background:'var(--color-secondary)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--color-muted-foreground)', flexShrink:0,
            }}><Icon name="arrow-up" size={13} /></button>
          )}
          {!isLast && (
            <button onClick={onMoveDown} title="Move down" style={{
              width:26, height:26, borderRadius:7, border:0,
              background:'var(--color-secondary)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--color-muted-foreground)', flexShrink:0,
            }}><Icon name="arrow-down" size={13} /></button>
          )}
        </div>
      </div>

      {/* Spec */}
      <div style={{ fontSize:13, color:'var(--color-muted-foreground)', fontFamily:'var(--font-mono)',
        marginTop:-6, display:'flex', alignItems:'center', gap:6 }}>
        {isDuration && <Icon name="timer" size={13} style={{ flexShrink:0 }} />}
        {fmtSpec({ ...exercise, targetSets, targetReps, bilateral, targetWeight })}
      </div>

      {/* Set buttons */}
      <div style={{ display:'flex', gap:6 }}>
        {isOneOff ? (
          // One-off: single large button, tap to mark done
          <button onClick={() => doneSets === 0 ? onCompleteSet(0) : onEditSet(0)}
            style={{
              flex:1, minHeight:52, borderRadius:12, border:'1px solid',
              borderColor: doneSets > 0 ? 'transparent' : 'var(--hue-teal)',
              background: doneSets > 0 ? 'var(--hue-sage)' : 'var(--hue-teal-wash)',
              color: doneSets > 0 ? '#fff' : 'var(--hue-teal-ink)',
              fontFamily:'inherit', fontWeight:700, fontSize:14, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all 150ms', WebkitTapHighlightColor:'transparent',
            }}>
            {doneSets > 0 ? <><Icon name="check" size={18} /> Done</> : <>Tap to log</>}
          </button>
        ) : Array.from({ length: targetSets }).map((_, i) => {
          const set  = sets[i];
          const done = !!set;

          if (isDuration) {
            // Duration set button
            const logged = done && set.duration != null ? fmtTime(set.duration) : null;
            const isNext = i === doneSets;
            return (
              <button key={i}
                onClick={() => done ? onEditSet(i) : onStartTimer(i)}
                style={{
                  flex:1, minHeight:52, borderRadius:12, border:'1px solid',
                  borderColor: done ? 'transparent' : (isNext ? 'var(--hue-teal)' : 'var(--color-border)'),
                  background: done ? 'var(--hue-sage)' : (isNext ? 'var(--hue-teal-wash)' : 'var(--color-card)'),
                  color: done ? '#fff' : (isNext ? 'var(--hue-teal-ink)' : 'var(--color-muted-foreground)'),
                  fontFamily:'var(--font-mono)', fontWeight:700, fontSize:12, cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:2, transition:'all 150ms', WebkitTapHighlightColor:'transparent',
                }}>
                {done ? (
                  <><Icon name="check" size={16} /><span style={{ fontSize:10, opacity:0.85 }}>{logged}</span></>
                ) : (
                  <><Icon name="play" size={16} filled /><span style={{ fontSize:10 }}>{i+1}</span></>
                )}
              </button>
            );
          }

          // Reps set button
          const isCurrentSet = i === doneSets;
          const diffReps   = done && set.reps   !== targetReps;
          const diffWeight = done && set.weight  !== targetWeight;
          const showDiff   = done && (diffReps || diffWeight);
          return (
            <button key={i} onClick={() => done ? onEditSet(i) : onCompleteSet(i)}
              style={{
                flex: isCurrentSet ? 2 : 1,  // active set gets more space
                minHeight:52, borderRadius:12, border:'1px solid',
                borderColor: done ? 'transparent' : (isCurrentSet ? 'var(--hue-teal)' : 'var(--color-border)'),
                background: done ? 'var(--hue-sage)' : (isCurrentSet ? 'var(--hue-teal)' : 'var(--color-card)'),
                color: done ? '#fff' : (isCurrentSet ? '#fff' : 'var(--color-muted-foreground)'),
                fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:2, transition:'all 150ms', WebkitTapHighlightColor:'transparent',
              }}>
              {done ? (
                <>
                  <Icon name="check" size={16} />
                  <span style={{ fontSize:10, opacity:0.85, fontFamily:'var(--font-mono)', textAlign:'center', lineHeight:1.3 }}>
                    {set.reps}{set.weight ? ` · ${set.weight}kg` : ''}
                  </span>
                </>
              ) : isCurrentSet ? (
                <>
                  <Icon name="check" size={18} />
                  <span style={{ fontSize:12, fontWeight:800, letterSpacing:'-0.01em' }}>Set {i+1}</span>
                </>
              ) : (
                <span style={{ fontSize:15, fontFamily:'var(--font-mono)' }}>{i+1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {doneSets > 0 && doneSets < targetSets && (
        <div style={{ height:4, background:'var(--warm-100)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${(doneSets/targetSets)*100}%`, height:'100%',
            background:'var(--hue-teal)', borderRadius:2, transition:'width 300ms' }} />
        </div>
      )}
      {/* Next-up hint */}
      {isNextUp && doneSets === 0 && (
        <div style={{ fontSize:12, fontWeight:600, color:'var(--hue-teal-ink)',
          display:'flex', alignItems:'center', gap:5, opacity:0.8 }}>
          <Icon name="chevron-right" size={13} /> Tap the teal button to log a set
        </div>
      )}
    </div>
  );
};

// ── RestTimerBanner ───────────────────────────────────────────────────────────
const RestTimerBanner = ({ timer, onDismiss, onSkip }) => {
  const { targetSeconds, elapsed } = timer;
  const remaining = targetSeconds - elapsed;
  const over = remaining < 0;
  const progress = over ? 0 : remaining / targetSeconds;
  const displaySecs = over ? Math.abs(remaining) : remaining;

  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:100,
      background:'var(--color-card)', borderTop:'1px solid var(--color-border)',
      padding:'14px 16px calc(14px + env(safe-area-inset-bottom,0))',
      boxShadow:'0 -4px 16px oklch(20% 0.02 60 / 0.08)',
      animation:'slideUp 200ms ease-out',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <ProgressRing size={64} stroke={5} progress={progress}
            color={over ? 'var(--hue-honey)' : 'var(--hue-teal)'}
            bg='var(--warm-100)' />
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-mono)', fontWeight:800, fontSize:14,
            color: over ? 'var(--hue-honey-ink)' : 'var(--hue-teal-ink)',
          }}>
            {over ? '+' : ''}{fmtTime(displaySecs)}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:6 }}>
            {over ? 'Rest over — whenever you\'re ready' : (timer.label || 'Resting…')}
            <InfoTip title="Rest timer"
              text="Auto-starts after each set. Tap 'Done' when you're ready for the next set. If you take longer than the target, the extra time is shown and the actual rest duration is logged." />
          </div>
          <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>
            {over ? `+${fmtTime(Math.abs(remaining))} over target` : `${fmtTime(remaining)} remaining`}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          <Button size="sm" variant="teal" onClick={onDismiss}>Done</Button>
          <Button size="sm" variant="ghost" onClick={onSkip}
            style={{ fontSize:12, minHeight:28, padding:'0 10px', color:'var(--color-muted-foreground)' }}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── EditSetSheet ─────────────────────────────────────────────────────────────
const EditSetSheet = ({ exercise, setIdx, set, totalSets, onSave, onDelete, onClose }) => {
  const [reps,   setReps]   = React.useState(String(set?.reps   ?? exercise.targetReps   ?? ''));
  const [weight, setWeight] = React.useState(String(set?.weight ?? exercise.targetWeight ?? ''));
  const diffReps   = !!set && Number(reps)   !== exercise.targetReps;
  const diffWeight = !!set && weight          !== (exercise.targetWeight || '');
  return (
    <Sheet title={`${exercise.name} — set ${setIdx+1} of ${totalSets}`} onClose={onClose}>
      {/* Target reference */}
      <div style={{ fontSize:12, color:'var(--color-muted-foreground)',
        fontFamily:'var(--font-mono)', padding:'2px 0 4px' }}>
        Target: {exercise.targetReps} reps{exercise.targetWeight ? ` @ ${exercise.targetWeight} kg` : ''}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <TextInput label="Reps" type="number" value={reps} onChange={setReps} min="0" />
          {diffReps && (
            <div style={{ fontSize:11, color:'var(--hue-honey-ink)', marginTop:4, fontWeight:600 }}>
              {Number(reps) < exercise.targetReps
                ? `−${exercise.targetReps - Number(reps)} below target`
                : `+${Number(reps) - exercise.targetReps} above target`}
            </div>
          )}
        </div>
        <TextInput label="Weight (kg)" type="text" value={weight}
          onChange={setWeight} placeholder="e.g. 8 or 4+4" />
      </div>
      <div style={{ fontSize:12, color:'var(--color-muted-foreground)', lineHeight:1.5,
        background:'var(--color-secondary)', borderRadius:10, padding:'8px 12px' }}>
        Each set can have different reps — log exactly what happened, e.g. 20/20/15 if the last set failed.
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {onDelete && (
          <Button variant="outline" size="md" style={{ borderColor:'var(--color-destructive)',
            color:'var(--color-destructive)' }} onClick={onDelete}>
            <Icon name="trash" size={16} /> Remove
          </Button>
        )}
        <Button variant="teal" size="md" fullWidth
          onClick={() => onSave({ reps: Number(reps)||0, weight: weight||null })}>
          Save set
        </Button>
      </div>
    </Sheet>
  );
};

// ── AddExerciseSheet ──────────────────────────────────────────────────────────
const AddExerciseSheet = ({ onAdd, onClose }) => {
  const [name,      setName]      = React.useState('');
  const [type,      setType]      = React.useState('reps'); // reps | duration | oneoff
  const [sets,      setSets]      = React.useState('3');
  const [reps,      setReps]      = React.useState('10');
  const [durationS, setDurationS] = React.useState('30');
  const [timerMode, setTimerMode] = React.useState('countdown');
  const [weight,    setWeight]    = React.useState('');
  const [group,     setGroup]     = React.useState('');
  const [bilateral, setBilateral] = React.useState(false);
  const [restVal,   setRestVal]   = React.useState('reps');

  const REST_OPTS = [
    { label:'= reps/duration',    value: 'reps' },
    { label:'= 2\xD7 reps/duration', value: 'reps2' },
    { label:'No rest',             value: 0 },
    { label:'30s',                 value: 30 },
    { label:'60s',                 value: 60 },
    { label:'90s',                 value: 90 },
  ];

  return (
    <Sheet title="Add exercise" onClose={onClose}>
      <TextInput label="Exercise name" value={name} onChange={setName} placeholder="e.g. Bicep curl" />

      {/* Type selector */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Type</div>
        <div style={{ display:'flex', gap:6 }}>
          {[['reps','Reps','zap'],['duration','Duration','timer'],['oneoff','One-off','check-circle']].map(([v,l,ic]) => (
            <button key={v} onClick={() => setType(v)} style={{
              flex:1, minHeight:36, borderRadius:10, border:'1px solid',
              borderColor: type===v ? 'var(--hue-teal)' : 'var(--color-border)',
              background: type===v ? 'var(--hue-teal-wash)' : 'transparent',
              color: type===v ? 'var(--hue-teal-ink)' : 'var(--color-muted-foreground)',
              fontFamily:'inherit', fontWeight:700, fontSize:12, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 150ms',
            }}><Icon name={ic} size={13} />{l}</button>
          ))}
        </div>
      </div>

      {/* Reps fields */}
      {type === 'reps' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <TextInput label="Sets"        type="number" value={sets}   onChange={setSets}   min="1" small />
            <TextInput label="Reps"        type="number" value={reps}   onChange={setReps}   min="1" small />
            <TextInput label="Weight (kg)" type="text"   value={weight} onChange={setWeight} placeholder="8" small />
          </div>
          <Toggle value={bilateral} onChange={setBilateral} label="Bilateral (LR)" />
        </>
      )}

      {/* Duration fields */}
      {type === 'duration' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <TextInput label="Sets"              type="number" value={sets}     onChange={setSets}     min="1" small />
            <TextInput label="Target (seconds)"  type="number" value={durationS} onChange={setDurationS} min="1" small />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Timer mode</div>
            <div style={{ display:'flex', gap:6 }}>
              {[['countdown','Count down'],['countup','Count up']].map(([v,l]) => (
                <button key={v} onClick={() => setTimerMode(v)} style={{
                  flex:1, minHeight:34, borderRadius:10, border:'1px solid',
                  borderColor: timerMode===v ? 'var(--hue-teal)' : 'var(--color-border)',
                  background: timerMode===v ? 'var(--hue-teal-wash)' : 'transparent',
                  color: timerMode===v ? 'var(--hue-teal-ink)' : 'var(--color-muted-foreground)',
                  fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 150ms',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* One-off: no sets/reps, just log it happened */}
      {type === 'oneoff' && (
        <div style={{ padding:'10px 14px', background:'var(--color-secondary)', borderRadius:12,
          fontSize:13, color:'var(--color-muted-foreground)', lineHeight:1.5 }}>
          One-off exercises are logged as a single event — no sets or reps to track. Good for warm-ups, stretches, or anything you just want to note happened.
        </div>
      )}

      <TextInput label="Group (optional)" value={group} onChange={setGroup} placeholder="e.g. Single" />
      {type === 'reps' && <Toggle value={bilateral} onChange={setBilateral} label="Bilateral (LR)" />}

      {/* Rest time picker */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Rest between sets</span>
          <InfoTip title="Rest between sets"
            text={'"= reps" rests as many seconds as the rep count (e.g. 20 reps → 20 s). "= 2× reps" doubles it. "App default" uses the setting from your Profile page.'} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {REST_OPTS.map(opt => (
            <button key={String(opt.value)} onClick={() => setRestVal(opt.value)} style={{
              minHeight:36, padding:'0 12px', borderRadius:10, fontFamily:'inherit',
              fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 150ms',
              border: restVal===opt.value ? '2px solid var(--hue-teal)' : '1px solid var(--color-border)',
              background: restVal===opt.value ? 'var(--hue-teal-wash)' : 'var(--color-card)',
              color: restVal===opt.value ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      <Button variant="teal" size="lg" fullWidth disabled={!name.trim()}
        onClick={() => onAdd({
          name: name.trim(),
          type,
          targetSets:      type === 'oneoff' ? 1 : (Number(sets)||3),
          targetReps:      type === 'reps'   ? (Number(reps)||10) : null,
          targetDuration:  type === 'duration' ? (Number(durationS)||30) : null,
          timerMode:       type === 'duration' ? timerMode : null,
          weight:          weight||null,
          bilateral:       type === 'reps' ? bilateral : false,
          groupName:       group||'Exercises',
          restSeconds:     type === 'oneoff' ? 0 : restVal,
        })}>
        Add to workout
      </Button>
    </Sheet>
  );
};

// ── EndWorkoutDialog ──────────────────────────────────────────────────────────
const EndWorkoutDialog = ({ onCancel, onEnd, onDiscard }) => (
  <div style={{ position:'absolute',inset:0,zIndex:150,
    background:'oklch(14% 0.01 60 / 0.58)',
    display:'flex',alignItems:'center',justifyContent:'center',padding:24,
    animation:'fadeIn 150ms ease-out' }}>
    <div style={{ width:'100%',maxWidth:320,background:'var(--color-card)',
      border:'1px solid var(--color-border)',
      borderRadius:24,padding:24,boxShadow:'var(--shadow-lg)',
      display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ fontSize:22,fontWeight:800,letterSpacing:'-0.015em',
        color:'var(--color-foreground)' }}>End workout?</div>
      <div style={{ fontSize:15,fontWeight:600,lineHeight:1.5,
        color:'var(--color-muted-foreground)' }}>
        Do you want to save this session to your history?
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <Button variant="teal" size="lg" fullWidth onClick={onEnd}>Save &amp; finish</Button>
        <Button variant="outline" size="lg" fullWidth onClick={onCancel}>Keep going</Button>
        <button onClick={onDiscard} style={{
          border:'1px solid var(--hue-terracotta)',background:'transparent',cursor:'pointer',
          fontFamily:'inherit', fontSize:14, fontWeight:700,
          color:'var(--hue-terracotta-ink)', padding:'10px 0', marginTop:2,
          borderRadius:12, width:'100%', transition:'all 150ms',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--hue-terracotta-wash)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
          🗑 Discard session
        </button>
      </div>
    </div>
  </div>
);

// ── WorkoutScreen ─────────────────────────────────────────────────────────────
const WorkoutScreen = ({ routine, onBack, onFinish }) => {
  const settings = DB.getSettings();

  // Build initial exercise list from routine (or blank)
  const initExercises = () => {
    if (!routine) return [];
    return (routine.groups || []).flatMap(g =>
      (g.exercises || []).map((ex, eIdx) => ({
        exerciseId:            ex.id,
        groupName:             g.name,
        name:                  ex.name,
        type:                  ex.type || 'reps',
        targetSets:            ex.targetSets,
        targetReps:            ex.targetReps,
        targetDuration:        ex.targetDuration || null,
        timerMode:             ex.timerMode || 'countdown',
        targetWeight:          ex.weight || null,
        bilateral:             ex.bilateral || false,
        dayStreak:             ex.dayStreak || 0,
        restSeconds:           ex.restSeconds ?? null,
        // carry group rest only on the LAST exercise of each group
        groupRestAfterSeconds: eIdx === g.exercises.length - 1 ? (g.restAfterSeconds || null) : null,
        sets: [],
      }))
    );
  };

  const sessionId = React.useRef(DB.uuid());
  const startedAt = React.useRef(null); // set when user presses Start

  const [exercises,    setExercises]   = React.useState(initExercises);
  const [restTimer,    setRestTimer]   = React.useState(null);
  const [editingSet,   setEditingSet]  = React.useState(null); // { exerciseIdx, setIdx }
  const [setTimer,     setSetTimer]    = React.useState(null); // { exerciseIdx, setIdx } for duration
  const [addingEx,     setAddingEx]    = React.useState(false);
  const [insertIdx,    setInsertIdx]   = React.useState(null); // null = append
  const [showEndDlg,   setShowEndDlg]  = React.useState(false);
  const [elapsed,      setElapsed]     = React.useState(0);   // workout duration in secs
  const [timerRunning, setTimerRunning] = React.useState(false);

  // Workout duration ticker — only runs after user starts
  React.useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Rest timer ticker
  React.useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => setRestTimer(t => t ? { ...t, elapsed: t.elapsed + 1 } : null), 1000);
    return () => clearInterval(id);
  }, [!!restTimer]);

  const totalSets = exercises.reduce((n,e) => n + e.targetSets, 0);
  const doneSets  = exercises.reduce((n,e) => n + e.sets.length, 0);
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  // Find the first exercise that hasn't completed all sets (for "next up" highlight)
  const nextUpIdx = exercises.findIndex(e => e.sets.length < e.targetSets);

  const completeSet = (exerciseIdx, customReps, customWeight) => {
    const ex = exercises[exerciseIdx];
    const reps   = customReps   ?? ex.targetReps;
    const weight = customWeight ?? ex.targetWeight;
    setExercises(exs => {
      const next = [...exs];
      next[exerciseIdx] = { ...next[exerciseIdx],
        sets: [...next[exerciseIdx].sets, {
          reps, weight, restSeconds: null, completedAt: new Date().toISOString(),
        }],
      };
      return next;
    });
    // Auto-start rest timer (only if not all sets done for this exercise)
    if (ex.sets.length + 1 < ex.targetSets) {
      const rawRest = ex.restSeconds ?? settings.restSeconds ?? 60;
      const repCount = reps || ex.targetReps;
      const target = rawRest === 'reps'  ? repCount
                   : rawRest === 'reps2' ? repCount * 2
                   : rawRest;
      if (target > 0) setRestTimer({ targetSeconds: target, elapsed: 0, exerciseIdx });
    } else {
      // Check if this exercise is the last in its group and group has restAfterSeconds
      const nextEx = exercises[exerciseIdx + 1];
      const groupChanged = nextEx && nextEx.groupName !== ex.groupName;
      const groupRest = ex.groupRestAfterSeconds;
      if (groupChanged && groupRest > 0) {
        setRestTimer({ targetSeconds: groupRest, elapsed: 0, exerciseIdx,
          label: `Rest after ${ex.groupName}` });
      }
    }
  };

  const dismissRest = () => {
    if (restTimer) {
      const actual = restTimer.elapsed;
      const idx    = restTimer.exerciseIdx;
      setExercises(exs => {
        const next = [...exs];
        const sets = [...next[idx].sets];
        if (sets.length > 0) sets[sets.length-1] = { ...sets[sets.length-1], restSeconds: actual };
        next[idx] = { ...next[idx], sets };
        return next;
      });
    }
    setRestTimer(null);
  };

  const saveEditSet = (exerciseIdx, setIdx, data) => {
    setExercises(exs => {
      const next = [...exs];
      const sets = [...next[exerciseIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...data };
      next[exerciseIdx] = { ...next[exerciseIdx], sets };
      return next;
    });
    setEditingSet(null);
  };

  const deleteSet = (exerciseIdx, setIdx) => {
    setExercises(exs => {
      const next = [...exs];
      const sets = next[exerciseIdx].sets.filter((_,i) => i !== setIdx);
      next[exerciseIdx] = { ...next[exerciseIdx], sets };
      return next;
    });
    setEditingSet(null);
  };

  const addExercise = (data) => {
    setExercises(exs => {
      const newEx = {
      exerciseId: null, groupName: data.groupName, name: data.name,
      type: data.type || 'reps',
      targetSets: data.targetSets, targetReps: data.targetReps,
      targetDuration: data.targetDuration || null,
      timerMode: data.timerMode || 'countdown',
      targetWeight: data.weight, bilateral: data.bilateral, dayStreak: 0,
      restSeconds: data.restSeconds ?? null, sets: [],
      };
      if (insertIdx !== null) {
        const next = [...exs];
        const pos = insertIdx < 0 ? 0 : insertIdx + 1;
        next.splice(pos, 0, newEx);
        return next;
      }
      return [...exs, newEx];
    });
    setInsertIdx(null);
    setAddingEx(false);
  };

  const completeDurationSet = (exerciseIdx, { duration }) => {
    const ex = exercises[exerciseIdx];
    setExercises(exs => {
      const next = [...exs];
      next[exerciseIdx] = { ...next[exerciseIdx],
        sets: [...next[exerciseIdx].sets, { duration, restSeconds: null, completedAt: new Date().toISOString() }],
      };
      return next;
    });
    setSetTimer(null);
    // Start rest timer if more sets remain
    if (ex.sets.length + 1 < ex.targetSets) {
      const rawRest = ex.restSeconds ?? settings.restSeconds ?? 60;
      const target  = rawRest === 'reps'  ? (ex.targetDuration || 30)
                    : rawRest === 'reps2' ? (ex.targetDuration || 30) * 2
                    : rawRest;
      setRestTimer({ targetSeconds: target, elapsed: 0, exerciseIdx });
    }
  };

  const moveExercise = (idx, dir) => {
    setExercises(exs => {
      const next = [...exs];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return exs;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const insertExerciseAt = (insertIdx) => {
    setInsertIdx(insertIdx);
    setAddingEx(true);
  };

  const handleFinish = () => {
    dismissRest();
    const session = {
      id: sessionId.current, routineId: routine?.id || null,
      routineName: routine?.name || 'Quick workout',
      startedAt: startedAt.current || new Date().toISOString(), finishedAt: new Date().toISOString(),
      durationSecs: elapsed,
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId, groupName: ex.groupName, name: ex.name,
        targetSets: ex.targetSets, targetReps: ex.targetReps,
        targetWeight: ex.targetWeight, bilateral: ex.bilateral, sets: ex.sets,
      })),
    };
    DB.saveSession(session);
    // Update day streaks
    const updates = exercises
      .filter(ex => ex.exerciseId)
      .map(ex => ({
        exerciseId: ex.exerciseId,
        hitTarget: ex.sets.length >= ex.targetSets &&
          ex.sets.every(s => (s.reps||0) >= ex.targetReps),
      }));
    if (updates.length) DB.updateStreaks(updates, session.id);
    onFinish(session);
  };

  // Group exercises by groupName for display
  const grouped = [];
  exercises.forEach((ex, idx) => {
    const last = grouped[grouped.length - 1];
    if (!last || last.groupName !== ex.groupName)
      grouped.push({ groupName: ex.groupName, items: [{ ex, idx }] });
    else
      last.items.push({ ex, idx });
  });

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {/* Header */}
      <AppHeader
        title={routine?.name || 'Quick workout'}
        subtitle={timerRunning ? `${doneSets}/${totalSets} sets · ${fmtTime(elapsed)}` : `${doneSets}/${totalSets} sets · not started`}
        onBack={() => setShowEndDlg(true)}
        trailing={
          <button onClick={() => setShowEndDlg(true)} style={{
            minHeight:36, padding:'0 12px', borderRadius:10, border:'1px solid var(--color-border)',
            background:'var(--color-card)', fontFamily:'inherit', fontWeight:700, fontSize:13,
            cursor:'pointer', color:'var(--color-muted-foreground)',
          }}>End</button>
        }
      />

      {/* Start workout banner */}
      {!timerRunning && elapsed === 0 && (
        <div style={{ margin:'8px 20px 0', background:'var(--hue-teal-wash)', borderRadius:14,
          padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--hue-teal-ink)', lineHeight:1.3 }}>
            Timer hasn't started yet
          </div>
          <button onClick={() => {
            if (!startedAt.current) startedAt.current = new Date().toISOString();
            setTimerRunning(true);
          }} style={{
            padding:'8px 16px', borderRadius:10, border:0,
            background:'var(--hue-teal)', color:'#fff',
            fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0,
          }}>Start exercise</button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding:'0 20px 2px' }}>
        <div style={{ height:6, background:'var(--warm-100)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:'var(--hue-teal)',
            borderRadius:3, transition:'width 300ms' }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 20px',
        paddingBottom: restTimer ? '110px' : '20px', display:'flex', flexDirection:'column', gap:0 }}>
        {exercises.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--color-muted-foreground)' }}>
            <Icon name="dumbbell" size={40} style={{ opacity:0.2, marginBottom:12 }} />
            <div style={{ fontSize:15, fontWeight:600 }}>No exercises yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Tap "Add exercise" to get started.</div>
          </div>
        )}

        {grouped.map(({ groupName, items }) => (
          <div key={groupName} style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em',
              textTransform:'uppercase', color:'var(--color-muted-foreground)',
              padding:'10px 2px 8px' }}>{groupName}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Insert before first exercise in group */}
              {(() => { const firstIdx = items[0]?.idx; return firstIdx != null && (
                <button onClick={() => insertExerciseAt(firstIdx - 1)} style={{
                  width:'100%', minHeight:28, border:'1px dashed var(--color-border)',
                  borderRadius:10, background:'transparent', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  gap:6, color:'var(--color-muted-foreground)', fontSize:12,
                  fontFamily:'inherit', fontWeight:600, transition:'all 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--hue-teal)'; e.currentTarget.style.color='var(--hue-teal-ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-border)'; e.currentTarget.style.color='var(--color-muted-foreground)'; }}>
                  <Icon name="plus" size={13} /> insert here
                </button>
              ); })()}
              {items.map(({ ex, idx }, itemPos) => (
                <React.Fragment key={idx}>
                  <ActiveExerciseRow exercise={ex} isNextUp={idx===nextUpIdx}
                    isFirst={idx===0} isLast={idx===exercises.length-1}
                    onCompleteSet={() => completeSet(idx)}
                    onEditSet={(setIdx) => setEditingSet({ exerciseIdx:idx, setIdx })}
                    onStartTimer={(setIdx) => setSetTimer({ exerciseIdx:idx, setIdx })}
                    onMoveUp={() => moveExercise(idx, -1)}
                    onMoveDown={() => moveExercise(idx, 1)} />
                  {/* Insert-here button between exercises */}
                  <button onClick={() => insertExerciseAt(idx)} style={{
                    width:'100%', minHeight:28, border:'1px dashed var(--color-border)',
                    borderRadius:10, background:'transparent', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    gap:6, color:'var(--color-muted-foreground)', fontSize:12,
                    fontFamily:'inherit', fontWeight:600, transition:'all 150ms',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--hue-teal)'; e.currentTarget.style.color='var(--hue-teal-ink)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-border)'; e.currentTarget.style.color='var(--color-muted-foreground)'; }}>
                    <Icon name="plus" size={13} /> insert here
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}

        {/* Add exercise + Finish */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          <Button variant="outline" size="md" fullWidth
            leading={<Icon name="plus" size={18} />} onClick={() => setAddingEx(true)}>
            Add exercise
          </Button>
          <Button variant="teal" size="xl" fullWidth
            leading={<Icon name="check" size={20} />}
            onClick={handleFinish} disabled={doneSets === 0}>
            Finish workout
          </Button>
        </div>
      </div>

      {/* Rest timer (sticky bottom) */}
      {restTimer && (
        <RestTimerBanner timer={restTimer} onDismiss={dismissRest} onSkip={dismissRest} />
      )}

      {/* Sheets & dialogs */}
      {editingSet && (() => {
        const { exerciseIdx, setIdx } = editingSet;
        const ex = exercises[exerciseIdx];
        return (
          <EditSetSheet
            exercise={ex} setIdx={setIdx} set={ex.sets[setIdx]} totalSets={ex.targetSets}
            onSave={(data) => saveEditSet(exerciseIdx, setIdx, data)}
            onDelete={() => deleteSet(exerciseIdx, setIdx)}
            onClose={() => setEditingSet(null)} />
        );
      })()}
      {setTimer && (() => {
        const { exerciseIdx, setIdx } = setTimer;
        const ex = exercises[exerciseIdx];
        return (
          <SetTimerSheet
            exercise={ex}
            setNum={setIdx + 1}
            totalSets={ex.targetSets}
            onComplete={(data) => completeDurationSet(exerciseIdx, data)}
            onClose={() => setSetTimer(null)} />
        );
      })()}
      {addingEx && <AddExerciseSheet onAdd={addExercise} onClose={() => setAddingEx(false)} />}}
      {showEndDlg && <EndWorkoutDialog onCancel={() => setShowEndDlg(false)} onEnd={handleFinish} onDiscard={onBack} />}
    </div>
  );
};

window.WorkoutScreen = WorkoutScreen;
