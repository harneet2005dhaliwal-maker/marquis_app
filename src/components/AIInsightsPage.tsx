import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AIStudyPlanPage } from "./AIStudyPlanPage";
import { PlanetDistribution } from "./PlanetDistribution";
import { 
  Sparkles, Target, TrendingUp, Calendar, BookOpen, 
  Zap, Clock, Award, Activity, Brain, 
  ChevronRight, RotateCw, Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface Goal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  category: string;
  completed: boolean;
  progress: number;
  projectedCompletion?: string;
  focusIntensity?: number;
  daysAhead?: number;
}

interface JournalInsight {
  id: number;
  date: string;
  summary: string;
  mood: string;
  pattern?: string;
  accuracyGain?: number;
}

// Mock data
const mockGoals: Goal[] = [
  {
    id: 1,
    title: "Master Algebra",
    description: "Complete all algebra units with 90% accuracy",
    targetDate: "2025-12-15",
    category: "Mathematics",
    completed: false,
    progress: 75,
    projectedCompletion: "Week 6",
    focusIntensity: 80,
    daysAhead: 2,
  },
  {
    id: 2,
    title: "Read 5 Books",
    description: "Finish 5 classic literature books",
    targetDate: "2025-11-30",
    category: "English",
    completed: false,
    progress: 60,
    projectedCompletion: "Week 4",
    focusIntensity: 65,
    daysAhead: -1,
  },
  {
    id: 3,
    title: "Geometry Mastery",
    description: "Achieve 85%+ in all geometry topics",
    targetDate: "2025-12-01",
    category: "Mathematics",
    completed: false,
    progress: 45,
    projectedCompletion: "Week 5",
    focusIntensity: 70,
    daysAhead: 0,
  },
];

const mockJournalInsights: JournalInsight[] = [
  {
    id: 1,
    date: "This week",
    summary: "You've completed 3 focus sessions this week — overall mood: calm & productive.",
    mood: "calm",
    pattern: "Mondays = highest focus",
    accuracyGain: 7,
  },
  {
    id: 2,
    date: "Last 7 days",
    summary: "Your accuracy improved by 7%, mostly in algebraic simplification.",
    mood: "productive",
    accuracyGain: 7,
  },
  {
    id: 3,
    date: "Pattern detected",
    summary: "Geometry sessions shorter than average — consider 2 shorter cycles.",
    mood: "neutral",
    pattern: "Geometry sessions shorter",
  },
];

const weeklyFocusData = [
  { subject: "Algebra", percentage: 40, color: "#6366F1" },
  { subject: "Geometry", percentage: 25, color: "#A78BFA" },
  { subject: "English", percentage: 20, color: "#C7D2FE" },
  { subject: "Other", percentage: 15, color: "#E0E7FF" },
];

interface AIInsightsPageProps {
  onNavigateToFocus?: () => void;
}

export function AIInsightsPage({ onNavigateToFocus }: AIInsightsPageProps) {
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [goals, setMockGoals] = useState(mockGoals);

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setIsGeneratingPlan(false);
      setShowStudyPlan(true);
    }, 2000);
  };

  // If showing study plan, render that instead
  if (showStudyPlan) {
    return <AIStudyPlanPage onBack={() => setShowStudyPlan(false)} onStartSession={onNavigateToFocus} />;
  }

  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* AI Summary Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Enhanced Section Header with Orbital Animation */}
        <div className="pt-10 pb-6 relative">
          {/* Orbiting icon animation */}
          <motion.div
            className="absolute -left-1 top-10"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Sparkles className="w-4 h-4 text-primary/40 stroke-[1.5]" />
          </motion.div>
          
          <p 
            className="text-sm tracking-[0.08em] text-foreground-secondary uppercase" 
            style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '0.08em' }}
          >
            ✨ WEEKLY ORBIT SUMMARY
          </p>
          
          {/* Soft divider */}
          <div 
            className="mt-4 h-px w-full" 
            style={{ background: 'rgba(0, 0, 0, 0.06)' }}
          />
        </div>
        
        <Card 
          className="relative overflow-hidden border-0"
          style={{ 
            borderRadius: '24px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFF 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Orbital rings background pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(99, 102, 241, 0.1) 30%, rgba(99, 102, 241, 0.1) 31%, transparent 31%, transparent 50%, rgba(99, 102, 241, 0.1) 50%, rgba(99, 102, 241, 0.1) 51%, transparent 51%)`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 pointer-events-none"
            animate={{
              opacity: [0, 0.03, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%)',
            }}
          />

          <div className="relative z-10 space-y-6 p-6">
            {/* AI-generated headline with accent bar */}
            <div className="flex items-start gap-4">
              {/* Vertical accent line */}
              <motion.div
                className="w-1 h-20 rounded-full flex-shrink-0"
                style={{ 
                  background: 'linear-gradient(180deg, #6366F1 0%, #A78BFA 100%)',
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 80, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              
              <div className="flex-1">
                <h3 
                  className="mb-3 text-foreground" 
                  style={{ 
                    color: '#1A1A1A',
                    lineHeight: '1.6',
                  }}
                >
                  This week's orbit shows rising momentum
                </h3>
                <p 
                  className="text-sm text-foreground-secondary leading-relaxed" 
                  style={{ opacity: 0.85 }}
                >
                  Algebra mastery is approaching 90% accuracy. Your consistency has improved for 3 consecutive weeks.
                </p>
              </div>
            </div>

            <Separator />

            {/* Orbit Distribution Chart - moved higher with reduced spacing */}
            <div style={{ marginTop: '-8px', marginBottom: '-16px' }}>
              <PlanetDistribution 
                selectedGoal={selectedGoal}
                setSelectedGoal={setSelectedGoal}
              />
            </div>

            <Separator />

            {/* AI Summary Text */}
            <div className="space-y-3 bg-background/60 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary stroke-[1.5]" />
                <p className="text-xs text-foreground-tertiary uppercase tracking-wider">
                  AI Analysis
                </p>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                Keep reinforcing Geometry — accuracy gain of <span className="text-primary font-medium">+8%</span> predicted next orbit. Your focus intensity remains in the optimal zone.
              </p>
            </div>

            {/* Action buttons */}
            <AnimatePresence mode="wait">
              {isGeneratingPlan ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-8 gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-8 h-8 text-primary stroke-[1.5]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm text-foreground mb-1">Analyzing your progress...</p>
                    <p className="text-xs text-foreground-secondary">
                      Creating personalized study schedule
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="buttons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleGeneratePlan}
                  >
                    <Sparkles className="w-4 h-4 mr-2 stroke-[1.5]" />
                    Generate Study Plan
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Goal Tracker Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-6"
      >
        <p className="section-label">🎯 ACTIVE GOALS</p>

        <div className="space-y-4">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card 
                className={`card-minimal cursor-pointer transition-all ${
                  selectedGoal === goal.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="mb-0 text-foreground">{goal.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-secondary">
                        {goal.description}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: selectedGoal === goal.id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary stroke-[1.5]" />
                    </motion.div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-secondary">{goal.progress}% complete</span>
                      <span className="text-foreground-tertiary">Target: {goal.targetDate}</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Status blurbs */}
                  <div className="flex flex-wrap gap-2">
                    {goal.projectedCompletion && (
                      <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3 text-primary stroke-[1.5]" />
                        <span className="text-xs text-foreground-secondary">
                          Projected: {goal.projectedCompletion}
                          {goal.daysAhead && goal.daysAhead > 0 && (
                            <span className="text-primary ml-1">
                              (ahead by {goal.daysAhead}d)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {goal.focusIntensity && (
                      <div className="flex items-center gap-1.5 bg-background/80 px-2 py-1 rounded-md border border-border/50">
                        <Activity className="w-3 h-3 text-foreground-secondary stroke-[1.5]" />
                        <span className="text-xs text-foreground-secondary">
                          Focus intensity {goal.focusIntensity}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {selectedGoal === goal.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Separator className="my-4" />
                        <div className="space-y-6">
                          {/* Progress Update Slider */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-foreground-tertiary uppercase tracking-wider">
                                Update Progress
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {goal.progress}%
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={goal.progress}
                                onChange={(e) => {
                                  const newProgress = parseInt(e.target.value);
                                  setMockGoals(prev => prev.map(g => 
                                    g.id === goal.id ? { ...g, progress: newProgress } : g
                                  ));
                                }}
                                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                                style={{
                                  background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${goal.progress}%, #E5E7EB ${goal.progress}%, #E5E7EB 100%)`
                                }}
                              />
                              <div className="flex justify-between text-xs text-foreground-tertiary">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <p className="text-xs text-foreground-tertiary uppercase tracking-wider">
                              Progress Orbit
                            </p>
                            {/* Mini orbit visualization */}
                            <div className="flex items-center justify-center py-4">
                              <div className="relative w-32 h-32">
                                {/* Central goal */}
                                <div 
                                  className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
                                  style={{ transform: 'translate(-50%, -50%)' }}
                                >
                                  <Target className="w-4 h-4 text-primary stroke-[1.5]" />
                                </div>
                                {/* Progress arc */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="50"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="6"
                                  />
                                  <motion.circle
                                    cx="64"
                                    cy="64"
                                    r="50"
                                    fill="none"
                                    stroke="#6366F1"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: 314 }}
                                    animate={{ 
                                      strokeDashoffset: 314 - (314 * goal.progress / 100),
                                    }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    style={{
                                      strokeDasharray: 314,
                                      filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))',
                                    }}
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Journal Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-6"
      >
        <p className="section-label">📔 JOURNAL HIGHLIGHTS</p>

        <div className="space-y-3">
          {mockJournalInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card className="card-minimal">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary stroke-[1.5]" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-tertiary">
                        {insight.date}
                      </span>
                      {insight.mood && (
                        <Badge variant="secondary" className="text-xs">
                          {insight.mood}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      {insight.summary}
                    </p>
                    {insight.pattern && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Zap className="w-3 h-3 stroke-[1.5]" />
                        <span>Pattern: {insight.pattern}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reflection prompt */}
        <AnimatePresence>
          {!showReflectionPrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowReflectionPrompt(true)}
              >
                <Lightbulb className="w-4 h-4 mr-2 stroke-[1.5]" />
                Answer Reflection Prompt
              </Button>
            </motion.div>
          )}
          {showReflectionPrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="card-minimal bg-primary/5 border-primary/20">
                <p className="text-sm text-foreground mb-3">
                  💭 What felt easier this week — recall or reasoning?
                </p>
                <p className="text-xs text-foreground-secondary">
                  Reflection helps reinforce learning patterns and build metacognition.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="space-y-6"
      >
        <p className="section-label">💡 AI RECOMMENDATIONS</p>

        <div className="space-y-3">
          <Card className="card-minimal border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground mb-2">
                  Try 2 shorter Pomodoro cycles tomorrow
                </p>
                <p className="text-xs text-foreground-secondary">
                  Fatigue patterns detected — shorter sessions may improve retention by 12%
                </p>
              </div>
            </div>
          </Card>

          <Card className="card-minimal border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground mb-2">
                  Schedule a mini-review for trigonometry
                </p>
                <p className="text-xs text-foreground-secondary">
                  Reinforce retention before accuracy decays — optimal timing is within 48 hours
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}