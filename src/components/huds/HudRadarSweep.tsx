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

function HudRadarSweep({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba35 = useMemo(() => hexToRgba(currentTheme.primary, 0.35), [currentTheme.primary]);
  const themeRgba45 = useMemo(() => hexToRgba(currentTheme.primary, 0.45), [currentTheme.primary]);
  const themeRgba15 = useMemo(() => hexToRgba(currentTheme.primary, 0.15), [currentTheme.primary]);
  const themeRgba20 = useMemo(() => hexToRgba(currentTheme.primary, 0.20), [currentTheme.primary]);
  
  const capsuleBoxShadow = useMemo(() =>
    `inset 0 1px 4px rgba(255,255,255,0.15), inset 0 0 15px ${themeRgba20}, 0 12px 32px rgba(0,0,0,0.95), 0 0 18px ${currentTheme.glow}, 0 0 28px ${themeRgba45}`,
    [themeRgba20, currentTheme.glow, themeRgba45]
  );

  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  // Radar logic
  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  // Radar uses a full 360 circle where speed is mapped to circumference.
  const arcLength = 2 * Math.PI * radius;
  const dashOffset = arcLength * (1 - speedPercentage);

  return (
    <div id="gauge_panel" className="relative flex items-center justify-center w-full select-none">
      {/* 1. LEFT CAPSULE CARD */}
      <div
        id="rpm_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-l-[2rem] rounded-r-[0.8rem] bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black -mr-5 sm:-mr-6 md:-mr-8 z-10 flex flex-col justify-between p-3 pl-4 select-none text-left relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})` }} className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md opacity-95 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RPM</span>
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-mono leading-none -mt-0.5">x1000</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* 2. CENTER DIAL (RADAR SWEEP) */}
      <div
        id="center_dial"
        style={{ boxShadow: '0 0 35px rgba(0,0,0,0.95), inset 0 0 25px rgba(0,0,0,0.8)' }}
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-[#02040a] border border-white/10 flex flex-col items-center justify-center overflow-hidden"
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="radar-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="1" />
              <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Concentric Grid */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={radius * 0.75} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={radius * 0.5} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          
          {/* Crosshairs */}
          <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Radar Ring representing Speed */}
          <circle
            cx={cx} cy={cy} r={radius - 4}
            fill="none"
            stroke="url(#radar-sweep)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#radar-glow)"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 100ms linear', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
          
          {/* Rotating Scanner Line */}
          <g className="animate-spin" style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '3s', animationTimingFunction: 'linear' }}>
            <line x1={cx} y1={cy} x2={cx} y2={cy - radius} stroke={currentTheme.primary} strokeWidth="1.5" className="opacity-60" />
            <polygon points={`${cx},${cy} ${cx-20},${cy-radius} ${cx},${cy-radius}`} fill={`url(#radar-sweep)`} className="opacity-20" />
          </g>

        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 select-none z-10">
          <span className="text-[10px] md:text-[11px] font-bold tracking-widest text-slate-400 uppercase font-mono">{displaysUnit}</span>
          <span className="text-[2rem] sm:text-[2.4rem] md:text-[2.8rem] font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] leading-none my-1">{displaySpeed}</span>
          <span className="text-xs md:text-sm font-black font-mono" style={{ color: currentTheme.primary }}>G{gear}</span>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD */}
      <div
        id="range_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-r-[2rem] rounded-l-[0.8rem] bg-gradient-to-bl from-slate-900/95 via-slate-950/95 to-black -ml-5 sm:-ml-6 md:-ml-8 z-10 flex flex-col justify-between p-3 pr-4 select-none text-right relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})` }} className="absolute right-0 top-3 bottom-3 w-1 rounded-l-md opacity-95 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RANGE</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-end pl-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">{displayRange}</span>
          <span className="text-[8.5px] font-bold text-slate-500 mt-1 font-mono">{rangeUnit}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(HudRadarSweep);
