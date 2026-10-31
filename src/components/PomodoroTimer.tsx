import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  BookOpen,
  Settings,
  Sparkles,
  Star,
  Flame,
  Orbit,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { CelebrationOverlay } from "./CelebrationOverlay";

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
  const saved = localStorage.getItem("pomodoroSettings");

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore invalid local settings.
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

const loadNumber = (key: string, fallback = 0) => {
  const raw = localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

interface JourneyWorldProps {
  sessionsCompleted: number;
  isActive: boolean;
  progress: number;
  timeLabel: string;
  mode: "work" | "break";
}

function JourneyWorld({
  sessionsCompleted,
  isActive,
  progress,
  timeLabel,
  mode,
}: JourneyWorldProps) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const stage = Math.min(7, sessionsCompleted);

  const stageName = useMemo(() => {
    return [
      "First world",
      "Atmosphere unlocked",
      "Moon discovered",
      "Rings formed",
      "Second world",
      "Star ignited",
      "System forming",
      "Solar system established",
    ][stage];
  }, [stage]);

  const nextStage = useMemo(() => {
    return [
      "Grow an atmosphere",
      "Discover your first moon",
      "Form planetary rings",
      "Discover a second world",
      "Ignite your star",
      "Begin your solar system",
      "Complete your solar system",
      "Keep building your universe",
    ][stage];
  }, [stage]);

  return (
    <motion.div
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: (event.clientX - rect.left) / rect.width - 0.5,
          y: (event.clientY - rect.top) / rect.height - 0.5,
        });
      }}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      animate={{
        boxShadow: isActive
          ? [
              "0 24px 70px rgba(0,0,0,0.28)",
              "0 30px 86px rgba(255,186,0,0.16)",
              "0 24px 70px rgba(0,0,0,0.28)",
            ]
          : "0 24px 70px rgba(0,0,0,0.22)",
      }}
      transition={{
        duration: 3.5,
        repeat: isActive ? Infinity : 0,
        ease: "easeInOut",
      }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "500px",
        minHeight: "480px",
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: "34px",
        background:
          stage >= 5
            ? "radial-gradient(circle at 72% 32%, rgba(255,177,0,0.14), transparent 25%), radial-gradient(circle at 50% 45%, #29303B 0%, #151A24 36%, #070A10 72%, #020305 100%)"
            : "radial-gradient(circle at 50% 46%, #29313D 0%, #151B25 38%, #080B11 73%, #020305 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        perspective: "1100px",
        isolation: "isolate",
      }}
    >
      {Array.from({ length: 48 }).map((_, index) => (
        <motion.span
          key={index}
          animate={{
            opacity: [0.18, 0.9, 0.18],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 2.3 + (index % 6) * 0.45,
            delay: (index % 10) * 0.14,
            repeat: Infinity,
          }}
          style={{
            position: "absolute",
            left: `${(index * 29) % 98}%`,
            top: `${(index * 43) % 93}%`,
            width: index % 7 === 0 ? "2.4px" : "1.1px",
            height: index % 7 === 0 ? "2.4px" : "1.1px",
            borderRadius: "999px",
            background: index % 8 === 0 ? "#FFD75B" : "#FFFFFF",
            boxShadow:
              index % 8 === 0
                ? "0 0 8px rgba(255,215,91,0.85)"
                : "0 0 5px rgba(255,255,255,0.65)",
          }}
        />
      ))}

      <motion.div
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          opacity: isActive ? [0.22, 0.34, 0.22] : 0.18,
        }}
        transition={{
          duration: 2.6,
          repeat: isActive ? Infinity : 0,
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: "295px",
          height: "295px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `conic-gradient(
            rgba(255,213,0,0.88) ${Math.max(0, Math.min(100, progress)) * 3.6}deg,
            rgba(255,255,255,0.035) 0deg
          )`,
          filter: "blur(20px)",
        }}
      />

      {/* star appears only once the student has progressed far enough */}
      <AnimatePresence>
        {stage >= 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: pointer.x * -8,
              y: pointer.y * -6,
            }}
            transition={{
              opacity: { duration: 0.8 },
              scale: { type: "spring", stiffness: 140, damping: 16 },
              x: { duration: 0.25 },
              y: { duration: 0.25 },
            }}
            style={{
              position: "absolute",
              right: "8%",
              top: "18%",
              width: stage >= 6 ? "102px" : "78px",
              height: stage >= 6 ? "102px" : "78px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 34% 29%, #FFFFE7 0%, #FFF0A5 10%, #FFD247 30%, #F39B00 58%, #A94300 82%, #491400 100%)",
              boxShadow:
                "0 0 18px rgba(255,236,145,0.95), 0 0 44px rgba(255,181,0,0.70), 0 0 82px rgba(255,130,0,0.35)",
            }}
          />
        )}
      </AnimatePresence>

      {/* primary world */}
      <motion.div
        animate={{
          x: pointer.x * 20,
          y: pointer.y * 16,
          rotateY: pointer.x * 11,
          rotateX: pointer.y * -9,
          scale: isActive ? [1, 1.018, 1] : 1,
        }}
        transition={{
          x: { duration: 0.2 },
          y: { duration: 0.2 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 },
          scale: {
            duration: 2.5,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
          },
        }}
        style={{
          position: "absolute",
          left: stage >= 4 ? "36%" : "50%",
          top: "43%",
          width: stage >= 4 ? "214px" : "248px",
          height: stage >= 4 ? "214px" : "248px",
          marginLeft: stage >= 4 ? "-107px" : "-124px",
          marginTop: stage >= 4 ? "-107px" : "-124px",
          borderRadius: "50%",
          transformStyle: "preserve-3d",
          background:
            stage >= 1
              ? "radial-gradient(circle at 30% 24%, #DDF8FF 0%, #74C3E8 20%, #3574A7 42%, #3B7852 60%, #162E41 79%, #07121B 100%)"
              : "radial-gradient(circle at 30% 24%, #E3D6BE 0%, #AE8E6B 25%, #715845 53%, #3B2B25 78%, #17100E 100%)",
          boxShadow:
            stage >= 1
              ? "inset -38px -32px 54px rgba(0,0,0,0.52), inset 18px 16px 26px rgba(255,255,255,0.20), 0 26px 58px rgba(0,0,0,0.48), 0 0 34px rgba(72,167,222,0.18)"
              : "inset -38px -32px 54px rgba(0,0,0,0.58), inset 18px 16px 26px rgba(255,255,255,0.18), 0 26px 58px rgba(0,0,0,0.50)",
        }}
      >
        {/* terrain / cloud texture */}
        {stage >= 1 && (
          <>
            <span
              style={{
                position: "absolute",
                width: "36%",
                height: "13%",
                left: "13%",
                top: "28%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                filter: "blur(4px)",
                transform: "rotate(-12deg)",
              }}
            />
            <span
              style={{
                position: "absolute",
                width: "28%",
                height: "10%",
                right: "14%",
                top: "48%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.16)",
                filter: "blur(4px)",
                transform: "rotate(18deg)",
              }}
            />
          </>
        )}

        {/* atmosphere */}
        {stage >= 1 && (
          <motion.span
            animate={{
              boxShadow: isActive
                ? [
                    "0 0 20px rgba(86,185,240,0.25)",
                    "0 0 32px rgba(86,185,240,0.42)",
                    "0 0 20px rgba(86,185,240,0.25)",
                  ]
                : "0 0 20px rgba(86,185,240,0.25)",
            }}
            transition={{
              duration: 2.7,
              repeat: isActive ? Infinity : 0,
            }}
            style={{
              position: "absolute",
              inset: "-7px",
              borderRadius: "50%",
              border: "2px solid rgba(122,207,255,0.22)",
            }}
          />
        )}

        {/* rings */}
        {stage >= 3 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            style={{
              position: "absolute",
              width: "160%",
              height: "42%",
              left: "-30%",
              top: "29%",
              borderRadius: "50%",
              border: "7px solid rgba(230,198,112,0.64)",
              transform: "rotate(-13deg)",
              boxShadow: "0 0 14px rgba(255,216,117,0.18)",
            }}
          />
        )}

        {/* timer lives ON the world */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <strong
            style={{
              color: stage >= 1 ? "#F5FCFF" : "#FFF4E8",
              fontSize: stage >= 4 ? "32px" : "36px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              textShadow: "0 4px 15px rgba(0,0,0,0.48)",
            }}
          >
            {timeLabel}
          </strong>
          <span
            style={{
              marginTop: "7px",
              color: "rgba(255,255,255,0.70)",
              fontSize: "8px",
              fontWeight: 900,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              textShadow: "0 2px 7px rgba(0,0,0,0.55)",
            }}
          >
            {mode === "work" ? "Focus time" : "Break"}
          </span>
        </div>
      </motion.div>

      {/* moon: floating, not constantly orbiting */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 18 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: pointer.x * 28,
              y: pointer.y * 20,
              rotate: isActive ? [0, 6, -4, 0] : 0,
            }}
            transition={{
              opacity: { duration: 0.45 },
              scale: { type: "spring", stiffness: 170, damping: 15 },
              rotate: { duration: 5, repeat: isActive ? Infinity : 0 },
            }}
            style={{
              position: "absolute",
              left: stage >= 4 ? "56%" : "72%",
              top: stage >= 4 ? "27%" : "24%",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 25%, #F4F1E8 0%, #BEB7A9 38%, #777064 70%, #332F2A 100%)",
              boxShadow:
                "inset -9px -8px 13px rgba(0,0,0,0.40), 0 10px 22px rgba(0,0,0,0.38)",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                left: "10px",
                top: "17px",
                background: "rgba(70,65,58,0.28)",
              }}
            />
            <span
              style={{
                position: "absolute",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                right: "9px",
                top: "9px",
                background: "rgba(70,65,58,0.23)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* second world */}
      <AnimatePresence>
        {stage >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2, x: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: pointer.x * -18,
              y: pointer.y * 14,
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { type: "spring", stiffness: 140, damping: 15 },
            }}
            style={{
              position: "absolute",
              right: "9%",
              top: stage >= 5 ? "48%" : "37%",
              width: stage >= 6 ? "114px" : "96px",
              height: stage >= 6 ? "114px" : "96px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 24%, #FFD5B5 0%, #D96F43 30%, #853B28 62%, #321814 100%)",
              boxShadow:
                "inset -20px -17px 28px rgba(0,0,0,0.45), inset 8px 7px 12px rgba(255,255,255,0.18), 0 18px 38px rgba(0,0,0,0.45)",
            }}
          />
        )}
      </AnimatePresence>

      {/* later-stage system motion — only once a system exists */}
      <AnimatePresence>
        {stage >= 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              left: "50%",
              top: "43%",
              width: "420px",
              height: "190px",
              marginLeft: "-210px",
              marginTop: "-95px",
              borderRadius: "50%",
              border: "1px solid rgba(255,214,97,0.16)",
              transform: "rotate(-9deg)",
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          position: "absolute",
          zIndex: 80,
          left: "18px",
          right: "18px",
          bottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "13px 14px",
          borderRadius: "19px",
          background: "rgba(9,11,16,0.66)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 850,
            }}
          >
            {stageName}
          </p>
          <p
            style={{
              margin: "3px 0 0",
              color: "#9299A6",
              fontSize: "10px",
            }}
          >
            Next: {nextStage}
          </p>
        </div>

        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: "37px",
            height: "37px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFD500",
            background: "rgba(255,213,0,0.10)",
          }}
        >
          <Sparkles size={18} />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function PomodoroTimer() {
  const [customSettings, setCustomSettings] =
    useState<CustomSettings>(loadSettings());
  const [selectedPreset, setSelectedPreset] = useState(defaultPresets[0]);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  const [sessionsCompleted, setSessionsCompleted] = useState(() =>
    loadNumber("pomodoroSessionsCompleted", 0)
  );

  const [focusStreak, setFocusStreak] = useState(() =>
    loadNumber("pomodoroFocusStreak", 0)
  );

  const [bestStreak, setBestStreak] = useState(() =>
    loadNumber("pomodoroBestStreak", 0)
  );

  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(
    selectedPreset.sessionsBeforeLongBreak
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tempSettings, setTempSettings] =
    useState<CustomSettings>(customSettings);
  const [activePresetName, setActivePresetName] = useState("Pomodoro");

  const completionHandledRef = useRef(false);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    localStorage.setItem(
      "pomodoroSessionsCompleted",
      String(sessionsCompleted)
    );
  }, [sessionsCompleted]);

  useEffect(() => {
    localStorage.setItem("pomodoroFocusStreak", String(focusStreak));
  }, [focusStreak]);

  useEffect(() => {
    localStorage.setItem("pomodoroBestStreak", String(bestStreak));
  }, [bestStreak]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const showTimedCelebration = () => {
    setShowCelebration(true);

    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }

    // Automatically dismiss after 6.5 seconds.
    celebrationTimerRef.current = setTimeout(() => {
      setShowCelebration(false);
    }, 6500);
  };

  const saveSettings = (settings: CustomSettings) => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
    setCustomSettings(settings);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRunning && timeLeft > 0) {
      completionHandledRef.current = false;

      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    if (timeLeft === 0 && !completionHandledRef.current) {
      completionHandledRef.current = true;

      if (mode === "work") {
        const newSessionCount = sessionsCompleted + 1;
        const newStreak = focusStreak + 1;
        const newBest = Math.max(bestStreak, newStreak);

        setSessionsCompleted(newSessionCount);
        setFocusStreak(newStreak);
        setBestStreak(newBest);
        showTimedCelebration();

        const nextUntilLongBreak = sessionsUntilLongBreak - 1;
        const shouldTakeLongBreak = nextUntilLongBreak <= 0;

        setIsLongBreak(shouldTakeLongBreak);

        if (shouldTakeLongBreak) {
          setSessionsUntilLongBreak(selectedPreset.sessionsBeforeLongBreak);
        } else {
          setSessionsUntilLongBreak(nextUntilLongBreak);
        }

        setMode("break");

        const breakTime = shouldTakeLongBreak
          ? selectedPreset.longBreak
          : selectedPreset.break;

        setTimeLeft(breakTime * 60);
        setIsRunning(customSettings.autoStartBreaks);
      } else {
        setMode("work");
        setTimeLeft(selectedPreset.focus * 60);
        setIsRunning(customSettings.autoStartFocus);
        setIsLongBreak(false);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    timeLeft,
    mode,
    selectedPreset,
    sessionsUntilLongBreak,
    customSettings,
    sessionsCompleted,
    focusStreak,
    bestStreak,
  ]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    completionHandledRef.current = false;

    const duration =
      mode === "work"
        ? selectedPreset.focus
        : isLongBreak
        ? selectedPreset.longBreak
        : selectedPreset.break;

    setTimeLeft(duration * 60);
  };

  const switchMode = (newMode: "work" | "break") => {
    setMode(newMode);
    setIsRunning(false);
    completionHandledRef.current = false;

    if (newMode === "work") {
      setTimeLeft(selectedPreset.focus * 60);
      setIsLongBreak(false);
      return;
    }

    const breakTime = isLongBreak
      ? selectedPreset.longBreak
      : selectedPreset.break;

    setTimeLeft(breakTime * 60);
  };

  const changePreset = (presetName: string) => {
    const preset = defaultPresets.find(
      (item) => item.name === presetName
    );

    if (!preset) return;

    const nextPreset =
      presetName === "Custom"
        ? {
            ...preset,
            focus: customSettings.focusTime,
            break: customSettings.shortBreak,
            longBreak: customSettings.longBreak,
            sessionsBeforeLongBreak:
              customSettings.sessionsBeforeLongBreak,
          }
        : preset;

    setSelectedPreset(nextPreset);
    setSessionsUntilLongBreak(nextPreset.sessionsBeforeLongBreak);
    setIsRunning(false);
    completionHandledRef.current = false;

    const duration =
      mode === "work"
        ? nextPreset.focus
        : isLongBreak
        ? nextPreset.longBreak
        : nextPreset.break;

    setTimeLeft(duration * 60);
    setActivePresetName(presetName);
  };

  const handleSaveSettings = () => {
    saveSettings(tempSettings);

    const customPreset: TimerPreset = {
      ...defaultPresets[3],
      focus: tempSettings.focusTime,
      break: tempSettings.shortBreak,
      longBreak: tempSettings.longBreak,
      sessionsBeforeLongBreak: tempSettings.sessionsBeforeLongBreak,
    };

    setSelectedPreset(customPreset);
    setSessionsUntilLongBreak(tempSettings.sessionsBeforeLongBreak);
    setActivePresetName("Custom");
    setIsRunning(false);
    completionHandledRef.current = false;

    const duration =
      mode === "work"
        ? tempSettings.focusTime
        : isLongBreak
        ? tempSettings.longBreak
        : tempSettings.shortBreak;

    setTimeLeft(duration * 60);
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const totalTime =
    mode === "work"
      ? selectedPreset.focus * 60
      : (isLongBreak ? selectedPreset.longBreak : selectedPreset.break) * 60;

  const progress =
    totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <>
      <Card
        className="border-0"
        style={{
          overflow: "hidden",
          borderRadius: "30px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.80), rgba(255,255,255,0.58))",
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
          border: "1px solid rgba(255,255,255,0.94)",
          boxShadow: "0 18px 42px rgba(30,26,18,0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "18px",
            padding: "22px",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#9A7D00",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Focus journey
              </p>
              <h3
                style={{
                  margin: "5px 0 0",
                  color: "#111111",
                  fontSize: "24px",
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: "-0.035em",
                }}
              >
                Build your universe
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#77716A",
                  fontSize: "13px",
                }}
              >
                Complete sessions to evolve your world and grow your streak.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTempSettings(customSettings);
                setShowSettings(true);
              }}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "15px",
                background: "rgba(255,255,255,0.68)",
                border: "1px solid rgba(220,218,213,0.75)",
                flexShrink: 0,
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Select value={activePresetName} onValueChange={changePreset}>
            <SelectTrigger
              style={{
                minHeight: "46px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.68)",
              }}
            >
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

          <JourneyWorld
            sessionsCompleted={sessionsCompleted}
            isActive={isRunning && mode === "work"}
            progress={progress}
            timeLabel={formatTime(timeLeft)}
            mode={mode}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "10px",
            }}
          >
            <Button
              size="lg"
              onClick={toggleTimer}
              style={{
                minHeight: "56px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, #FFD500 0%, #FFDF4A 58%, #E8B600 100%)",
                color: "#111111",
                fontWeight: 900,
                boxShadow: "0 12px 26px rgba(255,196,0,0.20)",
              }}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              style={{
                width: "58px",
                height: "56px",
                padding: 0,
                borderRadius: "20px",
                background: "#111111",
                color: "#FFFFFF",
                border: "none",
              }}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              padding: "5px",
              borderRadius: "18px",
              background: "rgba(235,232,226,0.72)",
            }}
          >
            <Button
              variant="ghost"
              onClick={() => switchMode("work")}
              style={{
                minHeight: "44px",
                borderRadius: "14px",
                background: mode === "work" ? "#FFFFFF" : "transparent",
                boxShadow:
                  mode === "work"
                    ? "0 6px 16px rgba(30,26,18,0.06)"
                    : "none",
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Focus
            </Button>

            <Button
              variant="ghost"
              onClick={() => switchMode("break")}
              style={{
                minHeight: "44px",
                borderRadius: "14px",
                background: mode === "break" ? "#FFFFFF" : "transparent",
                boxShadow:
                  mode === "break"
                    ? "0 6px 16px rgba(30,26,18,0.06)"
                    : "none",
              }}
            >
              <Coffee className="w-4 h-4 mr-2" />
              Break
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            {[
              {
                icon: Flame,
                label: "Focus streak",
                value: focusStreak,
                accent: "#FF8A3D",
              },
              {
                icon: Star,
                label: "Sessions",
                value: sessionsCompleted,
                accent: "#D0A600",
              },
              {
                icon: Orbit,
                label: "Best streak",
                value: bestStreak,
                accent: "#7C67D9",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -2 }}
                  style={{
                    padding: "14px 10px",
                    borderRadius: "18px",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.58)",
                    border: "1px solid rgba(255,255,255,0.90)",
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      margin: "0 auto 7px",
                      color: item.accent,
                    }}
                  />
                  <strong
                    style={{
                      display: "block",
                      color: "#111111",
                      fontSize: "18px",
                    }}
                  >
                    {item.value}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      color: "#7C766E",
                      fontSize: "10px",
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
            <DialogDescription>
              Customize your focus timer durations and preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>Focus Duration (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.focusTime}
                onChange={(event) =>
                  setTempSettings({
                    ...tempSettings,
                    focusTime: parseInt(event.target.value, 10) || 25,
                  })
                }
                min={1}
                max={120}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Short Break (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.shortBreak}
                onChange={(event) =>
                  setTempSettings({
                    ...tempSettings,
                    shortBreak: parseInt(event.target.value, 10) || 5,
                  })
                }
                min={1}
                max={30}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Long Break (minutes)</Label>
              <Input
                type="number"
                value={tempSettings.longBreak}
                onChange={(event) =>
                  setTempSettings({
                    ...tempSettings,
                    longBreak: parseInt(event.target.value, 10) || 15,
                  })
                }
                min={1}
                max={60}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Sessions Before Long Break</Label>
              <Input
                type="number"
                value={tempSettings.sessionsBeforeLongBreak}
                onChange={(event) =>
                  setTempSettings({
                    ...tempSettings,
                    sessionsBeforeLongBreak:
                      parseInt(event.target.value, 10) || 4,
                  })
                }
                min={1}
                max={10}
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Auto-start breaks</Label>
                <Switch
                  checked={tempSettings.autoStartBreaks}
                  onCheckedChange={(checked: boolean) =>
                    setTempSettings({
                      ...tempSettings,
                      autoStartBreaks: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto-start focus</Label>
                <Switch
                  checked={tempSettings.autoStartFocus}
                  onCheckedChange={(checked: boolean) =>
                    setTempSettings({
                      ...tempSettings,
                      autoStartFocus: checked,
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CelebrationOverlay
        show={showCelebration}
        message={`Focus complete — streak ${focusStreak}. Your universe just evolved.`}
        type="fireworks"
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}