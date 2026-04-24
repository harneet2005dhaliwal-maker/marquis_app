import { motion } from "motion/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Trophy, Star, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AchievementUnlockProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    name: string;
    description: string;
    icon: any;
    color: string;
    points: number;
  } | null;
}

export function AchievementUnlock({ isOpen, onClose, achievement }: AchievementUnlockProps) {
  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>Achievement Unlocked</DialogTitle>
          <DialogDescription>You've earned a new achievement: {achievement.name}</DialogDescription>
        </VisuallyHidden>
        {/* Animated Background */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-8 overflow-hidden">
          {/* Confetti Animation */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98'][i % 4],
                left: `${Math.random() * 100}%`,
                top: '-10%',
              }}
              animate={{
                y: ['0vh', '120vh'],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}

          {/* Achievement Badge */}
          <motion.div
            className="relative flex flex-col items-center gap-4 z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <div className={`w-24 h-24 rounded-full ${achievement.color} flex items-center justify-center shadow-2xl relative`}>
                <Icon className="w-12 h-12 text-white" />
                
                {/* Sparkle effects */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 180, 270, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-white mb-2">Achievement Unlocked!</h2>
              <h3 className="text-white">{achievement.name}</h3>
              <p className="text-white/90">{achievement.description}</p>
              <motion.div
                className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-white">+{achievement.points} points</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <div className="p-4 bg-white">
          <Button onClick={onClose} className="w-full">
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
