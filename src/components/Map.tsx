import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Compass, Layers, Plus, Minus, CheckCircle } from 'lucide-react';
import { DriverProfile, SimulationState } from '../types';
import { THEMES } from '../utils';

interface MapProps {
  profile: DriverProfile;
  simulation: SimulationState;
}

interface MapRoute {
  name: string;
  start: string;
  end: string;
  pathString: string;
  landmarks: { name: string; x: number; y: number }[];
  limit: number;
}

const ROUTES: MapRoute[] = [
  {
    name: 'Yerevan City Center Circular Loop',
    start: 'Republic Square',
    end: 'Cascade Monument',
    limit: 60,
    pathString: 'M 50,300 C 100,280 120,200 150,150 C 180,105 250,90 300,120 C 350,150 370,220 340,280 C 310,340 220,380 150,370 Z',
    landmarks: [
      { name: 'Republic Square', x: 50, y: 300 },
      { name: 'Opera Theatre', x: 180, y: 105 },
      { name: 'Cascade Complex', x: 300, y: 120 },
      { name: 'Northern Avenue', x: 220, y: 380 }
    ]
  },
  {
    name: 'Dilijan Mountain Pass Interceptor',
    start: 'Sevan Tunnel North Gate',
    end: 'Dilijan Old Town',
    limit: 90,
    pathString: 'M 40,380 L 100,320 L 120,240 L 180,260 L 220,180 L 280,200 L 320,100 L 380,40',
    landmarks: [
      { name: 'Tunnel Exit', x: 40, y: 380 },
      { name: 'S-Curves Edge', x: 180, y: 260 },
      { name: 'Alpine Viewing Spot', x: 280, y: 200 },
      { name: 'Dilijan Valley Basin', x: 380, y: 40 }
    ]
  },
  {
    name: 'Lake Sevan Coastal Runway',
    start: 'Hrazdan Peninsula',
    end: 'Martuni Shoreline',
    limit: 110,
    pathString: 'M 30,120 Q 150,220 200,300 T 360,350',
    landmarks: [
      { name: 'Sevanavank Monastery', x: 30, y: 120 },
      { name: 'Public Beach 4', x: 150, y: 220 },
      { name: 'Noratus Khachkars', x: 360, y: 350 }
    ]
  }
];

export default function Map({ profile, simulation }: MapProps) {
  const currentTheme = THEMES[profile.theme];
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.2);
  const [pathProgress, setPathProgress] = useState(0.25); // value between 0 and 1
  const activeRoute = ROUTES[activeRouteIndex];

  // Increment path coordinate progress as vehicle drives (speed > 0)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulation.speed > 0) {
      interval = setInterval(() => {
        setPathProgress((prev) => {
          // Increment is proportional to velocity
          const increment = (simulation.speed / 240) * 0.003;
          return (prev + increment) % 1;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [simulation.speed]);

  // SVG total path width
  const viewWidth = 400;
  const viewHeight = 400;

  // Render maps background grid
  const gridLines = [];
  for (let i = 0; i <= 400; i += 40) {
    gridLines.push(i);
  }

  // Get current marker coordinates from custom analytical vector math to support moving indicators accurately
  // Since simple SVG path interpolation can be tedious, we approximate relative coords along selected routes
  const getSimulatedCoords = (p: number, index: number) => {
    if (index === 0) {
      // Circular Orbit path coordinates
      const angle = p * Math.PI * 2;
      const rX = 140;
      const rY = 130;
      return {
        x: 210 + rX * Math.cos(angle),
        y: 230 + rY * Math.sin(angle),
        heading: (angle * 180) / Math.PI + 90
      };
    } else if (index === 1) {
      // Zig zag mountain path coordinates
      const points = [
        { x: 40, y: 380 }, { x: 100, y: 320 }, { x: 120, y: 240 },
        { x: 180, y: 260 }, { x: 220, y: 180 }, { x: 280, y: 200 },
        { x: 320, y: 100 }, { x: 380, y: 40 }
      ];
      const segmentCount = points.length - 1;
      const activeSegmentFloat = p * segmentCount;
      const segmentIndex = Math.floor(activeSegmentFloat) % segmentCount;
      const localP = activeSegmentFloat - Math.floor(activeSegmentFloat);
      const p1 = points[segmentIndex];
      const p2 = points[segmentIndex + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return {
        x: p1.x + dx * localP,
        y: p1.y + dy * localP,
        heading: (Math.atan2(dy, dx) * 180) / Math.PI + 90
      };
    } else {
      // Beach curve path coordinates
      const points = [
        { x: 30, y: 120 }, { x: 150, y: 220 }, { x: 200, y: 300 }, { x: 360, y: 350 }
      ];
      const segmentCount = points.length - 1;
      const activeSegmentFloat = p * segmentCount;
      const segmentIndex = Math.floor(activeSegmentFloat) % segmentCount;
      const localP = activeSegmentFloat - Math.floor(activeSegmentFloat);
      const p1 = points[segmentIndex];
      const p2 = points[segmentIndex + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return {
        x: p1.x + dx * localP,
        y: p1.y + dy * localP,
        heading: (Math.atan2(dy, dx) * 180) / Math.PI + 90
      };
    }
  };

  const currentCoords = getSimulatedCoords(pathProgress, activeRouteIndex);

  // Compute camera limits warnings
  const cameraWarning = simulation.speed > activeRoute.limit;

  return (
    <div id="navigation_screen" className="flex flex-col landscape:flex-row flex-1 px-4 pt-4 pb-10 landscape:pb-4 select-none landscape:gap-4 overflow-y-auto landscape:overflow-y-hidden">
      
      {/* MAP CONTROLS HEADER BAR */}
      <div className="bg-slate-950/80 border border-white/5 p-4 rounded-3xl shadow-xl flex flex-col space-y-3 mb-4 landscape:mb-0 backdrop-blur-md landscape:w-[45%] lg:landscape:w-[40%] shrink-0 landscape:justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Navigation className="w-5 h-5 text-sky-400 animate-pulse" />
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400">BOARD MONITOR NAVI</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            GPS LOGGED
          </span>
        </div>

        {/* Dynamic Route selector dropdown preset */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500">Destination Route Presets</label>
          <select
            value={activeRouteIndex}
            onChange={(e) => {
              setActiveRouteIndex(Number(e.target.value));
              setPathProgress(0.1);
            }}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            {ROUTES.map((route, i) => (
              <option key={route.name} value={i}>
                {route.name} (Limit: {route.limit} KM/H)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DYNAMIC GPS VECTOR DISPLAY */}
      <div id="vector_gps_frame" className="relative flex-1 aspect-square landscape:aspect-auto md:min-h-[420px] rounded-3xl border border-white/10 overflow-hidden bg-black flex flex-col min-h-[0]">
        
        {/* MAP BACKGROUND CANVAS */}
        <svg 
          viewBox="0 0 400 400" 
          className="absolute inset-0 w-full h-full"
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: `${currentCoords.x}px ${currentCoords.y}px`,
            transition: 'transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
        >
          {/* MAP COORDINATES GRID LINES */}
          <g opacity="0.12" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5">
            {gridLines.map((coord) => (
              <line key={`v-${coord}`} x1={coord} y1={0} x2={coord} y2={400} />
            ))}
            {gridLines.map((coord) => (
              <line key={`h-${coord}`} x1={0} y1={coord} x2={400} y2={coord} />
            ))}
          </g>

          {/* SIMULATED HIGHWAY / STREET OUTLINES */}
          {/* Backing structural highways */}
          <path d="M 10,240 L 390,240" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeDasharray="14,14" fill="none" opacity="0.4" />
          <path d="M 210,10 L 210,390" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeDasharray="14,14" fill="none" opacity="0.4" />

          {/* ACTIVE ROUTE HIGHLIGHT LINE BACKGROUND */}
          <path
            d={activeRoute.pathString}
            stroke="#0f172a"
            strokeWidth="10"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          {/* GAUGE COLOR ROUTE TRACK */}
          <path
            d={activeRoute.pathString}
            stroke={currentTheme.primary}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            className="opacity-75"
          />

          {/* DYNAMIC LANDMARK MARKERS */}
          {activeRoute.landmarks.map((landmark) => {
            const isNear = Math.hypot(currentCoords.x - landmark.x, currentCoords.y - landmark.y) < 55;
            return (
              <g key={landmark.name}>
                <circle cx={landmark.x} cy={landmark.y} r="5" fill="#ffffff" stroke={currentTheme.primary} strokeWidth="2" />
                <circle cx={landmark.x} cy={landmark.y} r="12" fill="none" stroke={currentTheme.primary} strokeWidth="1" className="opacity-30 animate-ping" />
                <text
                  x={landmark.x}
                  y={landmark.y - 12}
                  fontSize="8.5"
                  className={`font-mono font-medium tracking-tight fill-slate-300 drop-shadow-[0_1px_3px_black] ${isNear ? 'fill-sky-400 font-bold scale-[1.05]' : ''}`}
                  style={{ textAnchor: 'middle' }}
                >
                  {landmark.name}
                </text>
              </g>
            );
          })}

          {/* ACTIVE DRIVING CAR CURSOR DOT */}
          <g transform={`translate(${currentCoords.x}, ${currentCoords.y}) rotate(${currentCoords.heading - 90})`}>
            {/* Pulsing indicator aura */}
            <circle cx="0" cy="0" r="14" fill={currentTheme.primary} className="opacity-25" />
            
            {/* Real direction arrow wedge */}
            <path
              d="M 0,-9 L 8,9 L 0,4 L -8,9 Z"
              fill={currentTheme.primary}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="filter drop-shadow-[0_0_8px_cyan]"
            />
          </g>
        </svg>

        {/* SIDE BAR BUTTON CONTROLS OVERLAY ON MAP */}
        <div className="absolute right-4 top-4 flex flex-col space-y-2 z-30">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.3))}
            className="w-10 h-10 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer backdrop-blur hover:bg-slate-900 duration-100 shadow-2xl"
          >
            <Plus className="w-5 h-5 text-slate-300" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.3))}
            className="w-10 h-10 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer backdrop-blur hover:bg-slate-900 duration-100 shadow-2xl"
          >
            <Minus className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* SPEED CAMERA ROAD WARNING OVERLAY */}
        {cameraWarning && (
          <div className="absolute top-4 left-4 z-30 bg-red-600 border border-red-500 px-3 py-1.5 rounded-2xl flex items-center space-x-2 animate-bounce shadow-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-white uppercase">
              SPEEDING WARNING! ROUTE LIMIT: {activeRoute.limit} KM/H
            </span>
          </div>
        )}

        {/* COMPASS POSITION READOUTS BAR */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 border border-white/5 rounded-2xl p-3 flex justify-between items-center z-30 backdrop-blur shadow-2xl select-none">
          <div className="flex flex-col">
            <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500">Active Coordinates</span>
            <span className="text-xs font-mono font-medium text-white truncate max-w-[190px]">
              YRV-{currentCoords.x.toFixed(2)}E / {currentCoords.y.toFixed(2)}N
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500">Heading</span>
            <span className="text-xs font-mono font-medium text-sky-400">
              {Math.round(currentCoords.heading)}° (YRV-LNC)
            </span>
          </div>
        </div>
      </div>

      {/* ROAD STATISTICS SECTION */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-center">
          <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500">Target</span>
          <span className="text-sm font-bold text-white truncate mt-0.5">
            {activeRoute.end}
          </span>
          <span className="text-[10px] text-sky-400 font-mono mt-1">
            Remaining: {Math.max(12, 120 - Math.round(pathProgress * 120))} KM
          </span>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-center">
          <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500">Road Speed Limit</span>
          <span className="text-sm font-bold text-slate-200 mt-0.5 flex items-center space-x-1">
            <span className="text-orange-500 font-mono">{activeRoute.limit}</span>
            <span className="text-xs text-slate-500 font-sans font-normal">KM/H</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">
            Safety Cameras: Active
          </span>
        </div>
      </div>
    </div>
  );
}
