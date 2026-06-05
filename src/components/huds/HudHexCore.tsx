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
const radius = 95; // slightly smaller for hex fitting

// Generate hexagon points
const hexPoints = (r: number) => {
  let pts = [];
  for (let i = 0; i < 6; i++) {
    // start pointing up
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

function HudHexCore({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
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

  // Hex fill logic based on speed (stroke-dash on a polygon is supported)
  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  // Total perimeter of hexagon = 6 * side length. Side length = r
  const perimeter = 6 * radius;
  const dashOffset = perimeter * (1 - speedPercentage);

  return (
    <div id="gauge_panel" className="relative flex items-center justify-center w-full select-none">
      {/* 1. LEFT CAPSULE CARD (Hexagonal twist) */}
      <div
        id="rpm_capsule"
        style={{ boxShadow: capsuleBoxShadow, borderColor: themeRgba35 }}
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] bg-[#02050e] border z-10 flex flex-col justify-between p-3 pl-4 select-none text-left relative overflow-hidden"
        // Cyberpunk cut corners
        style={{ clipPath: 'polygon(0% 15%, 15% 0%, 100% 0%, 100% 85%, 85% 100%, 0% 100%)', boxShadow: capsuleBoxShadow, borderColor: themeRgba35, borderWidth: '1px' }}
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})` }} className="absolute left-0 top-3 bottom-3 w-1 opacity-95 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] md:text-xs font-extrabold tracking-wider text-slate-300 font-sans">RPM</span>
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-mono leading-none -mt-0.5">x1000</span>
        </div>
        <div className="my-auto py-1 flex flex-col items-start pr-1">
          <span className="text-2xl md:text-[1.85rem] font-extrabold font-mono tracking-tight text-white leading-none">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* 2. CENTER DIAL (HEX CORE) */}
      <div
        id="center_dial"
        className="w-[160px] h-[160px] xs:w-[175px] xs:h-[175px] sm:w-[195px] sm:h-[195px] md:w-[220px] md:h-[220px] relative z-20 flex-shrink-0 bg-[#020308] border border-white/5 flex flex-col items-center justify-center overflow-hidden"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)' }}
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="hex-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <polygon points={hexPoints(radius + 15)} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <polygon points={hexPoints(radius)} fill="none" stroke="#111827" strokeWidth="6" />
          
          {/* Active Hex Speed Bar */}
          <polygon 
            points={hexPoints(radius)} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="6" 
            strokeDasharray={perimeter}
            strokeDashoffset={dashOffset}
            filter="url(#hex-glow)"
            style={{ transition: 'stroke-dashoffset 100ms linear' }}
          />

          {/* Inner accent ring */}
          <polygon points={hexPoints(radius - 12)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 select-none z-10">
          <span className="text-[10px] md:text-[11px] font-black tracking-widest text-slate-500 uppercase font-sans mb-0.5">{displaysUnit}</span>
          <span className="text-[2rem] sm:text-[2.4rem] md:text-5xl font-black font-sans tracking-tighter text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-none italic">{displaySpeed}</span>
          <div className="mt-1 px-3 py-0.5 border border-white/10 bg-white/5 skew-x-[-15deg]">
            <span className="text-xs md:text-sm font-black font-mono skew-x-[15deg] block" style={{ color: currentTheme.primary }}>G{gear}</span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT CAPSULE CARD (Hexagonal twist) */}
      <div
        id="range_capsule"
        className="flex-1 min-w-0 h-[110px] sm:h-[126px] md:h-[134px] bg-[#02050e] border z-10 flex flex-col justify-between p-3 pr-4 select-none text-right relative overflow-hidden"
        style={{ clipPath: 'polygon(0% 0%, 85% 0%, 100% 15%, 100% 100%, 15% 100%, 0% 85%)', boxShadow: capsuleBoxShadow, borderColor: themeRgba35, borderWidth: '1px' }}
      >
        <div style={{ background: `linear-gradient(to bottom, ${currentTheme.primary}, ${themeRgba45}, ${currentTheme.primary})` }} className="absolute right-0 top-3 bottom-3 w-1 opacity-95 animate-pulse" />
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

export default memo(HudHexCore);
