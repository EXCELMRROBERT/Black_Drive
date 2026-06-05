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

const cx = 130;
const cy = 130;
const radius = 100;

function HudLuxuryChrono({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba35 = useMemo(() => hexToRgba(currentTheme.primary, 0.35), [currentTheme.primary]);
  const themeRgba45 = useMemo(() => hexToRgba(currentTheme.primary, 0.45), [currentTheme.primary]);
  const themeRgba15 = useMemo(() => hexToRgba(currentTheme.primary, 0.15), [currentTheme.primary]);
  const themeRgba20 = useMemo(() => hexToRgba(currentTheme.primary, 0.20), [currentTheme.primary]);
  
  const capsuleBoxShadow = useMemo(() =>
    `inset 0 1px 4px rgba(255,255,255,0.05), inset 0 0 15px rgba(255,255,255,0.05), 0 12px 32px rgba(0,0,0,0.95), 0 0 18px ${currentTheme.glow}`,
    [currentTheme.glow]
  );

  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  // Total circumference
  const arcLength = 2 * Math.PI * radius;
  const dashOffset = arcLength * (1 - speedPercentage);

  return (
    <div id="gauge_panel" className="relative flex items-center justify-center w-full select-none">
      {/* 1. LEFT CAPSULE CARD */}
      <div
        id="rpm_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: 'rgba(255,255,255,0.1)' }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-l-full rounded-r-sm bg-gradient-to-r from-slate-800 to-slate-900 -mr-5 sm:-mr-6 md:-mr-8 z-10 flex flex-col justify-between p-3 pl-6 select-none text-left relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, #d4af37, #f3e5ab, #d4af37)` }} className="absolute left-1 top-2 bottom-2 w-0.5 opacity-60" />
        <div className="flex flex-col">
          <span className="text-[10px] md:text-[11px] font-normal tracking-widest text-slate-400 font-serif">RPM</span>
          <span className="text-[6.5px] uppercase tracking-widest text-slate-500 font-serif leading-none mt-0.5">x1000</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-[1.85rem] font-light font-serif tracking-tight text-slate-200 leading-none">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* 2. CENTER DIAL (LUXURY CHRONO) */}
      <div
        id="center_dial"
        style={{ boxShadow: '0 0 30px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,0,0,0.8)' }}
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-600 flex flex-col items-center justify-center overflow-hidden"
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="metal-grad" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#1e2128" stopOpacity="1" />
              <stop offset="95%" stopColor="#2a2e37" stopOpacity="1" />
              <stop offset="100%" stopColor="#111318" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </linearGradient>
          </defs>

          {/* Background */}
          <circle cx={cx} cy={cy} r={radius + 15} fill="url(#metal-grad)" />
          
          {/* Outer metal ring */}
          <circle cx={cx} cy={cy} r={radius + 5} fill="none" stroke="url(#gold-grad)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#2a2e37" strokeWidth="6" />

          {/* Active sweeping ring */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="6"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 100ms linear', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />

          {/* Thin subtle inner ticks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            const innerR = radius - (isMajor ? 12 : 6);
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy + innerR * Math.sin(angle);
            const x2 = cx + (radius - 3) * Math.cos(angle);
            const y2 = cy + (radius - 3) * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? '#64748b' : '#334155'} strokeWidth="1" />;
          })}

        </svg>

        {/* Center content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 select-none z-10">
          <span className="text-[9px] md:text-[10px] font-normal tracking-widest text-slate-400 uppercase font-serif mb-1">{displaysUnit}</span>
          <span className="text-[2rem] sm:text-[2.4rem] md:text-[2.6rem] font-light font-serif tracking-tight text-slate-100 drop-shadow-md leading-none my-1">{displaySpeed}</span>
          <div className="mt-2 border border-[#b8860b]/50 px-3 py-0.5 rounded-full bg-black/20">
            <span className="text-xs font-normal font-serif text-[#ffd700]">G{gear}</span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD */}
      <div
        id="range_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: 'rgba(255,255,255,0.1)' }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-r-full rounded-l-sm bg-gradient-to-l from-slate-800 to-slate-900 -ml-5 sm:-ml-6 md:-ml-8 z-10 flex flex-col justify-between p-3 pr-6 select-none text-right relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, #d4af37, #f3e5ab, #d4af37)` }} className="absolute right-1 top-2 bottom-2 w-0.5 opacity-60" />
        <div className="flex flex-col">
          <span className="text-[10px] md:text-[11px] font-normal tracking-widest text-slate-400 font-serif">RANGE</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-end pl-1">
          <span className="text-2xl md:text-[1.85rem] font-light font-serif tracking-tight text-slate-200 leading-none">{displayRange}</span>
          <span className="text-[7.5px] font-normal text-slate-500 mt-1 font-serif uppercase tracking-widest">{rangeUnit}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(HudLuxuryChrono);
