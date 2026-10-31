import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Flame,
  Sparkles,
  Star,
} from "lucide-react";

interface CelebrationOverlayProps {
  show: boolean;
  message: string;
  type?: "confetti" | "stars" | "fireworks";
  onComplete?: () => void;
}

const getStoredNumber = (key: string) => {
  if (typeof window === "undefined") return 0;
  const parsed = Number(localStorage.getItem(key));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function CelebrationOverlay({
  show,
  message,
  onComplete,
}: CelebrationOverlayProps) {
  const [streak, setStreak] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!show) return;

    setStreak(getStoredNumber("pomodoroFocusStreak"));
    setSessions(getStoredNumber("pomodoroSessionsCompleted"));
    setSecondsLeft(10);

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Hard auto-close after 10 seconds.
    const closeTimer = window.setTimeout(() => {
      onComplete?.();
    }, 10000);

    const countdown = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.clearTimeout(closeTimer);
      window.clearInterval(countdown);
    };
  }, [show, onComplete]);

  const xp = useMemo(
    () => 100 + Math.min(streak, 10) * 5,
    [streak]
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            padding: 18,
            background:
              "radial-gradient(circle at 50% 40%,rgba(196,151,50,.12),rgba(7,9,13,.95) 52%,rgba(2,3,5,.99) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 0.72, 0.08],
                scale: [0.3, 1, 0.6],
                y: [16, -48 - (index % 5) * 19],
              }}
              transition={{
                duration: 2.4 + (index % 4) * 0.35,
                delay: (index % 9) * 0.08,
              }}
              style={{
                position: "absolute",
                left: `${8 + ((index * 31) % 84)}%`,
                bottom: `${8 + ((index * 17) % 35)}%`,
                width: index % 6 === 0 ? 5 : 2,
                height: index % 6 === 0 ? 5 : 2,
                borderRadius: "50%",
                background: index % 5 === 0 ? "#A98DF0" : "#D7B44C",
                boxShadow: "0 0 8px currentColor",
              }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 185, damping: 21 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 430,
              padding: "24px 20px 18px",
              borderRadius: 32,
              color: "#FFF",
              textAlign: "center",
              background:
                "linear-gradient(155deg,rgba(25,28,36,.95),rgba(5,7,11,.98))",
              border: "1px solid rgba(255,255,255,.12)",
              boxShadow:
                "0 34px 90px rgba(0,0,0,.60),inset 0 1px 0 rgba(255,255,255,.08)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 999,
                  color: "#FF9B55",
                  background: "rgba(255,130,55,.08)",
                  border: "1px solid rgba(255,137,67,.22)",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <Flame size={14} fill="#FF9B55" />
                {streak} streak
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 999,
                  color: "#D9B64E",
                  background: "rgba(217,182,78,.08)",
                  border: "1px solid rgba(217,182,78,.24)",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <Star size={14} fill="#D9B64E" />
                +{xp} XP
              </div>
            </div>

            <p
              style={{
                margin: "18px 0 0",
                color: "#B49335",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              Focus complete
            </p>

            <h2
              style={{
                margin: "6px 0 0",
                color: "#F8F8F8",
                fontSize: 29,
                lineHeight: 1.04,
                fontWeight: 900,
                letterSpacing: "-.04em",
              }}
            >
              Another world mapped.
            </h2>

            {/* refined discovery atlas */}
            <div
              style={{
                position: "relative",
                height: 185,
                marginTop: 10,
              }}
            >
              {[54, 88, 122, 156].map((diameter) => (
                <div
                  key={diameter}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: diameter,
                    height: diameter,
                    marginLeft: -diameter / 2,
                    marginTop: -diameter / 2,
                    borderRadius: "50%",
                    border: "1px solid rgba(192,151,60,.14)",
                  }}
                />
              ))}

              <motion.div
                animate={{
                  scale: [1, 1.035, 1],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 58,
                  height: 58,
                  marginLeft: -29,
                  marginTop: -29,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 34% 29%,#FFF8DB,#E2BC59 38%,#9B6115 70%,#3D2207 100%)",
                  boxShadow:
                    "0 0 12px rgba(226,188,89,.40),0 0 24px rgba(155,97,21,.16)",
                }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 150 }}
                style={{
                  position: "absolute",
                  left: "calc(50% + 70px)",
                  top: "calc(50% - 16px)",
                  width: 25,
                  height: 25,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 24%,#E9DCCB,#A87959 48%,#493127 100%)",
                  boxShadow:
                    "inset -6px -5px 8px rgba(0,0,0,.38),0 5px 12px rgba(0,0,0,.30)",
                }}
              />

              <Sparkles
                size={18}
                style={{
                  position: "absolute",
                  left: "22%",
                  top: "22%",
                  color: "#C9A43F",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                overflow: "hidden",
                borderRadius: 18,
                background: "rgba(255,255,255,.035)",
                border: "1px solid rgba(255,255,255,.07)",
              }}
            >
              {[
                ["XP", `+${xp}`],
                ["Streak", String(streak)],
                ["Sessions", String(sessions)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  style={{
                    padding: "12px 6px",
                    borderLeft:
                      index === 0
                        ? "none"
                        : "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: index === 0 ? "#D9B64E" : "#F2F2F2",
                      fontSize: 16,
                    }}
                  >
                    {value}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#737A85",
                      fontSize: 8,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p
              style={{
                margin: "11px auto 0",
                maxWidth: 330,
                color: "#777E89",
                fontSize: 10,
                lineHeight: 1.45,
              }}
            >
              {message}
            </p>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete?.()}
              style={{
                width: "100%",
                minHeight: 53,
                marginTop: 14,
                border: "none",
                borderRadius: 18,
                cursor: "pointer",
                color: "#111",
                fontSize: 14,
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#D8B445,#E7CA72 58%,#B98D27 100%)",
                boxShadow: "0 12px 28px rgba(185,141,39,.18)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Continue My Journey
                <ArrowRight size={16} />
              </span>
            </motion.button>

            <p
              style={{
                margin: "8px 0 0",
                color: "#5D646E",
                fontSize: 8,
              }}
            >
              Returning automatically in {secondsLeft}s
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}