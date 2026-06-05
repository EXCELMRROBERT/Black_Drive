export type ThemeColor = 'blue' | 'amber' | 'red' | 'green' | 'carbon' | 'yellow' | 'purple' | 'white';

export interface ThemeColors {
  primary: string;
  glow: string;
  gradient: string;
  bg: string;
  accent: string;
}

export type MapTheme = 'SAN_ANDREAS' | 'DARK_MINIMAL';
export type HudStyle = 
  | 'MODERN_ARC' | 'CLASSIC_M_DIAL' | 'RADAR_SWEEP' | 'HEX_CORE' | 'LUXURY_CHRONO'
  | 'NEON_PULSE' | 'MINIMAL_GLASS' | 'VIPER_FANG' | 'CRYSTAL_PRISM' | 'QUANTUM_HOLO'
  | 'LIQUID_CHROME' | 'CARBON_APEX' | 'AERO_FLUID' | 'ZENITH_RING' | 'TITANIUM_CORE';

export interface DriverProfile {
  name: string;
  carModel: string;
  transmission: 'AUTO' | 'MANUAL';
  units: 'METRIC' | 'IMPERIAL';
  theme: ThemeColor;
  mapTheme: MapTheme;
  hudStyle: HudStyle;
  gpsMode?: boolean;
  videoSimulation?: boolean;
}

export interface CarSpecs {
  engine: string;
  hp: number;
  torque: number;
  zeroToHundred: number;
  weight: number;
  topSpeed: number;
  ecuStage: number;
  exhaustUpgraded: boolean;
  intakeUpgraded: boolean;
}

export interface TripLog {
  id: string;
  title: string;
  date: string;
  distance: number;
  topSpeed: number;
  avgConsumption: number;
  duration: string;
  type: 'cruise' | 'speed_run' | 'scenic';
}

export interface SimulationState {
  isActive: boolean;
  speed: number;
  rpm: number;
  gear: number;
  rangeKm: number;
  tripKm: number;
  odoKm: number;
  throttle: number; // 0 to 1
  isBraking: boolean;
  fuelPct: number;
}
