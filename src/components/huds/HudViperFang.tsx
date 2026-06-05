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

function HudViperFang({ speed, rpm, gear, rangeKm, units, theme, throttle }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba20 = useMemo(() => hexToRgba(currentTheme.primary, 0.2), [currentTheme.primary]);
  const themeRgba50 = useMemo(() => hexToRgba(currentTheme.primary, 0.5), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  
  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const rpmPercentage = Math.min(1, Math.max(0, rpm / 6500));

  return (
    <div className="relative flex items-center justify-center w-full select-none">
      
      {/* RPM Fang (Left) */}
      <div 
        className="flex-1 min-w-0 h-[140px] bg-[#050505] border-r-0 relative z-10 flex flex-col justify-end p-4 text-left border"
        style={{ clipPath: 'polygon(0% 0%, 100% 15%, 100% 85%, 0% 100%)', borderColor: themeRgba50 }}
      >
        {/* Dynamic fill background */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-0"
          style={{ height: `${rpmPercentage * 100}%`, backgroundColor: themeRgba20, transition: 'height 100ms ease-out' }}
        />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">RPM</span>
          <span className="text-3xl font-black italic text-white leading-none">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* CENTER STEALTH CORE */}
      <div 
        className="w-[170px] h-[170px] sm:w-[200px] sm:h-[200px] bg-[#080808] relative z-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Angular Speed Bar inside Hexagon */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
           <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#222" strokeWidth="4" />
           <polygon 
             points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" 
             fill="none" 
             stroke={currentTheme.primary} 
             strokeWidth="4"
             strokeDasharray="270"
             strokeDashoffset={270 * (1 - speedPercentage)}
             style={{ transition: 'stroke-dashoffset 100ms linear', filter: `drop-shadow(0 0 6px ${currentTheme.primary})` }}
           />
        </svg>

        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">{displaysUnit}</span>
        <span className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] my-1">{displaySpeed}</span>
        <div className="bg-[#111] px-4 py-0.5 border-b-2" style={{ borderBottomColor: currentTheme.primary }}>
          <span className="text-lg font-black italic text-white">{gear}</span>
        </div>
      </div>

      {/* Speed Fang (Right) */}
      <div 
        className="flex-1 min-w-0 h-[140px] bg-[#050505] border-l-0 relative z-10 flex flex-col justify-end p-4 text-right border"
        style={{ clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)', borderColor: themeRgba50 }}
      >
        {/* Dynamic fill background based on throttle */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-0"
          style={{ height: `${throttle * 100}%`, backgroundColor: themeRgba20, transition: 'height 100ms ease-out' }}
        />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">RANGE</span>
          <span className="text-3xl font-black italic text-white leading-none">{displayRange}</span>
        </div>
      </div>

    </div>
  );
}

export default memo(HudViperFang);
