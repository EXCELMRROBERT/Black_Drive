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

function HudTitaniumCore({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba40 = useMemo(() => hexToRgba(currentTheme.primary, 0.4), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const cx = 130;
  const cy = 130;
  const r = 90;

  return (
    <div className="relative flex items-center justify-center w-full select-none gap-6">
      
      {/* Heavy Metal Left Plaque */}
      <div className="w-[80px] h-[100px] bg-gradient-to-br from-[#4a4c52] to-[#212328] rounded-[4px] border border-[#6b6e78] shadow-[0_10px_20px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center relative">
        <div className="absolute inset-1 border border-black/30 rounded-[2px]" />
        <span className="text-[9px] font-bold tracking-widest text-[#a2a6b0] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">RPM</span>
        <span className="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] mt-1">{(rpm / 1000).toFixed(1)}</span>
      </div>

      {/* Titanium Center Hub */}
      <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full bg-gradient-to-b from-[#3a3c42] to-[#121318] border-4 border-[#111] shadow-[0_15px_30px_rgba(0,0,0,0.9),_inset_0_2px_5px_rgba(255,255,255,0.3)] relative z-20 flex flex-col items-center justify-center">
        
        {/* Inner brushed plate */}
        <div className="absolute inset-4 rounded-full bg-[#1b1c21] shadow-[inset_0_5px_15px_rgba(0,0,0,0.9)] border border-white/5 pointer-events-none" />

        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0a0a0d" strokeWidth="18" />
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="10" 
            strokeDasharray={2 * Math.PI * r}
            strokeDashoffset={(2 * Math.PI * r) * (1 - speedPercentage)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 100ms ease-out', filter: `drop-shadow(0 0 8px ${themeRgba40})` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-[10px] font-bold tracking-widest text-[#a2a6b0] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] mb-1">{displaysUnit}</span>
          <span className="text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">{displaySpeed}</span>
          <div className="bg-[#111] px-4 py-1 rounded-[2px] mt-2 border-t border-white/10 shadow-inner">
            <span className="text-sm font-black tracking-widest" style={{ color: currentTheme.primary }}>G{gear}</span>
          </div>
        </div>
      </div>

      {/* Heavy Metal Right Plaque */}
      <div className="w-[80px] h-[100px] bg-gradient-to-bl from-[#4a4c52] to-[#212328] rounded-[4px] border border-[#6b6e78] shadow-[0_10px_20px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center relative">
        <div className="absolute inset-1 border border-black/30 rounded-[2px]" />
        <span className="text-[9px] font-bold tracking-widest text-[#a2a6b0] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">RANGE</span>
        <span className="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] mt-1">{displayRange}</span>
      </div>

    </div>
  );
}

export default memo(HudTitaniumCore);
