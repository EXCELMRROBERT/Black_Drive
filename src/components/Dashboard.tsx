import { useState, useEffect, Dispatch, SetStateAction, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, X, Navigation, Volume2, ShieldCheck, Activity, Gamepad2, Cloud, Sun, CloudRain, CloudLightning, Wind, Thermometer, Clock } from 'lucide-react';
import Speedometer from './Speedometer';
import AmbientBackground from './AmbientBackground';
import { DriverProfile, SimulationState } from '../types';
import { THEMES } from '../utils';

import { ThemeColor } from '../types';
import carNightImg from '../assets/images/bmw_e39_night_1779564092063.png';
import carHeadlightsImg from '../assets/images/bmw_e39_headlights_1779642011494.png';

// Helper to calculate exact distance in meters between two geolocations
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface DashboardProps {
  profile: DriverProfile;
  setProfile: Dispatch<SetStateAction<DriverProfile>>;
  simulation: SimulationState;
  setSimulation: Dispatch<SetStateAction<SimulationState>>;
  setTheme: (theme: ThemeColor) => void;
  triggerStartup?: () => void;
  isStartupActive?: boolean;
  showSettings?: boolean;
  setShowSettings?: (val: boolean) => void;
}

export default function Dashboard({
  profile,
  setProfile,
  simulation,
  setSimulation,
  setTheme,
  triggerStartup,
  isStartupActive,
  showSettings: showSettingsProp,
  setShowSettings: setShowSettingsProp,
}: DashboardProps) {
  const currentTheme = THEMES[profile.theme];
  const [isHoldingGas, setIsHoldingGas] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [localShowSettings, setLocalShowSettings] = useState(false);
  const showSettings = showSettingsProp !== undefined ? showSettingsProp : localShowSettings;
  const setShowSettings = setShowSettingsProp !== undefined ? setShowSettingsProp : setLocalShowSettings;

  const [weatherData, setWeatherData] = useState<{ temp: number; city: string; code: number } | null>(null);
  const [driveTimeSec, setDriveTimeSec] = useState(3060);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'SEARCHING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsMockActive, setGpsMockActive] = useState(false);
  const [displayedAccuracy, setDisplayedAccuracy] = useState<string>('0.0');

  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  // Use ref for isBraking to avoid physics loop dep churn
  const isBrakingRef = useRef(simulation.isBraking);
  useEffect(() => { isBrakingRef.current = simulation.isBraking; }, [simulation.isBraking]);

  // Accumulate drive time without extra state setter in loop
  const driveTimeRef = useRef(driveTimeSec);
  useEffect(() => { driveTimeRef.current = driveTimeSec; }, [driveTimeSec]);

  // Derived trip data via memo — no extra state needed
  const tripData = useMemo(() => {
    const dist = simulation.tripKm + 42.0;
    const avg = driveTimeSec > 0 ? dist / (driveTimeSec / 3600) : 57.0;
    return { distance: dist, avgSpeed: avg, time: driveTimeSec };
  }, [simulation.tripKm, driveTimeSec]);

  useEffect(() => {
    if (gpsStatus === 'CONNECTED') {
      const inter = setInterval(() => {
        let base = gpsMockActive ? 12.5 : (gpsAccuracy || 8.0);
        const jitter = base + (Math.random() * 8 - 4);
        setDisplayedAccuracy(Math.max(2.5, jitter).toFixed(1));
      }, 1500);
      return () => clearInterval(inter);
    }
  }, [gpsStatus, gpsAccuracy, gpsMockActive]);

  useEffect(() => {
    if (!profile.gpsMode) {
      setGpsStatus('IDLE');
      setGpsAccuracy(null);
      prevPosRef.current = null;
      prevTimeRef.current = null;
      return;
    }

    setGpsStatus('SEARCHING');

    const handleSuccess = (position: GeolocationPosition) => {
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;
      const currentTime = position.timestamp;
      let speedKmh = 0;

      if (position.coords.speed !== null && position.coords.speed >= 0) {
        speedKmh = position.coords.speed * 3.6;
      } else {
        if (prevPosRef.current && prevTimeRef.current) {
          const distanceMeters = getDistanceMeters(
            prevPosRef.current.lat, prevPosRef.current.lng,
            currentLat, currentLng
          );
          const timeSec = (currentTime - prevTimeRef.current) / 1000;
          if (timeSec > 0.5 && timeSec < 15) {
            const speedKmhCalc = (distanceMeters / timeSec) * 3.6;
            if (speedKmhCalc > 1.5 && speedKmhCalc < 300) speedKmh = speedKmhCalc;
          }
        }
      }

      prevPosRef.current = { lat: currentLat, lng: currentLng };
      prevTimeRef.current = currentTime;

      if (gpsMockActive) speedKmh = 42 + Math.sin(Date.now() / 4000) * 10;

      setGpsStatus('CONNECTED');
      setGpsAccuracy(position.coords.accuracy);

      setSimulation((prev) => {
        let calculatedGear = 1;
        let calculatedRpm = 700;
        if (speedKmh > 115) { calculatedGear = 5; calculatedRpm = 2000 + ((speedKmh - 110) * 45); }
        else if (speedKmh > 80) { calculatedGear = 4; calculatedRpm = 2100 + ((speedKmh - 80) * 55); }
        else if (speedKmh > 48) { calculatedGear = 3; calculatedRpm = 2100 + ((speedKmh - 48) * 65); }
        else if (speedKmh > 18) { calculatedGear = 2; calculatedRpm = 2100 + ((speedKmh - 18) * 85); }
        else if (speedKmh > 0) { calculatedGear = 1; calculatedRpm = 700 + (speedKmh * 110); }
        calculatedRpm = Math.min(6500, Math.max(700, Math.round(calculatedRpm)));
        return {
          ...prev,
          speed: speedKmh,
          rpm: calculatedRpm,
          gear: calculatedGear,
          throttle: speedKmh > 0 ? 0.25 + (speedKmh / 260) * 0.5 : 0,
        };
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn('GPS Error:', error);
      setGpsStatus('ERROR');
      if (!gpsMockActive) setSimulation(prev => ({ ...prev, speed: 0, rpm: 700, gear: 1 }));
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile.gpsMode, gpsMockActive, setSimulation]);

  // GPS mock drive
  useEffect(() => {
    if (!profile.gpsMode || !gpsMockActive) return;
    const interval = setInterval(() => {
      setSimulation((prev) => {
        const mockSpeed = 48 + Math.sin(Date.now() / 4500) * 12;
        const calculatedGear = mockSpeed < 48 ? 2 : 3;
        const calculatedRpm = 1850 + ((mockSpeed - 40) * 45);
        return { ...prev, speed: mockSpeed, rpm: Math.round(calculatedRpm), gear: calculatedGear, throttle: 0.35 };
      });
    }, 200);
    return () => clearInterval(interval);
  }, [profile.gpsMode, gpsMockActive, setSimulation]);

  // ─── OPTIMIZED PHYSICS LOOP ────────────────────────────────────────────────
  // Runs at 250ms (4× per sec instead of 10×) — smoother for display, lighter on CPU.
  // Uses ref for isBraking so dep array is stable.
  const isHoldingGasRef = useRef(isHoldingGas);
  useEffect(() => { isHoldingGasRef.current = isHoldingGas; }, [isHoldingGas]);

  const transmissionRef = useRef(profile.transmission);
  useEffect(() => { transmissionRef.current = profile.transmission; }, [profile.transmission]);

  const gpsModeRef = useRef(profile.gpsMode);
  useEffect(() => { gpsModeRef.current = profile.gpsMode; }, [profile.gpsMode]);

  // Toast ref to avoid closure stale ref
  const toastTimerRef = useRef<number | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setShowToast(false), 2000);
  }, []);

  useEffect(() => {
    const INTERVAL_MS = 50; // 20fps for ultra-smooth number blurring
    const DT = INTERVAL_MS / 1000; // seconds per tick

    const timer = window.setInterval(() => {
      setSimulation((prev) => {
        // In GPS mode just update odometry
        if (gpsModeRef.current) {
          const distIncrement = (prev.speed / 3600) * DT;
          const fuelConsumption = 0.005 + (prev.throttle * 0.015);
          return {
            ...prev,
            tripKm: prev.tripKm + distIncrement,
            odoKm: prev.odoKm + distIncrement,
            rangeKm: Math.max(30, prev.rangeKm - (distIncrement * (1 + fuelConsumption * 15))),
          };
        }

        const holding = isHoldingGasRef.current;
        const braking = isBrakingRef.current;

        let newThrottle = prev.throttle;
        if (holding) {
          newThrottle = Math.min(1, prev.throttle + 0.08 * (INTERVAL_MS / 100));
        } else if (braking) {
          newThrottle = Math.max(0, prev.throttle - 0.15 * (INTERVAL_MS / 100));
        } else {
          newThrottle = Math.max(0, prev.throttle - 0.05 * (INTERVAL_MS / 100));
        }

        const gearRatios = [0, 3.5, 2.1, 1.4, 1.0, 0.8];
        const currentGear = prev.gear;
        let targetRpm = 700;
        if (newThrottle > 0) {
          const gearMultiplier = gearRatios[currentGear] || 1;
          targetRpm = 700 + newThrottle * (5800 / Math.sqrt(gearMultiplier));
        }

        const rpmClimbRate = (180 + (newThrottle * 150)) * (INTERVAL_MS / 100);
        let updatedRpm = prev.rpm;
        if (holding) {
          updatedRpm = Math.min(6500, prev.rpm + rpmClimbRate);
        } else if (braking) {
          updatedRpm = Math.max(700, prev.rpm - 400 * (INTERVAL_MS / 100));
        } else {
          updatedRpm = Math.max(700, prev.rpm - 120 * (INTERVAL_MS / 100));
        }

        let updatedGear = prev.gear;
        if (transmissionRef.current === 'AUTO') {
          if (updatedRpm > 4800 && updatedGear < 5) {
            updatedGear += 1;
            updatedRpm = 2200;
            triggerToast(`Shift Up → Gear ${updatedGear}`);
          } else if (updatedRpm < 1500 && updatedGear > 1) {
            updatedGear -= 1;
            updatedRpm = 3200;
          }
        }

        const gearRatio = gearRatios[updatedGear] || 1;
        const targetSpeed = (updatedRpm / 6500) * (260 / (gearRatio * 0.7));
        let updatedSpeed = prev.speed;
        if (holding) {
          updatedSpeed = prev.speed + (targetSpeed - prev.speed) * 0.06 * (INTERVAL_MS / 100);
        } else if (braking) {
          updatedSpeed = Math.max(0, prev.speed - 12 * (INTERVAL_MS / 100));
        } else {
          updatedSpeed = Math.max(0, prev.speed - 0.8 * (INTERVAL_MS / 100));
        }
        updatedSpeed = Math.min(260, updatedSpeed);

        const distIncrement = (updatedSpeed / 3600) * DT;
        const fuelConsumption = 0.005 + (newThrottle * 0.015);

        return {
          ...prev,
          throttle: newThrottle,
          rpm: updatedRpm,
          gear: updatedGear,
          speed: updatedSpeed,
          tripKm: prev.tripKm + distIncrement,
          odoKm: prev.odoKm + distIncrement,
          rangeKm: Math.max(30, prev.rangeKm - (distIncrement * (1 + fuelConsumption * 15))),
        };
      });

      // Accumulate drive time
      driveTimeRef.current += DT;
      setDriveTimeSec(driveTimeRef.current);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — loop is stable via refs

  // Weather fetch
  useEffect(() => {
    async function fetchWeather() {
      try {
        const lat = 40.1772;
        const lon = 44.5035;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          setWeatherData({ temp: Math.round(data.current_weather.temperature), city: 'Yerevan', code: data.current_weather.weathercode });
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard binds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') { e.preventDefault(); setIsHoldingGas(true); }
      if (e.code === 'KeyB') setSimulation(prev => ({ ...prev, isBraking: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsHoldingGas(false);
      if (e.code === 'KeyB') setSimulation(prev => ({ ...prev, isBraking: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setSimulation]);

  const gearLabel = profile.transmission === 'AUTO'
    ? (simulation.speed === 0 ? 'P' : 'D')
    : simulation.gear;

  return (
    <div id="dashboard_screen" className="flex flex-col flex-1 h-full max-h-full relative overflow-hidden bg-transparent">
      <div className="flex flex-col w-full h-full">
        <AmbientBackground weatherCode={weatherData?.code} />

        {/* Bottom glow conduit */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] z-[60] pointer-events-none overflow-hidden">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ duration: 1.5, delay: 1.0 }}
            className="w-full h-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${currentTheme.primary}, ${currentTheme.primary}, transparent)`,
              boxShadow: `0 0 15px ${currentTheme.primary}, 0 0 30px ${currentTheme.primary}`
            }}
          />
        </div>

        {/* Glowing top divider */}
        <div className="relative h-[2px] w-full z-20 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-full h-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${currentTheme.primary}, ${currentTheme.primary}, transparent)`,
              boxShadow: `0 0 15px ${currentTheme.primary}, 0 0 30px ${currentTheme.primary}`
            }}
          />
        </div>

        {/* ── MAIN CONTENT AREA ─────────────────────────────────────── */}
        <main className="flex-1 flex w-full h-full overflow-hidden relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="w-full h-full z-10 overflow-hidden relative bg-slate-950/40 border-y border-white/10"
          >
            {/*
             * ── RESPONSIVE LAYOUT ──────────────────────────────────────
             * Portrait mobile (default): vertical stack, speedo dominates
             * Landscape / md+: side-by-side columns
             */}
            <div className="flex flex-col md:flex-row w-full h-full p-2 sm:p-3 gap-2">

              {/* ── LEFT COLUMN (car images) ─────────────────────────── */}
              {/* Hidden on portrait mobile, visible on landscape/md+ */}
              <div className="hidden md:flex flex-col w-[40%] h-full gap-2 shrink-0">
                {/* Main car photo */}
                <div className="flex-[60] relative z-10 flex items-center justify-center w-full h-0 min-h-0 grow">
                  <div
                    id="car_photo_container"
                    className="relative w-full h-full rounded-[14px] overflow-hidden shadow-2xl group"
                    style={{ boxShadow: `0 0 40px ${currentTheme.primary}15, 0 8px 32px rgba(0,0,0,0.8)` }}
                  >
                    <img
                      src={carNightImg}
                      alt="Glossy Black BMW E39 530i Under Streetlights at Night"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none opacity-50" />
                  </div>
                </div>
                {/* Headlights photo */}
                <div className="flex-[40] relative z-10 flex items-center justify-center w-full h-0 min-h-0 grow">
                  <div
                    id="car_headlights_container"
                    className="relative w-full h-full rounded-[10px] overflow-hidden group"
                    style={{ boxShadow: `0 0 30px ${currentTheme.primary}15, 0 4px 16px rgba(0,0,0,0.8)` }}
                  >
                    <img
                      src={carHeadlightsImg}
                      alt="BMW E39 Angel Eyes Headlights Glowing"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none opacity-50" />
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN (weather + speedometer) ─────────────── */}
              <div className="flex flex-col flex-1 min-w-0 h-full gap-2 overflow-hidden">

                {/* ── WEATHER CLOCK WIDGET ────────────────────────────── */}
                {/* On portrait: slim horizontal pill. On landscape/md+: card */}
                <div className="shrink-0 flex items-center justify-center">
                  <WeatherClock
                    profile={profile}
                    weather={weatherData}
                    tripData={tripData}
                  />
                </div>

                {/* ── SPEEDOMETER — takes all remaining height ─────────── */}
                <div className="flex-1 relative z-10 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                  <div className="w-full flex items-center justify-center px-1">
                    <Speedometer
                      speed={simulation.speed}
                      rpm={simulation.rpm}
                      gear={gearLabel}
                      rangeKm={simulation.rangeKm}
                      units={profile.units}
                      theme={profile.theme}
                      throttle={simulation.throttle}
                    />
                  </div>

                  {/* GPS badge */}
                  <div className="flex items-center justify-center space-x-1 mt-1.5 select-none z-20">
                    {profile.gpsMode && (
                      <div className="flex items-center space-x-1 bg-slate-900/40 border border-white/5 py-0.5 px-1.5 rounded-full">
                        <span className={`inline-block w-1 h-1 rounded-full ${
                          gpsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
                          gpsStatus === 'SEARCHING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500 animate-pulse'
                        }`} />
                        <span className="text-[6px] font-mono text-slate-300 font-extrabold tracking-widest uppercase">
                          {gpsStatus === 'CONNECTED' ? 'FIXED' : gpsStatus === 'SEARCHING' ? 'ACQUIRING...' : 'NO LIVE FIX'}
                        </span>
                        {gpsAccuracy !== null && (
                          <span className="text-[6px] font-mono text-slate-500">(±{displayedAccuracy}m)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>{/* end right column */}
            </div>{/* end main flex */}
          </motion.div>

          {/* ── SETTINGS OVERLAY ──────────────────────────────────────── */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => setShowSettings(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full max-w-[330px] bg-slate-950/95 border-2 border-slate-800 rounded-[32px] p-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] relative overflow-hidden"
                  style={{ borderColor: `${currentTheme.primary}45` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-[40px] pointer-events-none opacity-40 transition-colors duration-500"
                    style={{ backgroundColor: currentTheme.primary }}
                  />

                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" style={{ color: currentTheme.primary }} />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-100">Cockpit Aura System</span>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-left">

                    {/* Speedometer feed source */}
                    <div className="flex flex-col space-y-1.5 pt-2 border-t border-white/5 mt-2">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Speedometer Feed Source</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => setProfile({ ...profile, gpsMode: false })}
                          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                            !profile.gpsMode
                              ? 'bg-slate-900 border-white/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">Simulator</span>
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, gpsMode: true })}
                          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                            profile.gpsMode
                              ? 'bg-slate-900 border-white/20 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                              : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">GPS Feed</span>
                        </button>
                      </div>
                    </div>

                    {/* GPS mock drive */}
                    {profile.gpsMode && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/40 border border-white/5 rounded-2xl p-2.5 flex flex-col space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-widest text-slate-300 font-bold font-mono">Mock Drive / Demo</span>
                          <button
                            onClick={() => setGpsMockActive(prev => !prev)}
                            className={`px-2 py-0.5 rounded-md text-[7.5px] font-bold font-mono uppercase border transition-all cursor-pointer ${
                              gpsMockActive
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-950/80 border-white/5 text-slate-500'
                            }`}
                          >
                            {gpsMockActive ? 'ACTIVE' : 'OFF'}
                          </button>
                        </div>
                        <p className="text-[7.5px] text-slate-400 leading-normal font-sans">
                          Generates a realistic mock speed (35-60 km/h) if stationary. Disable to track live coordinates.
                        </p>
                      </motion.div>
                    )}

                    {/* Transmission & Units */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Transmission</span>
                        <div className="flex rounded-xl bg-slate-900/65 p-0.5 border border-white/5">
                          {['AUTO', 'MANUAL'].map((t) => (
                            <button
                              key={t}
                              onClick={() => setProfile(prev => ({ ...prev, transmission: t as any }))}
                              className={`flex-1 py-1.5 text-[8px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                                profile.transmission === t ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Units</span>
                        <div className="flex rounded-xl bg-slate-900/65 p-0.5 border border-white/5">
                          {['METRIC', 'IMPERIAL'].map((u) => (
                            <button
                              key={u}
                              onClick={() => setProfile(prev => ({ ...prev, units: u as any }))}
                              className={`flex-1 py-1.5 text-[8px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                                profile.units === u ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {u === 'METRIC' ? 'KM/H' : 'MPH'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Theme swatches */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Cockpit Backlight</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'red', name: 'M-Sport Red', color: 'bg-red-500' },
                          { id: 'blue', name: 'Cyber Blue', color: 'bg-cyan-400' },
                          { id: 'yellow', name: 'Sunset Amber', color: 'bg-yellow-400' },
                          { id: 'green', name: 'Green Hell', color: 'bg-emerald-500' }
                        ].map((btn) => {
                          const isActive = profile.theme === btn.id;
                          return (
                            <button
                              key={btn.id}
                              onClick={() => setTheme(btn.id as ThemeColor)}
                              className={`flex items-center space-x-2 p-2 rounded-xl border transition-all cursor-pointer active:scale-95 text-left select-none ${
                                isActive
                                  ? 'bg-slate-900 border-white/10 text-white'
                                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${btn.color} shrink-0`} />
                              <span className="text-[9.5px] font-bold tracking-tight">{btn.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Replay startup */}
                    <div className="pt-2">
                      <button
                        onClick={() => { setShowSettings(false); triggerStartup && triggerStartup(); }}
                        className="w-full py-2.5 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold tracking-widest uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <span>🎬 Replay Startup Cinematic</span>
                      </button>
                    </div>

                    {/* Footer status */}
                    <div className="pt-3 border-t border-white/5 flex flex-col space-y-1 select-none font-mono text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Cockpit State</span>
                        <span className="text-[8.5px] font-bold uppercase transition-all duration-500" style={{ color: currentTheme.primary }}>
                          {profile.theme} + {profile.gpsMode ? 'GPS' : 'SIM'}
                        </span>
                      </div>
                      <p className="text-[7.5px] text-slate-400 leading-normal">
                        Coordinate tracking is active. Open the Cockpit Companion tab on your mobile device to track real-time speeds!
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gear shift toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/95 border px-4 py-2 rounded-2xl flex items-center space-x-2 z-50 text-white shadow-2xl"
                style={{ borderColor: currentTheme.primary }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono tracking-widest font-semibold uppercase">{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── WEATHER CLOCK WIDGET ──────────────────────────────────────────────────────
// Memoized — only re-renders when weather or trip changes, not on every physics tick
const WeatherClock = memo(function WeatherClock({
  profile,
  weather,
  tripData
}: {
  profile: DriverProfile,
  weather: { temp: number; city: string; code: number } | null,
  tripData: { distance: number; avgSpeed: number; time: number }
}) {
  const [time, setTime] = useState(new Date());
  const currentTheme = THEMES[profile.theme];

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} min`;
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const WeatherIcon = () => {
    if (!weather) return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    const code = weather.code;
    if (code === 0) return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    if (code <= 3) return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
    if (code <= 67) return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
    if (code <= 99) return <CloudLightning className="w-3.5 h-3.5 text-violet-400" />;
    return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
  };

  return (
    <div className="w-full max-w-full select-none">
      {/*
       * Portrait mobile: horizontal pill with time + weather + 3 stats in a row
       * Landscape / md+: original vertical card layout
       */}

      {/* ── PORTRAIT PILL OR SHORT SCREENS (shown on mobile portrait OR landscape mobile, hidden on tall desktop) ── */}
      <div className="flex md:hidden [@media(max-height:650px)]:!flex items-center justify-between gap-2 bg-slate-900/50 backdrop-blur-sm border border-white/8 rounded-2xl px-3 py-2 w-full">
        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0" style={{ color: currentTheme.primary }} />
          <span className="text-base font-black tracking-tighter text-white font-mono leading-none">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 shrink-0" />

        {/* Weather */}
        <div className="flex items-center gap-1">
          <WeatherIcon />
          <span className="text-[9px] font-bold text-slate-300 font-mono">{weather?.temp ?? '--'}°C</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 shrink-0" />

        {/* Trip stats — compact */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-slate-500 uppercase tracking-wider font-bold leading-none">DIST</span>
            <span className="text-[10px] font-bold text-white font-mono leading-tight">{tripData.distance.toFixed(0)}km</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-slate-500 uppercase tracking-wider font-bold leading-none">AVG</span>
            <span className="text-[10px] font-bold text-white font-mono leading-tight">{Math.max(0, tripData.avgSpeed).toFixed(0)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-slate-500 uppercase tracking-wider font-bold leading-none">TIME</span>
            <span className="text-[10px] font-bold text-white font-mono leading-tight">{formatTime(tripData.time)}</span>
          </div>
        </div>
      </div>

      {/* ── DESKTOP / TALL CARD (hidden on portrait mobile and short screens) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden md:flex [@media(max-height:650px)]:!hidden flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[32px] px-5 py-4 rounded-[26px] transition-all duration-500 w-full relative overflow-hidden"
        style={{ boxShadow: `0 0 35px ${currentTheme.primary}10, 0 15px 40px rgba(0,0,0,0.6)` }}
      >
        {/* Glow orbs */}
        <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none" style={{ backgroundColor: currentTheme.primary }} />
        <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none" style={{ backgroundColor: currentTheme.primary }} />

        {/* Time + Weather */}
        <div className="flex flex-col items-center space-y-2 relative z-10">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" style={{ color: currentTheme.primary }} />
            <span className="text-3xl font-black tracking-tighter text-white font-mono leading-none">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <WeatherIcon />
            <span className="text-[8px] font-bold text-slate-300 font-mono uppercase tracking-[0.05em]">
              {weather?.city || 'Yerevan'}: {weather?.temp ?? '--'}°C
            </span>
          </div>
        </div>

        <div className="block w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3 relative z-10" />

        {/* Trip stats */}
        <div className="flex flex-col w-full relative z-10">
          <div className="flex items-center space-x-1.5 mb-2">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">Journal Today</span>
          </div>
          <div className="flex flex-col space-y-1.5">
            {[
              { label: 'Distance', value: `${tripData.distance.toFixed(0)} km` },
              { label: 'Avg Speed', value: `${Math.max(0, tripData.avgSpeed).toFixed(0)} km/h` },
              { label: 'Time', value: formatTime(tripData.time) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
                <span className="text-[11px] font-bold text-white font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
