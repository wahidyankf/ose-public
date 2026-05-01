// CustomEvents.jsx — AddEventSheet + CustomEventLogger

const ICON_OPTIONS = ['zap','clock','flame','trend','calendar','user','dumbbell','timer','book','heart','star','check-circle'];
// Add heart/star icons to Icon.jsx fallback — they'll use the default circle if not found

// ── AddEventSheet ─────────────────────────────────────────────────────────────
const AddEventSheet = ({ onClose, onWorkout, onCustom, onNewCustom, onModule }) => {
  const [customTypes, setCustomTypes] = React.useState(() => DB.getCustomTypes());

  // All built-in event types — equally weighted. Workout is one of many.
  const BUILTINS = [
    { id:'workout', label:'Workout',  icon:'dumbbell', hue:'teal',       desc:'Sets, reps, time or distance',     onClick: onWorkout },
    { id:'reading', label:'Reading',  icon:'book',     hue:'plum',       desc:'Log a book or reading session',    onClick: () => onModule('reading')  },
    { id:'learning',label:'Learning', icon:'zap',      hue:'honey',      desc:'Log a course or skill session',    onClick: () => onModule('learning') },
    { id:'meal',    label:'Meal',     icon:'flame',    hue:'terracotta', desc:'Log what you ate or drank',        onClick: () => onModule('meal')     },
    { id:'focus',   label:'Focus',    icon:'timer',    hue:'sky',        desc:'Log a deep work block',            onClick: () => onModule('focus')    },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300,
      background:'oklch(14% 0.01 60 / 0.45)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
      animation:'fadeIn 150ms ease-out',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:480,
        background:'var(--color-card)', borderRadius:'24px 24px 0 0',
        padding:'20px 20px calc(20px + env(safe-area-inset-bottom,0))',
        boxShadow:'var(--shadow-lg)', animation:'slideUp 200ms ease-out',
        maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.015em' }}>Log an event</div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:0,
            background:'var(--color-secondary)', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginBottom:14 }}>
          Pick a type to log — or create your own.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

          {/* Built-in event types — Workout is one of many */}
          {BUILTINS.map(m => (
            <button key={m.id} onClick={m.onClick} style={{
              display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
              borderRadius:16, border:'1px solid var(--color-border)',
              background:`var(--hue-${m.hue}-wash)`, cursor:'pointer',
              fontFamily:'inherit', textAlign:'left', transition:'all 150ms', width:'100%',
            }}>
              <div style={{ width:44, height:44, borderRadius:13, background:`var(--hue-${m.hue})`,
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={m.icon} size={22} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:15, color:`var(--hue-${m.hue}-ink)` }}>{m.label}</div>
                <div style={{ fontSize:13, color:`var(--hue-${m.hue}-ink)`, opacity:0.75, marginTop:2 }}>{m.desc}</div>
              </div>
              <Icon name="chevron-right" size={18} style={{ color:`var(--hue-${m.hue}-ink)`, opacity:0.5 }} />
            </button>
          ))}

          {/* Saved custom types */}
          {customTypes.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
                color:'var(--color-muted-foreground)', padding:'10px 4px 2px' }}>My custom events</div>
              {customTypes.map(ct => (
                <button key={ct.id} onClick={() => onCustom(ct)} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
                  borderRadius:16, border:'1px solid var(--color-border)',
                  background:`var(--hue-${ct.hue}-wash)`, cursor:'pointer',
                  fontFamily:'inherit', textAlign:'left', transition:'all 150ms', width:'100%',
                }}>
                  <div style={{ width:44, height:44, borderRadius:13, background:`var(--hue-${ct.hue})`,
                    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon name={ct.icon || 'zap'} size={22} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:`var(--hue-${ct.hue}-ink)` }}>{ct.name}</div>
                    <div style={{ fontSize:13, color:`var(--hue-${ct.hue}-ink)`, opacity:0.7, marginTop:2 }}>
                      Custom event
                    </div>
                  </div>
                  <Icon name="chevron-right" size={18} style={{ color:`var(--hue-${ct.hue}-ink)`, opacity:0.5 }} />
                </button>
              ))}
            </>
          )}

          {/* New custom event */}
          <button onClick={onNewCustom} style={{
            display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
            borderRadius:16, border:'2px dashed var(--color-border)',
            background:'transparent', cursor:'pointer',
            fontFamily:'inherit', textAlign:'left', transition:'all 150ms', width:'100%', marginTop:4,
          }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--hue-plum)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--color-border)'; }}>
            <div style={{ width:44, height:44, borderRadius:13, background:'var(--color-secondary)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="plus" size={22} style={{ color:'var(--color-muted-foreground)' }} />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15 }}>New custom event</div>
              <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>
                Define your own event type and log it
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── CustomEventLogger ─────────────────────────────────────────────────────────
const CustomEventLogger = ({ initialType, onSave, onClose }) => {
  const isNew = !initialType;
  const [name,       setName]       = React.useState(initialType?.name || '');
  const [hue,        setHue]        = React.useState(initialType?.hue  || 'sage');
  const [icon,       setIcon]       = React.useState(initialType?.icon || 'zap');
  const [durationMins, setDurationMins] = React.useState('');
  const [notes,      setNotes]      = React.useState('');
  const [saveType,   setSaveType]   = React.useState(isNew); // save as reusable type?
  const [saving,     setSaving]     = React.useState(false);

  const handleLog = () => {
    if (!name.trim()) return;
    setSaving(true);

    // Optionally save as reusable custom type
    let typeId = initialType?.id;
    if (saveType && !typeId) {
      const t = DB.saveCustomType({ name: name.trim(), hue, icon });
      typeId = t.id;
    }

    const now = new Date().toISOString();
    const finishedAt = durationMins
      ? new Date(new Date(now).getTime() + Number(durationMins) * 60000).toISOString()
      : now;

    onSave({
      type:       'custom',
      startedAt:  now,
      finishedAt,
      labels:     ['custom', name.trim(), ...(typeId ? [typeId] : [])],
      payload: {
        typeId:       typeId || null,
        name:         name.trim(),
        hue,
        icon,
        durationMins: durationMins ? Number(durationMins) : null,
        notes:        notes.trim() || null,
      },
    });
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:310,
      background:'oklch(14% 0.01 60 / 0.50)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
      animation:'fadeIn 150ms ease-out',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:480,
        background:'var(--color-card)', borderRadius:'24px 24px 0 0',
        padding:'20px 20px calc(28px + env(safe-area-inset-bottom,0))',
        boxShadow:'var(--shadow-lg)', animation:'slideUp 200ms ease-out',
        display:'flex', flexDirection:'column', gap:14 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.015em' }}>
            {isNew ? 'New custom event' : `Log: ${name}`}
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:0,
            background:'var(--color-secondary)', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)' }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Name */}
        {isNew && (
          <TextInput label="Event name" value={name} onChange={setName}
            placeholder="e.g. Evening walk, Cold shower, Meditation" />
        )}

        {/* Color + icon (only for new) */}
        {isNew && (
          <>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Color</div>
              <HuePicker value={hue} onChange={setHue} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Icon</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)} style={{
                    width:40, height:40, borderRadius:10, border:'1px solid',
                    borderColor: icon===ic ? `var(--hue-${hue})` : 'var(--color-border)',
                    background: icon===ic ? `var(--hue-${hue}-wash)` : 'var(--color-card)',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    color: icon===ic ? `var(--hue-${hue}-ink)` : 'var(--color-muted-foreground)',
                    transition:'all 150ms',
                  }}>
                    <Icon name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Preview for existing type */}
        {!isNew && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
            background:`var(--hue-${hue}-wash)`, borderRadius:14 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:`var(--hue-${hue})`,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={icon} size={22} />
            </div>
            <div style={{ fontWeight:800, fontSize:16, color:`var(--hue-${hue}-ink)` }}>{name}</div>
          </div>
        )}

        {/* Duration */}
        <TextInput label="Duration (minutes, optional)" type="number"
          value={durationMins} onChange={setDurationMins} placeholder="e.g. 30" min="1" />

        {/* Notes */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <label style={{ fontSize:13, fontWeight:600 }}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="How did it go? Anything worth noting..."
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

        {/* Save as reusable */}
        {isNew && (
          <Toggle value={saveType} onChange={setSaveType}
            label="Save as reusable event type" />
        )}

        <Button variant="teal" size="xl" fullWidth disabled={!name.trim() || saving}
          onClick={handleLog}>
          <Icon name="check" size={20} /> Log event
        </Button>
      </div>
    </div>
  );
};

Object.assign(window, { AddEventSheet, CustomEventLogger });
