import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Pause, RotateCcw, Coffee, BookOpen, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { OrbitalHarmonyModal } from "./OrbitalHarmonyModal";

interface TimerPreset {
  name: string;
  focus: number;
  break: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  icon: string;
}

interface CustomSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

const defaultPresets: TimerPreset[] = [
  { name: "Pomodoro", focus: 25, break: 5, longBreak: 15, sessionsBeforeLongBreak: 4, icon: "🍅" },
  { name: "Deep Focus", focus: 45, break: 10, longBreak: 30, sessionsBeforeLongBreak: 3, icon: "🧠" },
  { name: "Study Sprint", focus: 15, break: 3, longBreak: 10, sessionsBeforeLongBreak: 5, icon: "⚡" },
  { name: "Custom", focus: 25, break: 5, longBreak: 15, sessionsBeforeLongBreak: 4, icon: "⚙️" },
];

const loadSettings = (): CustomSettings => {
  const saved = localStorage.getItem('pomodoroSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {
        focusTime: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartFocus: false,
      };
    }
  }
  return {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  };
};

export function PomodoroTimer() {
  const [customSettings, setCustomSettings] = useState<CustomSettings>(loadSettings());
  const [selectedPreset, setSelectedPreset] = useState(defaultPresets[0]);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessionsCompleted, setSessionsCompleted] = useState(2);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(selectedPreset.sessionsBeforeLongBreak);
  const [showSettings, setShowSettings] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [showOrbitalModal, setShowOrbitalModal] = useState(false);

  const [tempSettings, setTempSettings] = useState<CustomSettings>(customSettings);
  const [activePresetName, setActivePresetName] = useState("Pomodoro");

  const saveSettings = (settings: CustomSettings) => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    setCustomSettings(settings);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === "work") {
        const newSessionCount = sessionsCompleted + 1;
        setSessionsCompleted(newSessionCount);

        // Trigger full-screen orbital harmony modal
        setTimeout(() => {
          setShowOrbitalModal(true);
        }, 200); // Small delay to let orbit animation complete first

        const newSessionsUntilLongBreak = sessionsUntilLongBreak - 1;
        setSessionsUntilLongBreak(newSessionsUntilLongBreak);

        const shouldTakeLongBreak = newSessionsUntilLongBreak <= 0;
        setIsLongBreak(shouldTakeLongBreak);
        
        if (shouldTakeLongBreak) {
          setSessionsUntilLongBreak(selectedPreset.sessionsBeforeLongBreak);
        }
        
        setMode("break");
        const breakTime = shouldTakeLongBreak ? selectedPreset.longBreak : selectedPreset.break;
        setTimeLeft(breakTime * 60);
        setIsRunning(customSettings.autoStartBreaks);
      } else {
        setMode("work");
        setTimeLeft(selectedPreset.focus * 60);
        setIsRunning(customSettings.autoStartFocus);
        setIsLongBreak(false);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, selectedPreset, sessionsUntilLongBreak, customSettings]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? selectedPreset.focus * 60 : (isLongBreak ? selectedPreset.longBreak : selectedPreset.break) * 60);
  };

  const switchMode = (newMode: "work" | "break") => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "work") {
      setTimeLeft(selectedPreset.focus * 60);
      setIsLongBreak(false);
    } else {
      const breakTime = isLongBreak ? selectedPreset.longBreak : selectedPreset.break;
      setTimeLeft(breakTime * 60);
    }
  };

  const changePreset = (presetName: string) => {
    const preset = defaultPresets.find(p => p.name === presetName);
    if (!preset) return;

    if (presetName === "Custom") {
      const customPreset = {
        ...preset,
        focus: customSettings.focusTime,
        break: customSettings.shortBreak,
        longBreak: customSettings.longBreak,
        sessionsBeforeLongBreak: customSettings.sessionsBeforeLongBreak,
      };
      setSelectedPreset(customPreset);
      setSessionsUntilLongBreak(customPreset.sessionsBeforeLongBreak);
      setIsRunning(false);
      setTimeLeft(mode === "work" ? customPreset.focus * 60 : (isLongBreak ? customPreset.longBreak : customPreset.break) * 60);
    } else {
      setSelectedPreset(preset);
      setSessionsUntilLongBreak(preset.sessionsBeforeLongBreak);
      setIsRunning(false);
      setTimeLeft(mode === "work" ? preset.focus * 60 : (isLongBreak ? preset.longBreak : preset.break) * 60);
    }
    setActivePresetName(presetName);
  };

  const handleSaveSettings = () => {
    saveSettings(tempSettings);
    
    // Always update to Custom preset when settings are changed
    const customPreset = {
      ...defaultPresets[3], // Custom preset
      focus: tempSettings.focusTime,
      break: tempSettings.shortBreak,
      longBreak: tempSettings.longBreak,
      sessionsBeforeLongBreak: tempSettings.sessionsBeforeLongBreak,
    };
    
    setSelectedPreset(customPreset);
    setSessionsUntilLongBreak(tempSettings.sessionsBeforeLongBreak);
    setActivePresetName("Custom");
    setIsRunning(false);
    setTimeLeft(mode === "work" ? tempSettings.focusTime * 60 : (isLongBreak ? tempSettings.longBreak : tempSettings.shortBreak) * 60);
    
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = mode === "work" ? selectedPreset.focus * 60 : (isLongBreak ? selectedPreset.longBreak : selectedPreset.break) * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Planet configuration: radius, speed (seconds per rotation), color, size, optional ring
  const planets = [
    { radius: 32, speed: 15, color: '#6366F1', size: 4.5, name: 'Inner', hasRing: false },
    { radius: 52, speed: 25, color: '#818CF8', size: 5.5, name: 'Mid', hasRing: false },
    { radius: 75, speed: 40, color: '#A78BFA', size: 6.5, name: 'Outer', hasRing: true },
  ];

  // Orbital Focus Component
  const OrbitalFocus = ({ sessions, isActive, progress }: { sessions: number; isActive: boolean; progress: number }) => {
    const [justCompleted, setJustCompleted] = useState(false);
    const [pulseCount, setPulseCount] = useState(0);
    const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null);
    const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
    
    const orbitsCompleted = Math.min(sessions, planets.length);
    
    // Color progression: cool blue -> lavender -> warm golden white
    const colorProgress = progress / 100;
    const hueShift = colorProgress * 40; // 0 to 40 degrees (blue -> warm)
    const saturationShift = Math.max(0, 1 - colorProgress * 0.3); // Slightly desaturate towards completion
    
    useEffect(() => {
      if (progress === 100 && isActive) {
        setJustCompleted(true);
        const timer = setTimeout(() => setJustCompleted(false), 2500);
        return () => clearTimeout(timer);
      }
    }, [progress, isActive]);

    useEffect(() => {
      if (isActive) {
        const interval = setInterval(() => {
          setPulseCount(prev => prev + 1);
        }, 60000); // Pulse every 60 seconds
        return () => clearInterval(interval);
      }
    }, [isActive]);

    // Initialize sparkles with random positions
    useEffect(() => {
      const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.random() * 200 - 100, // -100 to 100
        y: Math.random() * 200 - 100,
        delay: Math.random() * 5,
      }));
      setSparkles(newSparkles);
    }, []);

    const getPlanetPosition = (radius: number, angle: number, tilt: number = 0) => {
      const rad = (angle - 90) * (Math.PI / 180);
      const tiltRad = tilt * (Math.PI / 180);
      return {
        x: radius * Math.cos(rad),
        y: radius * Math.sin(rad) * Math.cos(tiltRad), // Apply tilt for parallax
      };
    };

    const getDepthScale = (angle: number) => {
      const normalizedAngle = angle % 360;
      return normalizedAngle < 180 
        ? 1 - (normalizedAngle / 180) * 0.2  // 1.0 -> 0.8
        : 0.8 + ((normalizedAngle - 180) / 180) * 0.2; // 0.8 -> 1.0
    };

    const getPlanetAngle = (planetIndex: number) => {
      if (!isActive) return 0;
      const planet = planets[planetIndex];
      const rotationSpeed = (360 / planet.speed) * (progress / 100) * (totalTime / 1000);
      return rotationSpeed % 360;
    };

    return (
      <div className="relative w-56 h-56 mx-auto">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, #F9FAFB 0%, #EEF2FF 100%)',
          }}
        />

        <svg viewBox="0 0 224 224" className="absolute inset-0 w-full h-full">
          <defs>
            {/* Enhanced Star Gradients */}
            <radialGradient id="star-core">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#6366F1" stopOpacity="1" />
              <stop offset="60%" stopColor="#818CF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.4" />
            </radialGradient>

            <radialGradient id="star-mid-glow">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="star-outer-glow">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#A5B4FC" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#E0E7FF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0" />
            </radialGradient>

            {/* Planet Gradients - Different for each planet */}
            <radialGradient id="planet-1-gradient">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="1" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
              <stop offset="85%" stopColor="#4F46E5" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4338CA" stopOpacity="0.9" />
            </radialGradient>

            <radialGradient id="planet-2-gradient">
              <stop offset="0%" stopColor="#A5B4FC" stopOpacity="1" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="1" />
              <stop offset="85%" stopColor="#6366F1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.9" />
            </radialGradient>

            <radialGradient id="planet-3-gradient">
              <stop offset="0%" stopColor="#C7D2FE" stopOpacity="1" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="1" />
              <stop offset="85%" stopColor="#8B5CF6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.9" />
            </radialGradient>

            {/* Planet Inner Glow (white overlay) */}
            <radialGradient id="planet-inner-glow">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Trail Gradients */}
            {planets.map((planet, i) => (
              <radialGradient key={`trail-${i}`} id={`trail-gradient-${i}`}>
                <stop offset="0%" stopColor={planet.color} stopOpacity="0.7" />
                <stop offset="50%" stopColor={planet.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={planet.color} stopOpacity="0" />
              </radialGradient>
            ))}

            {/* Orbit Gradients */}
            <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#C7D2FE" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.08" />
            </linearGradient>

            {/* Filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="soft-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="planet-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="1" dy="1" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.25"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="depth-blur">
              <feGaussianBlur stdDeviation="1.5"/>
            </filter>
          </defs>

          {/* Central Star with Enhanced Multi-Layer Glow */}
          <g transform="translate(112, 112)">
            {/* Ambient Halo - Blue-white blur (outermost) */}
            <motion.circle
              r="35"
              fill="url(#star-outer-glow)"
              style={{ 
                filter: 'blur(80px)',
                mixBlendMode: 'screen'
              }}
              animate={{
                scale: justCompleted ? [1, 1.2, 1] : [1, 1.05, 1],
                opacity: justCompleted ? [0.3, 0.5, 0.3] : [0.25, 0.35, 0.25],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Outer Gradient Glow */}
            <motion.circle
              r="22"
              fill="url(#star-mid-glow)"
              style={{ filter: 'blur(40px)' }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.3, 0.45, 0.3],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />

            {/* Mid-layer glow */}
            <motion.circle
              r="14"
              fill="url(#star-mid-glow)"
              opacity="0.4"
              style={{ filter: 'blur(20px)' }}
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.4, 0.5, 0.4],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />

            {/* Star Core with radial gradient */}
            <motion.circle
              r="10"
              fill="url(#star-core)"
              filter="url(#glow)"
              animate={{
                scale: justCompleted ? [1, 1.25, 1] : [1, 1.05, 1],
              }}
              transition={{ 
                duration: justCompleted ? 1.5 : 3,
                repeat: !justCompleted ? Infinity : 0,
                ease: "easeInOut",
              }}
              style={{
                filter: `hue-rotate(${hueShift}deg) saturate(${saturationShift})`,
              }}
            />

            {/* Inner white core */}
            <motion.circle
              r="5"
              fill="#FFFFFF"
              opacity="0.9"
              animate={{
                opacity: justCompleted ? [0.9, 1, 0.9] : [0.85, 0.95, 0.85],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Sparkle particles around the system */}
            {sparkles.map((sparkle) => (
              <motion.circle
                key={sparkle.id}
                cx={sparkle.x}
                cy={sparkle.y}
                r="1.5"
                fill="#E0E7FF"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isActive ? [0, 1, 0] : [0, 0.6, 0],
                  scale: [0, 1.2, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: sparkle.delay,
                  ease: "easeInOut",
                }}
                style={{
                  filter: 'blur(0.5px)',
                  mixBlendMode: 'screen',
                }}
              />
            ))}

            {/* Orbit Paths and Planets */}
            {planets.map((planet, i) => {
              if (i >= orbitsCompleted) return null;
              
              const planetAngle = isActive ? ((Date.now() / (planet.speed * 1000)) % 1) * 360 : 0;
              const position = getPlanetPosition(planet.radius, planetAngle, i * 3); // 3° tilt per orbit
              const depthScale = getDepthScale(planetAngle);
              const isOuterPlanet = i === 2;
              const depthBlur = isOuterPlanet ? 'url(#depth-blur)' : 'none';
              
              return (
                <g key={`planet-system-${i}`}>
                  {/* Orbit ring */}
                  <motion.ellipse
                    cx="0"
                    cy="0"
                    rx={planet.radius}
                    ry={planet.radius * Math.cos((i * 3) * Math.PI / 180)} // Ellipse for tilt effect
                    fill="none"
                    stroke="url(#orbit-gradient)"
                    strokeWidth="1"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: i === orbitsCompleted - 1 ? 0.2 : 0.12,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(99, 102, 241, 0.1))',
                    }}
                  />

                  {/* Planet trail (comet effect) */}
                  {isActive && (
                    <>
                      {Array.from({ length: 6 }).map((_, trailIndex) => {
                        const trailAngle = planetAngle - (trailIndex + 1) * 6;
                        const trailPos = getPlanetPosition(planet.radius, trailAngle, i * 3);
                        const trailOpacity = (0.5 - trailIndex * 0.08) * (1 + orbitsCompleted * 0.1);
                        
                        return (
                          <motion.circle
                            key={`trail-${i}-${trailIndex}`}
                            cx={trailPos.x}
                            cy={trailPos.y}
                            r={planet.size - trailIndex * 0.4}
                            fill={`url(#trail-gradient-${i})`}
                            initial={{ opacity: trailOpacity }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{
                              filter: `hue-rotate(${hueShift}deg)`,
                            }}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* Planet */}
                  <g
                    transform={`translate(${position.x}, ${position.y})`}
                    onMouseEnter={() => setHoveredPlanet(i)}
                    onMouseLeave={() => setHoveredPlanet(null)}
                  >
                    {/* Planet shadow */}
                    <motion.circle
                      cx="0.5"
                      cy="0.5"
                      r={planet.size + 1}
                      fill="#1F2937"
                      opacity="0.15"
                      style={{ filter: 'blur(3px)' }}
                      animate={{ scale: depthScale }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />

                    {/* Planet base */}
                    <motion.circle
                      r={planet.size}
                      fill={`url(#planet-${i + 1}-gradient)`}
                      filter={depthBlur}
                      animate={{
                        scale: isActive ? [depthScale, depthScale * 1.05, depthScale] : depthScale,
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        filter: `hue-rotate(${hueShift}deg) saturate(${saturationShift}) drop-shadow(0 0 ${6 + i * 2}px ${planet.color})`,
                        cursor: 'pointer',
                      }}
                      whileHover={{ scale: depthScale * 1.2 }}
                      whileTap={{ scale: depthScale * 0.9 }}
                    />

                    {/* Inner white glow overlay */}
                    <motion.circle
                      r={planet.size}
                      fill="url(#planet-inner-glow)"
                      animate={{ scale: depthScale }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />

                    {/* Specular highlight */}
                    <motion.circle
                      cx={-planet.size * 0.3}
                      cy={-planet.size * 0.3}
                      r={planet.size * 0.35}
                      fill="#FFFFFF"
                      opacity="0.7"
                      style={{ filter: 'blur(1px)' }}
                      animate={{ scale: depthScale }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />

                    {/* Saturn-like ring for outer planet */}
                    {planet.hasRing && (
                      <motion.ellipse
                        cx="0"
                        cy="0"
                        rx={planet.size * 1.6}
                        ry={planet.size * 0.5}
                        fill="none"
                        stroke="#C7D2FE"
                        strokeWidth="0.8"
                        opacity="0.5"
                        style={{ 
                          filter: 'blur(0.5px)',
                          transform: 'rotate(15deg)',
                        }}
                        animate={{ scale: depthScale }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    )}

                    {/* Hover tooltip */}
                    {hoveredPlanet === i && (
                      <motion.g
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <text
                          x={planet.radius + 15}
                          y="5"
                          textAnchor="start"
                          fill="#666666"
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="Inter, -apple-system, sans-serif"
                        >
                          {planet.name} Session {i + 1}
                        </text>
                      </motion.g>
                    )}
                  </g>
                </g>
              );
            })}


          </g>

          {/* Completion Effects - Enhanced Refraction Pulse */}
          <AnimatePresence>
            {justCompleted && (
              <g transform="translate(112, 112)">
                {/* Expanding ripple waves */}
                <motion.circle
                  r="50"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeOpacity="0.6"
                  initial={{ scale: 0.3, opacity: 0.6 }}
                  animate={{ scale: 2.8, opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOutCubic" }}
                />
                <motion.circle
                  r="50"
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  initial={{ scale: 0.4, opacity: 0.5 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOutCubic", delay: 0.15 }}
                />
                <motion.circle
                  r="50"
                  fill="none"
                  stroke="#A5B4FC"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  initial={{ scale: 0.5, opacity: 0.4 }}
                  animate={{ scale: 3.6, opacity: 0 }}
                  transition={{ duration: 2, ease: "easeOutCubic", delay: 0.3 }}
                />

                {/* Refraction pulse - gradient ring expanding from star */}
                <motion.circle
                  r="20"
                  fill="none"
                  stroke="url(#star-mid-glow)"
                  strokeWidth="8"
                  strokeOpacity="0.3"
                  initial={{ r: 20, opacity: 0.3 }}
                  animate={{ r: 100, opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ filter: 'blur(4px)' }}
                />

                {/* Refracted light arcs - sunlight effect */}
                <motion.path
                  d="M -90,-70 Q -10,-90 70,-70"
                  fill="none"
                  stroke="#C7D2FE"
                  strokeWidth="4"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{ filter: 'blur(3px)' }}
                />
                <motion.path
                  d="M -70,80 Q 0,100 70,80"
                  fill="none"
                  stroke="#E0E7FF"
                  strokeWidth="3"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  style={{ filter: 'blur(2px)' }}
                />

                {/* Sparkle burst on completion */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * 360;
                  const distance = 40;
                  const x = distance * Math.cos((angle - 90) * Math.PI / 180);
                  const y = distance * Math.sin((angle - 90) * Math.PI / 180);
                  
                  return (
                    <motion.circle
                      key={`burst-${i}`}
                      cx="0"
                      cy="0"
                      r="2"
                      fill="#FFFFFF"
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                      animate={{ 
                        x: x * 2, 
                        y: y * 2, 
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0]
                      }}
                      transition={{ 
                        duration: 1.2, 
                        ease: "easeOut",
                        delay: i * 0.03
                      }}
                      style={{ filter: 'blur(1px)' }}
                    />
                  );
                })}
              </g>
            )}
          </AnimatePresence>
        </svg>

        {/* Star Completion Glow - Multi-layer */}
        <AnimatePresence>
          {justCompleted && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(129, 140, 248, 0.3) 40%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 1, 0], scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOutCubic" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(165, 180, 252, 0.4) 0%, rgba(224, 231, 255, 0.2) 50%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.9, 0], scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOutCubic", delay: 0.2 }}
              />
              {/* Cinematic expand effect */}
              {orbitsCompleted >= 3 && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.03, opacity: 1 }}
                  exit={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* System expands slightly on completion */}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>



        {/* Session Status */}
        {!justCompleted && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-xs text-foreground-tertiary">
              {orbitsCompleted === 0 && "Begin your cosmic journey"}
              {orbitsCompleted === 1 && "Inner orbit active"}
              {orbitsCompleted === 2 && "Mid orbit unlocked"}
              {orbitsCompleted === 3 && "Outer orbit achieved"}
              {orbitsCompleted >= 3 && "Planetary harmony"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="card-minimal">
        <div className="space-y-8">
          {/* Header with Settings */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-foreground mb-1">Focus Timer</h3>
              <p className="text-sm text-foreground-secondary">
                {mode === "work" ? "Stay focused" : isLongBreak ? "Take a long break" : "Take a short break"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTempSettings(customSettings);
                setShowSettings(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4 stroke-[1.5]" />
            </Button>
          </div>

          {/* Preset Selector */}
          <div>
            <Label className="text-sm text-foreground-secondary mb-2 block">Timer Preset</Label>
            <Select value={activePresetName} onValueChange={changePreset}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultPresets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.icon} {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orbital Focus */}
          <div className="py-6">
            <OrbitalFocus 
              sessions={sessionsCompleted} 
              isActive={isRunning && mode === "work"} 
              progress={mode === "work" ? progress : 0} 
            />
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-border"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  animate={{ 
                    strokeDashoffset: `${2 * Math.PI * 88 * (1 - progress / 100)}` 
                  }}
                  transition={{ duration: 0.5 }}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className="text-4xl text-foreground tabular-nums"
                  animate={{ 
                    scale: timeLeft <= 10 && isRunning ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: timeLeft <= 10 && isRunning ? Infinity : 0 }}
                >
                  {formatTime(timeLeft)}
                </motion.span>
                <span className="text-sm text-foreground-tertiary mt-2">
                  {mode === "work" ? `${selectedPreset.icon} ${selectedPreset.name}` : isLongBreak ? "Long Break" : "Short Break"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="px-6"
              onClick={resetTimer}
            >
              <RotateCcw className="w-4 h-4 stroke-[1.5]" />
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2 stroke-[1.5]" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 stroke-[1.5]" />
                  Start
                </>
              )}
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-3">
            <Button
              variant={mode === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode("work")}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4 mr-2 stroke-[1.5]" />
              Focus
            </Button>
            <Button
              variant={mode === "break" ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode("break")}
              className="flex-1"
            >
              <Coffee className="w-4 h-4 mr-2 stroke-[1.5]" />
              Break
            </Button>
          </div>

          {/* Session Info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/[0.03] border border-primary/10">
            <div>
              <p className="text-sm text-foreground-secondary">Sessions Today</p>
              <p className="text-2xl text-foreground mt-1">{sessionsCompleted}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-secondary">Until Long Break</p>
              <p className="text-2xl text-foreground mt-1">{sessionsUntilLongBreak}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
            <DialogDescription>
              Customize your focus timer durations and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-foreground-secondary">Focus Duration (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.focusTime}
                onChange={(e) => setTempSettings({ ...tempSettings, focusTime: parseInt(e.target.value) || 25 })}
                min={1}
                max={120}
                className="mt-2 bg-white"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground-secondary">Short Break (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.shortBreak}
                onChange={(e) => setTempSettings({ ...tempSettings, shortBreak: parseInt(e.target.value) || 5 })}
                min={1}
                max={30}
                className="mt-2 bg-white"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground-secondary">Long Break (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.longBreak}
                onChange={(e) => setTempSettings({ ...tempSettings, longBreak: parseInt(e.target.value) || 15 })}
                min={1}
                max={60}
                className="mt-2 bg-white"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground-secondary">Sessions Before Long Break</Label>
              <Input
                type="number"
                value={tempSettings.sessionsBeforeLongBreak}
                onChange={(e) => setTempSettings({ ...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                min={1}
                max={10}
                className="mt-2 bg-white"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground-secondary">Auto-start breaks</Label>
                <Switch
                  checked={tempSettings.autoStartBreaks}
                  onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartBreaks: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground-secondary">Auto-start focus</Label>
                <Switch
                  checked={tempSettings.autoStartFocus}
                  onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartFocus: checked })}
                />
              </div>
            </div>
            <Button onClick={handleSaveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orbital Harmony Modal - Full-screen celebration */}
      <OrbitalHarmonyModal
        isVisible={showOrbitalModal}
        sessionsCompleted={sessionsCompleted}
        totalSessions={planets.length}
        onDismiss={() => setShowOrbitalModal(false)}
        onTakeBreak={() => {
          setMode("break");
          const breakTime = isLongBreak ? selectedPreset.longBreak : selectedPreset.break;
          setTimeLeft(breakTime * 60);
          setIsRunning(customSettings.autoStartBreaks);
        }}
        onContinue={() => {
          setMode("work");
          setTimeLeft(selectedPreset.focus * 60);
          setIsRunning(customSettings.autoStartFocus);
        }}
      />
    </>
  );
}