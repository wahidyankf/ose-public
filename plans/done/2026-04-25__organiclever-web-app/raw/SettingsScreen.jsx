// SettingsScreen.jsx — profile + preferences
const SettingsScreen = ({ onSettingsChange }) => {
  const [settings, setSettings] = React.useState(() => DB.getSettings());
  const [saved, setSaved] = React.useState(false);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    DB.saveSettings(next);
    if (patch.darkMode !== undefined) {
      document.documentElement.setAttribute('data-theme', next.darkMode ? 'dark' : '');
    }
    onSettingsChange?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'20px 20px 4px' }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.015em' }}>{t('settings')}</div>
      </div>

      <div style={{ padding:'12px 20px 40px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Avatar + name hero */}
        <div style={{ background:'var(--warm-50)', borderRadius:20, padding:20,
          display:'flex', alignItems:'center', gap:16, border:'1px solid var(--color-border)' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--color-foreground)',
            color:'var(--color-card)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, fontWeight:800, flexShrink:0 }}>
            {(settings.name||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:'-0.01em' }}>{settings.name||'—'}</div>
            <div style={{ fontSize:13, color:'var(--color-muted-foreground)', marginTop:2 }}>OrganicLever · local</div>
          </div>
        </div>

        {/* Profile settings */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)' }}>Profile</div>
          <TextInput label="Your name" value={settings.name||''} onChange={v => update({ name:v })}
            placeholder="e.g. Wahid" />
        </div>

        {/* Workout defaults */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)' }}>Workout defaults</div>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Default rest time</div>
            <InfoTip title="Default rest time"
              text={'How long to rest between sets. "= reps" uses each exercise\'s rep count as seconds — e.g. 20 reps → 20 s rest. Can be overridden per exercise in the routine editor.'} />
          </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['reps', 'reps2', 0, 30, 60, 90].map(s => (
                <button key={String(s)} onClick={() => update({ restSeconds: s })} style={{
                  minHeight:36, padding:'0 12px', borderRadius:10, fontFamily:'inherit',
                  fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 150ms',
                  border: settings.restSeconds===s ? '2px solid var(--hue-teal)' : '1px solid var(--color-border)',
                  background: settings.restSeconds===s ? 'var(--hue-teal-wash)' : 'var(--color-card)',
                  color: settings.restSeconds===s ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
                }}>
                  {s === 'reps' ? '= reps/duration' : s === 'reps2' ? '= 2\xD7 reps/duration' : s === 0 ? 'No rest' : `${s}s`}
                </button>
              ))}
            </div>
            <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:8 }}>
              "= reps" uses each exercise's rep count as the rest duration in seconds. Can be overridden per exercise in routine settings.
            </div>
          </div>
        </div>

        {/* Language */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)' }}>Language / Bahasa</div>
          <div style={{ display:'flex', gap:8 }}>
            {[['en','English'],['id','Bahasa']].map(([code, label]) => (
              <button key={code} onClick={() => {
                update({ lang: code });
                window.location.reload();
              }} style={{
                flex:1, minHeight:44, borderRadius:12, fontFamily:'inherit', fontWeight:700,
                fontSize:15, cursor:'pointer', transition:'all 150ms', border:'1px solid',
                borderColor: settings.lang===code||(code==='en'&&!settings.lang) ? 'var(--hue-teal)' : 'var(--color-border)',
                background: settings.lang===code||(code==='en'&&!settings.lang) ? 'var(--hue-teal-wash)' : 'var(--color-card)',
                color: settings.lang===code||(code==='en'&&!settings.lang) ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)' }}>Appearance</div>
          <Toggle value={settings.darkMode||false} onChange={v => update({ darkMode:v })} label="Dark mode" />
        </div>

        {/* Data */}
        <div style={{ background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:20, padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase',
            color:'var(--color-muted-foreground)' }}>Data</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>Stored locally</div>
              <div style={{ fontSize:12, color:'var(--color-muted-foreground)', marginTop:2 }}>
                All data lives on this device. Sync coming for paid accounts.
              </div>
            </div>
            <div style={{ width:36,height:36,borderRadius:10,background:'var(--hue-sage-wash)',
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon name="check-circle" size={18} style={{ color:'var(--hue-sage-ink)' }} />
            </div>
          </div>
        </div>

        {/* Save indicator */}
        {saved && (
          <div style={{ textAlign:'center', fontSize:13, color:'var(--hue-sage-ink)',
            fontWeight:600, animation:'fadeIn 150ms ease-out' }}>
            <Icon name="check" size={14} style={{ marginRight:4 }} />
            Saved
          </div>
        )}
      </div>
    </div>
  );
};

window.SettingsScreen = SettingsScreen;
