import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface PlanetDistributionProps {
  selectedGoal: number | null;
  setSelectedGoal: (goal: number | null) => void;
}

export function PlanetDistribution({ selectedGoal, setSelectedGoal }: PlanetDistributionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-sm text-foreground mb-0" style={{ fontWeight: 600, color: '#1A1A1A' }}>
          Your Focus Distribution This Week
        </h4>
      </div>
      
      {/* Radial visualization with centered canvas */}
      <div className="flex items-center justify-center py-12 px-8">
        {/* Outer frame with equal spacing */}
        <div className="relative w-[480px] h-[400px] flex items-center justify-center">
          {/* Faint radial gradient background centered on Algebra */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(138, 108, 255, 0.06) 0%, transparent 70%)',
            }}
          />
          
          {/* Centered orbit system container */}
          <div className="relative w-[320px] h-[320px]">
            {/* Three orbit rings - all centered on Algebra */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none', zIndex: 1 }}>
              {/* Inner ring */}
              <motion.circle
                cx="160"
                cy="160"
                r="70"
                fill="none"
                stroke="rgba(138, 108, 255, 0.08)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1.5 }}
              />
              
              {/* Middle ring */}
              <motion.circle
                cx="160"
                cy="160"
                r="110"
                fill="none"
                stroke="rgba(138, 108, 255, 0.08)"
                strokeWidth="0.75"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 1.5 }}
              />
              
              {/* Outer ring */}
              <motion.circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="rgba(138, 108, 255, 0.06)"
                strokeWidth="0.5"
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1.5 }}
              />
            </svg>

            {/* Algebra - Central planet (perfectly centered) */}
            <div>
              {/* Radial glow */}
              <div 
                className="absolute rounded-full blur-[35px]"
                style={{
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(138, 108, 255, 0.25) 0%, transparent 70%)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                }}
              />

              {/* Central planet - Algebra 40% */}
              <motion.div
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  width: '90px',
                  height: '90px',
                  background: 'radial-gradient(circle at 30% 30%, #A58BFF, #8A6CFF 40%, #6D56F8 100%)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  boxShadow: `
                    0 8px 16px rgba(109, 86, 248, 0.4),
                    inset -6px -6px 20px rgba(0, 0, 0, 0.2),
                    inset 6px 6px 20px rgba(255, 255, 255, 0.3)
                  `,
                }}
                whileHover={{ 
                  scale: 1.15,
                  boxShadow: `
                    0 12px 24px rgba(109, 86, 248, 0.6),
                    inset -6px -6px 20px rgba(0, 0, 0, 0.2),
                    inset 6px 6px 20px rgba(255, 255, 255, 0.3)
                  `,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGoal(selectedGoal === 1 ? null : 1)}
                transition={{ duration: 0.3 }}
              >
                {/* Glossy highlight */}
                <div 
                  className="absolute top-[15%] left-[20%] w-6 h-6 rounded-full opacity-60 blur-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {selectedGoal === 1 ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center px-2"
                    >
                      <p className="text-[10px] text-white/90 mb-0" style={{ fontWeight: 600 }}>
                        90% Accuracy
                      </p>
                      <p className="text-[9px] text-white/70 mb-0">
                        3 weeks streak
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="label"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-white mb-0 text-center" 
                      style={{ 
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      Algebra<br/>40%
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Geometry - Top-right (120px from center at 45°) */}
            <div>
              {/* Radial glow */}
              <div 
                className="absolute rounded-full blur-[35px]"
                style={{
                  width: '75px',
                  height: '75px',
                  background: 'radial-gradient(circle, rgba(165, 139, 255, 0.25) 0%, transparent 70%)',
                  top: 'calc(50% - 85px)',
                  left: 'calc(50% + 85px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                }}
              />

              {/* Planet */}
              <motion.div
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  width: '70px',
                  height: '70px',
                  background: 'radial-gradient(circle at 30% 30%, #C7A8FF, #A58BFF 40%, #8B72F8 100%)',
                  top: 'calc(50% - 85px)',
                  left: 'calc(50% + 85px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  boxShadow: `
                    0 6px 12px rgba(139, 114, 248, 0.4),
                    inset -5px -5px 15px rgba(0, 0, 0, 0.2),
                    inset 5px 5px 15px rgba(255, 255, 255, 0.3)
                  `,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
                whileHover={{ 
                  scale: 1.15,
                  boxShadow: `
                    0 8px 16px rgba(139, 114, 248, 0.6),
                    inset -5px -5px 15px rgba(0, 0, 0, 0.2),
                    inset 5px 5px 15px rgba(255, 255, 255, 0.3)
                  `,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGoal(selectedGoal === 2 ? null : 2)}
              >
                {/* Glossy highlight */}
                <div 
                  className="absolute top-[18%] left-[25%] w-5 h-5 rounded-full opacity-60 blur-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {selectedGoal === 2 ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center px-2"
                    >
                      <p className="text-[10px] text-white/90 mb-0" style={{ fontWeight: 600 }}>
                        85% Complete
                      </p>
                      <p className="text-[9px] text-white/70 mb-0">
                        On track
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="label"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-white mb-0 text-center" 
                      style={{ 
                        fontWeight: 700,
                        fontSize: '10px',
                      }}
                    >
                      Geometry<br/>25%
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Other - Top-left (120px from center at 135°, mirrored from Geometry) */}
            <div>
              {/* Radial glow */}
              <div 
                className="absolute rounded-full blur-[35px]"
                style={{
                  width: '55px',
                  height: '55px',
                  background: 'radial-gradient(circle, rgba(210, 200, 255, 0.25) 0%, transparent 70%)',
                  top: 'calc(50% - 85px)',
                  left: 'calc(50% - 85px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                }}
              />

              {/* Planet */}
              <motion.div
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  width: '50px',
                  height: '50px',
                  background: 'radial-gradient(circle at 30% 30%, #E8E0FF, #D2C8FF 40%, #B6AFFF 100%)',
                  top: 'calc(50% - 85px)',
                  left: 'calc(50% - 85px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  boxShadow: `
                    0 4px 8px rgba(182, 175, 255, 0.4),
                    inset -3px -3px 10px rgba(0, 0, 0, 0.2),
                    inset 3px 3px 10px rgba(255, 255, 255, 0.3)
                  `,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "backOut" }}
                whileHover={{ 
                  scale: 1.15,
                  boxShadow: `
                    0 6px 12px rgba(182, 175, 255, 0.6),
                    inset -3px -3px 10px rgba(0, 0, 0, 0.2),
                    inset 3px 3px 10px rgba(255, 255, 255, 0.3)
                  `,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGoal(selectedGoal === 4 ? null : 4)}
              >
                {/* Glossy highlight */}
                <div 
                  className="absolute top-[22%] left-[30%] w-3 h-3 rounded-full opacity-60 blur-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {selectedGoal === 4 ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center px-1"
                    >
                      <p className="text-[9px] text-white/90 mb-0" style={{ fontWeight: 600 }}>
                        Mixed Topics
                      </p>
                      <p className="text-[8px] text-white/70 mb-0">
                        Growing
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="label"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-white mb-0 text-center" 
                      style={{ 
                        fontWeight: 700,
                        fontSize: '9px',
                      }}
                    >
                      Other<br/>15%
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* English - Bottom-left (110px from center at 225°) */}
            <div>
              {/* Radial glow */}
              <div 
                className="absolute rounded-full blur-[35px]"
                style={{
                  width: '65px',
                  height: '65px',
                  background: 'radial-gradient(circle, rgba(183, 166, 255, 0.25) 0%, transparent 70%)',
                  top: 'calc(50% + 78px)',
                  left: 'calc(50% - 78px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                }}
              />

              {/* Planet */}
              <motion.div
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'radial-gradient(circle at 30% 30%, #D4C4FF, #B7A6FF 40%, #9E8FFF 100%)',
                  top: 'calc(50% + 78px)',
                  left: 'calc(50% - 78px)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  boxShadow: `
                    0 5px 10px rgba(158, 143, 255, 0.4),
                    inset -4px -4px 12px rgba(0, 0, 0, 0.2),
                    inset 4px 4px 12px rgba(255, 255, 255, 0.3)
                  `,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "backOut" }}
                whileHover={{ 
                  scale: 1.15,
                  boxShadow: `
                    0 7px 14px rgba(158, 143, 255, 0.6),
                    inset -4px -4px 12px rgba(0, 0, 0, 0.2),
                    inset 4px 4px 12px rgba(255, 255, 255, 0.3)
                  `,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGoal(selectedGoal === 3 ? null : 3)}
              >
                {/* Glossy highlight */}
                <div 
                  className="absolute top-[20%] left-[28%] w-4 h-4 rounded-full opacity-60 blur-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {selectedGoal === 3 ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center px-2"
                    >
                      <p className="text-[10px] text-white/90 mb-0" style={{ fontWeight: 600 }}>
                        5 Books Goal
                      </p>
                      <p className="text-[9px] text-white/70 mb-0">
                        3 completed
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="label"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-white mb-0 text-center" 
                      style={{ 
                        fontWeight: 700,
                        fontSize: '10px',
                      }}
                    >
                      English<br/>20%
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            {/* Floating stars/particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/30"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  zIndex: 0,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Summary text */}
      <motion.div
        className="text-center px-8"
        style={{ marginTop: '40px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p 
          className="mx-auto"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            color: '#3B3B4F',
            lineHeight: '150%',
            fontSize: '14px',
            maxWidth: '500px',
          }}
        >
          You focused mostly on <strong>Algebra (40%)</strong>, with steady attention to <strong>Geometry (25%)</strong> and <strong>English (20%)</strong>.
        </p>
        
        {/* Click hint */}
        <motion.p
          className="text-xs text-foreground-tertiary mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          ✨ Click any planet to see details
        </motion.p>
      </motion.div>

      {/* Legend */}
      <motion.div 
        className="flex items-center justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div 
          className="flex items-center gap-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {[
            { name: 'Algebra', color: '#8A6CFF' },
            { name: 'Geometry', color: '#A58BFF' },
            { name: 'English', color: '#B7A6FF' },
            { name: 'Other', color: '#D2C8FF' },
          ].map((item, index) => (
            <motion.div 
              key={item.name}
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 + index * 0.08 }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}40`,
                }}
              />
              <span 
                className="text-xs"
                style={{ 
                  fontWeight: 500, 
                  color: '#4B5563',
                }}
              >
                {item.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}