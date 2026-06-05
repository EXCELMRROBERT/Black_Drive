import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc, Settings2, Hammer, ShieldCheck, Cpu, Gauge, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';
import { DriverProfile, CarSpecs } from '../types';
import { UPGRADE_ITEMS, INITIAL_CAR_SPECS, OBD_CODES, THEMES } from '../utils';

interface GarageProps {
  profile: DriverProfile;
  specs: CarSpecs;
  setSpecs: Dispatch<SetStateAction<CarSpecs>>;
  setSimulation: any;
}

export default function Garage({ profile, specs, setSpecs, setSimulation }: GarageProps) {
  const currentTheme = THEMES[profile.theme];
  const [activeUpgrades, setActiveUpgrades] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);

  // Toggle virtual modification install
  const handleToggleUpgrade = (upgradeId: string, hpGain: number, torqueGain: number, speedGain: number, type: string) => {
    const isInstalled = activeUpgrades.includes(upgradeId);
    let newUpgrades: string[];
    
    if (isInstalled) {
      newUpgrades = activeUpgrades.filter(id => id !== upgradeId);
    } else {
      newUpgrades = [...activeUpgrades, upgradeId];
    }
    
    setActiveUpgrades(newUpgrades);

    // Calculate dynamic spec increases
    const hasEcu = newUpgrades.includes('upgrade-1');
    const hasExhaust = newUpgrades.includes('upgrade-2');
    const hasIntake = newUpgrades.includes('upgrade-3');

    setSpecs({
      ...INITIAL_CAR_SPECS,
      hp: INITIAL_CAR_SPECS.hp + (hasEcu ? 18 : 0) + (hasExhaust ? 11 : 0) + (hasIntake ? 8 : 0),
      torque: INITIAL_CAR_SPECS.torque + (hasEcu ? 22 : 0) + (hasExhaust ? 10 : 0) + (hasIntake ? 7 : 0),
      topSpeed: INITIAL_CAR_SPECS.topSpeed + (hasEcu ? 12 : 0) + (hasExhaust ? 4 : 0) + (hasIntake ? 2 : 0),
      zeroToHundred: Number((INITIAL_CAR_SPECS.zeroToHundred - (hasEcu ? 0.4 : 0) - (hasExhaust ? 0.2 : 0) - (hasIntake ? 0.15 : 0)).toFixed(2)),
      ecuStage: hasEcu ? 1 : 0,
      exhaustUpgraded: hasExhaust,
      intakeUpgraded: hasIntake,
    });
  };

  // Run Simulated OBD-II Diagnostic Sweep
  const runDiagnostic = () => {
    setIsScanning(true);
    setScanCompleted(false);
    setScanProgress(0);
    setDiagnosticLog([]);

    const modules = ['Engine DME Module', 'ABS/ASC Dynamic Controls', 'Double-VANOS Timing Solenoids', 'DISA Intake Control Valve', 'Oxygen O2 Sensor Arrays'];
    let currentModuleIndex = 0;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const nextProgress = prev + 4;
        
        // Push message periodically on sweeps
        if (nextProgress % 20 === 0 && currentModuleIndex < modules.length) {
          setDiagnosticLog(prevLogs => [...prevLogs, `Pinging ${modules[currentModuleIndex]}... ACTIVE`]);
          currentModuleIndex++;
        }

        if (nextProgress >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanCompleted(true);
          setDiagnosticLog(prevLogs => [...prevLogs, 'OBD-II Diagnostic Sweep Complete. Status: 100% HEALTHY.']);
          return 100;
        }
        return nextProgress;
      });
    }, 100);
  };

  return (
    <div id="garage_screen" className="flex flex-col flex-1 px-4 pt-4 pb-10 select-none">
      
      {/* GARAGE TITLE */}
      <div className="bg-slate-950/80 border border-white/5 p-4 rounded-3xl shadow-xl flex items-center space-x-3.5 mb-5 backdrop-blur-md">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Hammer className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold uppercase font-mono tracking-wider text-white">E39 PERFORMANCE PORT</h2>
          <span className="text-[10px] text-slate-400 font-mono">Telemetry upgrade port & DME flash center</span>
        </div>
      </div>

      {/* HORSEPOWER / COUPE PERFORMANCES GRAPH */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 mb-5 select-none">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-4 font-mono flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Simulated Engine Blueprint specs</span>
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase font-mono text-slate-500">Horsepower</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {specs.hp} <span className="text-xs font-sans text-slate-400">bHP</span>
            </div>
            {/* Visual indicator relative to max possible upgraded hp (approx 280) */}
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${currentTheme.bg}`}
                style={{ width: `${(specs.hp / 280) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase font-mono text-slate-500">Max Torque</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {specs.torque} <span className="text-xs font-sans text-slate-400">Nm</span>
            </div>
            {/* Visual indicator relative to max torque */}
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${currentTheme.bg}`}
                style={{ width: `${(specs.torque / 350) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase font-mono text-slate-500">0 - 100 KM/H Sprint</span>
            <div className="text-2xl font-bold font-mono text-white mt-1_5">
              {specs.zeroToHundred} <span className="text-xs font-sans text-slate-400">sec</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1 font-mono">Lighter is Faster</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase font-mono text-slate-500">Sim Top Speed</span>
            <div className="text-2xl font-bold font-mono text-white mt-1_5">
              {specs.topSpeed} <span className="text-xs font-sans text-slate-400">KM/H</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1 font-mono">Aerodynamics capped</span>
          </div>
        </div>
      </div>

      {/* PERFORMANCE MODIFICATION ITEMS FEED */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase font-mono flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Power Upgrades (Flash & bolt-ons)</span>
          </h3>
          <span className="text-[9.5px] font-mono text-slate-500 uppercase">Interactive specs modifier</span>
        </div>

        <div className="flex flex-col space-y-3">
          {UPGRADE_ITEMS.map((item) => {
            const isInstalled = activeUpgrades.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => handleToggleUpgrade(item.id, item.hpGain, item.torqueGain, item.topSpeedGain, item.type)}
                className={`p-4 rounded-2xl border bg-slate-950/50 transition-all cursor-pointer flex items-start gap-3.5 hover:bg-slate-950 select-none ${
                  isInstalled 
                    ? 'border-emerald-500/35 bg-emerald-500/5' 
                    : 'border-white/5'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isInstalled ? 'bg-emerald-500/10' : 'bg-slate-900'
                }`}>
                  <Settings2 className={`w-4.5 h-4.5 ${isInstalled ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                    <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                      isInstalled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {isInstalled ? 'INSTALLED' : 'EQUIP PART'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Dynamic metric performance indicators */}
                  <div className="flex items-center space-x-3 mt-3 font-mono text-[10px]">
                    <span className="text-emerald-400">+{item.hpGain} HP</span>
                    <span className="text-emerald-400">+{item.torqueGain} Nm</span>
                    <span className="text-slate-400">Est. Cost: ${item.cost}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OBD-II DIAGNOSTIC SCAN TERMINAL */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase font-mono flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Digital DME / OBD-II Diagnosis Scan</span>
          </h3>
          <button
            onClick={runDiagnostic}
            disabled={isScanning}
            className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 text-sky-400 font-mono text-[10.5px] font-bold rounded-lg border border-sky-500/20 flex items-center space-x-1 duration-100 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'SCANNING...' : 'RUN DME SCAN'}</span>
          </button>
        </div>

        {/* Diagnostic Terminal View */}
        <div className="bg-black border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 min-h-[140px] flex flex-col justify-between">
          <div>
            {!isScanning && !scanCompleted && (
              <p className="text-slate-500 italic text-[11px]">
                No live scan records logged. Pull vehicle diagnostic scan from interface.
              </p>
            )}

            {isScanning && (
              <div className="flex flex-col space-y-2">
                <p className="text-sky-400 font-bold text-[11px] animate-pulse">Running full CAN-bus telemetry cycle...</p>
                {/* Simulated scan bar loading */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-400 duration-100 transition-all"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Print scanning console outputs */}
            <div className="flex flex-col space-y-1.5 mt-2 text-[10.5px] overflow-y-auto max-h-[120px]">
              {diagnosticLog.map((log, index) => (
                <p key={`log-${index}`} className="text-slate-400">
                  <span className="text-sky-400 pr-1.5">&gt;</span> {log}
                </p>
              ))}
            </div>

            {/* Diagnostic Codes Sheet once complete */}
            {scanCompleted && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-emerald-400 font-bold mb-2 flex items-center space-x-1.5 text-[11px]">
                  <span>OBD MODULE CODES - FULL PASS ENGINE OK</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  {OBD_CODES.map((code) => (
                    <div key={code.code} className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold">{code.code}</span>
                        <span className="text-[8.5px] uppercase text-emerald-500/80 px-1 bg-emerald-500/10 rounded">OK</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
                        {code.system}: {code.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
