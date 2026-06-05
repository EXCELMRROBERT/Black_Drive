import { useMemo, memo } from 'react';
import { THEMES } from '../../utils';
import { ThemeColor } from '../../types';

interface SpeedometerProps {
  speed: number;
  rpm: number;
  gear: string | number;
  rangeKm: number;
  units: 'METRIC' | 'IMPERIAL';
  theme: ThemeColor;
  throttle: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function HudCrystalPrism({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba10 = useMemo(() => hexToRgba(currentTheme.primary, 0.1), [currentTheme.primary]);
  const themeRgba40 = useMemo(() => hexToRgba(currentTheme.primary, 0.4), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  
  return (
    <div className="relative flex items-center justify-center w-full select-none">
      
      {/* Left Diamond */}
      <div 
        className="w-[120px] h-[120px] bg-gradient-to-br from-slate-800 to-black border border-white/20 absolute left-4 z-10 flex flex-col items-center justify-center rotate-45 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />
        <div className="absolute inset-1 border border-white/5" />
        <div className="-rotate-45 flex flex-col items-center">
          <span className="text-[9px] font-bold tracking-widest text-slate-400">RPM</span>
          <span className="text-xl font-bold text-white">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* Center Diamond */}
      <div 
        className="w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] bg-gradient-to-br from-slate-900 to-[#020202] border-2 relative z-20 flex flex-col items-center justify-center rotate-45 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{ borderColor: themeRgba40 }}
      >
        {/* Inner glow fill based on speed */}
        <div 
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ height: `${speedPercentage * 100}%`, backgroundColor: themeRgba10, transition: 'height 100ms ease-out' }}
        />
        <div className="absolute inset-2 border border-white/10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />
        
        <div className="-rotate-45 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: currentTheme.primary }}>{displaysUnit}</span>
          <span className="text-5xl sm:text-6xl font-light text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">{displaySpeed}</span>
          <span className="text-sm font-bold text-white px-3 border-b-2 mt-2 pb-1" style={{ borderBottomColor: currentTheme.primary }}>GEAR {gear}</span>
        </div>
      </div>

      {/* Right Diamond */}
      <div 
        className="w-[120px] h-[120px] bg-gradient-to-bl from-slate-800 to-black border border-white/20 absolute right-4 z-10 flex flex-col items-center justify-center rotate-45 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent to-white/10 pointer-events-none" />
        <div className="absolute inset-1 border border-white/5" />
        <div className="-rotate-45 flex flex-col items-center">
          <span className="text-[9px] font-bold tracking-widest text-slate-400">RANGE</span>
          <span className="text-xl font-bold text-white">{displayRange}</span>
        </div>
      </div>

    </div>
  );
}

export default memo(HudCrystalPrism);
