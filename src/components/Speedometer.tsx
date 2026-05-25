import { motion } from 'motion/react';
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

export default function Speedometer({
  speed,
  rpm,
  gear,
  rangeKm,
  units,
  theme,
  throttle,
}: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  // State calculations for percentages
  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const rpmPercentage = Math.min(1, Math.max(0, rpm / 7000));

  // Center coordinate math inside a 260x260 box
  const cx = 130;
  const cy = 130;
  const radius = 100;

  // Gauge angles (135 degrees bottom-left to 405 degrees bottom-right)
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = endAngle - startAngle;

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
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  // Generate ticks
  const tickCount = 31;
  const ticks = Array.from({ length: tickCount }).map((_, idx) => {
    const value = idx * 10;
    const angle = startAngle + (value / 300) * sweepAngle;
    const pOuter = polarToCartesian(cx, cy, radius, angle);
    const isMajor = value % 50 === 0;
    const isRedline = value >= 250;
    const pInner = polarToCartesian(cx, cy, radius - (isMajor ? 10 : 6), angle);

    return {
      value,
      x1: pInner.x,
      y1: pInner.y,
      x2: pOuter.x,
      y2: pOuter.y,
      isMajor,
      isRedline,
      angle,
    };
  });

  // Numeric labels at major divisions: 0, 50, 100, 150, 200, 250, 300
  const labelDistances = [0, 50, 100, 150, 200, 250, 300];
  const labels = labelDistances.map((value) => {
    const angle = startAngle + (value / 300) * sweepAngle;
    const pText = polarToCartesian(cx, cy, radius - 18, angle);
    return {
      value,
      x: pText.x,
      y: pText.y + 3.5, // vertical centering adjustment
    };
  });

  // Multiplier for rotating custom indicator needle
  const activeEndAngle = startAngle + speedPercentage * sweepAngle;

  return (
    <div 
      id="gauge_panel" 
      className="relative flex items-center justify-center w-full max-w-[420px] mx-auto select-none mt-1 sm:mt-2 px-1 scale-[1.04] min-[360px]:scale-[1.12] min-[400px]:scale-[1.18] sm:scale-[1.28] md:scale-[1.36] landscape:scale-[1.10] landscape:min-[700px]:scale-[1.22] landscape:min-[800px]:scale-[1.32] landscape:md:scale-[1.42] origin-center transition-transform duration-300"
    >
      {/* 1. LEFT CAPSULE CARD (RPM) */}
      <div 
        id="rpm_capsule" 
        style={{
          boxShadow: `inset 0 1px 4px rgba(255,255,255,0.15), inset 0 0 15px ${hexToRgba(currentTheme.primary, 0.2)}, 0 12px 32px rgba(0,0,0,0.95), 0 0 18px ${currentTheme.glow}, 0 0 28px ${hexToRgba(currentTheme.primary, 0.45)}`,
          borderColor: hexToRgba(currentTheme.primary, 0.35)
        }}
        className="flex-1 max-w-[98px] min-w-[78px] h-[116px] md:h-[134px] rounded-l-[2rem] rounded-r-[0.8rem] bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black -mr-6 md:-mr-8 z-10 flex flex-col justify-between p-3.5 pl-4.5 select-none text-left relative overflow-hidden"
      >
        {/* Premium LED Ambient Color Light Bar Left Accent */}
        <div 
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.primary}, ${hexToRgba(currentTheme.primary, 0.5)}, ${currentTheme.primary})`,
            filter: `drop-shadow(0 0 8px ${currentTheme.primary})`
          }}
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md opacity-95 animate-pulse" 
        />
        
        {/* Interior Ambient Radial Light Aura */}
        <div 
          style={{ backgroundColor: hexToRgba(currentTheme.primary, 0.15) }}
          className="absolute -left-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none" 
        />

        {/* RPM HEADER */}
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RPM</span>
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-mono leading-none -mt-0.5">x1000</span>
        </div>

        {/* RPM VALUE */}
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-3.5xl font-extrabold font-mono tracking-tight text-white leading-none">
            {(rpm / 1000).toFixed(1)}
          </span>
          {/* Accent icon emblem (matches luxury dashboard) */}
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-500 mt-1 pb-0.5 opacity-50" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043a3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
      </div>

      {/* 2. CENTER SPECS GAUGE DIAL (OVERLAPS MIDDLE ON Z-20) */}
      <div 
        id="center_dial" 
        style={{
          boxShadow: `0 0 35px rgba(0,0,0,0.95), inset 0 0 25px rgba(0,0,0,0.8)`
        }}
        className="w-[170px] h-[170px] sm:w-[190px] sm:h-[190px] md:w-[220px] md:h-[220px] rounded-full relative z-20 flex-shrink-0 bg-[#02050e] border border-white/10 flex flex-col items-center justify-center overflow-hidden"
      >
        <svg 
          viewBox="0 0 260 260" 
          className="absolute inset-0 w-full h-full"
        >
          {/* DEFINITIONS FOR NEON FILTERS */}
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

          {/* GAUGE INNER GRADIENT BACKGROUND */}
          <circle cx={cx} cy={cy} r={radius - 2} fill="url(#ring-glow-grad)" />

          {/* BRIGHT GLOWING OUTER BEZEL HALF RINGS */}
          <path
            d={describeArc(cx, cy, radius + 6, startAngle, endAngle)}
            fill="none"
            stroke={hexToRgba(currentTheme.primary, 0.45)}
            strokeWidth="3.5"
          />
          <path
            d={describeArc(cx, cy, radius + 6, startAngle, endAngle)}
            fill="none"
            stroke={currentTheme.primary}
            strokeWidth="1.5"
            filter="url(#glow-theme)"
            className="opacity-90"
          />

          {/* BACKGROUND CIRCLE GUIDE */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* BACKING GRAY TRACK SPEEDO ARC */}
          <path
            d={describeArc(cx, cy, radius, startAngle, endAngle)}
            fill="none"
            stroke="#111827"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* HIGH SPEED WARNING sector zone (red arc) */}
          <path
            d={describeArc(cx, cy, radius, startAngle + (250/300)*sweepAngle, endAngle)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeDasharray="3,5"
            className="opacity-80"
          />

          {/* ACTIVE DIAL SWEEP GAUGE LINE GLOWING */}
          {speed > 0 && (
            <path
              d={describeArc(cx, cy, radius, startAngle, activeEndAngle)}
              fill="none"
              stroke={speed >= 250 ? '#ef4444' : currentTheme.primary}
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glow-theme)"
            />
          )}

          {/* GAUGE TIMELINE TICKS */}
          {ticks.map((tick, i) => (
            <line
              key={`tick-${i}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={
                tick.isRedline 
                  ? '#ef4444' 
                  : tick.value <= speed 
                    ? currentTheme.primary 
                    : 'rgba(255,255,255,0.12)'
              }
              strokeWidth={tick.isMajor ? 2 : 1}
            />
          ))}

          {/* CHROME MAJOR TICKS MARK NUMBERS */}
          {labels.map((label, idx) => (
            <text
              key={`label-${idx}`}
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

          {/* TOP 150 DYNAMIC GLOW VERTICAL NEEDLE MARKER (UPRIGHT POINT) */}
          <line
            x1={cx}
            y1={cy - radius}
            x2={cx}
            y2={cy - radius + 14}
            stroke={currentTheme.primary}
            strokeWidth="3"
            filter="url(#glow-theme)"
            className="opacity-90 animate-pulse"
          />
        </svg>

        {/* ABSOLUTE METALLIC INNER CONTENT GLASS */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 select-none z-10">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center justify-center -space-y-1"
          >
            {/* MEASURE UNIT (ABOVE SPEED VALUE) */}
            <span className="text-[9px] md:text-[10px] font-extrabold tracking-widest text-slate-400 uppercase font-sans mb-1 select-none">
              {displaysUnit}
            </span>

            {/* LARGE SPEED READING DISPLAY IN CENTER */}
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans tracking-tighter text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] select-none leading-none">
              {displaySpeed}
            </span>

            {/* TRANSMISSION GEAR BOX AND LETTERING */}
            <div className="flex flex-col items-center pt-1.5">
              <span 
                style={{
                  color: currentTheme.primary,
                  filter: `drop-shadow(0 0 8px ${hexToRgba(currentTheme.primary, 0.6)})`
                }}
                className="text-xl md:text-2xl font-black font-mono leading-none select-none"
              >
                {gear}
              </span>
              <span className="text-[7.5px] md:text-[8.5px] uppercase font-mono tracking-widest text-slate-400 mt-0.5 select-none">
                SPORT
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD (RANGE / FUEL) */}
      <div 
        id="range_capsule" 
        style={{
          boxShadow: `inset 0 1px 4px rgba(255,255,255,0.15), inset 0 0 15px ${hexToRgba(currentTheme.primary, 0.2)}, 0 12px 32px rgba(0,0,0,0.95), 0 0 18px ${currentTheme.glow}, 0 0 28px ${hexToRgba(currentTheme.primary, 0.45)}`,
          borderColor: hexToRgba(currentTheme.primary, 0.35)
        }}
        className="flex-1 max-w-[98px] min-w-[78px] h-[116px] md:h-[134px] rounded-r-[2rem] rounded-l-[0.8rem] bg-gradient-to-bl from-slate-900/95 via-slate-950/95 to-black -ml-6 md:-ml-8 z-10 flex flex-col justify-between p-3.5 pr-4.5 select-none text-right relative overflow-hidden"
      >
        {/* Premium LED Ambient Color Light Bar Right Accent */}
        <div 
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.primary}, ${hexToRgba(currentTheme.primary, 0.5)}, ${currentTheme.primary})`,
            filter: `drop-shadow(0 0 8px ${currentTheme.primary})`
          }}
          className="absolute right-0 top-3 bottom-3 w-1 rounded-l-md opacity-95 animate-pulse" 
        />
        
        {/* Interior Ambient Radial Light Aura */}
        <div 
          style={{ backgroundColor: hexToRgba(currentTheme.primary, 0.15) }}
          className="absolute -right-10 -top-10 w-24 h-24 rounded-full blur-[22px] pointer-events-none" 
        />

        {/* RANGE HEADER */}
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RANGE</span>
        </div>

        {/* RANGE VALUE */}
        <div className="my-auto py-1 flex flex-col items-end pl-1">
          <span className="text-2xl md:text-3.5xl font-extrabold font-mono tracking-tight text-white leading-none">
            {displayRange}
          </span>
          <span className="text-[8.5px] font-bold text-slate-500 mt-1 font-mono">{rangeUnit}</span>
        </div>
      </div>
    </div>
  );
}
