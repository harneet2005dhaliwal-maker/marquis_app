import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trophy, Star, BookOpen, Flame, Target, Clock, TrendingUp, TrendingDown, Calendar, Award, Lock, BarChart3, Sparkles, Brain, Zap, ChevronRight, ChevronDown, ChevronUp, ArrowRight, Circle, Crosshair, Lightbulb, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import { Progress } from "./ui/progress";
import { AchievementUnlock } from "./AchievementUnlock";
import { AIInsightsPage } from "./AIInsightsPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

// Mock study history data
const studyHistoryData = [
  { day: "Mon", hours: 2.5, sessions: 3, fullDay: "Monday", isPeak: false },
  { day: "Tue", hours: 3.2, sessions: 4, fullDay: "Tuesday", isPeak: false },
  { day: "Wed", hours: 1.8, sessions: 2, fullDay: "Wednesday", isPeak: false },
  { day: "Thu", hours: 4.0, sessions: 5, fullDay: "Thursday", isPeak: true },
  { day: "Fri", hours: 3.5, sessions: 4, fullDay: "Friday", isPeak: false },
  { day: "Sat", hours: 2.0, sessions: 2, fullDay: "Saturday", isPeak: false },
  { day: "Sun", hours: 3.8, sessions: 4, fullDay: "Sunday", isPeak: true },
];

const previousWeekTotal = 18.2;
const currentWeekTotal = 20.8;
const weeklyChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;

// Custom animated dot for chart
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <g>
      {/* Glow effect */}
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="rgba(255, 213, 0, 0.2)"
        style={{ filter: 'blur(4px)' }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#FFD500"
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      {/* Peak marker */}
      {payload.isPeak && (
        <text
          x={cx}
          y={cy - 15}
          textAnchor="middle"
          fontSize="12"
        >
          🔥
        </text>
      )}
    </g>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-xl p-3"
        style={{ 
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <p className="text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#595959' }}>
          {data.fullDay}
        </p>
        <p className="text-sm mb-0" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#000000' }}>
          {payload[0].value} {payload[0].name}
        </p>
        {data.sessions && (
          <p className="text-xs mt-1 mb-0" style={{ fontFamily: 'Inter, sans-serif', color: '#595959' }}>
            {data.sessions} sessions
          </p>
        )}
      </motion.div>
    );
  }
  return null;
};

// Unified Card Component
const UnifiedCard = ({ children, className = "", delay = 0, glow = false }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -2 }}
    className={className}
  >
    <Card 
      className="border-0 relative overflow-hidden"
      style={{ 
        borderRadius: '18px',
        boxShadow: glow 
          ? '0px 4px 20px rgba(255,213,0,0.12), 0px 2px 8px rgba(0,0,0,0.04)' 
          : '0px 4px 20px rgba(0,0,0,0.05)',
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.06)'
      }}
    >
      {/* Top gradient stripe */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ 
          background: 'linear-gradient(90deg, rgba(255,213,0,0.15), rgba(255,213,0,0.05))'
        }}
      />
      {children}
    </Card>
  </motion.div>
);

interface ProgressPageProps {
  onNavigate?: (tab: string) => void;
}

export function ProgressPage({ onNavigate }: ProgressPageProps) {
  const [chartMetric, setChartMetric] = useState<'hours' | 'sessions'>('hours');
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [activeInsightTab, setActiveInsightTab] = useState<'trends' | 'tips' | 'predictions'>('trends');
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentStreak = 7;
  const nextStreakMilestone = 14;
  const streakProgress = (currentStreak / nextStreakMilestone) * 100;

  const achievements = [
    { 
      id: 1, 
      name: "First Week", 
      icon: BookOpen, 
      earned: true, 
      color: "#FFD500", 
      points: 10,
      pattern: "radial"
    },
    { 
      id: 2, 
      name: "7-Day Streak", 
      icon: Flame, 
      earned: true, 
      color: "#FFD500", 
      points: 25,
      pattern: "radial"
    },
    { 
      id: 3, 
      name: "20 Hours", 
      icon: Clock, 
      earned: true, 
      color: "#FFD500", 
      points: 50,
      pattern: "radial"
    },
    { 
      id: 4, 
      name: "30-Day Goal", 
      icon: Trophy, 
      earned: false, 
      color: "#E6E6E6", 
      points: 100,
      pattern: "radial"
    },
    { 
      id: 5, 
      name: "Math Master", 
      icon: Target, 
      earned: false, 
      color: "#E6E6E6", 
      points: 75,
      pattern: "radial"
    },
    { 
      id: 6, 
      name: "Quiz Champion", 
      icon: Star, 
      earned: false, 
      color: "#E6E6E6", 
      points: 50,
      pattern: "radial"
    },
  ];

  const activeGoals = [
    {
      id: 1,
      title: "Complete 30 study hours",
      subject: "Mathematics",
      progress: 68,
      deadline: "Dec 15",
      projected: "On track",
      onTrack: true
    },
    {
      id: 2,
      title: "Finish Algebra module",
      subject: "Mathematics",
      progress: 45,
      deadline: "Dec 20",
      projected: "2 days ahead",
      onTrack: true
    },
    {
      id: 3,
      title: "Master essay structure",
      subject: "English",
      progress: 32,
      deadline: "Dec 18",
      projected: "1 day behind",
      onTrack: false
    }
  ];

  const aiRecommendations = [
    {
      id: 1,
      icon: Lightbulb,
      title: "Peak Performance Window",
      advice: "Your best focus time is Thursday mornings. Schedule difficult topics then.",
      detail: "Based on your study patterns over the last 4 weeks, your concentration peaks between 9-11 AM on Thursdays. You complete tasks 40% faster and retain 30% more information during this window. Consider scheduling your most challenging subjects like advanced algebra or complex essay writing during these hours for maximum effectiveness."
    },
    {
      id: 2,
      icon: Target,
      title: "Consistency Boost",
      advice: "You're 85% consistent! Add 1 more session on Wednesdays to hit 100%.",
      detail: "You've maintained study sessions 6 out of 7 days this week. Wednesday is your least active day with only 1.8 hours logged. By adding just one 25-minute Pomodoro session on Wednesdays, you'll achieve a perfect weekly consistency score. Consistent daily practice has been shown to improve long-term retention by up to 50%."
    },
    {
      id: 3,
      icon: Zap,
      title: "Quick Win",
      advice: "Complete 2 more sessions this week to unlock 'Weekly Champion' badge.",
      detail: "You're only 2 focus sessions away from earning the 'Weekly Champion' achievement worth 50 points! This badge is awarded to students who complete 20+ sessions in a single week. Your current pace: 18 sessions. Suggested action: Complete one session today and one tomorrow to claim your reward and boost your progress ranking."
    }
  ];

  const focusAreas = [
    { name: "Mathematics", hours: 8.5, percentage: 45, color: "#A78BFA", size: 120 },
    { name: "English", hours: 6.2, percentage: 32, color: "#C4B5FD", size: 100 },
    { name: "Flashcards", hours: 4.3, percentage: 23, color: "#DDD6FE", size: 80 },
  ];

  const handleAchievementClick = (achievement: any) => {
    if (achievement.earned) {
      setSelectedAchievement(achievement);
      setShowAchievementModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // If showing AI Insights, render full page
  if (showAIInsights) {
    return <AIInsightsPage onBack={() => setShowAIInsights(false)} />;
  }

  return (
    <div 
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom, #FFF9EB 0%, #FFFFFF 50%, #FFF7D9 100%)',
      }}
    >
      {/* Additional soft overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at top right, rgba(255,213,0,0.08), transparent 60%)',
          opacity: 0.3
        }}
      />

      <div className="p-6 space-y-5 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 
            className="mt-0 mb-1" 
            style={{ 
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '32px',
              color: '#000000',
              letterSpacing: '-0.02em'
            }}
          >
            Your Progress
          </h1>
          <p 
            className="text-sm mb-0" 
            style={{ 
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              color: '#595959'
            }}
          >
            Track your study journey and achievements
          </p>
        </motion.div>

        {/* Begin Focus Session CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate && onNavigate('study')}
          className="cursor-pointer"
        >
          <Card 
            className="border-0 p-5"
            style={{ 
              borderRadius: '18px',
              boxShadow: '0px 8px 24px rgba(255,213,0,0.25), 0px 4px 12px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #FFD500 0%, #FFC700 100%)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.1)' }}
                >
                  <Clock className="w-6 h-6" style={{ color: '#000000', strokeWidth: 2.5 }} />
                </div>
                <div>
                  <h3 
                    className="mb-0" 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#000000'
                    }}
                  >
                    Begin Focus Session
                  </h3>
                  <p 
                    className="text-sm mb-0" 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      color: 'rgba(0,0,0,0.7)'
                    }}
                  >
                    Start a Pomodoro timer
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" style={{ color: 'rgba(0,0,0,0.4)' }} />
            </div>
          </Card>
        </motion.div>

        {/* Metrics Overview - 4 Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <UnifiedCard delay={0.15} glow>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,213,0,0.15)' }}
                >
                  <Target className="w-5 h-5" style={{ color: '#FFD500', strokeWidth: 2.5 }} />
                </div>
                <h3 
                  className="text-xs mb-0" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#595959',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Today
                </h3>
              </div>
              <div className="relative">
                <div 
                  className="absolute -inset-2 rounded-full"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(255,213,0,0.1) 0%, transparent 70%)',
                    filter: 'blur(8px)'
                  }}
                />
                <p 
                  className="mb-0 relative" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '32px',
                    color: '#000000',
                    lineHeight: 1
                  }}
                >
                  2.5h
                </p>
              </div>
              <p 
                className="text-xs mt-2 mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#595959'
                }}
              >
                3 sessions
              </p>
            </div>
          </UnifiedCard>

          {/* This Week */}
          <UnifiedCard delay={0.2} glow>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,213,0,0.15)' }}
                >
                  <Calendar className="w-5 h-5" style={{ color: '#FFD500', strokeWidth: 2.5 }} />
                </div>
                <h3 
                  className="text-xs mb-0" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#595959',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  This Week
                </h3>
              </div>
              <div className="relative">
                <div 
                  className="absolute -inset-2 rounded-full"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(255,213,0,0.1) 0%, transparent 70%)',
                    filter: 'blur(8px)'
                  }}
                />
                <p 
                  className="mb-0 relative" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '32px',
                    color: '#000000',
                    lineHeight: 1
                  }}
                >
                  {currentWeekTotal}h
                </p>
              </div>
              <p 
                className="text-xs mt-2 mb-0 flex items-center gap-1" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#10B981'
                }}
              >
                <TrendingUp className="w-3 h-3" />
                +{weeklyChange.toFixed(0)}%
              </p>
            </div>
          </UnifiedCard>

          {/* All Time */}
          <UnifiedCard delay={0.25}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,213,0,0.15)' }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: '#FFD500', strokeWidth: 2.5 }} />
                </div>
                <h3 
                  className="text-xs mb-0" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#595959',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  All Time
                </h3>
              </div>
              <p 
                className="mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: '32px',
                  color: '#000000',
                  lineHeight: 1
                }}
              >
                156h
              </p>
              <p 
                className="text-xs mt-2 mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#595959'
                }}
              >
                82 sessions
              </p>
            </div>
          </UnifiedCard>

          {/* AI Insights */}
          <UnifiedCard delay={0.3}>
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setShowAIInsights(true)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.15)' }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: '#A78BFA', strokeWidth: 2.5 }} />
                </div>
                <h3 
                  className="text-xs mb-0" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#595959',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  AI Insights
                </h3>
              </div>
              <p 
                className="mb-0 text-xs" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#383838',
                  lineHeight: 1.4
                }}
              >
                View personalized tips
              </p>
              <ChevronRight className="w-4 h-4 mt-2" style={{ color: '#A78BFA' }} />
            </div>
          </UnifiedCard>
        </div>

        {/* Study Streak */}
        <UnifiedCard delay={0.35} glow>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                  style={{ 
                    background: 'linear-gradient(145deg, #FFD500, #FFC700)',
                    boxShadow: '0px 8px 16px rgba(255,213,0,0.25)'
                  }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Flame className="w-8 h-8" style={{ color: '#000000', strokeWidth: 2.5 }} />
                  <div 
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ 
                      background: '#000000',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#FFD500'
                    }}
                  >
                    {currentStreak}
                  </div>
                </motion.div>
                <div>
                  <p 
                    className="mb-0" 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 800,
                      fontSize: '28px',
                      color: '#000000',
                      lineHeight: 1
                    }}
                  >
                    {currentStreak} Days
                  </p>
                  <p 
                    className="text-sm mb-0 mt-1" 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      color: '#595959'
                    }}
                  >
                    Current streak 🔥
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p 
                  className="text-xs mb-1" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#595959',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Next Goal
                </p>
                <p 
                  className="mb-0" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: '#000000'
                  }}
                >
                  {nextStreakMilestone} days
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div 
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: '#F3F4F6' }}
              >
                <motion.div 
                  className="h-full rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${streakProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  style={{ 
                    background: 'linear-gradient(90deg, #FFD500, #FFC700)'
                  }}
                >
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                    }}
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  />
                </motion.div>
              </div>
              <p 
                className="text-xs text-center mt-2 mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#595959'
                }}
              >
                {nextStreakMilestone - currentStreak} more days to unlock reward! 🏆
              </p>
            </div>
          </div>
        </UnifiedCard>

        {/* Weekly Activity Chart */}
        <UnifiedCard delay={0.4}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '20px',
                  color: '#000000'
                }}
              >
                Weekly Activity
              </h2>
              
              {/* Pill-style toggles */}
              <div 
                className="flex gap-1 p-1 rounded-full"
                style={{ background: '#F3F4F6' }}
              >
                <motion.button
                  onClick={() => setChartMetric('hours')}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: chartMetric === 'hours' ? '#FFD500' : 'transparent',
                    color: chartMetric === 'hours' ? '#000000' : '#595959',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Hours
                </motion.button>
                <motion.button
                  onClick={() => setChartMetric('sessions')}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: chartMetric === 'sessions' ? '#FFD500' : 'transparent',
                    color: chartMetric === 'sessions' ? '#000000' : '#595959',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sessions
                </motion.button>
              </div>
            </div>

            <p 
              className="text-sm mb-6" 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: '#383838'
              }}
            >
              {weeklyChange > 0 ? '📈' : '📉'} {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}% vs last week
            </p>

            <div style={{ marginTop: '8px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={studyHistoryData} margin={{ top: 30, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,213,0,0.2)" />
                      <stop offset="100%" stopColor="rgba(255,213,0,0)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#F3F4F6" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: '#595959', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#595959', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="#FFD500"
                    strokeWidth={4}
                    fill="url(#lineGradient)"
                    dot={<CustomDot />}
                    filter="url(#glow)"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </UnifiedCard>

        {/* Weekly Orbit Summary */}
        <UnifiedCard delay={0.45}>
          <div className="flex">
            <div 
              className="w-1.5 rounded-l-2xl"
              style={{ background: 'linear-gradient(180deg, #A78BFA, #C4B5FD)' }}
            />
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Circle className="w-4 h-4" style={{ color: '#A78BFA', fill: '#A78BFA' }} />
                <h3 
                  className="mb-0 text-sm" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#000000'
                  }}
                >
                  Weekly Orbit Summary
                </h3>
              </div>
              <p 
                className="text-xs mb-0" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#383838',
                  lineHeight: 1.5
                }}
              >
                You spent <span style={{ fontWeight: 700, color: '#000000' }}>45% on Mathematics</span>, 32% on English, and 23% on review.
              </p>
            </div>
          </div>
        </UnifiedCard>

        {/* AI Insights Tabs */}
        <UnifiedCard delay={0.55}>
          <div className="p-5">
            <h2 
              className="mb-4" 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '20px',
                color: '#000000'
              }}
            >
              AI Insights
            </h2>

            {/* Segmented Control */}
            <div 
              className="flex gap-1 p-1 rounded-xl mb-4"
              style={{ background: '#F3F4F6' }}
            >
              {(['trends', 'tips', 'predictions'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveInsightTab(tab)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs transition-all relative"
                  style={{
                    background: activeInsightTab === tab ? '#A78BFA' : 'transparent',
                    color: activeInsightTab === tab ? '#FFFFFF' : '#595959',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    boxShadow: activeInsightTab === tab ? '0px 2px 8px rgba(167,139,250,0.3)' : 'none',
                    transform: activeInsightTab === tab ? 'translateY(-1px)' : 'none'
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            {/* Insight Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInsightTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeInsightTab === 'trends' && (
                  <div className="space-y-3">
                    <div 
                      className="p-3 rounded-xl flex items-start gap-3"
                      style={{ background: '#FAFAFA' }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(167,139,250,0.15)' }}
                      >
                        <TrendingUp className="w-4 h-4" style={{ color: '#A78BFA' }} />
                      </div>
                      <div className="flex-1">
                        <p 
                          className="text-xs mb-0" 
                          style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#000000',
                            lineHeight: 1.5
                          }}
                        >
                          Your study time increased 14% this month
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {activeInsightTab === 'tips' && (
                  <div className="space-y-3">
                    <div 
                      className="p-3 rounded-xl flex items-start gap-3"
                      style={{ background: '#FAFAFA' }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(167,139,250,0.15)' }}
                      >
                        <Brain className="w-4 h-4" style={{ color: '#A78BFA' }} />
                      </div>
                      <div className="flex-1">
                        <p 
                          className="text-xs mb-0" 
                          style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#000000',
                            lineHeight: 1.5
                          }}
                        >
                          Try reviewing flashcards before bed for better retention
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {activeInsightTab === 'predictions' && (
                  <div className="space-y-3">
                    <div 
                      className="p-3 rounded-xl flex items-start gap-3"
                      style={{ background: '#FAFAFA' }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(167,139,250,0.15)' }}
                      >
                        <Target className="w-4 h-4" style={{ color: '#A78BFA' }} />
                      </div>
                      <div className="flex-1">
                        <p 
                          className="text-xs mb-0" 
                          style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#000000',
                            lineHeight: 1.5
                          }}
                        >
                          At this rate, you'll complete your goal 3 days early
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </UnifiedCard>

        {/* Active Goals */}
        <div className="space-y-3">
          <h2 
            className="mb-0 px-1" 
            style={{ 
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '20px',
              color: '#000000'
            }}
          >
            Active Goals
          </h2>

          {activeGoals.map((goal, index) => (
            <UnifiedCard key={goal.id} delay={0.6 + index * 0.05}>
              <div className="p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 
                      className="mb-0 text-sm" 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        color: '#000000'
                      }}
                    >
                      {goal.title}
                    </h3>
                    <Badge 
                      className="border-0 text-xs"
                      style={{ 
                        background: goal.subject.includes('Math') ? '#FFD50020' : '#00000010',
                        color: goal.subject.includes('Math') ? '#000000' : '#595959',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        padding: '2px 8px'
                      }}
                    >
                      {goal.subject}
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div 
                    className="h-2 rounded-full overflow-hidden mb-2"
                    style={{ background: '#F3F4F6' }}
                  >
                    <motion.div 
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.7 + index * 0.1 }}
                      style={{ 
                        background: goal.onTrack 
                          ? 'linear-gradient(90deg, #FFD500, #FFC700)' 
                          : 'linear-gradient(90deg, #FCA5A5, #EF4444)'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <p 
                      className="text-xs mb-0" 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        color: '#595959'
                      }}
                    >
                      {goal.progress}% complete
                    </p>
                    <p 
                      className="text-xs mb-0" 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        color: goal.onTrack ? '#10B981' : '#EF4444'
                      }}
                    >
                      {goal.projected}
                    </p>
                  </div>

                  {/* Always Visible Details */}
                  <div 
                    className="pt-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid #F3F4F6' }}
                  >
                    <div>
                      <p 
                        className="text-xs mb-0" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#595959',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Deadline
                      </p>
                      <p 
                        className="text-sm mb-0 mt-1" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          color: '#000000'
                        }}
                      >
                        {goal.deadline}
                      </p>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-xs mb-0" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#595959',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Status
                      </p>
                      <p 
                        className="text-sm mb-0 mt-1" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          color: goal.onTrack ? '#10B981' : '#EF4444'
                        }}
                      >
                        {goal.onTrack ? 'On Track ✓' : 'Behind'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </UnifiedCard>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h2 
            className="mb-0 px-1" 
            style={{ 
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '20px',
              color: '#000000'
            }}
          >
            Recommendations
          </h2>

          {aiRecommendations.map((rec, index) => {
            const Icon = rec.icon;
            const isExpanded = expandedRecommendation === rec.id;
            return (
              <UnifiedCard key={rec.id} delay={0.75 + index * 0.05}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRecommendation(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,213,0,0.15)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: '#FFD500', strokeWidth: 2.5 }} />
                    </div>
                    <div className="flex-1">
                      <h4 
                        className="mb-1 text-sm" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#000000'
                        }}
                      >
                        {rec.title}
                      </h4>
                      <p 
                        className="text-xs mb-0" 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          color: '#383838',
                          lineHeight: 1.5
                        }}
                      >
                        {rec.advice}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#595959' }} />
                    </motion.div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div 
                          className="mt-3 pt-3 px-1"
                          style={{ borderTop: '1px solid #F3F4F6' }}
                        >
                          <p 
                            className="text-xs mb-0" 
                            style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 500,
                              color: '#595959',
                              lineHeight: 1.6
                            }}
                          >
                            {rec.detail}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </UnifiedCard>
            );
          })}
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 
              className="mb-0" 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '20px',
                color: '#000000'
              }}
            >
              Achievements
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                color: '#595959'
              }}
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <UnifiedCard key={achievement.id} delay={0.85 + index * 0.03}>
                  <div 
                    className="p-4 text-center relative overflow-hidden"
                    style={{ 
                      opacity: achievement.earned ? 1 : 0.5 
                    }}
                  >
                    {/* Radiating pattern background */}
                    {achievement.earned && (
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at center, ${achievement.color}15 0%, transparent 70%)`,
                          opacity: 0.5
                        }}
                      />
                    )}

                    <motion.div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 relative"
                      style={{ 
                        background: achievement.earned 
                          ? `linear-gradient(145deg, ${achievement.color}, ${achievement.color}dd)` 
                          : '#E6E6E6',
                        boxShadow: achievement.earned ? `0px 4px 12px ${achievement.color}40` : 'none'
                      }}
                      whileHover={achievement.earned ? { scale: 1.1, rotate: 5 } : {}}
                      onClick={() => handleAchievementClick(achievement)}
                    >
                      {achievement.earned ? (
                        <Icon className="w-5 h-5" style={{ color: '#000000', strokeWidth: 2.5 }} />
                      ) : (
                        <Lock className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                      )}
                    </motion.div>
                    
                    <h4 
                      className="mb-1 text-xs" 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        color: achievement.earned ? '#000000' : '#9CA3AF',
                        lineHeight: 1.3
                      }}
                    >
                      {achievement.name}
                    </h4>
                    <p 
                      className="text-xs mb-0" 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        color: achievement.earned ? '#FFD500' : '#D1D5DB'
                      }}
                    >
                      {achievement.points} pts
                    </p>
                  </div>
                </UnifiedCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievement Unlock Modal */}
      {showAchievementModal && (
        <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Achievement Unlocked!</DialogTitle>
              <DialogDescription>
                Congratulations on earning a new achievement!
              </DialogDescription>
            </DialogHeader>
            <AchievementUnlock 
              achievement={selectedAchievement}
              showConfetti={showConfetti}
              onConfettiComplete={() => setShowConfetti(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}