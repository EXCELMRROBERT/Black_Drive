import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StartupSequenceProps {
  onComplete: () => void;
}

export default function StartupSequence({ onComplete }: StartupSequenceProps) {
  const [scene, setScene] = useState(1);
  const [speedCounter, setSpeedCounter] = useState(0);

  // Master Timeline Manager
  useEffect(() => {
    const timings = [
      { s: 2, t: 2500 },
      { s: 3, t: 5500 },
      { s: 4, t: 8000 },
      { s: 5, t: 10500 },
      { s: 6, t: 12500 },
      { s: 7, t: 16500 },
      { s: 8, t: 19500 },
      { s: 9, t: 22000 },
    ];
    
    const timers = timings.map(({ s, t }) => setTimeout(() => {
      if (s === 9) onComplete();
      else setScene(s);
    }, t));
    
    return () => timers.forEach(clearTimeout);
  }, []); // Remove onComplete to avoid resetting when parent re-renders

  // Speedometer Needle Logic
  useEffect(() => {
    if (scene === 6) {
      let start = performance.now();
      let frameId: number;
      const duration = 3500; // Calmer luxury sweep duration
      
      const animate = (now: number) => {
        const elapsed = now - start;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          // Smooth sine interpolation
          const val = Math.round(Math.sin(progress * Math.PI) * 300);
          setSpeedCounter(Math.max(0, Math.min(300, val)));
          frameId = requestAnimationFrame(animate);
        } else {
          setSpeedCounter(0);
        }
      };
      
      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }
  }, [scene]);

  return (
    <div className="absolute inset-0 bg-black z-[110] text-white font-sans overflow-hidden select-none flex items-center justify-center rounded-[inherit] pointer-events-none">
      <AnimatePresence mode="wait">
        
        {/* SCENE 1: Pure Black Slate */}
        {scene === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black" />
          </motion.div>
        )}

        {/* SCENE 2: Laser & BMW Logo */}
        {scene === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }} className="absolute inset-0 flex items-center justify-center">
            {/* Horizontal Laser Sweep */}
            <motion.div className="absolute h-[2px] bg-white shadow-[0_0_20px_#00D2FF,0_0_40px_#00D2FF]" initial={{ left: 0, right: '100%', opacity: 1 }} animate={{ right: ['100%', '0%', '0%'], left: ['0%', '0%', '100%'] }} transition={{ duration: 1.2, times: [0, 0.5, 1], ease: "easeInOut" }} />
            
            {/* Logo Fade In */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, duration: 1.2 }} className="relative w-40 h-40 rounded-full shadow-[0_0_60px_rgba(0,210,255,0.2)] bg-gradient-to-br from-slate-300 via-gray-500 to-slate-700 p-1 flex items-center justify-center z-10">
              <div className="w-full h-full rounded-full bg-black p-1 relative flex items-center justify-center border-4 border-slate-900 overflow-hidden shadow-[inset_0_0_15px_black]">
                <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-slate-300 relative flex flex-wrap shadow-inner">
                  <div className="w-1/2 h-1/2 bg-[#0066B1] border-r border-b border-black/40" />
                  <div className="w-1/2 h-1/2 bg-white border-b border-black/40" />
                  <div className="w-1/2 h-1/2 bg-white border-r border-black/40" />
                  <div className="w-1/2 h-1/2 bg-[#0066B1]" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 3: Hello & Name */}
        {scene === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
            <motion.h1 initial={{ scale: 0.95, opacity: 0, letterSpacing: '0.1em' }} animate={{ scale: 1, opacity: 1, letterSpacing: '0.4em' }} transition={{ duration: 1.5 }} className="text-4xl font-light text-white drop-shadow-[0_0_20px_rgba(0,210,255,0.6)] ml-6">
              HELLO
            </motion.h1>
            <div className="relative w-[320px] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent flex items-center justify-center">
            </div>
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 1.2 }} className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
              Hayk Hayrapetyan
            </motion.h2>
          </motion.div>
        )}

        {/* SCENE 4: Glitch Title & Telemetry */}
        {scene === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }} className="absolute inset-0 flex flex-col items-center justify-center space-y-12">
            <div className="relative text-[32px] sm:text-[44px] font-black italic tracking-widest text-center px-4">
              <motion.span animate={{ x: [-3, 3, -1, 2, 0], y: [1, -1, 0, 2, 0], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 0.15 }} className="absolute inset-0 text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)] mix-blend-screen -ml-1">BLVCK_DRIVE</motion.span>
              <motion.span animate={{ x: [3, -3, 2, -1, 0], y: [-1, 1, 2, 0, 0], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 0.18 }} className="absolute inset-0 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,210,255,0.6)] mix-blend-screen ml-1.5">BLVCK_DRIVE</motion.span>
              <span className="relative text-white z-10 drop-shadow-md">BLVCK_DRIVE</span>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1.2 }} className="flex items-center space-x-3 text-cyan-400 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">
              <span>Dynamic Telemetry Engaged</span>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 5 & 6: Speedometer Assembly & Sweeping */}
        {(scene === 5 || scene === 6) && (
          <motion.div key="s56" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={scene === 6 && speedCounter > 260 ? { x: [-5, 5, -3, 3, 0], y: [-3, 3, -5, 5, 0] } : {}} 
              transition={{ repeat: scene === 6 && speedCounter > 260 ? Infinity : 0, duration: 0.08 }} 
              className="relative w-[340px] h-[340px] flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border-[6px] border-slate-900/80 shadow-2xl" />
              
              {/* Cyan Animated Arc */}
              <svg className="absolute inset-0 w-full h-full rotate-[135deg] drop-shadow-[0_0_15px_#00D2FF]" viewBox="0 0 100 100" overflow="visible">
                <motion.circle 
                  cx="50" cy="50" r="46" fill="none" stroke={scene === 6 && speedCounter > 260 ? "#ef4444" : "#00D2FF"} strokeWidth="5" strokeLinecap="round" 
                  strokeDasharray="216 289" 
                  initial={{ strokeDashoffset: 216 }} 
                  animate={{ strokeDashoffset: scene === 5 ? 0 : (scene === 6 ? 216 * (1 - speedCounter / 300) : 216) }} 
                  transition={scene === 5 ? { duration: 1, ease: 'easeOut' } : { duration: 0.05 }} 
                />
              </svg>

              {/* Red warning upper-right fixed segment logic for Scene 5 */}
              {scene === 5 && (
                <svg className="absolute inset-0 w-full h-full rotate-[135deg] drop-shadow-[0_0_15px_#ef4444]" viewBox="0 0 100 100" overflow="visible">
                  <motion.circle cx="50" cy="50" r="46" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeDasharray="30 289" initial={{ strokeDashoffset: -186, opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.2 }} />
                </svg>
              )}

              {/* Speed Numeric Ticks */}
              {[0, 50, 100, 150, 200, 250, 300].map((val, i) => {
                const rotation = -135 + (i * 270 / 6);
                const isLit = scene === 6 && speedCounter >= val;
                return (
                  <div key={val} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
                    <div className={`mx-auto w-1.5 h-6 mt-3 rounded transition-colors duration-200 ${isLit ? 'bg-white shadow-[0_0_12px_white]' : 'bg-slate-700'}`} />
                    <div className={`mt-3 text-center text-sm font-black tracking-tighter font-mono transition-colors duration-200 ${isLit ? 'text-white' : 'text-slate-600'}`} style={{ transform: `rotate(${-rotation}deg)` }}>
                      {val}
                    </div>
                  </div>
                );
              })}

              {/* Needle Sweep */}
              <motion.div className="absolute inset-0 z-10" initial={{ rotate: -135 }} animate={{ rotate: -135 + (speedCounter / 300) * 270 }} transition={{ duration: 0.05 }}>
                <div className="mx-auto w-[4px] h-[150px] mt-[20px] bg-gradient-to-t from-transparent via-cyan-400 to-white origin-bottom rounded-t-full shadow-[0_0_15px_#00D2FF]" />
              </motion.div>

              {/* Center Info Text */}
              <div className="absolute text-center z-20 flex flex-col items-center justify-center mt-10">
                {scene === 5 ? (
                  <span className="text-cyan-400 font-bold tracking-[0.2em] text-lg drop-shadow-[0_0_10px_#00D2FF] uppercase animate-pulse">Systems On</span>
                ) : (
                  <>
                    <span className={`text-[72px] font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] ${speedCounter > 260 ? 'text-red-500' : 'text-white'}`}>
                      {speedCounter}
                    </span>
                    <span className="text-[12px] text-cyan-400 font-black uppercase tracking-[0.2em] -mt-2">KM/H</span>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 7: Flash & BMW E39 Headlights */}
        {scene === 7 && (
          <motion.div key="s7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden pointer-events-none">
            {/* White Flash Bang */}
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 bg-white z-[60]" />
            
            {/* E39 Image */}
            <motion.img 
              src="/src/assets/images/bmw_e39_headlights_1779642011494.png" 
              alt="BMW Black Screen Reveal"
              className="absolute inset-0 w-full h-full object-cover opacity-90" 
              style={{ objectPosition: 'center 46%' }} 
              initial={{ scale: 1.15 }} 
              animate={{ scale: 1.0 }} 
              transition={{ duration: 1.4, ease: "easeOut" }} 
              referrerPolicy="no-referrer" 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10 mix-blend-multiply" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Glowing Lens Flares mimicking High Beams overlay on image position */}
            <div className="absolute top-[48%] left-[24%] w-20 md:w-28 h-6 bg-cyan-400/90 blur-[24px] rounded-full mix-blend-screen animate-pulse" />
            <div className="absolute top-[48%] right-[24%] w-20 md:w-28 h-6 bg-cyan-400/90 blur-[24px] rounded-full mix-blend-screen animate-pulse" />
            
            {/* Bottom Title Text */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 1.2 }} className="absolute bottom-[20%] text-center z-10 w-full px-4">
              <h2 className="text-[22px] sm:text-3xl font-black italic text-cyan-400 tracking-[0.2em] drop-shadow-[0_0_20px_#00D2FF]">
                M-POWER ACTIVATED
              </h2>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 8: Ready To Drive Fade Out */}
        {scene === 8 && (
          <motion.div key="s8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} className="absolute inset-0 flex items-center justify-center bg-black z-[70]">
            <h1 className="text-xl sm:text-2xl md:text-3xl tracking-[0.4em] text-white font-medium drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] ml-[0.2em]">
              READY TO DRIVE
            </h1>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
