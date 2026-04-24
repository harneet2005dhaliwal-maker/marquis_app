import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Coffee, Play } from "lucide-react";

interface OrbitalHarmonyModalProps {
  isVisible: boolean;
  sessionsCompleted: number;
  totalSessions: number;
  onDismiss: () => void;
  onTakeBreak?: () => void;
  onContinue?: () => void;
}

// Creative message variants
const completionMessages = [
  "Orbit achieved — your focus aligned with the stars.",
  "Stellar work — rhythm stabilized.",
  "One more revolution complete.",
  "Constellation expanding — brilliance sustained.",
  "Session complete — you're now in orbital harmony.",
  "Focus achieved — stellar momentum maintained.",
];

export function OrbitalHarmonyModal({
  isVisible,
  sessionsCompleted,
  totalSessions,
  onDismiss,
  onTakeBreak,
  onContinue,
}: OrbitalHarmonyModalProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
  }>>([]);

  const [message] = useState(() => 
    completionMessages[Math.floor(Math.random() * completionMessages.length)]
  );

  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Haptic feedback simulation (vibration on mobile)
      if ('vibrate' in navigator) {
        navigator.vibrate(75); // Medium pulse
      }

      // Generate ambient particles
      const particleColors = ['#E0E7FF', '#C7D2FE', '#F5F3FF'];
      const newParticles = Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        size: 2 + Math.random() * 2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        duration: 4 + Math.random() * 2,
        delay: Math.random() * 2,
        driftX: (Math.random() - 0.5) * 20,
        driftY: (Math.random() - 0.5) * 20,
      }));
      setParticles(newParticles);

      // Keyboard shortcut to dismiss (Escape or Space)
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          onDismiss();
        }
      };
      
      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #EEF2FF 0%, #F9FAFB 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={onDismiss}
        >
          {/* Vignette overlay with subtle pulse */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(99, 102, 241, 0.05) 100%)',
            }}
            animate={{
              opacity: [1, 0.85, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Shooting star flare on entry */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-1 h-1"
            initial={{ x: -200, y: -200, opacity: 0 }}
            animate={{ 
              x: 400, 
              y: 400, 
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className="w-32 h-0.5"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(165, 180, 252, 0.8), transparent)',
                filter: 'blur(1px)',
                transform: 'rotate(45deg)',
              }}
            />
          </motion.div>

          {/* Content Container with parallax effect */}
          <motion.div 
            className="relative flex flex-col items-center justify-center w-full h-full px-6"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Background particle field (slowest parallax layer) */}
            {particles.map((particle) => (
              <motion.div
                key={`particle-${particle.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 4}px ${particle.color}`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `${particle.x}px`,
                  marginTop: `${particle.y}px`,
                }}
                animate={{
                  x: particle.driftX,
                  y: particle.driftY,
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: particle.delay,
                }}
              />
            ))}

            {/* Header */}
            <motion.div
              className="absolute top-20 text-center flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <p 
                className="uppercase tracking-[0.1em]"
                style={{ 
                  opacity: 0.5,
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                }}
              >
                ☀ Focus Session Complete
              </p>
              <motion.p
                className="text-sm text-foreground-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                What would you like to do next?
              </motion.p>
            </motion.div>

            {/* Central Orbit System with rotation and parallax */}
            <motion.div
              className="relative"
              initial={{ scale: 1, opacity: 0, rotate: 0 }}
              animate={{ 
                scale: 1.3, 
                opacity: 1,
                rotate: 2,
              }}
              transition={{ 
                scale: { duration: 0.6, delay: 0.3, ease: [0.37, 0, 0.63, 1] },
                opacity: { duration: 0.6, delay: 0.3 },
                rotate: { duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              }}
            >
              {/* Enhanced Orbit Visualization */}
              <svg viewBox="0 0 280 280" className="w-[280px] h-[280px]">
                <defs>
                  {/* Star gradient */}
                  <radialGradient id="modal-star-core">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="30%" stopColor="#6366F1" stopOpacity="1" />
                    <stop offset="70%" stopColor="#818CF8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.4" />
                  </radialGradient>

                  <radialGradient id="modal-star-glow">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="modal-ambient-glow">
                    <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.15" />
                    <stop offset="70%" stopColor="#E9D5FF" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>

                  {/* Glow filter */}
                  <filter id="modal-glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <g transform="translate(140, 140)">
                  {/* Ambient breathing light (back layer) */}
                  <motion.circle
                    r="120"
                    fill="url(#modal-ambient-glow)"
                    style={{ filter: 'blur(80px)' }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5,
                    }}
                  />

                  {/* Orbit rings (mid-layer parallax) with stroke-dash animation */}
                  {[45, 70, 100].map((radius, i) => {
                    // Calculate which rings should be highlighted based on sessions completed
                    // We now have 6 planets total (start with 1, add 1 per session)
                    const totalPlanets = 6;
                    const visiblePlanets = Math.min(sessionsCompleted + 1, totalPlanets);
                    const ringIndex = Math.floor((i / 3) * totalPlanets);
                    const isUnlocked = ringIndex < visiblePlanets;
                    
                    return (
                      <motion.circle
                        key={`orbit-${i}`}
                        r={radius}
                        fill="none"
                        stroke={isUnlocked ? "#6366F1" : "#E5E7EB"}
                        strokeWidth="1.5"
                        strokeOpacity={isUnlocked ? 0.3 : 0.15}
                        strokeDasharray={`${2 * Math.PI * radius}`}
                        initial={{ 
                          strokeDashoffset: 2 * Math.PI * radius,
                          opacity: 0,
                        }}
                        animate={{ 
                          strokeDashoffset: 0,
                          opacity: 1,
                          rotate: -1,
                        }}
                        transition={{
                          strokeDashoffset: {
                            duration: 0.6,
                            delay: 0.3 + i * 0.1,
                            ease: [0.22, 1, 0.36, 1],
                          },
                          opacity: {
                            duration: 0.4,
                            delay: 0.3 + i * 0.1,
                          },
                          rotate: {
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                          },
                        }}
                      />
                    );
                  })}

                  {/* Outer glow halo */}
                  <motion.circle
                    r="50"
                    fill="url(#modal-star-glow)"
                    style={{ filter: 'blur(60px)' }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Mid glow */}
                  <motion.circle
                    r="30"
                    fill="url(#modal-star-glow)"
                    style={{ filter: 'blur(30px)' }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />

                  {/* Star core (front layer, most movement) with synced pulse */}
                  <motion.circle
                    r="14"
                    fill="url(#modal-star-core)"
                    filter="url(#modal-glow)"
                    animate={{
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.9, // Synced with text appearance
                    }}
                  />

                  {/* Inner white core */}
                  <motion.circle
                    r="7"
                    fill="#FFFFFF"
                    opacity="0.95"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.9,
                    }}
                  />
                </g>
              </svg>
            </motion.div>

            {/* Message Text with synced glow */}
            <motion.div
              className="absolute flex flex-col items-center gap-3"
              style={{ top: '62%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.h2 
                className="text-2xl text-center px-6 max-w-md"
                style={{
                  fontWeight: 400,
                  background: 'linear-gradient(90deg, #6366F1, #A78BFA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: '130%',
                }}
                animate={{
                  textShadow: [
                    '0 0 8px rgba(99, 102, 241, 0.3)',
                    '0 0 20px rgba(99, 102, 241, 0.6)',
                    '0 0 8px rgba(99, 102, 241, 0.3)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.9,
                }}
              >
                {message}
              </motion.h2>
              
              <motion.p 
                className="text-foreground-secondary"
                style={{
                  fontSize: '14px',
                  opacity: 0.6,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                {sessionsCompleted} of {totalSessions} orbits achieved.
              </motion.p>
            </motion.div>

            {/* CTA Buttons with micro-interactions */}
            <motion.div
              className="absolute bottom-12 flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 1.2,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <div className="flex items-center gap-4">
                {/* Take a Break button with icon fill effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 3,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button
                    variant="outline"
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTakeBreak) onTakeBreak();
                      onDismiss();
                    }}
                    className="gap-2 text-foreground-secondary hover:text-foreground hover:bg-white/80 border-border/50 bg-white/60 backdrop-blur-sm transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
                  >
                    <Coffee className="w-4 h-4 relative z-10 transition-colors" />
                    <span className="relative z-10">Take a Break</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-100/0 via-indigo-100/50 to-indigo-100/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                  </Button>
                </motion.div>
                
                {/* Continue Focus button with orbital ripple */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 3,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.05 }}
                  onHoverStart={() => setShowRipple(true)}
                  onHoverEnd={() => setShowRipple(false)}
                >
                  {/* Orbital ripple effect */}
                  <AnimatePresence>
                    {showRipple && (
                      <motion.div
                        className="absolute inset-0 rounded-md pointer-events-none"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                          border: '2px solid rgba(99, 102, 241, 0.4)',
                          filter: 'blur(2px)',
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  <Button
                    variant="default"
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onContinue) onContinue();
                      onDismiss();
                    }}
                    className="gap-2 bg-primary hover:bg-primary/90 transition-all relative z-10"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)',
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Continue Focus
                  </Button>
                </motion.div>
              </div>

              {/* Dismiss hint with pulsing opacity */}
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.5 }}
              >
                <motion.p
                  className="text-xs text-foreground-tertiary/70"
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Press <span className="text-foreground-secondary font-medium">Space</span> or <span className="text-foreground-secondary font-medium">Esc</span> to close
                </motion.p>
                <p className="text-xs text-foreground-tertiary/50">
                  or tap anywhere on the background
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}