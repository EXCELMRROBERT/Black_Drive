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

function HudQuantumHolo({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba15 = useMemo(() => hexToRgba(currentTheme.primary, 0.15), [currentTheme.primary]);
  const themeRgba30 = useMemo(() => hexToRgba(currentTheme.primary, 0.3), [currentTheme.primary]);
  const themeRgba50 = useMemo(() => hexToRgba(currentTheme.primary, 0.5), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const rpmPercentage = Math.min(1, Math.max(0, rpm / 6500));

  const cx = 130;
  const cy = 130;
  const rOuter = 110;
  const rInner = 90;
  const dashOuter = 2 * Math.PI * rOuter;
  const dashInner = 2 * Math.PI * rInner;

  return (
    <div className="relative flex items-center justify-center w-full select-none" style={{ perspective: '1000px' }}>
      
      {/* 3D Holographic Container */}
      <div 
        className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] relative z-20 flex flex-col items-center justify-center"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(15deg)' }}
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          <defs>
            <filter id="holo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* RPM Inner Ring (Floats higher in Z) */}
          <g style={{ transform: 'translateZ(20px)' }}>
            <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" />
            <circle 
              cx={cx} cy={cy} r={rInner} 
              fill="none" 
              stroke={themeRgba50} 
              strokeWidth="15" 
              strokeDasharray={dashInner}
              strokeDashoffset={dashInner * (1 - rpmPercentage)}
              strokeLinecap="round"
              filter="url(#holo-glow)"
              style={{ transition: 'stroke-dashoffset 100ms ease-out' }}
            />
          </g>

          {/* Speed Outer Ring (Floats lower in Z) */}
          <g style={{ transform: 'translateZ(-10px)' }}>
            <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
            <circle 
              cx={cx} cy={cy} r={rOuter} 
              fill="none" 
              stroke={currentTheme.primary} 
              strokeWidth="6" 
              strokeDasharray={dashOuter}
              strokeDashoffset={dashOuter * (1 - speedPercentage)}
              strokeLinecap="round"
              filter="url(#holo-glow)"
              style={{ transition: 'stroke-dashoffset 100ms ease-out' }}
            />
          </g>

          {/* Scanning lines */}
          <line x1={0} y1={cy} x2={260} y2={cy} stroke={themeRgba15} strokeWidth="1" strokeDasharray="4 8" />
          <line x1={cx} y1={0} x2={cx} y2={260} stroke={themeRgba15} strokeWidth="1" strokeDasharray="4 8" />
        </svg>

        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-30"
          style={{ transform: 'translateZ(30px)' }}
        >
          <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">{displaysUnit}</span>
          <span className="text-6xl font-light font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] my-1">{displaySpeed}</span>
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: currentTheme.primary, textShadow: `0 0 10px ${themeRgba50}` }}>
            G - {gear}
          </span>
        </div>
      </div>

      {/* Floating Side Info */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-80" style={{ transform: 'rotateY(15deg)' }}>
        <span className="text-[8px] tracking-widest text-slate-500 font-mono">RPM</span>
        <span className="text-xl font-light text-white font-mono">{(rpm / 1000).toFixed(1)}</span>
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-80" style={{ transform: 'rotateY(-15deg)' }}>
        <span className="text-[8px] tracking-widest text-slate-500 font-mono">RNG</span>
        <span className="text-xl font-light text-white font-mono">{displayRange}</span>
      </div>

    </div>
  );
}

export default memo(HudQuantumHolo);
