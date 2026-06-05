import { memo } from 'react';
import { ThemeColor, HudStyle } from '../types';
import HudModernArc from './huds/HudModernArc';
import HudClassicMDial from './huds/HudClassicMDial';
import HudRadarSweep from './huds/HudRadarSweep';
import HudHexCore from './huds/HudHexCore';
import HudLuxuryChrono from './huds/HudLuxuryChrono';

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
    case 'MODERN_ARC':
      return <HudModernArc {...restProps} />;
    case 'CLASSIC_M_DIAL':
      return <HudClassicMDial {...restProps} />;
    case 'RADAR_SWEEP':
      return <HudRadarSweep {...restProps} />;
    case 'HEX_CORE':
      return <HudHexCore {...restProps} />;
    case 'LUXURY_CHRONO':
      return <HudLuxuryChrono {...restProps} />;
    default:
      return <HudModernArc {...restProps} />;
  }
}

export default memo(SpeedometerSelector);
