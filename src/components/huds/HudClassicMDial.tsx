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

const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + r * Math.cos(angleInRadians),
    y: centerY + r * Math.sin(angleInRadians),
  };
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const cx = 130;
const cy = 130;
const radius = 100;
const startAngle = 135;
const endAngle = 405;
const sweepAngle = endAngle - startAngle;

const STATIC_TICKS = Array.from({ length: 61 }).map((_, idx) => {
  const value = idx * 5; // Every 5 units
  const angle = startAngle + (value / 300) * sweepAngle;
  const isMajor = value % 20 === 0;
  const isRedline = value >= 250;
  const pOuter = polarToCartesian(cx, cy, radius, angle);
  const pInner = polarToCartesian(cx, cy, radius - (isMajor ? 12 : 6), angle);
  return { value, x1: pInner.x, y1: pInner.y, x2: pOuter.x, y2: pOuter.y, isMajor, isRedline, angle };
});

const STATIC_LABELS = Array.from({ length: 16 }).map((_, idx) => {
  const value = idx * 20;
  const angle = startAngle + (value / 300) * sweepAngle;
  const pText = polarToCartesian(cx, cy, radius - 26, angle);
  return { value, x: pText.x, y: pText.y + 4 };
});

function HudClassicMDial({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba35 = useMemo(() => hexToRgba(currentTheme.primary, 0.35), [currentTheme.primary]);
  const themeRgba45 = useMemo(() => hexToRgba(currentTheme.primary, 0.45), [currentTheme.primary]);
  const themeRgba15 = useMemo(() => hexToRgba(currentTheme.primary, 0.15), [currentTheme.primary]);
  const themeRgba20 = useMemo(() => hexToRgba(currentTheme.primary, 0.20), [currentTheme.primary]);
  const themeRgba60 = useMemo(() => hexToRgba(currentTheme.primary, 0.6), [currentTheme.primary]);
  
  const capsuleBoxShadow = useMemo(() =>
    `inset 0 1px 4px rgba(255,255,255,0.15), inset 0 0 15px ${themeRgba20}, 0 12px 32px rgba(0,0,0,0.95), 0 0 18px ${currentTheme.glow}, 0 0 28px ${themeRgba45}`,
    [themeRgba20, currentTheme.glow, themeRgba45]
  );

  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const activeEndAngle = startAngle + speedPercentage * sweepAngle;

  return (
    <div id="gauge_panel" className="relative flex items-center justify-center w-full select-none">
      {/* 1. LEFT CAPSULE CARD (RPM) */}
      <div
        id="rpm_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-l-[2rem] rounded-r-[0.8rem] bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black -mr-5 sm:-mr-6 md:-mr-8 z-10 flex flex-col justify-between p-3 pl-4 select-none text-left relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})`, filter: `drop-shadow(0 0 8px ${currentTheme.primary})` }} className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md opacity-95 animate-pulse" />
        <div style={{ backgroundColor: themeRgba15 }} className="absolute -left-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none" />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RPM</span>
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-mono leading-none -mt-0.5">x1000</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* 2. CENTER DIAL (CLASSIC M-DIAL) */}
      <div
        id="center_dial"
        style={{ boxShadow: '0 0 35px rgba(0,0,0,0.95), inset 0 0 25px rgba(0,0,0,0.8)' }}
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-[#090a0f] border-4 border-slate-800 flex flex-col items-center justify-center overflow-hidden"
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="glow-theme" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="dial-grad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#1a1c23" stopOpacity="1" />
              <stop offset="90%" stopColor="#0d0e12" stopOpacity="1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Dial Background */}
          <circle cx={cx} cy={cy} r={radius + 15} fill="url(#dial-grad)" />
          <circle cx={cx} cy={cy} r={radius + 4} fill="none" stroke="#2a2d36" strokeWidth="2" />
          
          {/* Static ticks */}
          {STATIC_TICKS.map((tick) => (
            <line
              key={tick.value}
              x1={tick.x1} y1={tick.y1}
              x2={tick.x2} y2={tick.y2}
              stroke={tick.isRedline ? '#ef4444' : '#e2e8f0'}
              strokeWidth={tick.isMajor ? 2.5 : 1.5}
            />
          ))}

          {/* Numeric labels */}
          {STATIC_LABELS.map((label) => (
            <text
              key={label.value}
              x={label.x}
              y={label.y}
              className={`font-sans select-none tracking-tighter ${label.value >= 250 ? 'fill-red-500 font-bold' : 'fill-white font-medium'}`}
              fontSize="12"
              textAnchor="middle"
            >
              {units === 'METRIC' ? label.value : Math.round(label.value * 0.621371)}
            </text>
          ))}

          {/* Classic solid sweeping needle */}
          <g style={{ transition: 'transform 100ms linear', transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${activeEndAngle}deg)` }}>
            {/* Needle shadow */}
            <polygon points={`${cx - 3},${cy + 15} ${cx + 3},${cy + 15} ${cx + 1},${cy - radius + 10} ${cx - 1},${cy - radius + 10}`} fill="rgba(0,0,0,0.5)" filter="url(#glow-theme)" />
            {/* Needle body */}
            <polygon points={`${cx - 3},${cy + 15} ${cx + 3},${cy + 15} ${cx + 1},${cy - radius + 8} ${cx - 1},${cy - radius + 8}`} fill="#ef4444" />
            <circle cx={cx} cy={cy} r="12" fill="#0f1115" stroke="#ef4444" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Center content overlay - lower half for classic dial */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 select-none z-10 pointer-events-none">
          <div className="flex flex-col items-center justify-center bg-[#0d0e12]/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
            <span className="text-[14px] md:text-base font-bold font-mono text-white leading-none tracking-wider">{gear}</span>
            <span className="text-[7px] md:text-[8px] font-extrabold tracking-widest text-slate-400 uppercase font-sans mt-0.5">{displaysUnit}</span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD (RANGE) */}
      <div
        id="range_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-r-[2rem] rounded-l-[0.8rem] bg-gradient-to-bl from-slate-900/95 via-slate-950/95 to-black -ml-5 sm:-ml-6 md:-ml-8 z-10 flex flex-col justify-between p-3 pr-4 select-none text-right relative overflow-hidden border"
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})`, filter: `drop-shadow(0 0 8px ${currentTheme.primary})` }} className="absolute right-0 top-3 bottom-3 w-1 rounded-l-md opacity-95 animate-pulse" />
        <div style={{ backgroundColor: themeRgba15 }} className="absolute -right-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none" />
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

export default memo(HudClassicMDial);
