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
      {/* Removed heavy animated reflections and particles to improve performance */}
    </div>
  );
};

export default AmbientBackground;
