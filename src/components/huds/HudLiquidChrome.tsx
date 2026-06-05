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

function HudLiquidChrome({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba40 = useMemo(() => hexToRgba(currentTheme.primary, 0.4), [currentTheme.primary]);
  const themeRgba80 = useMemo(() => hexToRgba(currentTheme.primary, 0.8), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  
  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  
  const cx = 130;
  const cy = 130;
  const r = 100;
  const dash = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center w-full select-none">
      
      {/* Liquid Chrome Center Dial */}
      <div 
        className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full relative z-20 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.2),_0_20px_50px_rgba(0,0,0,0.8)]"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #3a3b40, #121318 60%, #050508 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Specular highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />
        <div className="absolute top-2 left-[15%] w-[70%] h-[30%] bg-gradient-to-b from-white/10 to-transparent rounded-[100%] pointer-events-none opacity-50" />

        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          <defs>
            <filter id="liquid-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="liquid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="50%" stopColor={currentTheme.primary} />
              <stop offset="100%" stopColor={themeRgba40} />
            </linearGradient>
          </defs>

          {/* Liquid Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke="url(#liquid-grad)" 
            strokeWidth="12" 
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - speedPercentage)}
            strokeLinecap="round"
            filter="url(#liquid-glow)"
            style={{ transition: 'stroke-dashoffset 100ms ease-in-out' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-[12px] font-semibold tracking-[0.2em] text-white/60 mb-2 uppercase">{displaysUnit}</span>
          <span className="text-6xl font-light text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: `0 0 20px ${themeRgba80}` }}>{displaySpeed}</span>
          <span className="text-sm font-semibold text-white/80 tracking-widest mt-2">{gear}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(HudLiquidChrome);
