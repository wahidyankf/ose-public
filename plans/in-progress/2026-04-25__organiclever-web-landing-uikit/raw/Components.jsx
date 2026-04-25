// Components.jsx — shared UI building blocks for OrganicLever

// ── Shared helpers ────────────────────────────────────────────────────────────
const fmtTime = (secs) => {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
};

// ── Button ────────────────────────────────────────────────────────────────────
const Button = ({ children, variant='default', size='md', leading, trailing,
  fullWidth=false, onClick, disabled, style={} }) => {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    borderRadius:12, fontFamily:'inherit', fontWeight:700, border:'1px solid transparent',
    cursor: disabled?'not-allowed':'pointer', transition:'all 150ms',
    whiteSpace:'nowrap', opacity: disabled?0.45:1, width: fullWidth?'100%':'auto',
    WebkitTapHighlightColor:'transparent',
  };
  const sizes = {
    sm:   { minHeight:36, padding:'0 14px', fontSize:14 },
    md:   { minHeight:44, padding:'0 18px', fontSize:15 },
    lg:   { minHeight:52, padding:'0 24px', fontSize:17 },
    xl:   { minHeight:60, padding:'0 28px', fontSize:18, borderRadius:16 },
    icon: { minHeight:44, width:44, padding:0, borderRadius:12 },
  };
  const variants = {
    default:     { background:'var(--color-primary)', color:'var(--color-primary-foreground)' },
    destructive: { background:'var(--color-destructive)', color:'#fff' },
    outline:     { background:'var(--color-card)', color:'var(--color-foreground)', borderColor:'var(--color-border)', boxShadow:'var(--shadow-xs)' },
    secondary:   { background:'var(--color-secondary)', color:'var(--color-secondary-foreground)' },
    ghost:       { background:'transparent', color:'var(--color-foreground)' },
    teal:        { background:'var(--hue-teal)', color:'#fff' },
    sage:        { background:'var(--hue-sage)', color:'#fff' },
  };
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style,
        transform: pressed && !disabled ? 'scale(0.97)' : 'none' }}>
      {leading}{children}{trailing}
    </button>
  );
};

// ── AppHeader ─────────────────────────────────────────────────────────────────
const AppHeader = ({ title, subtitle, onBack, trailing }) => (
  <div style={{ padding:'16px 16px 10px', display:'flex', alignItems:'center', gap:10 }}>
    {onBack && (
      <button onClick={onBack} style={{
        width:40, height:40, borderRadius:12, border:0, background:'var(--color-secondary)',
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        color:'var(--color-foreground)', flexShrink:0,
      }}>
        <Icon name="arrow-left" size={20} />
      </button>
    )}
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.015em', lineHeight:1.2,
        textWrap:'pretty', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
      {subtitle && <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>{subtitle}</div>}
    </div>
    {trailing}
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit, hue='teal', icon, info }) => (
  <div style={{
    background: 'var(--color-card)',
    borderRadius: 20, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 8, minHeight: 96,
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ width:36, height:36, borderRadius:12, background:`var(--hue-${hue})`, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={20} />
      </div>
      {info && <InfoTip title={label} text={info} />}
    </div>
    <div>
      <div style={{ fontSize:24, fontWeight:800, color:'var(--color-foreground)',
        letterSpacing:'-0.015em', lineHeight:1, fontFamily:'var(--font-mono)' }}>
        {value}<span style={{ fontSize:13, fontWeight:700, marginLeft:4,
          fontFamily:'var(--font-sans)', color:'var(--color-muted-foreground)' }}>{unit}</span>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--color-muted-foreground)', marginTop:4 }}>{label}</div>
    </div>
  </div>
);

// ── RoutineCard ───────────────────────────────────────────────────────────────
const RoutineCard = ({ routine, onOpen, onEdit }) => {
  const { name, hue='teal', groups=[] } = routine;
  const exCount = (groups).reduce((n,g) => n+(g.exercises?.length||0), 0);
  const [pressed, setPressed] = React.useState(false);
  return (
    <div style={{ display:'flex', borderRadius:20, boxShadow:'var(--shadow-sm)', overflow:'hidden',
      border:'1px solid var(--color-border)' }}>
      <button onClick={onOpen}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
        style={{ flex:1, display:'grid', gridTemplateColumns:'52px 1fr 20px', gap:12, alignItems:'center',
          padding:14, background:'var(--color-card)', border:0, textAlign:'left', cursor:'pointer',
          fontFamily:'inherit', color:'var(--color-foreground)', transition:'transform 150ms',
          transform: pressed ? 'scale(0.98)' : 'none', WebkitTapHighlightColor:'transparent' }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`var(--hue-${hue})`, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name="dumbbell" size={24} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:16, letterSpacing:'-0.01em',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
          <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:3,
            display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6,
              background:`var(--hue-${hue}-wash)`, color:`var(--hue-${hue}-ink)`,
              letterSpacing:'.04em', textTransform:'uppercase' }}>
              {routine.type || 'workout'}
            </span>
            <span>{exCount} exercise{exCount!==1?'s':''}</span>
            <span style={{ width:3,height:3,borderRadius:'50%',background:'var(--warm-300)',flexShrink:0 }}/>
            <span>{groups.length} group{groups.length!==1?'s':''}</span>
          </div>
        </div>
        <Icon name="chevron-right" size={18} style={{ color:'var(--color-muted-foreground)' }} />
      </button>
      {onEdit && (
        <button onClick={onEdit} style={{
          width:48, background:'var(--color-card)', border:0, borderLeft:'1px solid var(--color-border)',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--color-muted-foreground)', flexShrink:0, transition:'background 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background='var(--color-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background='var(--color-card)'}>
          <Icon name="pencil" size={17} />
        </button>
      )}
    </div>
  );
};

// ── TabBar (mobile) ─────────────────────────────────────────────────────────
const TabBar = ({ current, onChange, onAddEvent }) => {
  return (
    <div style={{ height:64, borderTop:'1px solid var(--color-border)', display:'flex',
      background:'var(--color-card)', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom,0)',
      alignItems:'stretch' }}>
      {[{ id:'home',     label:t('home'),     icon:'home'    },
        { id:'progress', label:t('progress'), icon:'trend'   }].map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, border:0, background:'transparent', cursor:'pointer', fontFamily:'inherit',
          color: current===tab.id ? 'var(--hue-teal)' : 'var(--color-muted-foreground)',
          fontSize:10, fontWeight: current===tab.id ? 700 : 500, transition:'color 150ms',
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon name={tab.icon} size={22} filled={current===tab.id} />
          {tab.label}
        </button>
      ))}

      {/* Centre + */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <button onClick={onAddEvent} style={{
          width:52, height:52, borderRadius:16, border:0,
          background:'var(--hue-teal)', color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', boxShadow:'0 4px 16px oklch(68% 0.10 195 / 0.35)',
          transition:'transform 150ms', WebkitTapHighlightColor:'transparent', marginBottom:6,
        }}
          onMouseDown={e=>e.currentTarget.style.transform='scale(0.90)'}
          onMouseUp={e=>e.currentTarget.style.transform=''}
          onMouseLeave={e=>e.currentTarget.style.transform=''}
          onTouchStart={e=>e.currentTarget.style.transform='scale(0.90)'}
          onTouchEnd={e=>e.currentTarget.style.transform=''}>
          <Icon name="plus" size={26} />
        </button>
      </div>

      {[{ id:'history',  label:t('history'),  icon:'history'  },
        { id:'settings', label:t('settings'), icon:'settings' }].map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, border:0, background:'transparent', cursor:'pointer', fontFamily:'inherit',
          color: current===tab.id ? 'var(--hue-teal)' : 'var(--color-muted-foreground)',
          fontSize:10, fontWeight: current===tab.id ? 700 : 500, transition:'color 150ms',
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon name={tab.icon} size={22} filled={current===tab.id} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ── SideNav (desktop) ─────────────────────────────────────────────────────────
const SideNav = ({ current, onChange, onAddEvent }) => {
  const tabs = [
    { id:'home',     label: t('home'),     icon:'home'     },
    { id:'history',  label: t('history'),  icon:'history'  },
    { id:'progress', label: t('progress'), icon:'trend'    },
    { id:'settings', label: t('settings'), icon:'settings' },
  ];
  return (
    <div style={{ width:220, borderRight:'1px solid var(--color-border)', background:'var(--color-card)',
      display:'flex', flexDirection:'column', padding:'20px 12px', gap:2, flexShrink:0 }}>
      <div style={{ padding:'4px 12px 20px', display:'flex', flexDirection:'column', gap:2 }}>
        <button onClick={() => onChange('home')} style={{
          display:'flex', alignItems:'center', gap:10, padding:'6px 0',
          border:0, background:'transparent', cursor:'pointer', fontFamily:'inherit', width:'100%', textAlign:'left',
        }}>
          <div style={{ width:32,height:32,borderRadius:10,background:'var(--hue-teal)',color:'#fff',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Icon name="zap" size={18} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.015em', color:'var(--color-foreground)', lineHeight:1 }}>OrganicLever</div>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--color-muted-foreground)', marginTop:2 }}>Life event tracker</div>
          </div>
        </button>
      </div>
      {onAddEvent && (
        <button onClick={onAddEvent} style={{
          display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12,
          border:0, background:'var(--hue-teal)', color:'#fff',
          fontFamily:'inherit', fontSize:15, fontWeight:700,
          cursor:'pointer', textAlign:'left', marginBottom:12,
          boxShadow:'var(--shadow-xs)', letterSpacing:'-0.01em',
        }}>
          <Icon name="plus" size={20} />
          Log event
        </button>
      )}
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12,
          border:0, background: current===tab.id ? 'var(--hue-teal-wash)' : 'transparent',
          color: current===tab.id ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
          fontFamily:'inherit', fontSize:15, fontWeight: current===tab.id ? 700 : 500,
          cursor:'pointer', textAlign:'left', transition:'all 150ms',
        }}>
          <Icon name={tab.icon} size={20} filled={current===tab.id} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ── TextInput ─────────────────────────────────────────────────────────────────
const TextInput = ({ label, value, onChange, type='text', placeholder, min, max, step,
  small=false, style={}, inputStyle={} }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
    {label && <label style={{ fontSize:13, fontWeight:600, color:'var(--color-foreground)' }}>{label}</label>}
    <input
      type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max} step={step}
      style={{
        height: small ? 36 : 44, borderRadius:12, border:'1px solid var(--color-border)',
        background:'var(--color-card)', padding:'0 12px', fontFamily:'var(--font-sans)',
        fontSize: small ? 14 : 15, fontWeight:500, color:'var(--color-foreground)',
        outline:'none', width:'100%', boxSizing:'border-box', ...inputStyle,
      }}
      onFocus={e => e.target.style.boxShadow='0 0 0 3px oklch(68% 0.10 195 / 0.3)'}
      onBlur={e => e.target.style.boxShadow=''}
    />
  </div>
);

// ── HuePicker ─────────────────────────────────────────────────────────────────
const HUES = ['terracotta','honey','sage','teal','sky','plum'];
const HuePicker = ({ value, onChange }) => (
  <div style={{ display:'flex', gap:8 }}>
    {HUES.map(h => (
      <button key={h} onClick={() => onChange(h)} title={h} style={{
        width:32, height:32, borderRadius:10, border:0, background:`var(--hue-${h})`,
        cursor:'pointer', outline: value===h ? '3px solid var(--color-foreground)' : '2px solid transparent',
        outlineOffset:2, transition:'all 150ms',
      }} />
    ))}
  </div>
);

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
    {label && <span style={{ fontSize:15, fontWeight:500 }}>{label}</span>}
    <button onClick={() => onChange(!value)} style={{
      width:48, height:28, borderRadius:14, border:0, cursor:'pointer',
      background: value ? 'var(--hue-teal)' : 'var(--warm-200)',
      position:'relative', transition:'background 200ms', flexShrink:0,
    }}>
      <span style={{
        position:'absolute', top:3, left: value ? 23 : 3, width:22, height:22,
        borderRadius:11, background:'#fff', transition:'left 200ms', boxShadow:'var(--shadow-xs)',
      }} />
    </button>
  </div>
);

// ── ProgressRing (SVG circle for rest timer) ──────────────────────────────────
const ProgressRing = ({ size=80, stroke=6, progress=1, color='var(--hue-teal)', bg='var(--warm-100)' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear, stroke 300ms' }} />
    </svg>
  );
};

// ── Sheet (bottom sheet overlay) ──────────────────────────────────────────────
const Sheet = ({ children, onClose, title }) => (
  <div style={{
    position:'fixed', inset:0, zIndex:200,
    background:'oklch(14% 0.01 60 / 0.45)',
    display:'flex', alignItems:'flex-end', justifyContent:'center',
    animation:'fadeIn 150ms ease-out',
  }} onClick={e => e.target===e.currentTarget && onClose()}>
    <div style={{
      width:'100%', maxWidth:480, background:'var(--color-card)',
      borderRadius:'24px 24px 0 0', padding:'20px 20px calc(20px + env(safe-area-inset-bottom,0))',
      boxShadow:'var(--shadow-lg)', display:'flex', flexDirection:'column', gap:14,
      animation:'slideUp 200ms ease-out',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {title && <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.015em' }}>{title}</div>}
        <button onClick={onClose} style={{ width:36,height:36,borderRadius:10,border:0,
          background:'var(--color-secondary)',cursor:'pointer',display:'flex',
          alignItems:'center',justifyContent:'center',color:'var(--color-muted-foreground)',marginLeft:'auto' }}>
          <Icon name="x" size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── InfoTip — ⓘ button that opens a bottom sheet explanation ─────────────────
const InfoTip = ({ title, text }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        title={title}
        style={{
          width: 20, height: 20, borderRadius: '50%', border: 0, padding: 0,
          background: 'var(--color-secondary)', color: 'var(--color-muted-foreground)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'background 150ms',
          verticalAlign: 'middle',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hue-sky-wash)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-secondary)'}
      >
        <Icon name="info" size={13} />
      </button>
      {open && (
        <Sheet title={title} onClose={() => setOpen(false)}>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-foreground)',
            fontWeight: 400 }}>
            {text}
          </div>
          <Button variant="outline" size="md" fullWidth onClick={() => setOpen(false)}>
            Got it
          </Button>
        </Sheet>
      )}
    </>
  );
};

Object.assign(window, { fmtTime, Button, AppHeader, StatCard, RoutineCard, TabBar, SideNav,
  TextInput, HuePicker, HUES, Toggle, ProgressRing, Sheet, InfoTip });
