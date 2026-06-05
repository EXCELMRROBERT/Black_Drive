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

function HudMinimalGlass({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba10 = useMemo(() => hexToRgba(currentTheme.primary, 0.1), [currentTheme.primary]);
  const themeRgba30 = useMemo(() => hexToRgba(currentTheme.primary, 0.3), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));

  const cx = 130;
  const cy = 130;
  const r = 110;
  const dashArray = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center w-full select-none gap-2 px-4">
      {/* RPM Glass Card */}
      <div 
        className="flex-[0.8] min-w-0 h-[120px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-center items-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase mb-2">RPM</span>
        <span className="text-3xl font-light tracking-tight text-white">{(rpm / 1000).toFixed(1)}</span>
      </div>

      {/* CENTER DIAL GLASS */}
      <div 
        className="w-[180px] h-[180px] xs:w-[200px] xs:h-[200px] rounded-full relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 rounded-full border-[6px] border-white/5 pointer-events-none" />
        
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="3" 
            strokeDasharray={dashArray}
            strokeDashoffset={dashArray * (1 - speedPercentage)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 100ms ease-out', filter: `drop-shadow(0 0 8px ${themeRgba30})` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">{displaysUnit}</span>
          <span className="text-6xl font-extralight tracking-tighter text-white my-1">{displaySpeed}</span>
          <div className="px-4 py-1 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
            <span className="text-sm font-semibold" style={{ color: currentTheme.primary }}>{gear}</span>
          </div>
        </div>
      </div>

      {/* Range Glass Card */}
      <div 
        className="flex-[0.8] min-w-0 h-[120px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-center items-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
        <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase mb-2">RANGE {rangeUnit}</span>
        <span className="text-3xl font-light tracking-tight text-white">{displayRange}</span>
      </div>
    </div>
  );
}

export default memo(HudMinimalGlass);
