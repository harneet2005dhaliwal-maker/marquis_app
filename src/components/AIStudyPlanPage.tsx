import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Sparkles, Calendar, Clock, Target, BookOpen, 
  TrendingUp, Coffee, Brain, Zap, ChevronLeft,
  CheckCircle2, Circle, AlertCircle, Award, Moon, Sun, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

interface StudyBlock {
  day: string;
  time: string;
  subject: string;
  topic: string;
  duration: string;
  type: "focus" | "review" | "practice" | "break";
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

interface WeeklyGoal {
  subject: string;
  target: string;
  currentProgress: number;
  recommendedHours: number;
}

interface AIStudyPlanPageProps {
  onBack: () => void;
  onStartSession?: () => void;
}

const weeklySchedule: StudyBlock[] = [
  // Monday
  { day: "Monday", time: "16:00", subject: "Algebra", topic: "Linear Equations Review", duration: "45 min", type: "focus", priority: "high" },
  { day: "Monday", time: "17:00", subject: "Break", topic: "Rest & Recharge", duration: "15 min", type: "break", priority: "medium" },
  { day: "Monday", time: "17:15", subject: "Geometry", topic: "Triangle Properties", duration: "30 min", type: "practice", priority: "medium" },
  
  // Tuesday
  { day: "Tuesday", time: "16:00", subject: "English", topic: "Literature Analysis", duration: "45 min", type: "focus", priority: "high" },
  { day: "Tuesday", time: "17:00", subject: "Algebra", topic: "Practice Problems", duration: "30 min", type: "practice", priority: "medium" },
  
  // Wednesday
  { day: "Wednesday", time: "16:00", subject: "Geometry", topic: "Advanced Concepts", duration: "45 min", type: "focus", priority: "high" },
  { day: "Wednesday", time: "17:00", subject: "Break", topic: "Rest & Recharge", duration: "15 min", type: "break", priority: "medium" },
  { day: "Wednesday", time: "17:15", subject: "Review", topic: "Weekly Flashcards", duration: "30 min", type: "review", priority: "low" },
  
  // Thursday
  { day: "Thursday", time: "16:00", subject: "Algebra", topic: "Factoring Deep Dive", duration: "50 min", type: "focus", priority: "high" },
  { day: "Thursday", time: "17:00", subject: "English", topic: "Essay Writing", duration: "40 min", type: "practice", priority: "medium" },
  
  // Friday
  { day: "Friday", time: "16:00", subject: "Mixed Review", topic: "All Subjects Quiz", duration: "45 min", type: "review", priority: "high" },
  { day: "Friday", time: "17:00", subject: "Geometry", topic: "Problem Solving", duration: "30 min", type: "practice", priority: "medium" },
  
  // Weekend
  { day: "Saturday", time: "10:00", subject: "English", topic: "Reading & Analysis", duration: "60 min", type: "focus", priority: "medium" },
  { day: "Saturday", time: "14:00", subject: "Review", topic: "Week Summary", duration: "30 min", type: "review", priority: "low" },
  
  { day: "Sunday", time: "15:00", subject: "Algebra", topic: "Light Practice", duration: "30 min", type: "practice", priority: "low" },
];

const weeklyGoals: WeeklyGoal[] = [
  { subject: "Algebra", target: "Complete Units 7-8", currentProgress: 75, recommendedHours: 3.5 },
  { subject: "Geometry", target: "Master Triangle Theorems", currentProgress: 45, recommendedHours: 2.5 },
  { subject: "English", target: "Finish Book 2 Analysis", currentProgress: 60, recommendedHours: 2.0 },
];

const aiRecommendations = [
  {
    icon: Brain,
    title: "Optimal Study Times",
    description: "Based on your focus patterns, you're most productive between 4-6 PM on weekdays.",
    priority: "high",
  },
  {
    icon: Coffee,
    title: "Strategic Breaks",
    description: "Take 15-min breaks after 45 min sessions to maintain peak retention (proven +12% improvement).",
    priority: "medium",
  },
  {
    icon: Zap,
    title: "Interleaving Subjects",
    description: "Mix Algebra and Geometry sessions on the same day for better conceptual connections.",
    priority: "high",
  },
  {
    icon: Moon,
    title: "Rest Optimization",
    description: "Your fatigue patterns suggest lighter sessions on Sundays. Keep it under 45 minutes.",
    priority: "low",
  },
];

export function AIStudyPlanPage({ onBack, onStartSession }: AIStudyPlanPageProps) {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleBlockCompletion = (index: number) => {
    const newCompleted = new Set(completedBlocks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedBlocks(newCompleted);
  };

  const getTypeColor = (type: StudyBlock["type"]) => {
    switch (type) {
      case "focus": return "bg-primary/10 border-primary/30 text-primary";
      case "review": return "bg-purple-50 border-purple-200 text-purple-700";
      case "practice": return "bg-blue-50 border-blue-200 text-blue-700";
      case "break": return "bg-green-50 border-green-200 text-green-700";
    }
  };

  const getPriorityIcon = (priority: StudyBlock["priority"]) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "medium": return <Circle className="w-3 h-3 text-yellow-500" />;
      case "low": return <Circle className="w-3 h-3 text-green-500" />;
    }
  };

  const todayBlocks = weeklySchedule.filter(block => block.day === selectedDay);
  const totalHoursThisWeek = weeklySchedule
    .filter(b => b.type !== "break")
    .reduce((acc, b) => acc + parseInt(b.duration), 0) / 60;

  const completionRate = (completedBlocks.size / weeklySchedule.length) * 100;

  // Find next uncompleted session for today
  const getNextSession = () => {
    const todayIndex = weeklySchedule.findIndex(
      (block, idx) => block.day === selectedDay && !completedBlocks.has(idx) && block.type !== "break"
    );
    if (todayIndex !== -1) {
      return weeklySchedule[todayIndex];
    }
    return null;
  };

  const nextSession = getNextSession();

  const handleStartSession = () => {
    if (onStartSession && nextSession) {
      toast.success(`Starting: ${nextSession.subject}`, {
        description: `${nextSession.topic} • ${nextSession.duration}`,
        duration: 3000,
      });
      // Small delay for toast to show before navigation
      setTimeout(() => {
        onStartSession();
      }, 300);
    }
  };

  const handleExportToCalendar = () => {
    // Create iCalendar (.ics) format - works with Google Calendar, Apple Calendar, Outlook, etc.
    let icsContent = 'BEGIN:VCALENDAR\n';
    icsContent += 'VERSION:2.0\n';
    icsContent += 'PRODID:-//Marquis Tutoring//Study Plan//EN\n';
    icsContent += 'CALSCALE:GREGORIAN\n';
    icsContent += 'METHOD:PUBLISH\n';
    icsContent += 'X-WR-CALNAME:Marquis Study Plan\n';
    icsContent += 'X-WR-TIMEZONE:UTC\n';

    // Get current week's Monday as reference
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysUntilMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);

    const dayMapping: { [key: string]: number } = {
      Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
      Friday: 4, Saturday: 5, Sunday: 6
    };

    weeklySchedule.forEach((block, index) => {
      if (block.type === 'break') return; // Skip breaks

      const dayOffset = dayMapping[block.day];
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + dayOffset);

      // Parse time (format: "HH:MM")
      const [hours, minutes] = block.time.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);

      // Parse duration (format: "XX min")
      const durationMinutes = parseInt(block.duration);
      const endDate = new Date(eventDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      // Format dates to iCalendar format (YYYYMMDDTHHMMSS)
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hour}${minute}${second}`;
      };

      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:marquis-${index}-${Date.now()}@marquistutoring.com\n`;
      icsContent += `DTSTAMP:${formatDate(new Date())}\n`;
      icsContent += `DTSTART:${formatDate(eventDate)}\n`;
      icsContent += `DTEND:${formatDate(endDate)}\n`;
      icsContent += `SUMMARY:${block.subject}: ${block.topic}\n`;
      icsContent += `DESCRIPTION:${block.type.toUpperCase()} session - ${block.topic}\\nDuration: ${block.duration}\\nPriority: ${block.priority}\n`;
      icsContent += `LOCATION:Marquis Tutoring\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += `CATEGORIES:${block.subject},Study,${block.type}\n`;
      icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    // Create downloadable file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'marquis-study-plan.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('Calendar Exported!', {
      description: 'Open the downloaded file to add events to your calendar',
      duration: 4000,
    });
  };

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
          Back to Insights
        </Button>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary stroke-[1.5]" />
            <h2 className="mb-0">AI-Generated Study Plan</h2>
          </div>
          <p className="text-sm text-foreground-secondary">
            Personalized weekly roadmap optimized for your goals and learning patterns
          </p>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="card-minimal text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-2 stroke-[1.5]" />
          <p className="text-2xl text-foreground mb-1">{totalHoursThisWeek.toFixed(1)}h</p>
          <p className="text-xs text-foreground-secondary">Total This Week</p>
        </Card>
        <Card className="card-minimal text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-2 stroke-[1.5]" />
          <p className="text-2xl text-foreground mb-1">{weeklyGoals.length}</p>
          <p className="text-xs text-foreground-secondary">Active Goals</p>
        </Card>
        <Card className="card-minimal text-center">
          <Award className="w-5 h-5 text-primary mx-auto mb-2 stroke-[1.5]" />
          <p className="text-2xl text-foreground mb-1">{completionRate.toFixed(0)}%</p>
          <p className="text-xs text-foreground-secondary">Completed</p>
        </Card>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-4"
      >
        <p className="section-label">💡 AI RECOMMENDATIONS</p>
        
        <div className="grid grid-cols-2 gap-3">
          {aiRecommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card className={`card-minimal h-full ${rec.priority === 'high' ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary stroke-[1.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm mb-1 text-foreground">{rec.title}</h4>
                      <p className="text-xs text-foreground-secondary leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Weekly Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <p className="section-label">📅 WEEKLY SCHEDULE</p>

        <Tabs value={selectedDay} onValueChange={setSelectedDay}>
          <TabsList className="grid w-full grid-cols-7 bg-white/60 rounded-lg p-1 h-auto border border-border">
            {daysOfWeek.map((day) => {
              const dayBlocks = weeklySchedule.filter(b => b.day === day);
              const completedCount = dayBlocks.filter((_, idx) => {
                const globalIndex = weeklySchedule.findIndex(b => b === dayBlocks[idx]);
                return completedBlocks.has(globalIndex);
              }).length;
              const allCompleted = completedCount === dayBlocks.length;

              return (
                <TabsTrigger
                  key={day}
                  value={day}
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2 text-xs flex-col gap-1 relative"
                >
                  <span>{day.slice(0, 3)}</span>
                  {allCompleted && (
                    <CheckCircle2 className="w-3 h-3 text-primary absolute -top-1 -right-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {daysOfWeek.map((day) => (
            <TabsContent key={day} value={day} className="mt-4 space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {weeklySchedule
                    .map((block, globalIndex) => ({ ...block, globalIndex }))
                    .filter(block => block.day === day)
                    .map((block) => {
                      const isCompleted = completedBlocks.has(block.globalIndex);
                      
                      return (
                        <motion.div
                          key={block.globalIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 }}
                        >
                          <Card
                            className={`card-minimal cursor-pointer transition-all ${
                              isCompleted ? 'opacity-60 border-primary/20' : ''
                            }`}
                            onClick={() => toggleBlockCompletion(block.globalIndex)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-primary stroke-[1.5]" />
                                ) : (
                                  <Circle className="w-5 h-5 text-border stroke-[1.5]" />
                                )}
                              </div>

                              {/* Time */}
                              <div className="w-16 flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {block.time}
                                </Badge>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`text-sm ${isCompleted ? 'line-through' : ''}`}>
                                    {block.subject}
                                  </h4>
                                  <Badge className={`text-xs ${getTypeColor(block.type)}`}>
                                    {block.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-foreground-secondary mb-2">
                                  {block.topic}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 stroke-[1.5]" />
                                    {block.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {getPriorityIcon(block.priority)}
                                    {block.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Success Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="space-y-4"
      >
        <p className="section-label">✨ SUCCESS TIPS</p>

        <Card className="card-minimal bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sun className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">Morning Prep</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Review your schedule each morning. Visualizing your study blocks increases completion rates by 23%.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">Track Progress</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Check off each block as you complete it. The visual feedback reinforces motivation and builds momentum.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Coffee className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">Don't Skip Breaks</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Breaks are scheduled strategically. They prevent burnout and improve long-term retention.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="space-y-3"
      >
        {/* Next Session Preview */}
        {nextSession && (
          <Card className="card-minimal bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary stroke-[1.5]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
                  Next Session
                </p>
                <p className="text-foreground mb-1">{nextSession.subject}: {nextSession.topic}</p>
                <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                  <Clock className="w-3 h-3 stroke-[1.5]" />
                  <span>{nextSession.time}</span>
                  <span>•</span>
                  <span>{nextSession.duration}</span>
                  <Badge variant="outline" className={`text-xs ml-auto ${getTypeColor(nextSession.type)}`}>
                    {nextSession.type}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleExportToCalendar}>
            <Calendar className="w-4 h-4 mr-2 stroke-[1.5]" />
            Export to Calendar
          </Button>
          <Button 
            className="flex-1"
            onClick={handleStartSession}
            disabled={!nextSession}
          >
            {nextSession ? (
              <>
                <Play className="w-4 h-4 mr-2 stroke-[1.5] fill-current" />
                Start Session
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 stroke-[1.5]" />
                All Complete!
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}