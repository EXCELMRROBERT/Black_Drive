export type ThemeColor = 'blue' | 'amber' | 'red' | 'green' | 'carbon' | 'yellow';

export interface ThemeColors {
  primary: string;
  glow: string;
  gradient: string;
  bg: string;
  accent: string;
}

export interface DriverProfile {
  name: string;
  carModel: string;
  transmission: 'AUTO' | 'MANUAL';
  units: 'METRIC' | 'IMPERIAL';
  theme: ThemeColor;
  audioEngine: boolean;
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
