import { useState, Dispatch, SetStateAction } from 'react';
import { User, ShieldAlert, Cpu, CircleCheck, Eye, Compass, HardDrive, Palette } from 'lucide-react';
import { DriverProfile, MapTheme } from '../types';
import { THEMES } from '../utils';

interface SettingsProps {
  profile: DriverProfile;
  setProfile: Dispatch<SetStateAction<DriverProfile>>;
  resetTelemetry: () => void;
}

export default function Settings({ profile, setProfile, resetTelemetry }: SettingsProps) {
  const currentTheme = THEMES[profile.theme];
  const [successMsg, setSuccessMsg] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  const handleNameChange = (val: string) => {
    setProfile(prev => ({ ...prev, name: val }));
  };

  const handleCarModelChange = (val: string) => {
    setProfile(prev => ({ ...prev, carModel: val }));
    triggerToast(`Switched Model to ${val}`);
  };

  const handleTransmissionChange = (val: 'AUTO' | 'MANUAL') => {
    setProfile(prev => ({ ...prev, transmission: val }));
    triggerToast(`Transmission style updated to ${val}`);
  };

  const handleUnitsChange = (val: 'METRIC' | 'IMPERIAL') => {
    setProfile(prev => ({ ...prev, units: val }));
    triggerToast(`Cockpit measurement scales converted to ${val}`);
  };

  const handleThemeChange = (val: any) => {
    setProfile(prev => ({ ...prev, theme: val }));
    triggerToast(`Cluster backlight color updated to ${val.toUpperCase()}`);
  };

  return (
    <div id="settings_screen" className="flex flex-col flex-1 px-4 pt-4 pb-10 select-none animate-fadeIn">
      
      {/* PROFILE SETTINGS COUPE */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 mb-5">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-4 font-mono flex items-center space-x-2">
          <User className="w-4 h-4 text-sky-400" />
          <span>Config Active Driver Profile</span>
        </h3>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Driver Greeting Identifier</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-black/80 border border-white/10 rounded-xl px-3 h-11 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="E.g., Hayk Hayrapetyan"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Vehicle Model Trim</label>
            <select
              value={profile.carModel}
              onChange={(e) => handleCarModelChange(e.target.value)}
              className="bg-black/80 border border-white/10 rounded-xl px-3 h-11 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              <option value="E39 530i">BMW E39 530i (Inline-6 M54)</option>
              <option value="E39 M5">BMW E39 M5 (32-Valve V8 S62)</option>
              <option value="E39 540i">BMW E39 540i (Alusil V8 M62)</option>
              <option value="E39 525i">BMW E39 525i (Classic Inline-6 M54)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CLUSTER VISUAL Backlight SELECTOR */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 mb-5">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-4 font-mono flex items-center space-x-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>Custom Backlight Theme Modes</span>
        </h3>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Classic Blue Theme */}
          <button
            onClick={() => handleThemeChange('blue')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between duration-100 transition-all select-none cursor-pointer h-20 ${
              profile.theme === 'blue' 
                ? 'border-sky-500 bg-sky-500/5' 
                : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <span className="text-xs font-bold text-slate-200">M-Sport Neon Blue</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_turquoise]" />
              <span className="text-[9px] font-mono text-slate-400">Digital Turquoise</span>
            </div>
          </button>

          {/* Classic Orange Backlight */}
          <button
            onClick={() => handleThemeChange('amber')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between duration-100 transition-all select-none cursor-pointer h-20 ${
              profile.theme === 'amber' 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <span className="text-xs font-bold text-slate-200">Classic E39 Amber</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_orange]" />
              <span className="text-[9px] font-mono text-slate-400">Authentic BMW Retro</span>
            </div>
          </button>

          {/* Aggressive Red Backlight */}
          <button
            onClick={() => handleThemeChange('red')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between duration-100 transition-all select-none cursor-pointer h-20 ${
              profile.theme === 'red' 
                ? 'border-red-500 bg-red-500/5' 
                : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <span className="text-xs font-bold text-slate-200">Motorsport Red</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
              <span className="text-[9px] font-mono text-slate-400">M Performance Vibe</span>
            </div>
          </button>

          {/* Eco Green theme */}
          <button
            onClick={() => handleThemeChange('green')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between duration-100 transition-all select-none cursor-pointer h-20 ${
              profile.theme === 'green' 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <span className="text-xs font-bold text-slate-200">Electric Acid Green</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_lime]" />
              <span className="text-[9px] font-mono text-slate-400">Neon Energy</span>
            </div>
          </button>
        </div>
      </div>

      {/* COCKPIT HARDWARE CALIBRATORS */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 mb-5">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-4 font-mono flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Calibrate Hardware Metrics</span>
        </h3>

        {/* Transmission select button toggle */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">Transmission Style</span>
            <span className="text-[9.5px] text-slate-400 font-sans mt-0.5">Automated shifts vs sequential manual gears</span>
          </div>

          <div className="flex bg-black rounded-lg p-0.5 border border-white/5">
            <button
              onClick={() => handleTransmissionChange('AUTO')}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-mono font-bold transition-all select-none cursor-pointer ${
                profile.transmission === 'AUTO' ? 'bg-sky-500/10 text-sky-450 border border-sky-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              AUTO
            </button>
            <button
              onClick={() => handleTransmissionChange('MANUAL')}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-mono font-bold transition-all select-none cursor-pointer ${
                profile.transmission === 'MANUAL' ? 'bg-sky-500/10 text-sky-450 border border-sky-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              MANUAL (1-5)
            </button>
          </div>
        </div>

        {/* Metric vs Imperial selector */}
        <div className="flex items-center justify-between py-3.5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">Measurement scales</span>
            <span className="text-[9.5px] text-slate-400 font-sans mt-0.5">Scale gauges inside KM/H vs MPH scales</span>
          </div>

          <div className="flex bg-black rounded-lg p-0.5 border border-white/5">
            <button
              onClick={() => handleUnitsChange('METRIC')}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-mono font-bold transition-all select-none cursor-pointer ${
                profile.units === 'METRIC' ? 'bg-sky-500/10 text-sky-455 border border-sky-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              METRIC (KM)
            </button>
            <button
              onClick={() => handleUnitsChange('IMPERIAL')}
              className={`px-3 py-1.5 rounded-md text-[10.5px] font-mono font-bold transition-all select-none cursor-pointer ${
                profile.units === 'IMPERIAL' ? 'bg-sky-500/10 text-sky-455 border border-sky-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              IMPERIAL (MI)
            </button>
          </div>
        </div>
      </div>

      {/* FACTORY RESET CALIBRATOR BAR */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-3 font-mono">
          Erase Telemetry
        </h3>
        <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
          Reset local trip logs, baseline modifications, and calibration variables back to pristine factory configurations.
        </p>
        <button
          onClick={() => {
            resetTelemetry();
            triggerToast('Telemetry recalibrated successfully.');
          }}
          className="w-full h-11 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 select-none text-red-400 font-bold border border-red-500/20 text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer duration-100"
        >
          RESET VEHICLE FACTORY STATUS
        </button>
      </div>

      {/* Dynamic Success notifications */}
      {successMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-950 border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center space-x-2 z-50 text-white shadow-2xl animate-bounce">
          <CircleCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">{successMsg}</span>
        </div>
      )}

    </div>
  );
}
