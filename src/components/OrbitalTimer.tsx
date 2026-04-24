import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface OrbitalTimerProps {
  sessionsCompleted: number;
  isActive: boolean;
  progress: number;
  totalTime: number;
}

export function OrbitalTimer({ sessionsCompleted, isActive, progress, totalTime }: OrbitalTimerProps) {
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  
  // Planet configuration with Marquis colors (Yellow, Black, Grey shades)
  const planets = [
    { radius: 32, speed: 15, color: '#FFD500', size: 4.5, name: 'Mercury', hasRing: false },
    { radius: 48, speed: 25, color: '#FDB022', size: 5, name: 'Venus', hasRing: false },
    { radius: 64, speed: 35, color: '#6E6E70', size: 5.5, name: 'Earth', hasRing: false },
    { radius: 80, speed: 45, color: '#4A4A4C', size: 6, name: 'Mars', hasRing: false },
    { radius: 96, speed: 55, color: '#2A2A2C', size: 6.5, name: 'Jupiter', hasRing: true },
    { radius: 112, speed: 65, color: '#000000', size: 7, name: 'Saturn', hasRing: true },
  ];
  
  // Start with 1 planet, add 1 planet per session completed (max 6 planets after 5 sessions)
  const visiblePlanets = Math.min(sessionsCompleted + 1, planets.length);

  // Initialize sparkles
  useEffect(() => {
    const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
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
      y: radius * Math.sin(rad) * Math.cos(tiltRad),
    };
  };

  const getDepthScale = (angle: number) => {
    const normalizedAngle = angle % 360;
    return normalizedAngle < 180 
      ? 1 - (normalizedAngle / 180) * 0.2
      : 0.8 + ((normalizedAngle - 180) / 180) * 0.2;
  };

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Background */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at center, #FFFDF7 0%, #FFF8E5 100%)',
        }}
      />

      <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full">
        <defs>
          {/* Sun (Star) Gradients - Marquis Yellow */}
          <radialGradient id="sun-core">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFD500" stopOpacity="1" />
            <stop offset="60%" stopColor="#FDB022" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFE680" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="#FFD500" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FDB022" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFE680" stopOpacity="0" />
          </radialGradient>

          {/* Planet Gradients */}
          {planets.map((planet, i) => (
            <radialGradient key={`planet-grad-${i}`} id={`planet-gradient-${i}`}>
              <stop offset="0%" stopColor={planet.color} stopOpacity="1" />
              <stop offset="50%" stopColor={planet.color} stopOpacity="1" />
              <stop offset="100%" stopColor={planet.color} stopOpacity="0.8" />
            </radialGradient>
          ))}

          {/* Orbit Gradient */}
          <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD500" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#FDB022" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFD500" stopOpacity="0.08" />
          </linearGradient>

          {/* Filters */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central Sun */}
        <g transform="translate(128, 128)">
          {/* Outer glow */}
          <motion.circle
            r="35"
            fill="url(#sun-glow)"
            style={{ filter: 'blur(60px)' }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Mid glow */}
          <motion.circle
            r="20"
            fill="url(#sun-glow)"
            style={{ filter: 'blur(30px)' }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.4, 0.5, 0.4],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

          {/* Sun core */}
          <motion.circle
            r="12"
            fill="url(#sun-core)"
            filter="url(#glow)"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner white core */}
          <motion.circle
            r="6"
            fill="#FFFFFF"
            opacity="0.9"
            animate={{
              opacity: [0.85, 0.95, 0.85],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Sparkle particles */}
          {sparkles.map((sparkle) => (
            <motion.circle
              key={sparkle.id}
              cx={sparkle.x}
              cy={sparkle.y}
              r="1.5"
              fill="#FFE680"
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
              }}
            />
          ))}

          {/* Orbit Paths and Planets */}
          {planets.map((planet, i) => {
            if (i >= visiblePlanets) return null;
            
            const planetAngle = isActive ? ((Date.now() / (planet.speed * 1000)) % 1) * 360 : 0;
            const position = getPlanetPosition(planet.radius, planetAngle, i * 2);
            const depthScale = getDepthScale(planetAngle);
            
            return (
              <g key={`planet-system-${i}`}>
                {/* Orbit ring */}
                <motion.ellipse
                  cx="0"
                  cy="0"
                  rx={planet.radius}
                  ry={planet.radius * Math.cos((i * 2) * Math.PI / 180)}
                  fill="none"
                  stroke="url(#orbit-gradient)"
                  strokeWidth="1"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: i === visiblePlanets - 1 ? 0.25 : 0.15,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />

                {/* Planet trail */}
                {isActive && (
                  <>
                    {Array.from({ length: 4 }).map((_, trailIndex) => {
                      const trailAngle = planetAngle - (trailIndex + 1) * 8;
                      const trailPos = getPlanetPosition(planet.radius, trailAngle, i * 2);
                      const trailOpacity = (0.4 - trailIndex * 0.1);
                      
                      return (
                        <motion.circle
                          key={`trail-${i}-${trailIndex}`}
                          cx={trailPos.x}
                          cy={trailPos.y}
                          r={planet.size - trailIndex * 0.5}
                          fill={planet.color}
                          opacity={trailOpacity}
                          style={{ filter: 'blur(2px)' }}
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
                    fill="#000000"
                    opacity="0.15"
                    style={{ filter: 'blur(3px)' }}
                    animate={{ scale: depthScale }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />

                  {/* Planet body */}
                  <motion.circle
                    r={planet.size}
                    fill={`url(#planet-gradient-${i})`}
                    animate={{
                      scale: isActive ? [depthScale, depthScale * 1.05, depthScale] : depthScale,
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      filter: `drop-shadow(0 0 ${4 + i}px ${planet.color})`,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: depthScale * 1.2 }}
                  />

                  {/* Specular highlight */}
                  <motion.circle
                    cx={-planet.size * 0.3}
                    cy={-planet.size * 0.3}
                    r={planet.size * 0.35}
                    fill="#FFFFFF"
                    opacity="0.6"
                    style={{ filter: 'blur(1px)' }}
                    animate={{ scale: depthScale }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />

                  {/* Ring for outer planets */}
                  {planet.hasRing && (
                    <motion.ellipse
                      cx="0"
                      cy="0"
                      rx={planet.size * 1.6}
                      ry={planet.size * 0.5}
                      fill="none"
                      stroke="#FFD500"
                      strokeWidth="0.8"
                      opacity="0.4"
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
                        x={planet.size + 12}
                        y="5"
                        textAnchor="start"
                        fill="#000000"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="Inter, -apple-system, sans-serif"
                      >
                        {planet.name} • Session {i + 1}
                      </text>
                    </motion.g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}