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

function HudCarbonApex({ speed, rpm, gear, rangeKm, units, theme }: SpeedometerProps) {
  const currentTheme = THEMES[theme] || THEMES.blue;

  const themeRgba20 = useMemo(() => hexToRgba(currentTheme.primary, 0.2), [currentTheme.primary]);
  const themeRgba60 = useMemo(() => hexToRgba(currentTheme.primary, 0.6), [currentTheme.primary]);

  const displaySpeed = units === 'METRIC' ? Math.round(speed) : Math.round(speed * 0.621371);
  const displayRange = units === 'METRIC' ? Math.round(rangeKm) : Math.round(rangeKm * 0.621371);
  const displaysUnit = units === 'METRIC' ? 'KM/H' : 'MPH';
  const rangeUnit = units === 'METRIC' ? 'KM' : 'MI';

  const speedPercentage = Math.min(1, Math.max(0, speed / 300));
  const rpmPercentage = Math.min(1, Math.max(0, rpm / 6500));

  const cx = 130;
  const cy = 130;
  const r = 100;

  return (
    <div className="relative flex items-center justify-center w-full select-none gap-3">
      
      {/* RPM Apex Bar */}
      <div className="w-[60px] h-[180px] bg-[#111] border-2 border-[#222] flex flex-col justify-end p-2 relative shadow-xl rounded-sm">
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}
        />
        <div 
          className="w-full relative z-10"
          style={{ height: `${rpmPercentage * 100}%`, backgroundColor: currentTheme.primary, transition: 'height 100ms ease-out', boxShadow: `0 0 15px ${themeRgba60}` }}
        />
        <div className="absolute top-2 left-0 w-full text-center z-20">
          <span className="text-[10px] font-black text-white/50 tracking-widest block">RPM</span>
          <span className="text-xl font-black text-white italic">{(rpm / 1000).toFixed(1)}</span>
        </div>
      </div>

      {/* Carbon Speed Dial */}
      <div 
        className="w-[200px] h-[200px] rounded-full relative z-20 border-[6px] border-[#222] flex items-center justify-center shadow-2xl"
        style={{
          backgroundColor: '#151515',
          backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
          backgroundSize: '4px 4px'
        }}
      >
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="16" 
            strokeDasharray={2 * Math.PI * r}
            strokeDashoffset={(2 * Math.PI * r) * (1 - speedPercentage)}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dashoffset 100ms ease-out', filter: `drop-shadow(0 0 4px ${themeRgba20})` }}
          />
          {/* Tick marks */}
          <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke="#555" strokeWidth="4" strokeDasharray="2 18" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 rounded-full">
          <span className="text-[14px] font-black italic tracking-widest text-slate-300 uppercase">{displaysUnit}</span>
          <span className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] my-1">{displaySpeed}</span>
          <div className="w-10 h-1 mt-1" style={{ backgroundColor: currentTheme.primary }} />
          <span className="text-xl font-black text-white italic mt-1">{gear}</span>
        </div>
      </div>

      {/* Range Apex Bar */}
      <div className="w-[60px] h-[180px] bg-[#111] border-2 border-[#222] flex flex-col justify-end p-2 relative shadow-xl rounded-sm">
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}
        />
        <div 
          className="w-full relative z-10 bg-white/20"
          style={{ height: `${Math.min(1, rangeKm / 800) * 100}%`, transition: 'height 100ms ease-out' }}
        />
        <div className="absolute top-2 left-0 w-full text-center z-20">
          <span className="text-[10px] font-black text-white/50 tracking-widest block">RNG</span>
          <span className="text-xl font-black text-white italic">{displayRange}</span>
        </div>
      </div>

    </div>
  );
}

export default memo(HudCarbonApex);
