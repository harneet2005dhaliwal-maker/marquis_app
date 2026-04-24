import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

interface SparkBurstProps {
  isVisible: boolean;
  message: string;
  sessionsCompleted: number;
  totalSessions?: number;
  onComplete?: () => void;
}

export function SparkBurst({ 
  isVisible, 
  message, 
  sessionsCompleted, 
  totalSessions = 5,
  onComplete 
}: SparkBurstProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
    duration: number;
    rotation: number;
  }>>([]);

  const [streaks, setStreaks] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    length: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate spark particles
      const sparkColors = ['#A5B4FC', '#C7D2FE', '#F5F3FF', '#E0E7FF'];
      const newParticles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        angle: (i / 12) * 360 + Math.random() * 20 - 10,
        distance: 40 + Math.random() * 30,
        size: 1 + Math.random() * 2,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        duration: 2 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 20,
      }));
      setParticles(newParticles);

      // Generate shooting star streaks
      const newStreaks = Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        angle: (i / 4) * 360 + 45,
        distance: 50 + Math.random() * 25,
        length: 15 + Math.random() * 10,
        duration: 1.5 + Math.random() * 0.5,
      }));
      setStreaks(newStreaks);

      // Trigger completion callback
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-white/60 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Central sparkburst - radial gradient explosion */}
          <motion.div
            className="absolute"
            style={{
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, rgba(165, 180, 252, 0.4) 30%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(8px)',
              mixBlendMode: 'screen',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2.5, opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Secondary burst wave */}
          <motion.div
            className="absolute"
            style={{
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.5) 0%, rgba(199, 210, 254, 0.3) 40%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(10px)',
              mixBlendMode: 'screen',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 0.8, 0] }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
          />

          {/* Spark particles */}
          {particles.map((particle) => {
            const x = Math.cos((particle.angle - 90) * Math.PI / 180) * particle.distance;
            const y = Math.sin((particle.angle - 90) * Math.PI / 180) * particle.distance;
            
            return (
              <motion.div
                key={`particle-${particle.id}`}
                className="absolute"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
                  mixBlendMode: 'screen',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 0,
                  rotate: 0,
                }}
                animate={{ 
                  x: x * 2.5, 
                  y: y * 2.5, 
                  opacity: 0,
                  scale: [0, 1.5, 0.8, 0],
                  rotate: particle.rotation,
                }}
                transition={{ 
                  duration: particle.duration, 
                  ease: [0.22, 0.61, 0.36, 1], // easeOutSine
                  delay: 0.2,
                }}
              />
            );
          })}

          {/* Shooting star streaks */}
          {streaks.map((streak) => {
            const x = Math.cos((streak.angle - 90) * Math.PI / 180) * streak.distance;
            const y = Math.sin((streak.angle - 90) * Math.PI / 180) * streak.distance;
            const rotation = streak.angle;
            
            return (
              <motion.div
                key={`streak-${streak.id}`}
                className="absolute"
                style={{
                  width: `${streak.length}px`,
                  height: '2px',
                  background: 'linear-gradient(90deg, rgba(253, 230, 138, 0.8) 0%, rgba(165, 180, 252, 0.6) 50%, transparent 100%)',
                  borderRadius: '2px',
                  filter: 'blur(1px)',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'left center',
                  mixBlendMode: 'screen',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scaleX: 0,
                }}
                animate={{ 
                  x: x * 2, 
                  y: y * 2, 
                  opacity: [0, 1, 0],
                  scaleX: [0, 1, 0.5],
                }}
                transition={{ 
                  duration: streak.duration, 
                  ease: [0.22, 0.61, 0.36, 1],
                  delay: 0.4,
                }}
              />
            );
          })}

          {/* Completion message */}
          <motion.div
            className="absolute -top-32 flex flex-col items-center gap-2 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1], // easeOutCubic
              delay: 0.4,
            }}
          >
            {/* Message text */}
            <p 
              className="text-sm"
              style={{
                fontWeight: 600,
                color: '#4338CA',
                letterSpacing: '0.3px',
                textShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              {message}
            </p>

            {/* Session badge */}
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              {/* Planet ring indicator */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSessions }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
                  >
                    {/* Ring */}
                    <div 
                      className={`w-3 h-3 rounded-full border ${
                        i < sessionsCompleted 
                          ? 'border-primary bg-primary/20' 
                          : 'border-border bg-transparent'
                      }`}
                      style={{
                        boxShadow: i < sessionsCompleted 
                          ? '0 0 6px rgba(99, 102, 241, 0.5)' 
                          : 'none',
                      }}
                    />
                    {/* Glow effect for completed */}
                    {i < sessionsCompleted && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/30"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-foreground-tertiary">
                {sessionsCompleted}/{totalSessions} orbits
              </span>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
