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

function HudNeonPulse({ speed, rpm, gear, rangeKm, units, theme, throttle }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba15 = useMemo(() => hexToRgba(currentTheme.primary, 0.15), [currentTheme.primary]);
  const themeRgba30 = useMemo(() => hexToRgba(currentTheme.primary, 0.3), [currentTheme.primary]);
  const themeRgba60 = useMemo(() => hexToRgba(currentTheme.primary, 0.6), [currentTheme.primary]);

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const rpmPercentage = Math.min(1, Math.max(0, rpm / 6500));

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  // Concentric ring properties
  const cx = 130;
  const cy = 130;
  const outerR = 100;
  const midR = 85;
  const innerR = 70;
  const dashArrayOuter = 2 * Math.PI * outerR;
  const dashArrayMid = 2 * Math.PI * midR;

  return (
    <div className="relative flex items-center justify-center w-full select-none">
      {/* RPM Pulse Card */}
      <div 
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-l-[2rem] rounded-r-[0.8rem] bg-black -mr-5 z-10 flex flex-col justify-between p-3 pl-4 relative overflow-hidden border"
        style={{ borderColor: themeRgba30, boxShadow: `0 0 20px ${themeRgba15}, inset 0 0 30px ${themeRgba15}` }}
      >
        <div style={{ backgroundColor: themeRgba30 }} className="absolute -left-10 -top-10 w-32 h-32 rounded-full blur-[30px] pointer-events-none" />
        {/* Pulse effect bar based on throttle */}
        <div 
          className="absolute bottom-0 left-0 right-0 opacity-20"
          style={{ height: `${throttle * 100}%`, backgroundColor: currentTheme.primary, transition: 'height 100ms ease-out' }}
        />
        <div className="flex flex-col z-10">
          <span className="text-[11px] md:text-xs font-black tracking-wider text-white">PULSE RPM</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1 z-10">
          <span className="text-2xl md:text-[1.85rem] font-black font-mono tracking-tight text-white drop-shadow-[0_0_8px_currentColor]" style={{ color: currentTheme.primary }}>
            {(rpm / 1000).toFixed(1)}
          </span>
        </div>
      </div>

      {/* CENTER DIAL */}
      <div 
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-[#05050a] flex flex-col items-center justify-center overflow-hidden border border-white/10"
        style={{ boxShadow: `0 0 40px ${themeRgba30}, inset 0 0 40px ${themeRgba30}` }}
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          {/* Static tracks */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#111" strokeWidth="4" />
          <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#111" strokeWidth="4" />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1a1a24" strokeWidth="1" strokeDasharray="4 4" />

          {/* Speed Ring */}
          <circle 
            cx={cx} cy={cy} r={outerR} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="4" 
            strokeDasharray={dashArrayOuter}
            strokeDashoffset={dashArrayOuter * (1 - speedPercentage)}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_currentColor]"
            style={{ transition: 'stroke-dashoffset 100ms linear', transformOrigin: 'center', transform: 'rotate(90deg)' }}
          />

          {/* RPM Ring */}
          <circle 
            cx={cx} cy={cy} r={midR} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="4" 
            strokeDasharray={dashArrayMid}
            strokeDashoffset={dashArrayMid * (1 - rpmPercentage)}
            strokeLinecap="round"
            className="drop-shadow-[0_0_6px_currentColor] opacity-60"
            style={{ transition: 'stroke-dashoffset 100ms linear', transformOrigin: 'center', transform: 'rotate(90deg)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none">
          <span className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: currentTheme.primary }}>
            {displaysUnit}
          </span>
          <span className="text-5xl font-black font-sans tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {displaySpeed}
          </span>
          <span className="text-xl font-black font-mono mt-1" style={{ color: currentTheme.primary, textShadow: `0 0 10px ${themeRgba60}` }}>
            {gear}
          </span>
        </div>
      </div>

      {/* Range Card */}
      <div 
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-r-[2rem] rounded-l-[0.8rem] bg-black -ml-5 z-10 flex flex-col justify-between p-3 pr-4 relative overflow-hidden border"
        style={{ borderColor: themeRgba30, boxShadow: `0 0 20px ${themeRgba15}, inset 0 0 30px ${themeRgba15}` }}
      >
        <div style={{ backgroundColor: themeRgba30 }} className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[30px] pointer-events-none" />
        <div className="flex flex-col text-right z-10">
          <span className="text-[11px] md:text-xs font-black tracking-wider text-white">RANGE</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-end pl-1 z-10">
          <span className="text-2xl md:text-[1.85rem] font-black font-mono tracking-tight text-white drop-shadow-[0_0_8px_currentColor]" style={{ color: currentTheme.primary }}>
            {displayRange}
          </span>
          <span className="text-[9px] font-bold text-slate-400 font-mono mt-1">{rangeUnit}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(HudNeonPulse);
