// App.jsx — root navigation shell, responsive layout

const App = () => {
  // Persisted nav state
  const [tab,       setTab]       = React.useState(() => localStorage.getItem('ol_tab') || 'home');
  const [screen,    setScreen]    = React.useState('main');
  const [screenData,setScreenData]= React.useState(null);
  const [refreshKey,setRefreshKey]= React.useState(0);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);
  const [tweaksOn,  setTweaksOn]  = React.useState(false);
  const [darkMode,  setDarkMode]  = React.useState(() => DB.getSettings().darkMode || false);
  const [addEvent,    setAddEvent]    = React.useState(false);
  const [customLogger, setCustomLogger] = React.useState(null);
  const [activeLogger, setActiveLogger] = React.useState(null); // 'reading'|'learning'|'meal'|'focus'

  // Tweaks protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode')   setTweaksOn(true);
      if (e.data?.type === '__deactivate_edit_mode')  setTweaksOn(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Responsive breakpoint
  React.useEffect(() => {
    const ro = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', ro);
    return () => window.removeEventListener('resize', ro);
  }, []);

  // Apply dark mode on mount + change
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  }, [darkMode]);

  const navigate = (tabId) => {
    setTab(tabId);
    localStorage.setItem('ol_tab', tabId);
  };

  const refresh = () => setRefreshKey(k => k + 1);

  // ── Screen transitions ──────────────────────────────────────────────────────
  const startRoutine = (routine) => {
    setScreenData({ routine });
    setScreen('workout');
  };

  const startBlank = () => {
    setScreenData({ routine: null });
    setScreen('workout');
  };

  const finishWorkout = (session) => {
    setScreenData({ session });
    setScreen('finish');
    refresh();
  };

  const newRoutine = () => {
    setScreenData({ routine: null });
    setScreen('editRoutine');
  };

  const editRoutine = (routine) => {
    setScreenData({ routine });
    setScreen('editRoutine');
  };

  const backToMain = () => {
    setScreen('main');
    setScreenData(null);
    refresh();
  };

  // ── Content area ────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (screen === 'workout') return (
      <WorkoutScreen
        routine={screenData?.routine}
        onBack={backToMain}
        onFinish={finishWorkout} />
    );
    if (screen === 'finish') return (
      <FinishScreen session={screenData?.session} onDone={backToMain} />
    );
    if (screen === 'editRoutine') return (
      <EditRoutineScreen
        routine={screenData?.routine}
        onSave={backToMain}
        onDelete={backToMain}
        onBack={backToMain} />
    );
    // main screens
    if (tab === 'home') return (
      <HomeScreen
        refreshKey={refreshKey}
        onStartRoutine={startRoutine}
        onStartBlank={startBlank}
        onNewRoutine={newRoutine}
        onEditRoutine={editRoutine}
        onGoSettings={() => navigate('settings')} />
    );
    if (tab === 'history') return <HistoryScreen refreshKey={refreshKey} />;
    if (tab === 'progress') return <ProgressScreen refreshKey={refreshKey} />;
    if (tab === 'settings') return (
      <SettingsScreen onSettingsChange={() => {
        setDarkMode(DB.getSettings().darkMode || false);
        refresh();
      }} />
    );
    return null;
  };

  const showNav = screen === 'main';

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--color-background)' }}>

      {/* Desktop side nav */}
      {isDesktop && showNav && (
        <SideNav current={tab} onChange={navigate} onAddEvent={() => setAddEvent(true)} />
      )}

      {/* Main content column */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        maxWidth: isDesktop ? 480 : '100%',
        margin: isDesktop ? '0 auto' : 0,
        height: '100vh',
        position: isDesktop ? 'sticky' : 'relative',
        top: 0,
        overflow: 'hidden',
      }}>
        {/* App chrome */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          background:'var(--color-background)',
          boxShadow: isDesktop ? 'var(--shadow-md)' : 'none',
          overflow:'hidden',
          backgroundImage: showNav
            ? 'radial-gradient(ellipse 100% 40% at 50% 0%, var(--warm-100), transparent 70%)'
            : 'none',
          height: showNav ? 'calc(100vh - 60px)' : '100vh',
        }}>
          {renderContent()}
        </div>

        {/* Mobile bottom tab bar */}
        {!isDesktop && showNav && (
          <TabBar current={tab} onChange={navigate} onAddEvent={() => setAddEvent(true)} />
        )}
      </div>

      {/* Tweaks panel */}
      {tweaksOn && (
        <div style={{
          position:'fixed', bottom:20, right:20, zIndex:500,
          background:'var(--color-card)', border:'1px solid var(--color-border)',
          borderRadius:16, padding:16, boxShadow:'var(--shadow-lg)',
          fontFamily:'var(--font-sans)', minWidth:220,
        }}>
          <div style={{ fontSize:11,fontWeight:800,letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--color-muted-foreground)',marginBottom:12 }}>
            Tweaks
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Toggle value={darkMode} onChange={(v) => {
              setDarkMode(v);
              DB.saveSettings({ darkMode:v });
              window.parent.postMessage({ type:'__edit_mode_set_keys', edits:{ darkMode:v } }, '*');
            }} label="Dark mode" />
            <div>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:6 }}>Default rest</div>
              <div style={{ display:'flex', gap:6 }}>
                {[30, 60, 90, 'reps'].map(s => {
                  const cur = DB.getSettings().restSeconds;
                  return (
                    <button key={s} onClick={() => { DB.saveSettings({restSeconds:s}); refresh(); }} style={{
                      flex:1, minHeight:36, borderRadius:10, fontFamily:'inherit', fontWeight:700,
                      fontSize:12, cursor:'pointer', transition:'all 150ms',
                      border: cur===s ? '2px solid var(--hue-teal)' : '1px solid var(--color-border)',
                      background: cur===s ? 'var(--hue-teal-wash)' : 'var(--color-card)',
                      color: cur===s ? 'var(--hue-teal-ink)' : 'var(--color-foreground)',
                    }}>{s === 'reps' ? '= reps' : `${s}s`}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Event sheet */}
      {addEvent && (
        <AddEventSheet
          onClose={() => setAddEvent(false)}
          onWorkout={() => { setAddEvent(false); startBlank(); }}
          onCustom={(type) => { setAddEvent(false); setCustomLogger(type); }}
          onNewCustom={() => { setAddEvent(false); setCustomLogger('new'); }}
          onModule={(mod) => { setAddEvent(false); setActiveLogger(mod); }}
        />
      )}

      {/* Custom event logger */}
      {customLogger && (
        <CustomEventLogger
          initialType={customLogger === 'new' ? null : customLogger}
          onSave={(event) => { DB.saveEvent(event); setCustomLogger(null); refresh(); }}
          onClose={() => setCustomLogger(null)}
        />
      )}

      {/* Structured event loggers */}
      {activeLogger === 'reading'  && <ReadingLogger  onSave={ev => { DB.saveEvent({...ev, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString()}); setActiveLogger(null); refresh(); }} onClose={() => setActiveLogger(null)} />}
      {activeLogger === 'learning' && <LearningLogger onSave={ev => { DB.saveEvent({...ev, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString()}); setActiveLogger(null); refresh(); }} onClose={() => setActiveLogger(null)} />}
      {activeLogger === 'meal'     && <MealLogger     onSave={ev => { DB.saveEvent({...ev, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString()}); setActiveLogger(null); refresh(); }} onClose={() => setActiveLogger(null)} />}
      {activeLogger === 'focus'    && <FocusLogger    onSave={ev => { DB.saveEvent({...ev, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString()}); setActiveLogger(null); refresh(); }} onClose={() => setActiveLogger(null)} />}
    </div>
  );
};

window.WorkoutApp = App;
