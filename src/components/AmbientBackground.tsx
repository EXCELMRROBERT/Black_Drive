import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AmbientBackgroundProps {
  weatherCode?: number;
}

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ weatherCode }) => {
  // Weather Logic Mapping
  const isRainy = useMemo(() => weatherCode !== undefined && ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)), [weatherCode]);
  const isFoggy = useMemo(() => weatherCode !== undefined && (weatherCode === 45 || weatherCode === 48), [weatherCode]);
  const isCloudy = useMemo(() => weatherCode !== undefined && (weatherCode >= 1 && weatherCode <= 3), [weatherCode]);
  const isStormy = useMemo(() => weatherCode !== undefined && (weatherCode >= 95), [weatherCode]);

  // Generate random particles and rain streaks
  const particles = useMemo(() => 
    Array.from({ length: isFoggy ? 60 : 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20,
    })), [isFoggy]);

  const rainStreaks = useMemo(() => 
    Array.from({ length: isRainy ? 60 : (isStormy ? 100 : 0) }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * -10}%`,
      height: Math.random() * 50 + 50,
      duration: Math.random() * 0.3 + 0.5,
      delay: Math.random() * -2,
    })), [isRainy, isStormy]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. NEON CITY REFLECTIONS */}
      <div className="absolute inset-0 opacity-[0.25]">
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: isStormy ? [0.6, 1, 0.6] : [0.6, 0.9, 0.6],
            x: [0, 100, 0],
            y: [0, -60, 0]
          }}
          transition={{ duration: isStormy ? 8 : 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-cyan-500 blur-[140px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.4, 1, 1.4],
            opacity: isStormy ? [0.5, 1, 0.5] : [0.5, 0.8, 0.5],
            x: [0, -110, 0],
            y: [0, 80, 0]
          }}
          transition={{ duration: isStormy ? 7 : 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-rose-600 blur-[160px] rounded-full"
        />
        <motion.div 
          animate={{ 
            opacity: isStormy ? [0.4, 1, 0.4] : [0.4, 0.7, 0.4],
            y: [0, -150, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: isStormy ? 10 : 28, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/4 w-[85%] h-1/2 bg-amber-500 blur-[120px] rounded-full"
        />
      </div>

      {/* 2. SMOKE / FOG LAYER */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isFoggy ? 'opacity-[0.4]' : (isCloudy ? 'opacity-[0.25]' : 'opacity-[0.15]')}`}>
        <motion.div 
          animate={{ x: ['-70%', '70%'] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4),transparent_70%)] blur-[100px]"
        />
        <motion.div 
          animate={{ x: ['70%', '-70%'] }}
          transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-full h-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),transparent_60%)] blur-[80px]"
        />
      </div>

      {/* 3. RAIN EFFECT */}
      {(isRainy || isStormy) && (
        <div className="absolute inset-0 opacity-[0.25]">
          {rainStreaks.map(streak => (
            <motion.div
              key={streak.id}
              initial={{ y: -200 }}
              animate={{ y: '120vh' }}
              transition={{ 
                duration: streak.duration, 
                repeat: Infinity, 
                ease: "linear",
                delay: streak.delay 
              }}
              style={{ 
                left: streak.left, 
                height: streak.height,
                width: '1.5px'
              }}
              className="absolute bg-gradient-to-b from-transparent via-sky-400/80 to-transparent"
            />
          ))}
        </div>
      )}

      {/* 4. MOVING PARTICLES */}
      <div className="absolute inset-0 opacity-[0.3]">
        {particles.map(p => (
          <motion.div
            key={p.id}
            animate={{ 
              y: [0, -150, 0],
              x: [0, 40, 0],
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: p.delay 
            }}
            style={{ 
              left: p.left, 
              top: p.top, 
              width: p.size * 1.5, 
              height: p.size * 1.5 
            }}
            className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          />
        ))}
      </div>

      {/* VIGNETTE OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-60" />
    </div>
  );
};

export default AmbientBackground;
