import { useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, X, Navigation, Compass, Volume2, ShieldCheck, Activity, Gamepad2, Cloud, Sun, CloudRain, CloudLightning, Wind, Thermometer, Clock } from 'lucide-react';
import Speedometer from './Speedometer';
import AmbientBackground from './AmbientBackground';
import { DriverProfile, SimulationState } from '../types';
import { THEMES } from '../utils';

import { ThemeColor } from '../types';
import carNightImg from '../assets/images/bmw_e39_night_1779564092063.png';
import carHeadlightsImg from '../assets/images/bmw_e39_headlights_1779642011494.png';

interface DashboardProps {
  profile: DriverProfile;
  setProfile: Dispatch<SetStateAction<DriverProfile>>;
  simulation: SimulationState;
  setSimulation: Dispatch<SetStateAction<SimulationState>>;
  setTheme: (theme: ThemeColor) => void;
  triggerStartup?: () => void;
  isStartupActive?: boolean;
}

export default function Dashboard({
  profile,
  setProfile,
  simulation,
  setSimulation,
  setTheme,
  triggerStartup,
  isStartupActive,
}: DashboardProps) {
  const currentTheme = THEMES[profile.theme];
  const [isHoldingGas, setIsHoldingGas] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // MONITOR ORIENTATION FOR FORCED ROTATED MODE
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
  const [weatherData, setWeatherData] = useState<{ temp: number; city: string; code: number } | null>(null);
  const [driveTimeSec, setDriveTimeSec] = useState(3060); // Starts at 51 min
  const [tripDist, setTripDist] = useState(42.0); // Starts at 42 km
  const [avgSpd, setAvgSpd] = useState(57.0); // Starts at 57 km/h

  // GPS state indicators
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'SEARCHING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsMockActive, setGpsMockActive] = useState(false);

  // Real GPS Geolocation Tracker
  const [displayedAccuracy, setDisplayedAccuracy] = useState<string>('0.0');

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
      return;
    }

    setGpsStatus('SEARCHING');

    const handleSuccess = (position: GeolocationPosition) => {
      let speedKmh = 0;
      if (position.coords.speed !== null && position.coords.speed >= 0) {
        speedKmh = position.coords.speed * 3.6;
      } else if (gpsMockActive) {
        // Fallback or demo offset if mock is active
        speedKmh = 42 + Math.sin(Date.now() / 4000) * 10;
      }

      setGpsStatus('CONNECTED');
      setGpsAccuracy(position.coords.accuracy);

      setSimulation((prev) => {
        // Compute realistic RPM and Gear maps dynamically from the speed
        let calculatedGear = 1;
        let calculatedRpm = 700;

        if (speedKmh > 115) {
          calculatedGear = 5;
          calculatedRpm = 2000 + ((speedKmh - 110) * 45);
        } else if (speedKmh > 80) {
          calculatedGear = 4;
          calculatedRpm = 2100 + ((speedKmh - 80) * 55);
        } else if (speedKmh > 48) {
          calculatedGear = 3;
          calculatedRpm = 2100 + ((speedKmh - 48) * 65);
        } else if (speedKmh > 18) {
          calculatedGear = 2;
          calculatedRpm = 2100 + ((speedKmh - 18) * 85);
        } else if (speedKmh > 0) {
          calculatedGear = 1;
          calculatedRpm = 700 + (speedKmh * 110);
        }

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
      console.warn('GPS Error or Denied:', error);
      setGpsStatus('ERROR');
      
      // Keep simulation speed at 0 if no mock in error case
      if (!gpsMockActive) {
        setSimulation(prev => ({ ...prev, speed: 0, rpm: 700, gear: 1 }));
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [profile.gpsMode, gpsMockActive, setSimulation]);

  // Support demo drive simulated updates for GPS mock model
  useEffect(() => {
    if (!profile.gpsMode || !gpsMockActive) return;

    const interval = setInterval(() => {
      setSimulation((prev) => {
        const mockSpeed = 48 + Math.sin(Date.now() / 4500) * 12;
        let calculatedGear = 3;
        let calculatedRpm = 1850 + ((mockSpeed - 40) * 45);
        if (mockSpeed < 48) {
          calculatedGear = 2;
        } else if (mockSpeed < 80) {
          calculatedGear = 3;
        }

        return {
          ...prev,
          speed: mockSpeed,
          rpm: Math.round(calculatedRpm),
          gear: calculatedGear,
          throttle: 0.35,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [profile.gpsMode, gpsMockActive, setSimulation]);

  // Handle user holding simulated gas pedal
  useEffect(() => {
    let timer: number;
    const updatePhysics = () => {
      setSimulation((prev) => {
        if (profile.gpsMode) {
          const distanceIncrement = (prev.speed / 3600) * 0.1; // km per 100ms cycle
          const updatedTrip = prev.tripKm + distanceIncrement;
          const updatedOdo = prev.odoKm + distanceIncrement;
          const fuelConsumption = 0.005 + (prev.throttle * 0.015);
          const updatedRange = Math.max(30, prev.rangeKm - (distanceIncrement * (1 + fuelConsumption * 15)));
          
          return {
            ...prev,
            tripKm: updatedTrip,
            odoKm: updatedOdo,
            rangeKm: updatedRange,
          };
        }

        let newThrottle = prev.throttle;
        let newIsBraking = prev.isBraking;

        if (isHoldingGas) {
          // Accelerating!
          newThrottle = Math.min(1, prev.throttle + 0.08);
          newIsBraking = false;
        } else if (prev.isBraking) {
          // Braking!
          newThrottle = Math.max(0, prev.throttle - 0.15);
        } else {
          // Passive coasting friction
          newThrottle = Math.max(0, prev.throttle - 0.05);
        }

        // RPM calculation based on throttle and gear
        let targetRpm = 700; // idle
        const gearRatios = [0, 3.5, 2.1, 1.4, 1.0, 0.8]; // 5 speed ratio multipliers
        const currentGear = prev.gear;
        
        if (newThrottle > 0) {
          // RPM climbs towards a calculated limit for the gear
          const gearMultiplier = gearRatios[currentGear] || 1;
          const maxRpmForGear = 6500;
          targetRpm = 700 + newThrottle * (5800 / Math.sqrt(gearMultiplier));
        }

        // Multiplier based on upgrades to add a racing spec stage tuning
        let rpmClimbRate = 180 + (newThrottle * 150);
        let updatedRpm = prev.rpm;

        if (isHoldingGas) {
          updatedRpm = Math.min(6500, prev.rpm + rpmClimbRate);
        } else if (prev.isBraking) {
          updatedRpm = Math.max(700, prev.rpm - 400);
        } else {
          updatedRpm = Math.max(700, prev.rpm - 120);
        }

        // Automatic gear shifting simulation based on RPM thresholds
        let updatedGear = prev.gear;
        if (profile.transmission === 'AUTO') {
          if (updatedRpm > 4800 && updatedGear < 5) {
            updatedGear += 1;
            updatedRpm = 2200; // shift drop
            triggerToast(`Shift Up to Gear ${updatedGear}`);
          } else if (updatedRpm < 1500 && updatedGear > 1) {
            updatedGear -= 1;
            updatedRpm = 3200; // shift bump
          }
        }

        // Speed calculation proportional to RPM and Gear
        const gearRatio = gearRatios[updatedGear] || 1;
        const targetSpeed = (updatedRpm / 6500) * (260 / (gearRatio * 0.7));
        
        let updatedSpeed = prev.speed;
        if (isHoldingGas) {
          updatedSpeed = prev.speed + (targetSpeed - prev.speed) * 0.06;
        } else if (prev.isBraking) {
          updatedSpeed = Math.max(0, prev.speed - 12);
        } else {
          // coasting friction
          updatedSpeed = Math.max(0, prev.speed - 0.8);
        }

        // Cap speed by topSpeed spec
        updatedSpeed = Math.min(260, updatedSpeed);

        // Odometer and Trip computations
        const distanceIncrement = (updatedSpeed / 3600) * 0.1; // km per 100ms cycle
        const updatedTrip = prev.tripKm + distanceIncrement;
        const updatedOdo = prev.odoKm + distanceIncrement;
        
        // Decaying fuel range as speed rises
        const fuelConsumption = 0.005 + (newThrottle * 0.015);
        const updatedRange = Math.max(30, prev.rangeKm - (distanceIncrement * (1 + fuelConsumption * 15)));

        return {
          ...prev,
          throttle: newThrottle,
          rpm: updatedRpm,
          gear: updatedGear,
          speed: updatedSpeed,
          tripKm: updatedTrip,
          odoKm: updatedOdo,
          rangeKm: updatedRange,
        };
      });
    };

    // run loop at 100ms interval
    timer = window.setInterval(() => {
      updatePhysics();
      // Update real-trip stats every second roughly
      setDriveTimeSec(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [isHoldingGas, simulation.isBraking, setSimulation, profile.transmission]);

  // Update averages periodically
  useEffect(() => {
    // Current trip distance based on simulation + base 42km
    const currentTotalDist = simulation.tripKm + 42.0;
    setTripDist(currentTotalDist);
    
    // Avg Speed = Total Distance / Total Time (in hours)
    if (driveTimeSec > 0) {
      const avg = currentTotalDist / (driveTimeSec / 3600);
      setAvgSpd(avg);
    }
  }, [simulation.speed, simulation.tripKm, driveTimeSec]);

  // Fetch weather at top level to share with background
  useEffect(() => {
    async function fetchWeather() {
      try {
        const lat = 40.1772; // Yerevan
        const lon = 44.5035;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          setWeatherData({
            temp: Math.round(data.current_weather.temperature),
            city: 'Yerevan',
            code: data.current_weather.weathercode
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather in Dashboard:", err);
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Physical keyboard binds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsHoldingGas(true);
      }
      if (e.code === 'KeyB') {
        setSimulation(prev => ({ ...prev, isBraking: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsHoldingGas(false);
      }
      if (e.code === 'KeyB') {
        setSimulation(prev => ({ ...prev, isBraking: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setSimulation]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // Convert gear representation
  const gearLabel = profile.transmission === 'AUTO' 
    ? (simulation.speed === 0 ? 'P' : 'D') 
    : simulation.gear;

  // Dynamic Gear shift notification banner overlay
  return (
    <div id="dashboard_screen" className="flex flex-col flex-1 h-full max-h-full justify-between pb-2 md:pb-4 relative overflow-hidden bg-black">
      {/* FORCE LANDSCAPE WRAPPER */}
      <div 
        className="flex flex-col w-full h-full transition-transform duration-500 ease-out origin-center"
        style={isPortrait ? {
          width: '100vh',
          height: '100vw',
          transform: 'rotate(90deg)',
          position: 'fixed',
          left: '50%',
          top: '50%',
          marginLeft: '-50vh',
          marginTop: '-50vw'
        } : {}}
      >
        <AmbientBackground weatherCode={weatherData?.code} />
      
      {/* BOTTOM GLOW CONDUIT */}
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
      
      {/* HEADER SECTION - greeting & machine badge */}
      <header className="flex items-center justify-between px-4 pt-1.5 pb-1 sm:pt-2 sm:pb-1.5 md:px-6 select-none shrink-0 bg-slate-950/10">
        <div className="flex flex-col">
            <motion.span 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center space-x-2"
          >
            <div className="flex items-center">
              <span>Hello</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400/80 animate-pulse ml-1" />
            </div>
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              filter: "blur(0px)"
            }}
            transition={{ 
              opacity: { duration: 1.2, ease: "easeOut", delay: 0.1 },
              scale: { duration: 1.0, ease: "easeOut", delay: 0.1 },
              filter: { duration: 0.8, ease: "easeOut", delay: 0.1 }
            }}
            className="text-[22px] sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-transparent select-none drop-shadow-[0_2px_8px_rgba(167,139,250,0.3)] font-sans mt-0.5 pb-0.5 whitespace-nowrap"
          >
            {profile.name.split('').map((char, index) => (
              <motion.span
                key={index}
                className="bg-gradient-to-r from-white via-indigo-300 via-sky-300 to-white bg-clip-text text-transparent inline-block"
                style={{ backgroundSize: '200% auto', backgroundPosition: `${(index / profile.name.length) * 100}% center` }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: isStartupActive ? 0 : 1, y: isStartupActive ? 5 : 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: isStartupActive ? 0 : (0.4 + index * 0.12), 
                  ease: "easeOut" 
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>
 
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.4 }}
            className="flex items-center space-x-3 mt-1"
          >
            <span className="text-[10px] md:text-xs text-slate-400 font-sans">
              Welcome back to your cockpit
            </span>
            <div className="flex items-center space-x-2">
              {[
                { id: 'red', color: 'bg-red-500' },
                { id: 'blue', color: 'bg-cyan-400' },
                { id: 'purple', color: 'bg-purple-500' },
                { id: 'white', color: 'bg-white' },
                { id: 'yellow', color: 'bg-yellow-500' },
                { id: 'green', color: 'bg-emerald-500' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`w-3 h-3 rounded-full ${t.color} border border-white/20 cursor-pointer hover:scale-125 transition-transform ${profile.theme === t.id ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-black' : ''}`}
                  title={`${t.id} theme`}
                />
              ))}
            </div>
          </motion.div>
        </div>
 
        {/* Settings button and BMW roundel badge Container */}
        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          
          {/* BMW OEM Retro-Futurist Badge Representation */}
          <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-900/40 border border-white/5 p-1 px-2.5 rounded-2xl shadow-xl shrink-0">
            {/* Authentic Vector BMW Roundel with written "BMW" branding */}
            <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-9 md:h-9 shrink-0 select-none filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <defs>
                <path id="bmw_text_path" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
                <linearGradient id="chrome_border" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>
 
              {/* Outer chrome container border */}
              <circle cx="50" cy="50" r="48" fill="url(#chrome_border)" />
              
              {/* Outer black ring body */}
              <circle cx="50" cy="50" r="45.5" fill="#090d16" />
 
              {/* High-Contrast "BMW" Branding Text matching the alignment of real emblem */}
              <text fill="#ffffff" className="font-sans font-black text-[12px] tracking-[6px] select-none" textAnchor="middle">
                <textPath href="#bmw_text_path" startOffset="50%">BMW</textPath>
              </text>
 
              {/* Inner chrome separator circle */}
              <circle cx="50" cy="50" r="28" fill="url(#chrome_border)" />
              
              {/* Inner quadrant base container */}
              <circle cx="50" cy="50" r="26.2" fill="#090d16" />
 
              {/* Authentic quadrant partition configuration */}
              {/* Top-Left: Sky Blue */}
              <path d="M 50,50 L 50,23.8 A 26.2,26.2 0 0,0 23.8,50 Z" className="fill-sky-400" />
              {/* Bottom-Left: White */}
              <path d="M 50,50 L 23.8,50 A 26.2,26.2 0 0,0 50,76.2 Z" className="fill-white" />
              {/* Bottom-Right: Sky Blue */}
              <path d="M 50,50 L 50,76.2 A 26.2,26.2 0 0,0 76.2,50 Z" className="fill-sky-400" />
              {/* Top-Right: White */}
              <path d="M 50,50 L 76.2,50 A 26.2,26.2 0 0,0 50,23.8 Z" className="fill-white" />
            </svg>
            <div className="flex flex-col">
              <h2 className="text-xs font-bold text-sky-450 tracking-tight leading-none">
                {profile.carModel}
              </h2>
              <span className="text-[7.5px] uppercase tracking-wider text-slate-450 mt-0.5 font-mono">
                YOUR MACHINE
              </span>
            </div>
          </div>
        </div>
      </header>
 
      {/* GLOWING DIVIDER */}
      <div className="relative h-px w-full overflow-hidden shrink-0 z-20">
        <div 
          className="absolute inset-0 opacity-40"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}, transparent)`,
            boxShadow: `0 0 12px ${currentTheme.primary}`
          }}
        />
      </div>

      {/* DASHBOARD HERO CONTAINER holding overlap image & cluster */}
      <main className="flex-1 flex flex-col items-center justify-center py-2 px-4 landscape:px-8 relative overflow-hidden min-h-0">
        
        {/* UNIFIED GLASS COCKPIT PANEL */}
        <div className="relative w-full max-w-[1200px] h-full max-h-[600px] flex flex-col items-center justify-center">
          
          {/* THE MIRRORED REFLECTION (Bottom Shadow/Reflection) */}
          <div className="absolute -bottom-[28%] left-0 w-full h-[40%] perspective-[1000px] pointer-events-none z-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 2, delay: 0.5 }}
              className="w-full h-full bg-slate-900/40 rounded-[48px] blur-[30px] scale-y-[-0.6] origin-top"
              style={{ 
                background: `linear-gradient(to bottom, ${currentTheme.primary}20, transparent)`,
                maskImage: 'linear-gradient(to top, black, transparent)'
              }}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="relative w-full h-full bg-slate-950/25 backdrop-blur-[45px] rounded-[48px] border-4 border-white/10 flex flex-row items-center justify-between p-4 md:p-10 lg:p-14 gap-2 md:gap-8 overflow-hidden group/cockpit z-10"
            style={{
              boxShadow: `
                0 0 160px rgba(0,0,0,0.9), 
                inset 0 0 0 4px ${currentTheme.primary}45,
                inset 0 0 60px ${currentTheme.primary}25,
                inset 0 0 100px rgba(255,255,255,0.1)
              `
            }}
          >
            {/* DYNAMIC INNER GLOW RIM PULSE */}
            <motion.div 
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.01, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-[48px] pointer-events-none z-0"
              style={{ 
                boxShadow: `inset 0 0 40px ${currentTheme.primary}30`,
                filter: 'blur(4px)'
              }}
            />

            {/* Specular Highlights & Urban Refraction Sheen */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-0" />
            <div className="absolute top-0 -left-[20%] w-[60%] h-full bg-gradient-to-r from-white/15 via-transparent to-transparent -rotate-[25deg] blur-3xl pointer-events-none z-0" />
            
            {/* ADDITIONAL SPECULAR EDGE LIGHTS */}
            <div className="absolute top-0 left-[15%] w-[1px] h-[100px] bg-white/20 blur-[1px] pointer-events-none z-0" />
            <div className="absolute top-[10%] right-0 w-[100px] h-[1px] bg-white/10 blur-[1px] pointer-events-none z-0" />

            {/* PRISMATIC URBAN REFLECTIONS (Cyberpunk/City Vibes) */}
            <div className="absolute -top-10 left-[10%] w-[35%] h-[45%] bg-cyan-500/15 blur-[100px] -rotate-12 pointer-events-none z-0" />
            <div className="absolute top-[20%] right-[2%] w-[30%] h-[40%] bg-purple-500/15 blur-[110px] rotate-12 pointer-events-none z-0" />
            <div className="absolute bottom-[5%] left-[35%] w-[25%] h-[35%] bg-amber-500/10 blur-[90px] pointer-events-none z-0" />
            <div className="absolute top-[40%] left-[60%] w-[15%] h-[20%] bg-emerald-500/10 blur-[80px] pointer-events-none z-0" />
            
            {/* SHIFTING LIGHT STREAKS - DYNAMIC REFLECTION */}
            <motion.div 
              animate={{ 
                x: [-200, 400, -200],
                opacity: [0.03, 0.12, 0.03]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[20%] -left-[10%] w-[140%] h-[3px] bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-12 blur-md pointer-events-none z-0"
            />
            <motion.div 
              animate={{ 
                x: [400, -200, 400],
                opacity: [0.02, 0.08, 0.02]
              }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[25%] -left-[10%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-6 blur-sm pointer-events-none z-0"
            />
            
            {/* THEME ACCENT GLOW (follows selection) */}
            <div 
              className="absolute -right-40 -bottom-40 w-[500px] h-[500px] rounded-full blur-[140px] opacity-30 pointer-events-none transition-colors duration-1000 z-0"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <div 
              className="absolute -left-30 -top-30 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 pointer-events-none transition-colors duration-1000 z-0"
              style={{ backgroundColor: currentTheme.primary }}
            />

            {/* LEFT/TOP STRUCTURE: Photography and Badges */}
            <div className="flex flex-col items-center justify-center w-[44%] max-w-[420px] scale-[0.8] md:scale-[0.9] lg:scale-100 transition-transform shrink min-h-0 relative z-10">
            {/* CAR PHOTO CONTAINER with rounded corners */}
            <div 
              id="car_photo_container" 
              className="relative w-full aspect-[1.8] rounded-[24px] overflow-hidden border transition-all duration-500 shadow-2xl group shrink"
              style={{ 
                borderColor: `${currentTheme.primary}40`,
                boxShadow: `0 0 40px ${currentTheme.primary}15, 0 12px 48px rgba(0,0,0,0.8)`
              }}
            >
              <img
                src={carNightImg}
                alt="Glossy Black BMW E39 530i Under Streetlights at Night"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              {/* Shading scrim layout overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none" />
            </div>

            {/* CAR HEADLIGHTS PHOTO CONTAINER with glowing angel eyes */}
            <div 
              id="car_headlights_container" 
              className="relative w-full h-24 md:h-32 rounded-[18px] overflow-hidden border transition-all duration-500 mt-2 sm:mt-3 group shrink"
              style={{ 
                borderColor: `${currentTheme.primary}40`,
                boxShadow: `0 0 30px ${currentTheme.primary}15, 0 8px 32px rgba(0,0,0,0.8)`
              }}
            >
              <img
                src={carHeadlightsImg}
                alt="Sleek BMW E39 Angel Eyes Headlights Glowing"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              {/* Shading scrim layout overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25" />
            </div>

            {/* REAL-TIME INPUT & GPS STATE BADGE INDICATOR */}
            <div className="flex items-center space-x-1.5 mt-3 select-none z-20 min-h-[1.5rem]">
              {profile.gpsMode && (
                <div className="flex items-center space-x-1.5 bg-slate-900/40 border border-white/5 py-1 px-2.5 rounded-full transition-all">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    gpsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
                    gpsStatus === 'SEARCHING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500 animate-pulse'
                  }`} />
                  <span className="text-[7.5px] font-mono text-slate-300 font-extrabold tracking-widest uppercase">
                    {gpsStatus === 'CONNECTED' ? 'FIXED' : gpsStatus === 'SEARCHING' ? 'ACQUIRING...' : 'NO LIVE FIX'}
                  </span>
                  {gpsAccuracy !== null && (
                    <span className="text-[7px] font-mono text-slate-500">
                      (±{displayedAccuracy}m)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT/BOTTOM STRUCTURE: OVERLAY CLUSTER AREA - SPEEDOMETER WITH SPACING BUDGETED FOR ITS SCALE */}
          <div className="w-[52%] z-10 px-0 sm:px-2 relative h-full flex flex-col items-center justify-center grow shrink min-w-0 scale-[0.75] md:scale-[0.9] lg:scale-100 transition-transform">
            
            {/* WEATHER & TIME WIDGET (ABOVE SPEEDOMETER) */}
            <WeatherClock 
              profile={profile} 
              weather={weatherData} 
              tripData={{
                distance: tripDist,
                avgSpeed: avgSpd,
                time: driveTimeSec
              }}
            />

            {/* ELEGANT TECH-CONDUIT CONNECTOR */}
            <div className="flex flex-col items-center -mt-1 mb-1 relative z-0">
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 20, opacity: 1 }}
                transition={{ duration: 1.0, delay: 0.8 }}
                className="w-0.5 bg-gradient-to-b from-white/20 via-white/5 to-transparent relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/10 border border-white/10" />
              </motion.div>
            </div>

            <div className="w-full flex items-center justify-center -mt-2">
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
          </div>
        </motion.div>

        {/* AMBIENT SETTINGS OVERLAY MODAL */}
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
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-full max-w-[330px] bg-slate-950/95 border-2 border-slate-800 rounded-[32px] p-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] relative overflow-hidden"
                style={{ borderColor: `${currentTheme.primary}45` }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Embedded Ambient Glow background */}
                <div 
                  className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-[40px] pointer-events-none opacity-40 transition-colors duration-500"
                  style={{ backgroundColor: currentTheme.primary }}
                />

                {/* Header of Settings Panel */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-indigo-400" style={{ color: currentTheme.primary }} />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-100">
                      Cockpit Aura System
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Aura Selector Inside Settings */}
                <div className="flex flex-col space-y-4 max-h-[55vh] overflow-y-auto pr-1 text-left scrollbar-thin">
                  
            {/* SPEEDOMETER FEED SOURCE */}
            <div className="flex flex-col space-y-1.5 pt-2 border-t border-white/5 mt-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                Speedometer Feed Source
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setProfile({ ...profile, gpsMode: false })}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border transition-all duration-200 cursor-pointer ${
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
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border transition-all duration-200 cursor-pointer ${
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

                  {/* SPEEDOMETER FEED SOURCE END */}

                  {/* Cockpit Simulation Options */}

                  {/* GPS SPECIFIC COMPANION OPTIONS */}
                  {profile.gpsMode && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-slate-900/40 border border-white/5 rounded-2xl p-2.5 flex flex-col space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-widest text-slate-300 font-bold font-mono">
                          Mock Drive / Demo
                        </span>
                        <button
                          onClick={() => setGpsMockActive(prev => !prev)}
                          className={`px-2 py-0.5 rounded-md text-[7.5px] font-bold font-mono uppercase border transition-all cursor-pointer ${
                            gpsMockActive
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm'
                              : 'bg-slate-950/80 border-white/5 text-slate-500'
                          }`}
                        >
                          {gpsMockActive ? 'ACTIVE' : 'OFF'}
                        </button>
                      </div>
                      <p className="text-[7.5px] text-slate-400 leading-normal font-sans">
                        Generates a realistic mock speed (35-60 km/h) if stationary inside the room. Disable to track live coordinates.
                      </p>
                    </motion.div>
                  )}



                  {/* Gear Layout & Unit controls */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Transmission style */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                        Transmission
                      </span>
                      <div className="flex rounded-xl bg-slate-900/65 p-0.5 border border-white/5">
                        {['AUTO', 'MANUAL'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setProfile(prev => ({ ...prev, transmission: t as any }))}
                            className={`flex-1 py-1.5 text-[8px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                              profile.transmission === t
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-350'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clock units */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                        Measurement Units
                      </span>
                      <div className="flex rounded-xl bg-slate-900/65 p-0.5 border border-white/5">
                        {['METRIC', 'IMPERIAL'].map((u) => (
                          <button
                            key={u}
                            onClick={() => setProfile(prev => ({ ...prev, units: u as any }))}
                            className={`flex-1 py-1.5 text-[8px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                              profile.units === u
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-355'
                            }`}
                          >
                            {u === 'METRIC' ? 'KM/H' : 'MPH'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Backlight Theme Swatches */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                      Cockpit Backlight System
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'red', name: 'M-Sport Red', color: 'bg-red-500' },
                        { id: 'blue', name: 'Cyber Blue', color: 'bg-cyan-400' },
                        { id: 'yellow', name: 'Sunset Amber', color: 'bg-yellow-450' },
                        { id: 'green', name: 'Green Hell', color: 'bg-emerald-500' }
                      ].map((btn) => {
                        const isActive = profile.theme === btn.id;
                        return (
                          <button
                            key={btn.id}
                            onClick={() => setTheme(btn.id as ThemeColor)}
                            className={`flex items-center space-x-2 p-1.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-left select-none relative overflow-hidden ${
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

                  {/* Startup Sequence Trigger */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        triggerStartup && triggerStartup();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold tracking-widest uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <span>🎬 Replay Startup cinematic</span>
                    </button>
                  </div>

                </div>

                {/* Interactive Status Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col space-y-1 select-none font-mono text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Cockpit State</span>
                    <span className="text-[8.5px] font-bold uppercase transition-all duration-500" style={{ color: currentTheme.primary }}>
                      {profile.theme} + {profile.gpsMode ? 'GPS' : 'SIM'}
                    </span>
                  </div>
                  <p className="text-[7.5px] text-slate-400 leading-normal">
                    Secure coordinate tracking is active. Open the Cockpit Companion tab on your mobile device inside your car's dock to track real-time speeds!
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Gear shift notification banner overlay */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute top-8 bg-slate-950/95 border border-white/10 px-4 py-2 rounded-2xl flex items-center space-x-2 z-50 text-white shadow-2xl"
              style={{ borderColor: currentTheme.primary }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono tracking-widest font-semibold uppercase">{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  </div>
);
}

/**
 * Enhanced Real-time Weather and Clock Widget
 */
function WeatherClock({ 
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

  // Helper to format drive time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} min`;
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const WeatherIcon = () => {
    if (!weather) return <Sun className="w-4 h-4 text-amber-400" />;
    const code = weather.code;
    if (code === 0) return <Sun className="w-4 h-4 text-amber-400" />;
    if (code <= 3) return <Cloud className="w-4 h-4 text-slate-300" />;
    if (code <= 67) return <CloudRain className="w-4 h-4 text-sky-400" />;
    if (code <= 99) return <CloudLightning className="w-4 h-4 text-violet-400" />;
    return <Cloud className="w-4 h-4 text-slate-300" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="flex flex-col items-center justify-center space-y-1 mb-2 select-none"
    >
      {/* INFO CLUSTER: WEATHER/TIME & RECENT TRIP (ABOVE SPEEDOMETER) */}
      <div className="flex flex-row items-center justify-center space-x-6 lg:space-x-12 mb-2 select-none">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-row items-center justify-center bg-slate-900/40 backdrop-blur-[32px] px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-[28px] border transition-all duration-500 min-w-[320px] sm:min-w-[360px] relative overflow-hidden group"
          style={{ 
            borderColor: `${currentTheme.primary}40`,
            boxShadow: `0 0 35px ${currentTheme.primary}10, 0 15px 40px rgba(0,0,0,0.6)`
          }}
        >
          {/* Subtle Theme Glow Overlay */}
          <div 
            className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <div 
            className="absolute -left-20 -top-20 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: currentTheme.primary }}
          />

          {/* TIME & WEATHER SECTION */}
          <div className="flex flex-row items-center justify-center space-x-4 pr-4 sm:pr-8 relative z-10">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block p-1.5 rounded-lg bg-white/5 border border-white/5">
                <Clock className="w-4 h-4" style={{ color: currentTheme.primary }} />
              </div>
              <span className="text-3xl lg:text-4xl font-black tracking-tighter text-white font-mono leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] flex-shrink-0">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 w-full">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-cyan-400 leading-none">
                  {weather?.city || 'Yerevan'}
                </span>
                <span className="hidden sm:block text-[8px] font-mono text-slate-500 uppercase tracking-[0.15em] mt-1 font-bold">
                  Atmospheric
                </span>
              </div>
              
              <div className="h-6 sm:h-8 w-px bg-white/10" />

              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                <div className="block p-1 sm:p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <WeatherIcon />
                </div>
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-tight flex-shrink-0">
                  {weather?.temp || '--'}°<span className="text-slate-500 font-medium">C</span>
                </span>
              </div>
            </div>
          </div>

          {/* ELEGANT VERTICAL SEPARATOR */}
          <div className="block h-16 sm:h-20 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent relative z-10" />

          {/* RECENT TRIP SECTION */}
          <div className="flex flex-col pl-4 sm:pl-8 min-w-[130px] sm:min-w-[170px] relative z-10 w-auto">
            <div className="hidden sm:flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">Journal</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Today
              </span>
            </div>
            
            <div className="flex flex-col space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between group/stat gap-2">
                <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-widest font-bold group-hover/stat:text-slate-300 transition-colors">Distance</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono group-hover/stat:scale-105 transition-transform origin-right flex-shrink-0">
                  {tripData.distance.toFixed(0)} <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium ml-0.5">km</span>
                </span>
              </div>
              <div className="flex items-center justify-between group/stat gap-2">
                <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-widest font-bold group-hover/stat:text-slate-300 transition-colors">Avg Spd</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono group-hover/stat:scale-105 transition-transform origin-right flex-shrink-0">
                  {Math.max(0, tripData.avgSpeed || 0).toFixed(0)} <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium ml-0.5">km/h</span>
                </span>
              </div>
              <div className="flex items-center justify-between group/stat gap-2 hidden sm:flex">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold group-hover/stat:text-slate-300 transition-colors">Time</span>
                <span className="text-base font-bold text-white font-mono group-hover/stat:scale-105 transition-transform origin-right flex-shrink-0">
                  {formatTime(tripData.time)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
