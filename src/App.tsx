import { useState, useEffect, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gauge, 
  MapPin, 
  Clock, 
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';
import { DriverProfile, SimulationState, ThemeColor } from './types';
import { THEMES } from './utils';

// Components
import Dashboard from './components/Dashboard';
import Map from './components/Map';
import History from './components/History';
import StartupSequence from './components/StartupSequence';

const themeGlowRgb: Record<ThemeColor, string> = {
  blue: '0, 210, 255',
  amber: '255, 161, 0',
  red: '239, 68, 68',
  green: '52, 199, 89',
  yellow: '250, 204, 21',
  purple: '175, 82, 222',
  white: '255, 255, 255',
  carbon: '243, 244, 246',
};

export default function App() {
  const [showStartup, setShowStartup] = useState(true);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MAP' | 'HISTORY'>('DASHBOARD');
  const [showSettings, setShowSettings] = useState(false);

  // Load profile state with setter to dynamically manage styling context
  const [profile, setProfile] = useState<DriverProfile>({
    name: 'Hayk Hayrapetyan',
    carModel: 'E39 530i',
    transmission: 'AUTO',
    units: 'METRIC',
    theme: 'blue', // matches mockup blue, can be toggled to BMW Amber!
    mapTheme: 'DARK_MINIMAL',
    gpsMode: true,
  });

  const setTheme = (newTheme: ThemeColor) => {
    setProfile(prev => ({ ...prev, theme: newTheme }));
  };

  // Initialize simulation with values from the mockup to create an outstanding matching first look!
  const [simulation, setSimulation] = useState<SimulationState>({
    isActive: true,
    speed: 132, // matches mockup speed!
    rpm: 3800,  // matches mockup RPM (3.8 x1000)
    gear: 4,    // matches mockup gear
    rangeKm: 130, // matches mockup fuel gauge range
    tripKm: 124.8, // matches mockup TRIP A
    odoKm: 245678, // matches mockup ODO readout
    throttle: 0.3,
    isBraking: false,
    fuelPct: 0.45,
  });

  const resetTelemetry = () => {
    setSimulation({
      isActive: true,
      speed: 0,
      rpm: 700,
      gear: 1,
      rangeKm: 310,
      tripKm: 0,
      odoKm: 245678,
      throttle: 0,
      isBraking: false,
      fuelPct: 0.85,
    });
  };

  // Handle manual shifts directly
  const handleShiftUp = () => {
    if (profile.transmission === 'MANUAL' && simulation.gear < 5) {
      setSimulation(prev => ({
        ...prev,
        gear: prev.gear + 1,
        rpm: Math.max(1200, Math.round(prev.rpm * 0.65)), // RPM shift drop
      }));
    }
  };

  const handleShiftDown = () => {
    if (profile.transmission === 'MANUAL' && simulation.gear > 1) {
      setSimulation(prev => ({
        ...prev,
        gear: prev.gear - 1,
        rpm: Math.min(6500, Math.round(prev.rpm * 1.45)), // RPM shift bump
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent text-slate-100 font-sans flex items-center justify-center overflow-hidden selection:bg-cyan-500/30">
      
      {/* MAIN CONTAINER CHASSIS - Becomes invisible/full-screen in MAP mode */}
      <div 
        style={{ 
          '--glow-rgb': themeGlowRgb[profile.theme],
        } as CSSProperties}
        className="transition-all duration-500 flex flex-col overflow-hidden relative w-full h-full border-0 lg:rounded-none lg:shadow-none"
      >
        <AnimatePresence>
          {showStartup && (
            <motion.div 
              key="startup-layer" 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.8 }} 
              className="absolute inset-0 z-[100] rounded-[inherit] overflow-hidden"
            >
              <StartupSequence onComplete={() => setShowStartup(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* TOP OVERALL NAVIGATION AND MACHINE INFORMATION HEADER */}
        {activeTab !== 'MAP' && (
          <header className="flex items-center justify-between px-3 py-1 sm:py-1.5 md:px-5 lg:px-6 select-none shrink-0 bg-slate-950/40 border-b border-white/5 backdrop-blur-md relative z-40">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-5">
              <span className="text-[14px] sm:text-base font-extrabold tracking-tight text-white font-sans whitespace-nowrap">
                {profile.name}
              </span>
              
              <div className="h-3.5 w-px bg-white/10 hidden xs:block" />

              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {[
                  { id: 'red', color: 'bg-red-500' },
                  { id: 'blue', color: 'bg-cyan-400' },
                  { id: 'purple', color: 'bg-purple-500' },
                  { id: 'white', color: 'bg-white' },
                  { id: 'yellow', color: 'bg-yellow-500' },
                  { id: 'green', color: 'bg-emerald-500' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as ThemeColor)}
                    className="p-1.5 -m-1 rounded-full cursor-pointer"
                    title={`${t.id} theme`}
                  >
                    <span className={`block w-2.5 h-2.5 rounded-full ${t.color} border border-white/20 hover:scale-125 transition-transform ${profile.theme === t.id ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-black' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* INTEGRATED TAB SELECTOR SYSTEM */}
            <div className="flex items-center bg-slate-900/60 border border-white/10 rounded-full p-0.5 space-x-0.5 shadow-xl text-[9px] uppercase font-mono tracking-widest font-bold">
              <button 
                onClick={() => setActiveTab('DASHBOARD')} 
                className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${activeTab === 'DASHBOARD' ? 'bg-slate-800 border border-white/5 shadow-md font-black' : 'text-slate-500 hover:text-slate-300'}`}
                style={activeTab === 'DASHBOARD' ? { color: THEMES[profile.theme].primary } : {}}
              >
                <span>Dash</span>
              </button>
              <button 
                onClick={() => setActiveTab('MAP')} 
                className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${activeTab === 'MAP' ? 'bg-slate-800 border border-white/5 shadow-md font-black' : 'text-slate-500 hover:text-slate-300'}`}
                style={activeTab === 'MAP' ? { color: THEMES[profile.theme].primary } : {}}
              >
                <span>Map</span>
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')} 
                className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${activeTab === 'HISTORY' ? 'bg-slate-800 border border-white/5 shadow-md font-black' : 'text-slate-500 hover:text-slate-300'}`}
                style={activeTab === 'HISTORY' ? { color: THEMES[profile.theme].primary } : {}}
              >
                <span>History</span>
              </button>
            </div>

            {/* INTEGRATED CAR MODEL SPEC & RETRO ROUNDEL */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/50 border border-white/5 py-1 px-2 md:px-2.5 rounded-xl hover:bg-slate-900/80 active:scale-95 transition-all text-left cursor-pointer group"
              title="Open Dashboard Settings"
            >
              <svg viewBox="0 0 100 100" className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 shrink-0 select-none filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                <defs>
                  <path id="bmw_text_path_app" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
                  <linearGradient id="chrome_border_app" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="50%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#chrome_border_app)" />
                <circle cx="50" cy="50" r="45.5" fill="#090d16" />
                <text fill="#ffffff" className="font-sans font-black text-[12px] tracking-[6px] select-none" textAnchor="middle">
                  <textPath href="#bmw_text_path_app" startOffset="50%">BMW</textPath>
                </text>
                <circle cx="50" cy="50" r="28" fill="url(#chrome_border_app)" />
                <circle cx="50" cy="50" r="26.2" fill="#090d16" />
                <path d="M 50,50 L 50,23.8 A 26.2,26.2 0 0,0 23.8,50 Z" className="fill-sky-400" />
                <path d="M 50,50 L 23.8,50 A 26.2,26.2 0 0,0 50,76.2 Z" className="fill-white" />
                <path d="M 50,50 L 50,76.2 A 26.2,26.2 0 0,0 76.2,50 Z" className="fill-sky-400" />
                <path d="M 50,50 L 76.2,50 A 26.2,26.2 0 0,0 50,23.8 Z" className="fill-white" />
              </svg>
              <div className="flex flex-col hidden xs:flex">
                <h2 className="text-[10px] sm:text-xs font-bold text-sky-450 group-hover:text-sky-300 transition-colors tracking-tight leading-none uppercase">
                  {profile.carModel}
                </h2>
                <span className="text-[6.5px] uppercase tracking-wider text-slate-500 mt-0.5 font-mono">
                  SETTINGS
                </span>
              </div>
            </button>
          </header>
        )}

        {/* CORE SCREEN SWITCH INJECTOR */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'DASHBOARD' && (
            <Dashboard
              profile={profile}
              setProfile={setProfile}
              simulation={simulation}
              setSimulation={setSimulation}
              setTheme={setTheme}
              triggerStartup={() => setShowStartup(true)}
              isStartupActive={showStartup}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
            />
          )}

          {activeTab === 'MAP' && (
            <Map
              profile={profile}
              simulation={simulation}
              setProfile={setProfile}
              onBack={() => setActiveTab('DASHBOARD')}
            />
          )}

          {activeTab === 'HISTORY' && (
            <History
              profile={profile}
              simulation={simulation}
              setSimulation={setSimulation}
            />
          )}
        </div>

        {/* SEQUENTIAL GEAR MANUAL SHIFT TRIGGER OVERLAYS (ONLY IF VEHICLE IS MANUAL MODE & ON DASHBOARD) */}
        {profile.transmission === 'MANUAL' && activeTab === 'DASHBOARD' && (
          <div className="fixed bottom-24 right-4 lg:absolute lg:bottom-28 lg:right-4 flex flex-col space-y-2 z-40">
            <button
              onClick={handleShiftUp}
              title="Shift Gear Up"
              className="w-11 h-11 rounded-full bg-slate-900/90 border border-white/10 flex items-center justify-center active:scale-90 cursor-pointer shadow-xl text-emerald-400 hover:text-emerald-300"
            >
              <ChevronsUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleShiftDown}
              title="Shift Gear Down"
              className="w-11 h-11 rounded-full bg-slate-900/90 border border-white/10 flex items-center justify-center active:scale-90 cursor-pointer shadow-xl text-rose-400 hover:text-rose-300"
            >
              <ChevronsDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* COCKPIT BOTTOM TAB BAR SYSTEM */}
        {activeTab !== 'MAP' && (
          <nav
            className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-white/5 py-1.5 px-3 grid grid-cols-3 z-40 shrink-0 select-none"
            style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
          >
            
            {/* DASHBOARD TAB BUTTON */}
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none"
            >
              <div className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-slate-900/60 text-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.1)] border border-cyan-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
                <Gauge className="w-4.5 h-4.5" />
                <span className="text-[8px] uppercase font-mono tracking-widest mt-0.5 font-bold">
                  Dashboard
                </span>
              </div>
            </button>

            {/* MAP NAVIGATION BUTTON */}
            <button 
              onClick={() => setActiveTab('MAP')}
              className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none"
            >
              <div className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'MAP' 
                  ? 'bg-slate-900/60 text-sky-450 shadow-[0_0_12px_rgba(0,210,255,0.1)] border border-cyan-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
                <MapPin className="w-4.5 h-4.5" />
                <span className="text-[8px] uppercase font-mono tracking-widest mt-0.5 font-bold">
                  Map
                </span>
              </div>
            </button>

            {/* HISTORY PERFORMANCE BOOK */}
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none"
            >
              <div className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'HISTORY' 
                  ? 'bg-slate-900/60 text-sky-450 shadow-[0_0_12px_rgba(0,210,255,0.1)] border border-cyan-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
                <Clock className="w-4.5 h-4.5" />
                <span className="text-[8px] uppercase font-mono tracking-widest mt-0.5 font-bold">
                  History
                </span>
              </div>
            </button>

          </nav>
        )}
      </div>

    </div>
  );
}
