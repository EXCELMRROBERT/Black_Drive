import { ThemeColor, ThemeColors, CarSpecs, TripLog } from './types';

export const THEMES: Record<ThemeColor, ThemeColors> = {
  blue: {
    primary: '#00d2ff',
    glow: 'rgba(0, 210, 255, 0.4)',
    gradient: 'from-cyan-500/20 to-blue-600/5',
    bg: 'bg-cyan-500',
    accent: 'text-cyan-400',
  },
  amber: {
    primary: '#ffa100',
    glow: 'rgba(255, 161, 0, 0.45)',
    gradient: 'from-amber-600/20 to-orange-700/5',
    bg: 'bg-amber-500',
    accent: 'text-amber-500',
  },
  red: {
    primary: '#ff3b30',
    glow: 'rgba(255, 59, 48, 0.4)',
    gradient: 'from-red-600/25 to-rose-700/5',
    bg: 'bg-red-500',
    accent: 'text-rose-500',
  },
  green: {
    primary: '#34c759',
    glow: 'rgba(52, 199, 89, 0.4)',
    gradient: 'from-green-500/20 to-emerald-600/5',
    bg: 'bg-green-500',
    accent: 'text-emerald-400',
  },
  yellow: {
    primary: '#facc15',
    glow: 'rgba(250, 204, 21, 0.4)',
    gradient: 'from-yellow-500/20 to-amber-600/5',
    bg: 'bg-yellow-500',
    accent: 'text-yellow-400',
  },
  purple: {
    primary: '#af52de',
    glow: 'rgba(175, 82, 222, 0.4)',
    gradient: 'from-purple-500/20 to-indigo-600/5',
    bg: 'bg-purple-500',
    accent: 'text-purple-400',
  },
  white: {
    primary: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.4)',
    gradient: 'from-white/20 to-slate-400/5',
    bg: 'bg-white',
    accent: 'text-slate-200',
  },
  carbon: {
    primary: '#f3f4f6',
    glow: 'rgba(243, 244, 246, 0.25)',
    gradient: 'from-zinc-500/10 to-stone-600/5',
    bg: 'bg-zinc-300',
    accent: 'text-zinc-400',
  },
};

export const INITIAL_CAR_SPECS: CarSpecs = {
  engine: 'M54B30 3.0L Double-VANOS Inline-6',
  hp: 231,
  torque: 300,
  zeroToHundred: 7.1,
  weight: 1535,
  topSpeed: 250,
  ecuStage: 0,
  exhaustUpgraded: false,
  intakeUpgraded: false,
};

export const INITIAL_TRIPS: TripLog[] = [
  {
    id: 'trip-1',
    title: 'Night Cruise in Yerevan',
    date: 'May 22, 2026',
    distance: 42.6,
    topSpeed: 145,
    avgConsumption: 9.8,
    duration: '0h 45m',
    type: 'cruise',
  },
  {
    id: 'trip-2',
    title: 'Dilijan Interceptor Run',
    date: 'May 18, 2026',
    distance: 110.2,
    topSpeed: 184,
    avgConsumption: 11.2,
    duration: '1h 24m',
    type: 'speed_run',
  },
  {
    id: 'trip-3',
    title: 'Scenic Lake Sevan Highway',
    date: 'May 10, 2026',
    distance: 185.0,
    topSpeed: 120,
    avgConsumption: 8.4,
    duration: '2h 10m',
    type: 'scenic',
  },
];

export const UPGRADE_ITEMS = [
  {
    id: 'upgrade-1',
    name: 'Stage 1 ECU Dynamic Flash',
    description: 'Recalibrates ignition curves, advances double-VANOS timing, and raises redline to 6800 RPM.',
    hpGain: 18,
    torqueGain: 22,
    topSpeedGain: 12,
    cost: 450,
    type: 'ecu',
  },
  {
    id: 'upgrade-2',
    name: 'Eisenmann Sport Exhaust',
    description: 'High-performance stainless steel exhaust system restoring the legendary throatiness of the inline-6.',
    hpGain: 11,
    torqueGain: 10,
    topSpeedGain: 4,
    cost: 850,
    type: 'exhaust',
  },
  {
    id: 'upgrade-3',
    name: 'aFe Dual-Cone Cold Air Intake',
    description: 'Increases manifold pressure and reduces intake charge temperature with custom carbon fiber shroud.',
    hpGain: 8,
    torqueGain: 7,
    topSpeedGain: 2,
    cost: 320,
    type: 'intake',
  },
];

export const OBD_CODES = [
  { code: 'P0171', system: 'Fuel Trim', status: 'Healthy', description: 'System Too Lean (Bank 1) - Monitored and adaptively compensated.' },
  { code: 'P0300', system: 'Ignition System', status: 'Healthy', description: 'Random/Multiple Cylinder Misfire - Coil packs firing perfectly at standard voltage.' },
  { code: 'P1520', system: 'VANOS Actuator', status: 'Healthy', description: 'Intake Camshaft Position Actuator - Dual VANOS response cycles fully clean.' },
  { code: 'P0420', system: 'Emission Control', status: 'Healthy', description: 'Catalyst System Efficiency Below Threshold - Flow rate stabilized (Sport Muffler active).' },
];
