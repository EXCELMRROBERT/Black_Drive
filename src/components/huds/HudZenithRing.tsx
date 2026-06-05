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

function HudZenithRing({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba10 = useMemo(() => hexToRgba(currentTheme.primary, 0.1), [currentTheme.primary]);
  const themeRgba40 = useMemo(() => hexToRgba(currentTheme.primary, 0.4), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  
  const cx = 130;
  const cy = 130;
  const r = 118;
  const dash = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center w-full select-none">
      
      {/* Zen Minimal Dial */}
      <div className="w-[260px] h-[260px] relative z-20 flex flex-col items-center justify-center">
        
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          {/* Ultra thin tracking line */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="2" 
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - speedPercentage)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 100ms ease-out', filter: `drop-shadow(0 0 4px ${themeRgba40})` }}
          />

          {/* Minimal tick dots */}
          <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="1 30" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
          <span className="text-[9px] font-light tracking-[0.4em] text-slate-500 uppercase">{displaysUnit}</span>
          <span className="text-7xl font-extralight tracking-tighter text-white/90 my-2" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            {displaySpeed}
          </span>
          <div className="w-12 h-[1px] bg-white/10 mb-2" />
          <div className="flex w-full px-12 justify-between text-xs font-light tracking-widest text-slate-400">
            <span>RPM {(rpm / 1000).toFixed(1)}</span>
            <span style={{ color: currentTheme.primary, fontWeight: 'bold' }}>G{gear}</span>
            <span>RNG {displayRange}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(HudZenithRing);
