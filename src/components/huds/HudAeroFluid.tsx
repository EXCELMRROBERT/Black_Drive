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

function HudAeroFluid({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;
  const themeRgba60 = useMemo(() => hexToRgba(currentTheme.primary, 0.6), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  
  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none py-4">
      
      {/* Top Aero Arc */}
      <div className="w-[300px] h-[60px] relative overflow-hidden mb-2">
        <svg viewBox="0 0 300 60" className="absolute inset-0 w-full h-full">
          <path d="M 10,50 Q 150,-20 290,50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" strokeLinecap="round" />
          <path 
            d="M 10,50 Q 150,-20 290,50" 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="6" 
            strokeDasharray="320"
            strokeDashoffset={320 * (1 - speedPercentage)}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${themeRgba60})`, transition: 'stroke-dashoffset 100ms ease-out' }}
          />
        </svg>
      </div>

      {/* Center Numeric Stack */}
      <div className="flex flex-col items-center z-10 relative px-12 py-4 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-[100%]">
        <span className="text-[12px] font-medium tracking-[0.3em] text-white/50 uppercase">{displaysUnit}</span>
        <span className="text-7xl font-extralight tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] my-2">
          {displaySpeed}
        </span>
        <div className="flex items-center space-x-6 text-sm font-light tracking-widest text-slate-300">
          <span className="flex flex-col items-center">RPM <b className="text-lg font-normal text-white">{(rpm / 1000).toFixed(1)}</b></span>
          <span className="w-px h-8 bg-white/20" />
          <span className="flex flex-col items-center">GEAR <b className="text-lg font-bold" style={{ color: currentTheme.primary }}>{gear}</b></span>
          <span className="w-px h-8 bg-white/20" />
          <span className="flex flex-col items-center">RNG <b className="text-lg font-normal text-white">{displayRange}</b></span>
        </div>
      </div>

      {/* Bottom Aero Arc */}
      <div className="w-[300px] h-[60px] relative overflow-hidden mt-2">
        <svg viewBox="0 0 300 60" className="absolute inset-0 w-full h-full">
          <path d="M 10,10 Q 150,80 290,10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeLinecap="round" />
          <path 
            d="M 10,10 Q 150,80 290,10" 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="2" 
            strokeDasharray="320"
            strokeDashoffset={320 * (1 - speedPercentage)}
            strokeLinecap="round"
            style={{ opacity: 0.5, transition: 'stroke-dashoffset 100ms ease-out' }}
          />
        </svg>
      </div>

    </div>
  );
}

export default memo(HudAeroFluid);
