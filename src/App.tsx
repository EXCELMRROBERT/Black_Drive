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

  // Load profile state with setter to dynamically manage styling context
  const [profile, setProfile] = useState<DriverProfile>({
    name: 'Hayk Hayrapetyan',
    carModel: 'E39 530i',
    transmission: 'AUTO',
    units: 'METRIC',
    theme: 'blue', // matches mockup blue, can be toggled to BMW Amber!
    mapTheme: 'DARK_MINIMAL',
    gpsMode: false,
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
    <div className={`fixed inset-0 bg-black text-slate-100 font-sans flex items-center justify-center ${activeTab === 'MAP' ? 'p-0' : 'p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:p-6'} overflow-hidden selection:bg-cyan-500/30`}>
      
      {/* MAIN CONTAINER CHASSIS - Becomes invisible/full-screen in MAP mode */}
      <div 
        style={{ '--glow-rgb': themeGlowRgb[profile.theme] } as CSSProperties}
        className={`transition-all duration-500 flex flex-col overflow-hidden relative ${
          activeTab === 'MAP' 
            ? 'w-full h-full lg:w-full lg:h-full lg:rounded-none lg:border-0 lg:shadow-none' 
            : 'w-full h-full border-t border-[rgba(var(--glow-rgb),0.3)] lg:w-[480px] lg:landscape:w-[960px] lg:max-w-none lg:h-[880px] lg:landscape:h-[600px] lg:max-h-[920px] lg:rounded-[42px] lg:border-4 lg:border-[rgba(var(--glow-rgb),0.6)] lg:shadow-[0_0_80px_rgba(var(--glow-rgb),0.35),inset_0_0_20px_rgba(var(--glow-rgb),0.15)]'
        }`}
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
        
        {/* TOP COCKPIT SPEAKER CAMERA PORT DECORATOR (HIDDEN IN MAP) */}
        {activeTab !== 'MAP' && (
          <div className="hidden lg:flex justify-center absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-50">
            <div className="w-12 h-1 bg-black rounded-full mt-1.5" />
            <div className="w-2.5 h-2.5 bg-[#141517] rounded-full ml-3 mt-1" />
          </div>
        )}

        {/* TOP FLOATING NAV (LANDSCAPE ONLY) */}
        {activeTab !== 'MAP' && (
          <div className="hidden landscape:flex absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-full py-1 px-2 space-x-1 h-fit shadow-2xl">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${activeTab === 'DASHBOARD' ? 'bg-slate-900 shadow-[0_0_12px_rgba(0,210,255,0.2)] border border-cyan-500/30 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <span className="text-[9px] uppercase font-mono tracking-widest font-bold">Dash</span>
            </button>
            <button onClick={() => setActiveTab('MAP')} className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${activeTab === 'MAP' ? 'bg-slate-900 shadow-[0_0_12px_rgba(0,210,255,0.2)] border border-cyan-500/30 text-sky-450' : 'text-slate-500 hover:text-slate-300'}`}>
              <span className="text-[9px] uppercase font-mono tracking-widest font-bold">Map</span>
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`flex items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${activeTab === 'HISTORY' ? 'bg-slate-900 shadow-[0_0_12px_rgba(0,210,255,0.2)] border border-cyan-500/30 text-sky-450' : 'text-slate-500 hover:text-slate-300'}`}>
              <span className="text-[9px] uppercase font-mono tracking-widest font-bold">History</span>
            </button>
          </div>
        )}

        {/* CORE SCREEN SWITCH INJECTOR */}
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'MAP' ? 'mt-0' : 'mt-1 sm:mt-2 lg:mt-6'}`}>
          {activeTab === 'DASHBOARD' && (
            <Dashboard
              profile={profile}
              setProfile={setProfile}
              simulation={simulation}
              setSimulation={setSimulation}
              setTheme={setTheme}
              triggerStartup={() => setShowStartup(true)}
              isStartupActive={showStartup}
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
          <nav className="landscape:hidden sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-white/5 py-1.5 px-3 grid grid-cols-3 z-40 shrink-0 select-none">
            
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
