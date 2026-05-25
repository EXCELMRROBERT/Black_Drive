import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, TrendingUp, Compass, Award, Fuel, PlusCircle } from 'lucide-react';
import { DriverProfile, TripLog, SimulationState } from '../types';
import { INITIAL_TRIPS, THEMES } from '../utils';

interface HistoryProps {
  profile: DriverProfile;
  simulation: SimulationState;
  setSimulation: any;
}

export default function History({ profile, simulation, setSimulation }: HistoryProps) {
  const currentTheme = THEMES[profile.theme];
  const [trips, setTrips] = useState<TripLog[]>(INITIAL_TRIPS);

  // Compute stats dynamically
  const totalKmDriven = trips.reduce((acc, trip) => acc + trip.distance, 0);
  const maxVelocityAchieved = trips.reduce((acc, trip) => Math.max(acc, trip.topSpeed), 0);
  const averageConsump = trips.reduce((acc, trip) => acc + trip.avgConsumption, 0) / (trips.length || 1);

  // Dynamic unit conversion for views
  const displayKm = (km: number) => {
    return profile.units === 'METRIC' 
      ? `${km.toFixed(1)} KM` 
      : `${(km * 0.621371).toFixed(1)} MI`;
  };

  const displaySpeedValue = (kmh: number) => {
    return profile.units === 'METRIC' 
      ? `${Math.round(kmh)} KM/H` 
      : `${Math.round(kmh * 0.621371)} MPH`;
  };

  // Save current dynamic simulator session to history logs
  const handleSaveActiveSession = () => {
    if (simulation.tripKm < 0.1) return;

    const newTrip: TripLog = {
      id: `session-trip-${Date.now()}`,
      title: `Simulated Drive in ${profile.name}'s Coach`,
      date: 'Today, Live Feed',
      distance: simulation.tripKm,
      topSpeed: simulation.speed > 0 ? simulation.speed : 132, // fallback or active peak
      avgConsumption: 10.4 + (simulation.throttle * 3.2),
      duration: 'Live Session Clip',
      type: 'cruise',
    };

    setTrips([newTrip, ...trips]);
    
    // Clear dynamic trip counters to let them start a fresh log
    setSimulation((prev: any) => ({
      ...prev,
      tripKm: 0,
    }));
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(trips.filter(t => t.id !== tripId));
  };

  return (
    <div id="history_screen" className="flex flex-col flex-1 px-4 pt-4 pb-10 landscape:pb-4 select-none animate-fadeIn overflow-y-auto overflow-x-hidden scrollbar-none">
      
      {/* COCKPIT STATS OVERVIEW SECTION */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-center select-none text-center">
          <TrendingUp className="w-4 h-4 text-sky-400 mx-auto mb-1" />
          <span className="text-[9px] uppercase font-mono text-slate-500">Cumulative Dist</span>
          <span className="text-[13px] font-bold font-mono text-white mt-1 truncate">
            {displayKm(totalKmDriven)}
          </span>
        </div>

        <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-center select-none text-center">
          <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className="text-[9px] uppercase font-mono text-slate-500">V-MAX Top Speed</span>
          <span className="text-[13px] font-bold font-mono text-white mt-1 truncate">
            {displaySpeedValue(maxVelocityAchieved)}
          </span>
        </div>

        <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-center select-none text-center">
          <Trash2 className="hidden" /> {/* prefetching lucide icons */}
          <Fuel className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <span className="text-[9px] uppercase font-mono text-slate-500">Avg Economy</span>
          <span className="text-[13px] font-bold font-mono text-white mt-1 truncate">
            {averageConsump.toFixed(1)} <span className="text-[9px] text-slate-400 font-sans">L/100K</span>
          </span>
        </div>
      </div>

      {/* SAVE ACTIVE LIVE SIM DRIVES PANEL */}
      {simulation.tripKm >= 0.1 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex flex-col space-y-3 mb-5 shadow-xl select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold font-mono text-emerald-400 uppercase tracking-widest">Active Sim Run Detected!</span>
            <span className="text-[9.5px] font-mono text-slate-300">Telemetry size: {simulation.tripKm.toFixed(2)} KM</span>
          </div>

          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            You completed a dynamic driving simulator run. Commit this telemetry log to save your peak speeds and trip metrics inside the vehicle index!
          </p>

          <button
            onClick={handleSaveActiveSession}
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-widest uppercase rounded-xl flex items-center justify-center space-x-1.5 transition-all select-none cursor-pointer duration-100"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>COMMIT RUN TO HISTORY LOG</span>
          </button>
        </motion.div>
      )}

      {/* MAIN HISTORICAL SHEETS */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase font-mono">
            Recorded Telemetry logs
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Logs sorted: Recent</span>
        </div>

        {trips.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-slate-500 font-sans italic">No driving logs found. Fire up the simulator on the Dashboard to record trips!</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3.5">
            {trips.map((trip) => (
              <div 
                key={trip.id}
                className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl relative group hover:border-white/10 transition-colors"
                id={`trip_card_${trip.id}`}
              >
                {/* Delete trip */}
                <button
                  onClick={() => handleDeleteTrip(trip.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Remove telemetry log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-baseline space-x-2 select-none">
                  <div className={`w-2 h-2 rounded-full ${
                    trip.type === 'speed_run' ? 'bg-orange-500' : trip.type === 'scenic' ? 'bg-sky-400' : currentTheme.bg
                  }`} />
                  <h4 className="text-sm font-bold text-slate-200 truncate pr-6">{trip.title}</h4>
                </div>

                {/* Sub row indicators */}
                <div className="flex items-center space-x-3.5 mt-2 font-mono text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1.5 shrink-0">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{trip.date}</span>
                  </span>
                  <span className="shrink-0">•</span>
                  <span className="font-sans text-slate-300">{trip.duration}</span>
                </div>

                {/* Performance stats layout */}
                <div className="grid grid-cols-3 gap-3.5 mt-3.5 pt-3.5 border-t border-white/5 text-[11px] font-mono">
                  <div>
                    <span className="text-[9.5px] uppercase text-slate-500 block">Distance</span>
                    <span className="text-slate-100 font-bold">{displayKm(trip.distance)}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] uppercase text-slate-500 block">Top Speed</span>
                    <span className="text-slate-100 font-bold">{displaySpeedValue(trip.topSpeed)}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] uppercase text-slate-500 block">Consumption</span>
                    <span className="text-emerald-400">{trip.avgConsumption.toFixed(1)} L/100K</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
