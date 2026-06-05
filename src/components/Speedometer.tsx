import { useMemo, memo } from 'react';
import { THEMES } from '../utils';
import { ThemeColor } from '../types';

interface SpeedometerProps {
  speed: number;
  rpm: number;
  gear: string | number;
  rangeKm: number;
  units: 'METRIC' | 'IMPERIAL';
  theme: ThemeColor;
  throttle: number;
}

// Pure helper — stable reference, never changes
const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + r * Math.cos(angleInRadians),
    y: centerY + r * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, r: number, startAngleDeg: number, endAngleDeg: number) => {
  const start = polarToCartesian(x, y, r, endAngleDeg);
  const end = polarToCartesian(x, y, r, startAngleDeg);
  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Constants — never change
const cx = 130;
const cy = 130;
const radius = 100;
const startAngle = 135;
const endAngle = 405;
const sweepAngle = endAngle - startAngle;
const tickCount = 31;
const labelDistances = [0, 50, 100, 150, 200, 250, 300];

// Pre-compute static tick geometry once (module-level, not per-render)
const STATIC_TICKS = Array.from({ length: tickCount }).map((_, idx) => {
  const value = idx * 10;
  const angle = startAngle + (value / 300) * sweepAngle;
  const pOuter = polarToCartesian(cx, cy, radius, angle);
  const isMajor = value % 50 === 0;
  const isRedline = value >= 250;
  const pInner = polarToCartesian(cx, cy, radius - (isMajor ? 10 : 6), angle);
  return { value, x1: pInner.x, y1: pInner.y, x2: pOuter.x, y2: pOuter.y, isMajor, isRedline };
});

// Pre-compute static label positions once (module-level)
const STATIC_LABELS = labelDistances.map((value) => {
  const angle = startAngle + (value / 300) * sweepAngle;
  const pText = polarToCartesian(cx, cy, radius - 18, angle);
  return { value, x: pText.x, y: pText.y + 3.5 };
});

// Pre-compute static arc paths once (module-level)
const OUTER_BEZEL_PATH = describeArc(cx, cy, radius + 6, startAngle, endAngle);
const BACKING_TRACK_PATH = describeArc(cx, cy, radius, startAngle, endAngle);
const REDLINE_ARC_PATH = describeArc(cx, cy, radius, startAngle + (250 / 300) * sweepAngle, endAngle);

function SpeedometerInner({
  speed,
  rpm,
  gear,
  rangeKm,
  units,
  theme,
}: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  // Memoize per-theme color transforms
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
  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const arcLength = 471.24; // 2 * PI * radius * (sweepAngle / 360)
  const dashOffset = -arcLength * (1 - speedPercentage);

  const activeStroke = speed >= 250 ? '#ef4444' : currentTheme.primary;

  return (
    <div
      id="gauge_panel"
      className="relative flex items-center justify-center w-full select-none"
    >
      {/* 1. LEFT CAPSULE CARD (RPM) */}
      <div
        id="rpm_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-l-[2rem] rounded-r-[0.8rem] bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black -mr-5 sm:-mr-6 md:-mr-8 z-10 flex flex-col justify-between p-3 pl-4 select-none text-left relative overflow-hidden border"
      >
        {/* Premium LED Color Light Bar */}
        <div
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})`,
            filter: `drop-shadow(0 0 8px ${currentTheme.primary})`
          }}
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md opacity-95 animate-pulse"
        />
        {/* Ambient Radial Aura */}
        <div
          style={{ backgroundColor: themeRgba15 }}
          className="absolute -left-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none"
        />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RPM</span>
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-mono leading-none -mt-0.5">x1000</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">
            {(rpm / 1000).toFixed(1)}
          </span>
        </div>
      </div>

      {/* 2. CENTER DIAL */}
      <div
        id="center_dial"
        style={{ boxShadow: '0 0 35px rgba(0,0,0,0.95), inset 0 0 25px rgba(0,0,0,0.8)' }}
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-[#02050e] border border-white/10 flex flex-col items-center justify-center overflow-hidden"
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="glow-theme" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="ring-glow-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0c111d" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#030712" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
          </defs>

          <circle cx={cx} cy={cy} r={radius - 2} fill="url(#ring-glow-grad)" />

          {/* Outer bezel rings */}
          <path d={OUTER_BEZEL_PATH} fill="none" stroke={themeRgba45} strokeWidth="3.5" />
          <path d={OUTER_BEZEL_PATH} fill="none" stroke={currentTheme.primary} strokeWidth="1.5" filter="url(#glow-theme)" className="opacity-90" />

          {/* Background circle guide */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Backing gray track */}
          <path d={BACKING_TRACK_PATH} fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />

          {/* Redline zone */}
          <path d={REDLINE_ARC_PATH} fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="3,5" className="opacity-80" />

          {/* Active speed arc */}
          <path
            d={BACKING_TRACK_PATH}
            fill="none"
            stroke={activeStroke}
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow-theme)"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ 
              transition: 'stroke-dashoffset 100ms linear, stroke 100ms linear',
              opacity: speedPercentage > 0.005 ? 1 : 0 
            }}
          />

          {/* Static ticks — color changes based on current speed */}
          {STATIC_TICKS.map((tick) => (
            <line
              key={tick.value}
              x1={tick.x1} y1={tick.y1}
              x2={tick.x2} y2={tick.y2}
              stroke={
                tick.isRedline
                  ? '#ef4444'
                  : tick.value <= speed
                  ? currentTheme.primary
                  : 'rgba(255,255,255,0.12)'
              }
              strokeWidth={tick.isMajor ? 2 : 1}
              style={{ transition: 'stroke 100ms linear' }}
            />
          ))}

          {/* Numeric labels */}
          {STATIC_LABELS.map((label) => (
            <text
              key={label.value}
              x={label.x}
              y={label.y}
              className={`font-sans select-none tracking-tight font-bold ${
                label.value >= 250
                  ? 'fill-red-500/90 font-extrabold'
                  : label.value <= speed
                  ? 'fill-white font-medium'
                  : 'fill-slate-500'
              }`}
              fontSize={label.value === 150 ? '11' : '9'}
              textAnchor="middle"
            >
              {units === 'METRIC' ? label.value : Math.round(label.value * 0.621371)}
            </text>
          ))}

          {/* 150 marker needle */}
          <line
            x1={cx} y1={cy - radius}
            x2={cx} y2={cy - radius + 14}
            stroke={currentTheme.primary}
            strokeWidth="3"
            filter="url(#glow-theme)"
            className="opacity-90 animate-pulse"
          />
        </svg>

        {/* Center content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 select-none z-10">
          <div className="flex flex-col items-center justify-center -space-y-1">
            <span className="text-[9px] md:text-[10px] font-extrabold tracking-widest text-slate-400 uppercase font-sans mb-1 select-none">
              {displaysUnit}
            </span>
            <span className="text-[2rem] sm:text-[2.4rem] md:text-5xl font-extrabold font-sans tracking-tighter text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] select-none leading-none">
              {displaySpeed}
            </span>
            <div className="flex flex-col items-center pt-1.5">
              <span
                style={{
                  color: currentTheme.primary,
                  filter: `drop-shadow(0 0 8px ${themeRgba60})`
                }}
                className="text-xl md:text-2xl font-black font-mono leading-none select-none"
              >
                {gear}
              </span>
              <span className="text-[7.5px] md:text-[8.5px] uppercase font-mono tracking-widest text-slate-400 mt-0.5 select-none">
                SPORT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD (RANGE) */}
      <div
        id="range_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] rounded-r-[2rem] rounded-l-[0.8rem] bg-gradient-to-bl from-slate-900/95 via-slate-950/95 to-black -ml-5 sm:-ml-6 md:-ml-8 z-10 flex flex-col justify-between p-3 pr-4 select-none text-right relative overflow-hidden border"
      >
        {/* LED Accent Right */}
        <div
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})`,
            filter: `drop-shadow(0 0 8px ${currentTheme.primary})`
          }}
          className="absolute right-0 top-3 bottom-3 w-1 rounded-l-md opacity-95 animate-pulse"
        />
        {/* Ambient Aura */}
        <div
          style={{ backgroundColor: themeRgba15 }}
          className="absolute -right-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none"
        />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RANGE</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-end pl-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">
            {displayRange}
          </span>
          <span className="text-[8.5px] font-bold text-slate-500 mt-1 font-mono">{rangeUnit}</span>
        </div>
      </div>
    </div>
  );
}

// Wrap with memo — only re-renders when props actually change
export default memo(SpeedometerInner);
