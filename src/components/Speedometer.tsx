import { memo } from 'react';
import { ThemeColor, HudStyle } from '../types';

import HudModernArc from './huds/HudModernArc';
import HudClassicMDial from './huds/HudClassicMDial';
import HudRadarSweep from './huds/HudRadarSweep';
import HudHexCore from './huds/HudHexCore';
import HudLuxuryChrono from './huds/HudLuxuryChrono';

import HudNeonPulse from './huds/HudNeonPulse';
import HudMinimalGlass from './huds/HudMinimalGlass';
import HudViperFang from './huds/HudViperFang';
import HudCrystalPrism from './huds/HudCrystalPrism';
import HudQuantumHolo from './huds/HudQuantumHolo';
import HudLiquidChrome from './huds/HudLiquidChrome';
import HudCarbonApex from './huds/HudCarbonApex';
import HudAeroFluid from './huds/HudAeroFluid';
import HudZenithRing from './huds/HudZenithRing';
import HudTitaniumCore from './huds/HudTitaniumCore';

interface SpeedometerWrapperProps {
  speed: number;
  rpm: number;
  gear: string | number;
  rangeKm: number;
  units: 'METRIC' | 'IMPERIAL';
  theme: ThemeColor;
  throttle: number;
  hudStyle: HudStyle;
}

function SpeedometerSelector(props: SpeedometerWrapperProps) {
  const { hudStyle, ...restProps } = props;

  switch (hudStyle) {
    case 'MODERN_ARC': return <HudModernArc {...restProps} />;
    case 'CLASSIC_M_DIAL': return <HudClassicMDial {...restProps} />;
    case 'RADAR_SWEEP': return <HudRadarSweep {...restProps} />;
    case 'HEX_CORE': return <HudHexCore {...restProps} />;
    case 'LUXURY_CHRONO': return <HudLuxuryChrono {...restProps} />;
    case 'NEON_PULSE': return <HudNeonPulse {...restProps} />;
    case 'MINIMAL_GLASS': return <HudMinimalGlass {...restProps} />;
    case 'VIPER_FANG': return <HudViperFang {...restProps} />;
    case 'CRYSTAL_PRISM': return <HudCrystalPrism {...restProps} />;
    case 'QUANTUM_HOLO': return <HudQuantumHolo {...restProps} />;
    case 'LIQUID_CHROME': return <HudLiquidChrome {...restProps} />;
    case 'CARBON_APEX': return <HudCarbonApex {...restProps} />;
    case 'AERO_FLUID': return <HudAeroFluid {...restProps} />;
    case 'ZENITH_RING': return <HudZenithRing {...restProps} />;
    case 'TITANIUM_CORE': return <HudTitaniumCore {...restProps} />;
    default: return <HudModernArc {...restProps} />;
  }
}

export default memo(SpeedometerSelector);
