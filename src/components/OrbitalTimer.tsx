import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

interface OrbitalTimerProps {
  sessionsCompleted: number;
  isActive: boolean;
  progress: number;
  totalTime: number;
}

interface PlanetConfig {
  name: string;
  size: number;
  orbitDiameter: number;
  duration: number;
  angle: number;
  base: string;
  texture: string;
  accent: string;
  ring?: boolean;
  moon?: boolean;
}

const PLANETS: PlanetConfig[] = [
  {
    name: "Mercury",
    size: 18,
    orbitDiameter: 118,
    duration: 18,
    angle: -74,
    base:
      "radial-gradient(circle at 31% 26%, #EEE7DD 0%, #B8AA98 33%, #786A5C 68%, #2E2924 100%)",
    texture:
      "radial-gradient(circle at 35% 34%, rgba(56,49,43,.35) 0 9%, transparent 10%), radial-gradient(circle at 68% 60%, rgba(255,255,255,.11) 0 6%, transparent 7%)",
    accent: "#B6A282",
  },
  {
    name: "Venus",
    size: 23,
    orbitDiameter: 154,
    duration: 24,
    angle: 31,
    base:
      "radial-gradient(circle at 31% 25%, #F5DEB5 0%, #C99A61 35%, #895B36 68%, #332219 100%)",
    texture:
      "linear-gradient(18deg, transparent 28%, rgba(255,242,211,.18) 34% 41%, transparent 47%), linear-gradient(-22deg, transparent 50%, rgba(91,56,35,.20) 55% 62%, transparent 68%)",
    accent: "#CAA06C",
  },
  {
    name: "Earth",
    size: 28,
    orbitDiameter: 192,
    duration: 31,
    angle: 151,
    base:
      "radial-gradient(circle at 30% 24%, #DDF8FF 0%, #63AAD3 26%, #275F95 58%, #0B2944 100%)",
    texture:
      "radial-gradient(ellipse at 38% 39%, #688F52 0 13%, transparent 14%), radial-gradient(ellipse at 62% 63%, #4B7C4A 0 11%, transparent 12%), radial-gradient(ellipse at 54% 31%, rgba(255,255,255,.30) 0 7%, transparent 8%), linear-gradient(17deg, transparent 44%, rgba(255,255,255,.18) 47% 51%, transparent 54%)",
    accent: "#6B9DB2",
    moon: true,
  },
  {
    name: "Mars",
    size: 22,
    orbitDiameter: 232,
    duration: 38,
    angle: 232,
    base:
      "radial-gradient(circle at 30% 24%, #EAB9A2 0%, #B76045 36%, #71382B 68%, #2A1916 100%)",
    texture:
      "radial-gradient(circle at 41% 31%, rgba(87,42,31,.42) 0 9%, transparent 10%), radial-gradient(ellipse at 68% 65%, rgba(242,168,129,.18) 0 11%, transparent 12%)",
    accent: "#A56550",
  },
  {
    name: "Jupiter",
    size: 38,
    orbitDiameter: 274,
    duration: 46,
    angle: 314,
    base:
      "repeating-linear-gradient(174deg, #DFC69F 0 5px, #AC765A 6px 10px, #E9D1AA 11px 16px, #805B48 17px 21px)",
    texture:
      "radial-gradient(ellipse at 70% 60%, rgba(145,62,47,.60) 0 8%, transparent 9%)",
    accent: "#C09A75",
  },
  {
    name: "Saturn",
    size: 32,
    orbitDiameter: 316,
    duration: 54,
    angle: 82,
    base:
      "radial-gradient(circle at 31% 25%, #EFE1B8 0%, #C9AE79 39%, #857054 70%, #342C24 100%)",
    texture:
      "repeating-linear-gradient(172deg, transparent 0 5px, rgba(255,255,255,.07) 6px 7px, transparent 8px 12px)",
    accent: "#BFA36D",
    ring: true,
  },
];

function PlanetSurface({
  planet,
  selected,
  onSelect,
}: {
  planet: PlanetConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      title={planet.name}
      onClick={onSelect}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "relative",
        width: planet.size,
        height: planet.size,
        padding: 0,
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: "50%",
        background: planet.base,
        boxShadow:
          "inset -7px -7px 12px rgba(0,0,0,.48), inset 3px 3px 7px rgba(255,255,255,.18), 0 6px 14px rgba(0,0,0,.38)",
        cursor: "pointer",
        overflow: "visible",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          background: planet.texture,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "19%",
          top: "14%",
          width: "22%",
          height: "22%",
          borderRadius: "50%",
          background: "rgba(255,255,255,.17)",
          filter: "blur(.8px)",
        }}
      />

      {planet.ring && (
        <>
          <span
            style={{
              position: "absolute",
              zIndex: -1,
              width: "176%",
              height: "50%",
              left: "-38%",
              top: "25%",
              borderRadius: "50%",
              border: "2px solid rgba(211,188,126,.44)",
              transform: "rotate(-13deg)",
              clipPath: "inset(0 0 50% 0)",
            }}
          />
          <span
            style={{
              position: "absolute",
              zIndex: 3,
              width: "176%",
              height: "50%",
              left: "-38%",
              top: "25%",
              borderRadius: "50%",
              border: "2px solid rgba(224,202,141,.62)",
              transform: "rotate(-13deg)",
              clipPath: "inset(50% 0 0 0)",
            }}
          />
        </>
      )}

      {planet.moon && (
        <span
          style={{
            position: "absolute",
            right: "-8px",
            top: "5px",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 25%,#EEEAE2,#A6A098 56%,#48443F 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,.4)",
          }}
        />
      )}

      {selected && (
        <span
          style={{
            position: "absolute",
            inset: "-5px",
            borderRadius: "50%",
            border: `1px solid ${planet.accent}`,
            opacity: 0.5,
          }}
        />
      )}
    </motion.button>
  );
}

export function OrbitalTimer({
  sessionsCompleted,
  isActive,
  progress,
}: OrbitalTimerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Session 0 still shows one starter planet.
  // Every completed focus session unlocks exactly one more.
  const unlockedCount = Math.min(
    PLANETS.length,
    Math.max(1, sessionsCompleted + 1)
  );

  const unlocked = useMemo(
    () => PLANETS.slice(0, unlockedCount),
    [unlockedCount]
  );

  const nextPlanet =
    unlockedCount < PLANETS.length ? PLANETS[unlockedCount].name : null;

  const progressPct = Math.max(0, Math.min(100, progress));

  return (
    <motion.div
      animate={{
        boxShadow: isActive
          ? [
              "0 22px 48px rgba(20,22,28,.16)",
              "0 28px 60px rgba(20,22,28,.22)",
              "0 22px 48px rgba(20,22,28,.16)",
            ]
          : "0 22px 48px rgba(20,22,28,.14)",
      }}
      transition={{
        duration: 4,
        repeat: isActive ? Infinity : 0,
        ease: "easeInOut",
      }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        height: "430px",
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: "30px",
        background:
          "radial-gradient(circle at 50% 42%, rgba(203,157,52,.055), transparent 30%), linear-gradient(155deg,#181A1F 0%,#0D0F13 58%,#060709 100%)",
        border: "1px solid rgba(255,255,255,.09)",
        isolation: "isolate",
      }}
    >
      {/* restrained star field */}
      {Array.from({ length: 30 }).map((_, index) => (
        <motion.span
          key={index}
          animate={{ opacity: [0.1, 0.52, 0.1] }}
          transition={{
            duration: 3.2 + (index % 6) * 0.7,
            delay: (index % 9) * 0.14,
            repeat: Infinity,
          }}
          style={{
            position: "absolute",
            left: `${5 + ((index * 37) % 90)}%`,
            top: `${5 + ((index * 53) % 78)}%`,
            width: index % 8 === 0 ? "2px" : "1px",
            height: index % 8 === 0 ? "2px" : "1px",
            borderRadius: "50%",
            background: index % 7 === 0 ? "#B7953B" : "#FFFFFF",
          }}
        />
      ))}

      {/* scientific guide axes */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "24px",
          bottom: "92px",
          width: "1px",
          background:
            "linear-gradient(180deg,transparent,rgba(191,149,58,.16),rgba(191,149,58,.11),transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "22px",
          right: "22px",
          height: "1px",
          background:
            "linear-gradient(90deg,transparent,rgba(191,149,58,.08),rgba(191,149,58,.08),transparent)",
        }}
      />

      {/* orbit rings */}
      {PLANETS.map((planet, index) => (
        <div
          key={planet.name}
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            width: planet.orbitDiameter,
            height: planet.orbitDiameter,
            marginLeft: -planet.orbitDiameter / 2,
            marginTop: -planet.orbitDiameter / 2,
            borderRadius: "50%",
            border: `1px solid rgba(191,149,58,${
              index < unlockedCount ? 0.15 : 0.055
            })`,
          }}
        />
      ))}

      {/* small central sun */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.025, 1] : 1,
          boxShadow: isActive
            ? [
                "0 0 13px rgba(233,201,107,.42),0 0 24px rgba(190,132,34,.15)",
                "0 0 17px rgba(233,201,107,.52),0 0 32px rgba(190,132,34,.22)",
                "0 0 13px rgba(233,201,107,.42),0 0 24px rgba(190,132,34,.15)",
              ]
            : "0 0 13px rgba(233,201,107,.42),0 0 24px rgba(190,132,34,.15)",
        }}
        transition={{
          duration: 3.2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          zIndex: 20,
          left: "50%",
          top: "42%",
          width: 62,
          height: 62,
          marginLeft: -31,
          marginTop: -31,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 34% 29%,#FFF8DB 0%,#F2D886 14%,#DBAC38 39%,#A96612 68%,#5C3307 84%,#251305 100%)",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow:
            "0 0 13px rgba(233,201,107,.42),0 0 24px rgba(190,132,34,.15)",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: "10%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 28% 30%,rgba(255,255,255,.45) 0 4%,transparent 5%),radial-gradient(circle at 64% 30%,rgba(239,194,74,.38) 0 8%,transparent 9%),radial-gradient(circle at 67% 67%,rgba(112,61,8,.30) 0 8%,transparent 9%)",
          }}
        />
      </motion.div>

      {/* planets move only while timer is running */}
      {unlocked.map((planet, index) => (
        <motion.div
          key={planet.name}
          initial={{ rotate: planet.angle }}
          animate={{
            rotate: isActive ? planet.angle + 360 : planet.angle,
          }}
          transition={{
            duration: planet.duration,
            repeat: isActive ? Infinity : 0,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            zIndex: 25 + index,
            left: "50%",
            top: "42%",
            width: planet.orbitDiameter,
            height: planet.orbitDiameter,
            marginLeft: -planet.orbitDiameter / 2,
            marginTop: -planet.orbitDiameter / 2,
            transformOrigin: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -planet.size / 2,
              transform: "translateX(-50%)",
              pointerEvents: "auto",
            }}
          >
            <PlanetSurface
              planet={planet}
              selected={selected === planet.name}
              onSelect={() =>
                setSelected((current) =>
                  current === planet.name ? null : planet.name
                )
              }
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: planet.size + 6,
                transform: "translateX(-50%)",
                color:
                  selected === planet.name
                    ? planet.accent
                    : "rgba(210,203,187,.50)",
                fontSize: "7px",
                fontWeight: 800,
                letterSpacing: ".05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {planet.name}
            </div>
          </div>
        </motion.div>
      ))}

      {/* compact atlas HUD */}
      <div
        style={{
          position: "absolute",
          zIndex: 60,
          left: "14px",
          right: "14px",
          bottom: "13px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "12px",
          alignItems: "center",
          padding: "12px 13px",
          borderRadius: "18px",
          background: "rgba(255,255,255,.042)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,.075)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#AF8C2D",
              fontSize: "8px",
              fontWeight: 900,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Orbital atlas
          </p>
          <p
            style={{
              margin: "3px 0 0",
              color: "#F4F4F4",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {unlockedCount}/{PLANETS.length} worlds mapped
          </p>
          <p
            style={{
              margin: "3px 0 0",
              color: "#747A84",
              fontSize: "9px",
            }}
          >
            {nextPlanet
              ? `Next discovery · ${nextPlanet}`
              : "System complete · keep building your universe"}
          </p>
        </div>

        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#C6A03C",
            background: "rgba(198,160,60,.07)",
          }}
        >
          <Sparkles size={16} />
        </motion.div>
      </div>

      {/* timer progress */}
      <div
        style={{
          position: "absolute",
          left: "16px",
          right: "16px",
          top: "14px",
          height: 3,
          borderRadius: 999,
          background: "rgba(255,255,255,.05)",
          overflow: "hidden",
          zIndex: 70,
        }}
      >
        <motion.div
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(90deg,rgba(188,145,44,.62),rgba(226,194,99,.90))",
          }}
        />
      </div>
    </motion.div>
  );
}