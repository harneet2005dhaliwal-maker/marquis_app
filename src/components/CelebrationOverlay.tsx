import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Sparkles, Flame, Rocket, Award } from "lucide-react";

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

interface CelebrationOverlayProps {
  show: boolean;
  message: string;
  type?: "confetti" | "stars" | "fireworks";
  onComplete?: () => void;
}

export function CelebrationOverlay({ 
  show, 
  message, 
  type = "confetti",
  onComplete 
}: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces: Confetti[] = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: ["#FFD500", "#FF6B6B", "#A78BFA", "#22C55E", "#3B82F6"][Math.floor(Math.random() * 5)],
        size: Math.random() * 10 + 5,
        delay: Math.random() * 0.3,
        duration: Math.random() * 2 + 2
      }));
      setConfetti(pieces);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        style={{
          background: "rgba(0, 0, 0, 0.4)"
        }}
      >
        {/* Confetti */}
        {type === "confetti" && confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              background: piece.color,
              borderRadius: piece.size > 7 ? "50%" : "2px"
            }}
            initial={{ 
              y: piece.y,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: "easeIn"
            }}
          />
        ))}

        {/* Sparkle stars */}
        {type === "stars" && Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 150;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: "50%",
                top: "50%"
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                ease: "easeOut"
              }}
            >
              <Star 
                className="w-6 h-6" 
                style={{ 
                  color: "#FFD500",
                  fill: "#FFD500"
                }} 
              />
            </motion.div>
          );
        })}

        {/* Fireworks */}
        {type === "fireworks" && (
          <>
            {Array.from({ length: 3 }).map((_, i) => {
              const positions = [
                { x: "25%", y: "30%" },
                { x: "50%", y: "25%" },
                { x: "75%", y: "30%" }
              ];
              const pos = positions[i];
              
              return (
                <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                  {Array.from({ length: 12 }).map((_, j) => {
                    const angle = (j / 12) * Math.PI * 2;
                    const distance = 80;
                    return (
                      <motion.div
                        key={j}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: ["#FFD500", "#FF6B6B", "#A78BFA"][i]
                        }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{
                          x: Math.cos(angle) * distance,
                          y: Math.sin(angle) * distance,
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.3 + j * 0.02,
                          ease: "easeOut"
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* Central celebration message */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2
          }}
          className="relative z-10 text-center px-8 py-8 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
            boxShadow: "0px 20px 60px rgba(254, 207, 56, 0.5)"
          }}
        >
          {/* Trophy icon */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ 
              delay: 0.4,
              type: "spring",
              stiffness: 300
            }}
            className="mb-4"
          >
            <div className="inline-block relative">
              <Trophy 
                className="w-20 h-20" 
                style={{ 
                  color: "#000000",
                  strokeWidth: 2.5
                }} 
              />
              
              {/* Rotating sparkles around trophy */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%"
                  }}
                  animate={{
                    rotate: [angle, angle + 360],
                    x: Math.cos((angle * Math.PI) / 180) * 50,
                    y: Math.sin((angle * Math.PI) / 180) * 50,
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Message */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "#000000",
              marginBottom: "8px",
              marginTop: 0
            }}
          >
            🎉 Achievement!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              fontFamily: "Roboto Slab, serif",
              fontSize: "18px",
              color: "#333333",
              margin: 0
            }}
          >
            {message}
          </motion.p>

          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
              filter: "blur(30px)",
              zIndex: -1
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Flame/rocket effects for streaks */}
        {(type === "confetti" || type === "fireworks") && (
          <>
            <motion.div
              className="absolute left-1/4 bottom-20"
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: -200, 
                opacity: [0, 1, 1, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <Flame className="w-12 h-12" style={{ color: "#FF6B6B", fill: "#FF6B6B" }} />
            </motion.div>
            
            <motion.div
              className="absolute right-1/4 bottom-20"
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: -200, 
                opacity: [0, 1, 1, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 2, delay: 0.7 }}
            >
              <Rocket className="w-12 h-12" style={{ color: "#3B82F6" }} />
            </motion.div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
