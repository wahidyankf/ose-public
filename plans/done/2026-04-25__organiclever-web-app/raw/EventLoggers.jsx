// EventLoggers.jsx — Structured loggers for Reading, Learning, Meal, Focus events

// ── Reading Logger ────────────────────────────────────────────────────────────
const ReadingLogger = ({ onSave, onClose }) => {
  const [title,    setTitle]    = React.useState('');
  const [author,   setAuthor]   = React.useState('');
  const [pages,    setPages]    = React.useState('');
  const [mins,     setMins]     = React.useState('');
  const [notes,    setNotes]    = React.useState('');
  const [pct,      setPct]      = React.useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      type: 'reading', labels: ['reading', title.trim()].filter(Boolean),
      payload: { title: title.trim(), author: author.trim() || null,
        pages: pages ? Number(pages) : null,
        durationMins: mins ? Number(mins) : null,
        completionPct: pct ? Number(pct) : null,
        notes: notes.trim() || null },
    });
  };

  return (
    <LoggerShell title="Log reading" icon="book" hue="plum" onClose={onClose} onSave={handleSave} saveDisabled={!title.trim()}>
      <TextInput label="Book / article title" value={title} onChange={setTitle} placeholder="e.g. Thinking Fast and Slow" />
      <TextInput label="Author (optional)" value={author} onChange={setAuthor} placeholder="e.g. Daniel Kahneman" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <TextInput label="Pages read" type="number" value={pages} onChange={setPages} placeholder="e.g. 30" min="1" small />
        <TextInput label="Duration (min)" type="number" value={mins} onChange={setMins} placeholder="e.g. 45" min="1" small />
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Completion %</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[10,25,50,75,100].map(p => (
            <button key={p} onClick={() => setPct(String(p))} style={{
              minHeight:36, padding:'0 12px', borderRadius:10, border:'1px solid',
              borderColor: pct===String(p) ? 'var(--hue-plum)' : 'var(--color-border)',
              background: pct===String(p) ? 'var(--hue-plum)' : 'transparent',
              color: pct===String(p) ? '#fff' : 'var(--color-muted-foreground)',
              fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer',
            }}>{p}%</button>
          ))}
        </div>
      </div>
      <NotesField value={notes} onChange={setNotes} />
    </LoggerShell>
  );
};

// ── Learning Logger ───────────────────────────────────────────────────────────
const LearningLogger = ({ onSave, onClose }) => {
  const [subject, setSubject] = React.useState('');
  const [source,  setSource]  = React.useState('');
  const [mins,    setMins]    = React.useState('');
  const [notes,   setNotes]   = React.useState('');
  const [rating,  setRating]  = React.useState('');

  const handleSave = () => {
    if (!subject.trim()) return;
    onSave({
      type: 'learning', labels: ['learning', subject.trim()].filter(Boolean),
      payload: { subject: subject.trim(), source: source.trim() || null,
        durationMins: mins ? Number(mins) : null,
        rating: rating ? Number(rating) : null,
        notes: notes.trim() || null },
    });
  };

  return (
    <LoggerShell title="Log learning" icon="zap" hue="honey" onClose={onClose} onSave={handleSave} saveDisabled={!subject.trim()}>
      <TextInput label="What did you learn?" value={subject} onChange={setSubject} placeholder="e.g. React hooks, Spanish vocab, Piano scales" />
      <TextInput label="Source (optional)" value={source} onChange={setSource} placeholder="e.g. YouTube, Udemy, Book, Practice" />
      <TextInput label="Duration (min)" type="number" value={mins} onChange={setMins} placeholder="e.g. 60" min="1" />
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Session quality</div>
        <div style={{ display:'flex', gap:6 }}>
          {[['😴','1'],['😐','2'],['🙂','3'],['😊','4'],['🔥','5']].map(([emoji, val]) => (
            <button key={val} onClick={() => setRating(val)} style={{
              flex:1, minHeight:40, borderRadius:10, border:'1px solid',
              borderColor: rating===val ? 'var(--hue-honey)' : 'var(--color-border)',
              background: rating===val ? 'var(--hue-honey-wash)' : 'transparent',
              cursor:'pointer', fontSize:20, transition:'all 150ms',
            }}>{emoji}</button>
          ))}
        </div>
      </div>
      <NotesField value={notes} onChange={setNotes} />
    </LoggerShell>
  );
};

// ── Meal Logger ───────────────────────────────────────────────────────────────
const MealLogger = ({ onSave, onClose }) => {
  const [name,    setName]    = React.useState('');
  const [mealType,setMealType]= React.useState('');
  const [energy,  setEnergy]  = React.useState('');
  const [notes,   setNotes]   = React.useState('');

  const MEAL_TYPES = ['Breakfast','Lunch','Dinner','Snack','Drink'];
  const ENERGY_LEVELS = [['😩','1'],['😐','2'],['🙂','3'],['😊','4'],['⚡','5']];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      type: 'meal', labels: ['meal', mealType, name.trim()].filter(Boolean),
      payload: { name: name.trim(), mealType: mealType || null,
        energyLevel: energy ? Number(energy) : null,
        notes: notes.trim() || null },
    });
  };

  return (
    <LoggerShell title="Log meal" icon="flame" hue="terracotta" onClose={onClose} onSave={handleSave} saveDisabled={!name.trim()}>
      <TextInput label="What did you eat/drink?" value={name} onChange={setName} placeholder="e.g. Oatmeal with berries, Green tea" />
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Meal type</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {MEAL_TYPES.map(t => (
            <button key={t} onClick={() => setMealType(mealType===t?'':t)} style={{
              minHeight:34, padding:'0 12px', borderRadius:10, border:'1px solid',
              borderColor: mealType===t ? 'var(--hue-terracotta)' : 'var(--color-border)',
              background: mealType===t ? 'var(--hue-terracotta-wash)' : 'transparent',
              color: mealType===t ? 'var(--hue-terracotta-ink)' : 'var(--color-muted-foreground)',
              fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Energy after</div>
        <div style={{ display:'flex', gap:6 }}>
          {ENERGY_LEVELS.map(([emoji, val]) => (
            <button key={val} onClick={() => setEnergy(val)} style={{
              flex:1, minHeight:40, borderRadius:10, border:'1px solid',
              borderColor: energy===val ? 'var(--hue-terracotta)' : 'var(--color-border)',
              background: energy===val ? 'var(--hue-terracotta-wash)' : 'transparent',
              cursor:'pointer', fontSize:20, transition:'all 150ms',
            }}>{emoji}</button>
          ))}
        </div>
      </div>
      <NotesField value={notes} onChange={setNotes} />
    </LoggerShell>
  );
};

// ── Focus Logger ──────────────────────────────────────────────────────────────
const FocusLogger = ({ onSave, onClose }) => {
  const [task,    setTask]    = React.useState('');
  const [mins,    setMins]    = React.useState('');
  const [quality, setQuality] = React.useState('');
  const [notes,   setNotes]   = React.useState('');

  const DURATION_PRESETS = [15,25,45,60,90,120];

  const handleSave = () => {
    if (!task.trim() && !mins) return;
    onSave({
      type: 'focus', labels: ['focus', task.trim()].filter(Boolean),
      payload: { task: task.trim() || null,
        durationMins: mins ? Number(mins) : null,
        quality: quality ? Number(quality) : null,
        notes: notes.trim() || null },
    });
  };

  return (
    <LoggerShell title="Log focus session" icon="timer" hue="sky" onClose={onClose} onSave={handleSave} saveDisabled={!task.trim() && !mins}>
      <TextInput label="What did you work on?" value={task} onChange={setTask} placeholder="e.g. Feature design, Writing, Tax returns" />
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Duration (min)</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          {DURATION_PRESETS.map(p => (
            <button key={p} onClick={() => setMins(String(p))} style={{
              minHeight:34, padding:'0 12px', borderRadius:10, border:'1px solid',
              borderColor: mins===String(p) ? 'var(--hue-sky)' : 'var(--color-border)',
              background: mins===String(p) ? 'var(--hue-sky-wash)' : 'transparent',
              color: mins===String(p) ? 'var(--hue-sky-ink)' : 'var(--color-muted-foreground)',
              fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer',
            }}>{p}</button>
          ))}
        </div>
        <TextInput type="number" value={mins} onChange={setMins} placeholder="or enter custom" min="1" small />
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Focus quality</div>
        <div style={{ display:'flex', gap:6 }}>
          {[['😵','1'],['😐','2'],['🙂','3'],['😊','4'],['🧠','5']].map(([emoji, val]) => (
            <button key={val} onClick={() => setQuality(val)} style={{
              flex:1, minHeight:40, borderRadius:10, border:'1px solid',
              borderColor: quality===val ? 'var(--hue-sky)' : 'var(--color-border)',
              background: quality===val ? 'var(--hue-sky-wash)' : 'transparent',
              cursor:'pointer', fontSize:20, transition:'all 150ms',
            }}>{emoji}</button>
          ))}
        </div>
      </div>
      <NotesField value={notes} onChange={setNotes} />
    </LoggerShell>
  );
};

// ── Shared helpers ────────────────────────────────────────────────────────────
const NotesField = ({ value, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:13, fontWeight:600 }}>Notes (optional)</label>
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder="Any thoughts worth capturing..."
      rows={3} style={{
        borderRadius:12, border:'1px solid var(--color-border)',
        background:'var(--color-card)', padding:'10px 12px',
        fontFamily:'var(--font-sans)', fontSize:15, fontWeight:500,
        color:'var(--color-foreground)', outline:'none', resize:'none',
        width:'100%', boxSizing:'border-box', lineHeight:1.5,
      }}
      onFocus={e => e.target.style.boxShadow='0 0 0 3px oklch(68% 0.10 195 / 0.3)'}
      onBlur={e => e.target.style.boxShadow=''}
    />
  </div>
);

const LoggerShell = ({ title, icon, hue, onClose, onSave, saveDisabled, children }) => (
  <div style={{ position:'fixed', inset:0, zIndex:310,
    background:'oklch(14% 0.01 60 / 0.50)',
    display:'flex', alignItems:'flex-end', justifyContent:'center',
    animation:'fadeIn 150ms ease-out',
  }} onClick={e => e.target===e.currentTarget && onClose()}>
    <div style={{ width:'100%', maxWidth:480,
      background:'var(--color-card)', borderRadius:'24px 24px 0 0',
      padding:'20px 20px calc(28px + env(safe-area-inset-bottom,0))',
      boxShadow:'var(--shadow-lg)', animation:'slideUp 200ms ease-out',
      display:'flex', flexDirection:'column', gap:14, maxHeight:'90vh', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`var(--hue-${hue})`,
            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name={icon} size={20} />
          </div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.015em' }}>{title}</div>
        </div>
        <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:0,
          background:'var(--color-secondary)', cursor:'pointer', display:'flex',
          alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)' }}>
          <Icon name="x" size={18} />
        </button>
      </div>
      {children}
      <Button variant="teal" size="xl" fullWidth disabled={saveDisabled} onClick={onSave}>
        <Icon name="check" size={20} /> Save event
      </Button>
    </div>
  </div>
);

Object.assign(window, { ReadingLogger, LearningLogger, MealLogger, FocusLogger, LoggerShell, NotesField });
