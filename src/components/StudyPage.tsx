import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, Zap, Brain, BookOpen, Play, Pause, RotateCcw, 
  ChevronDown, ChevronUp, Sparkles, Target, TrendingUp,
  Star, Award, AlertCircle, Plus, Trash2, Check, X, ChevronLeft, ChevronRight, Settings, Archive
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { OrbitalTimer } from "./OrbitalTimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { questionBank, type Question } from "../data/questionBank";
import { getCurrentAndLastWeekTopicIds, getPastWeeksForQuizBank, type WeeklyLesson, getCurrentWeekLessons, getLastWeekLessons } from "../data/weeklyLessons";

type TabType = "focus" | "quizzes" | "memory" | "revision";
type QuestionType = "multiple-choice" | "short-answer";
type DifficultyLevel = "easy" | "medium" | "hard";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  flipped: boolean;
  category: string;
  difficulty: DifficultyLevel;
  mastered?: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  correctAnswer: string;
  options?: string[];
  userAnswer: string;
  wasWrong?: boolean;
}

interface Quiz {
  id: number;
  topic: string;
  questions: QuizQuestion[];
  isAdaptive?: boolean;
}

const mockPastErrors = [
  {
    topic: "Algebra",
    question: "Solve for x: 2x + 5 = 13",
    correctAnswer: "x = 4",
    difficulty: "medium" as DifficultyLevel,
  },
  {
    topic: "Geometry",
    question: "What is the area of a triangle with base 6 and height 8?",
    correctAnswer: "24",
    difficulty: "easy" as DifficultyLevel,
  },
  {
    topic: "Trigonometry",
    question: "What is sin(90°)?",
    correctAnswer: "1",
    difficulty: "easy" as DifficultyLevel,
  },
];

export function StudyPage() {
  const { currentStudent } = useData();
  const [activeTab, setActiveTab] = useState<TabType>("focus");
  const [showInsights, setShowInsights] = useState(false);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [celebrationType, setCelebrationType] = useState<"confetti" | "stars" | "fireworks">("confetti");
  
  // Pomodoro Timer State
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [sessionsCompleted, setSessionsCompleted] = useState(3);
  const [totalFocusTime, setTotalFocusTime] = useState(75);
  const [showSettings, setShowSettings] = useState(false);
  const [tempWorkDuration, setTempWorkDuration] = useState(25);
  const [tempBreakDuration, setTempBreakDuration] = useState(5);
  const [tempLongBreakDuration, setTempLongBreakDuration] = useState(15);
  const [tempSessionsUntilLongBreak, setTempSessionsUntilLongBreak] = useState(4);

  // Flashcard State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { 
      id: 1, 
      question: "What is photosynthesis?", 
      answer: "The process by which plants use sunlight to create energy", 
      flipped: false, 
      category: "Biology", 
      difficulty: "medium",
      mastered: false
    },
    { 
      id: 2, 
      question: "Define Newton's First Law", 
      answer: "An object at rest stays at rest unless acted upon by a force", 
      flipped: false, 
      category: "Physics", 
      difficulty: "easy",
      mastered: false
    },
    { 
      id: 3, 
      question: "What is the Pythagorean theorem?", 
      answer: "a² + b² = c²", 
      flipped: false, 
      category: "Math", 
      difficulty: "medium",
      mastered: true
    }
  ]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [newCardCategory, setNewCardCategory] = useState("Math");
  const [flashcardsReviewedToday, setFlashcardsReviewedToday] = useState(12);

  // Quiz State
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: 1,
      topic: "Mathematics",
      questions: [
        { 
          id: 1,
          question: "What is the formula for the area of a circle?",
          type: "multiple-choice",
          difficulty: "easy",
          correctAnswer: "πr²",
          options: ["2πr", "πr²", "πd", "r²"],
          userAnswer: ""
        },
        { 
          id: 2,
          question: "What is the Pythagorean theorem?",
          type: "short-answer",
          difficulty: "medium",
          correctAnswer: "a² + b² = c²",
          userAnswer: ""
        },
      ]
    }
  ]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showQuizBank, setShowQuizBank] = useState(false);

  const tabs = [
    { id: "focus" as TabType, label: "Focus", icon: Clock },
    { id: "quizzes" as TabType, label: "Quizzes", icon: Zap },
    { id: "memory" as TabType, label: "Memory", icon: Brain },
    { id: "revision" as TabType, label: "Revision", icon: BookOpen },
  ];

  const weakAreas = [
    { topic: "Algebra", difficulty: "medium", color: "#FFD84D" },
    { topic: "Geometry", difficulty: "hard", color: "#FF6B6B" },
    { topic: "Trigonometry", difficulty: "easy", color: "#A78BFA" },
  ];

  // Trigger celebration helper
  const triggerCelebration = (message: string, type: "confetti" | "stars" | "fireworks" = "confetti") => {
    setCelebrationMessage(message);
    setCelebrationType(type);
    setShowCelebration(true);
  };

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            setIsRunning(false);
            if (timerMode === "work") {
              const newSessionCount = sessionsCompleted + 1;
              setSessionsCompleted(newSessionCount);
              setTotalFocusTime(prev => prev + workDuration);
              
              // Celebration for milestones - Solar System Complete at 5!
              if (newSessionCount === 5) {
                triggerCelebration("Solar System Complete! 🌟🪐", "fireworks");
              } else if (newSessionCount % 5 === 0) {
                triggerCelebration(`${newSessionCount} Focus Sessions Complete! 🔥`, "fireworks");
              } else {
                triggerCelebration(`New Planet Unlocked! Session ${newSessionCount} 🪐`, "stars");
              }
              
              // Determine if it's time for a long break
              const isLongBreak = newSessionCount % sessionsUntilLongBreak === 0;
              const breakTime = isLongBreak ? longBreakDuration : breakDuration;
              
              toast.success(`Focus session complete! ${isLongBreak ? 'Long break time!' : 'Take a break.'}`);
              setTimerMode("break");
              return breakTime * 60;
            } else {
              toast.success("Break complete! Ready for another session?");
              setTimerMode("work");
              return workDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode, sessionsCompleted, workDuration, breakDuration, longBreakDuration, sessionsUntilLongBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleTimerReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMode === "work" ? workDuration * 60 : breakDuration * 60);
  };

  const handleSaveSettings = () => {
    setWorkDuration(tempWorkDuration);
    setBreakDuration(tempBreakDuration);
    setLongBreakDuration(tempLongBreakDuration);
    setSessionsUntilLongBreak(tempSessionsUntilLongBreak);
    
    // Reset timer with new duration if not running
    if (!isRunning) {
      setTimeLeft(timerMode === "work" ? tempWorkDuration * 60 : tempBreakDuration * 60);
    }
    
    setShowSettings(false);
    toast.success("Timer settings updated!");
  };

  const handleCancelSettings = () => {
    setTempWorkDuration(workDuration);
    setTempBreakDuration(breakDuration);
    setTempLongBreakDuration(longBreakDuration);
    setTempSessionsUntilLongBreak(sessionsUntilLongBreak);
    setShowSettings(false);
  };

  // Flashcard Functions
  const flipCard = (id: number) => {
    setFlashcards(flashcards.map(card =>
      card.id === id ? { ...card, flipped: !card.flipped } : card
    ));
  };

  const nextCard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
    } else {
      setCurrentFlashcardIndex(0);
    }
  };

  const prevCard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1);
    } else {
      setCurrentFlashcardIndex(flashcards.length - 1);
    }
  };

  const markAsMastered = (id: number) => {
    setFlashcards(flashcards.map(card =>
      card.id === id ? { ...card, mastered: true } : card
    ));
    
    // Check if this is a milestone
    const masteredCount = flashcards.filter(c => c.mastered).length + 1;
    const totalCards = flashcards.length;
    
    if (masteredCount === totalCards) {
      triggerCelebration("All Flashcards Mastered! 🌟", "fireworks");
    } else if (masteredCount % 5 === 0) {
      triggerCelebration(`${masteredCount} Cards Mastered! Keep going! ⭐`, "stars");
    } else {
      triggerCelebration("Card Mastered! Great work! ✓", "confetti");
    }
    
    toast.success("Card marked as mastered!");
  };

  const addFlashcard = () => {
    if (newCardQuestion.trim() && newCardAnswer.trim()) {
      const newCard: Flashcard = {
        id: Date.now(),
        question: newCardQuestion,
        answer: newCardAnswer,
        flipped: false,
        category: newCardCategory,
        difficulty: "medium",
        mastered: false
      };
      const updatedFlashcards = [...flashcards, newCard];
      setFlashcards(updatedFlashcards);
      setNewCardQuestion("");
      setNewCardAnswer("");
      setIsAddingCard(false);
      
      // Celebration for milestones
      if (updatedFlashcards.length === 1) {
        triggerCelebration("First Flashcard Created! 🎯", "stars");
      } else if (updatedFlashcards.length % 10 === 0) {
        triggerCelebration(`${updatedFlashcards.length} Flashcards! Amazing! 📚`, "fireworks");
      } else {
        toast.success("Flashcard created!");
      }
    }
  };

  const deleteFlashcard = (id: number) => {
    setFlashcards(flashcards.filter(card => card.id !== id));
    if (currentFlashcardIndex >= flashcards.length - 1) {
      setCurrentFlashcardIndex(Math.max(0, flashcards.length - 2));
    }
    toast.success("Flashcard deleted");
  };

  // Quiz Functions
  const generateAdaptiveQuiz = () => {
    // Get current subject (Math for now, would be dynamic in production)
    const subject = "Mathematics";
    
    // Get current and last week lesson info
    const currentWeek = getCurrentWeekLessons(subject);
    const lastWeek = getLastWeekLessons(subject);
    
    // Get topic IDs for current + last week
    const topicIds = getCurrentAndLastWeekTopicIds(subject);
    
    // Filter questions from question bank matching these topics
    const relevantQuestions = questionBank.filter(q => 
      topicIds.includes(q.curriculumTopicId)
    );
    
    // Select 15 questions with a mix of difficulties
    // Target distribution: 5 easy, 7 medium, 3 hard
    const easyQuestions = relevantQuestions.filter(q => q.difficulty === "easy");
    const mediumQuestions = relevantQuestions.filter(q => q.difficulty === "medium");
    const hardQuestions = relevantQuestions.filter(q => q.difficulty === "hard");
    
    // Shuffle and select questions
    const shuffleArray = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
    
    const selectedQuestions: Question[] = [
      ...shuffleArray([...easyQuestions]).slice(0, 5),
      ...shuffleArray([...mediumQuestions]).slice(0, 7),
      ...shuffleArray([...hardQuestions]).slice(0, 3)
    ];
    
    // If we don't have enough questions, fill with what we have
    const finalQuestions = shuffleArray(selectedQuestions).slice(0, 15);
    
    // Convert to QuizQuestion format
    const adaptiveQuestions: QuizQuestion[] = finalQuestions.map((q, index) => ({
      id: Date.now() + index,
      question: q.question,
      type: q.type as QuestionType,
      difficulty: q.difficulty,
      correctAnswer: q.correctAnswer,
      options: q.options,
      userAnswer: "",
      wasWrong: false
    }));

    const weekTopics = [
      currentWeek?.topics.join(", "),
      lastWeek?.topics.join(", ")
    ].filter(Boolean).join(" & ");

    const adaptiveQuiz: Quiz = {
      id: Date.now(),
      topic: `Weekly Review: ${weekTopics}`,
      questions: adaptiveQuestions,
      isAdaptive: true
    };

    startQuiz(adaptiveQuiz);
    toast.success(`Generated ${adaptiveQuestions.length}-question adaptive quiz!`);
  };

  const generateQuizFromWeek = (weekLesson: WeeklyLesson) => {
    // Filter questions from question bank for this specific week's topics
    const relevantQuestions = questionBank.filter(q => 
      weekLesson.curriculumTopicIds.includes(q.curriculumTopicId)
    );
    
    // Select up to 15 questions with balanced difficulty
    const easyQuestions = relevantQuestions.filter(q => q.difficulty === "easy");
    const mediumQuestions = relevantQuestions.filter(q => q.difficulty === "medium");
    const hardQuestions = relevantQuestions.filter(q => q.difficulty === "hard");
    
    const shuffleArray = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
    
    const selectedQuestions: Question[] = [
      ...shuffleArray([...easyQuestions]).slice(0, 5),
      ...shuffleArray([...mediumQuestions]).slice(0, 7),
      ...shuffleArray([...hardQuestions]).slice(0, 3)
    ];
    
    const finalQuestions = shuffleArray(selectedQuestions).slice(0, 15);
    
    // Convert to QuizQuestion format
    const quizQuestions: QuizQuestion[] = finalQuestions.map((q, index) => ({
      id: Date.now() + index,
      question: q.question,
      type: q.type as QuestionType,
      difficulty: q.difficulty,
      correctAnswer: q.correctAnswer,
      options: q.options,
      userAnswer: "",
      wasWrong: false
    }));

    const weekDate = weekLesson.weekStartDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    
    const quiz: Quiz = {
      id: Date.now(),
      topic: `Week ${weekLesson.weekNumber}: ${weekLesson.topics.join(", ")} (${weekDate})`,
      questions: quizQuestions,
      isAdaptive: false
    };

    startQuiz(quiz);
    setShowQuizBank(false);
    toast.success(`Started quiz from Week ${weekLesson.weekNumber}!`);
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz({
      ...quiz,
      questions: quiz.questions.map(q => ({ ...q, userAnswer: "" }))
    });
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setActiveTab("quizzes");
  };

  const answerQuestion = (answer: string) => {
    if (activeQuiz) {
      const updatedQuestions = [...activeQuiz.questions];
      updatedQuestions[currentQuestionIndex].userAnswer = answer;
      setActiveQuiz({ ...activeQuiz, questions: updatedQuestions });
    }
  };

  const nextQuestion = () => {
    if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      
      // Calculate score and trigger celebration
      const score = calculateScore();
      if (score.percentage === 100) {
        triggerCelebration("Perfect Score! 100% 🏆", "fireworks");
      } else if (score.percentage >= 80) {
        triggerCelebration(`Excellent! ${score.percentage}% ⭐`, "stars");
      } else if (score.percentage >= 60) {
        triggerCelebration(`Good Job! ${score.percentage}% ✓`, "confetti");
      }
    }
  };

  const calculateScore = () => {
    if (!activeQuiz) return { score: 0, total: 0, percentage: 0 };
    const correct = activeQuiz.questions.filter(
      q => q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
    ).length;
    return {
      score: correct,
      total: activeQuiz.questions.length,
      percentage: Math.round((correct / activeQuiz.questions.length) * 100)
    };
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const totalFlashcards = flashcards.length;
  const currentCard = flashcards[currentFlashcardIndex];

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #FFF8E5 0%, #FFFDF7 100%)"
      }}
    >
      {/* Celebration Overlay */}
      <CelebrationOverlay
        show={showCelebration}
        message={celebrationMessage}
        type={celebrationType}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Subtle Watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='10' y='50' font-size='40' fill='%23000' opacity='0.1'%3E⭐%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "150px 150px"
        }}
      />

      <div className="max-w-2xl mx-auto px-6 pt-8 relative">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1
            className="mb-2"
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "-0.02em",
              marginTop: 0
            }}
          >
            Study Tools
          </h1>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "#666666",
              marginTop: 0
            }}
          >
            Focus, practice, and master your subjects
          </p>
        </motion.div>

        {/* 4-Tab Quick Action Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-3 mb-8 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-full transition-all flex-shrink-0"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)"
                    : "#FFFFFF",
                  border: isActive ? "none" : "1px solid #E6E6E6",
                  color: isActive ? "#000000" : "#666666",
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "15px",
                  fontWeight: isActive ? 700 : 600,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0px 6px 20px rgba(254, 207, 56, 0.3)"
                    : "0px 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    strokeWidth: isActive ? 2.5 : 2
                  }}
                />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Dynamic Content Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              className="border-0 mb-8"
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                padding: "32px",
                boxShadow: "0px 8px 32px rgba(0,0,0,0.06)"
              }}
            >
              {/* FOCUS TAB - Pomodoro Timer */}
              {activeTab === "focus" && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h3
                      className="mb-0"
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#000000",
                        marginTop: 0
                      }}
                    >
                      Pomodoro Focus Timer
                    </h3>
                    
                    {/* Settings Button */}
                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => {
                            setTempWorkDuration(workDuration);
                            setTempBreakDuration(breakDuration);
                            setTempLongBreakDuration(longBreakDuration);
                            setTempSessionsUntilLongBreak(sessionsUntilLongBreak);
                            setShowSettings(true);
                          }}
                          className="p-2 rounded-lg transition-all hover:bg-gray-100"
                          style={{
                            border: "1px solid #E6E6E6",
                            background: "#FFFFFF",
                            cursor: "pointer"
                          }}
                        >
                          <Settings className="w-5 h-5" style={{ color: "#6E6E70" }} />
                        </button>
                      </DialogTrigger>
                      <DialogContent 
                        className="border-0"
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "24px",
                          maxWidth: "400px",
                          padding: "32px"
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "24px",
                              fontWeight: 700,
                              color: "#000000"
                            }}
                          >
                            Timer Settings
                          </DialogTitle>
                          <DialogDescription
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              color: "#6E6E70"
                            }}
                          >
                            Customize your focus timer durations and preferences
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-6">
                          {/* Work Duration */}
                          <div>
                            <Label 
                              htmlFor="work-duration"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#000000",
                                display: "block",
                                marginBottom: "8px"
                              }}
                            >
                              Work Session (minutes)
                            </Label>
                            <Input
                              id="work-duration"
                              type="number"
                              min="1"
                              max="60"
                              value={tempWorkDuration}
                              onChange={(e) => setTempWorkDuration(Number(e.target.value))}
                              className="border"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                padding: "12px",
                                borderRadius: "12px",
                                borderColor: "#E6E6E6"
                              }}
                            />
                          </div>

                          {/* Break Duration */}
                          <div>
                            <Label 
                              htmlFor="break-duration"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#000000",
                                display: "block",
                                marginBottom: "8px"
                              }}
                            >
                              Short Break (minutes)
                            </Label>
                            <Input
                              id="break-duration"
                              type="number"
                              min="1"
                              max="30"
                              value={tempBreakDuration}
                              onChange={(e) => setTempBreakDuration(Number(e.target.value))}
                              className="border"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                padding: "12px",
                                borderRadius: "12px",
                                borderColor: "#E6E6E6"
                              }}
                            />
                          </div>

                          {/* Long Break Duration */}
                          <div>
                            <Label 
                              htmlFor="long-break-duration"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#000000",
                                display: "block",
                                marginBottom: "8px"
                              }}
                            >
                              Long Break (minutes)
                            </Label>
                            <Input
                              id="long-break-duration"
                              type="number"
                              min="1"
                              max="60"
                              value={tempLongBreakDuration}
                              onChange={(e) => setTempLongBreakDuration(Number(e.target.value))}
                              className="border"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                padding: "12px",
                                borderRadius: "12px",
                                borderColor: "#E6E6E6"
                              }}
                            />
                          </div>

                          {/* Sessions Until Long Break */}
                          <div>
                            <Label 
                              htmlFor="sessions-long-break"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#000000",
                                display: "block",
                                marginBottom: "8px"
                              }}
                            >
                              Sessions Before Long Break
                            </Label>
                            <Input
                              id="sessions-long-break"
                              type="number"
                              min="2"
                              max="10"
                              value={tempSessionsUntilLongBreak}
                              onChange={(e) => setTempSessionsUntilLongBreak(Number(e.target.value))}
                              className="border"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                padding: "12px",
                                borderRadius: "12px",
                                borderColor: "#E6E6E6"
                              }}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleCancelSettings}
                              className="flex-1 border-0"
                              style={{
                                height: "48px",
                                borderRadius: "12px",
                                background: "#F3F4F6",
                                color: "#000000",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                fontWeight: 600
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveSettings}
                              className="flex-1 border-0"
                              style={{
                                height: "48px",
                                borderRadius: "12px",
                                background: "#FFD500",
                                color: "#000000",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "16px",
                                fontWeight: 700
                              }}
                            >
                              Save Settings
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <p
                    className="mb-6"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      color: "#666666",
                      marginTop: "8px"
                    }}
                  >
                    {timerMode === "work" ? "Work Session - Stay focused!" : "Break Time - Relax!"}
                  </p>

                  {/* Orbital Solar System */}
                  <div className="mb-6">
                    <OrbitalTimer
                      sessionsCompleted={sessionsCompleted}
                      isActive={isRunning && timerMode === "work"}
                      progress={timerMode === "work" ? ((workDuration * 60 - timeLeft) / (workDuration * 60)) * 100 : 0}
                      totalTime={workDuration * 60}
                    />
                  </div>

                  {/* Timer Display */}
                  <div
                    className="mb-8"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "56px",
                      fontWeight: 700,
                      color: "#000000",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    {formatTime(timeLeft)}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex gap-3 justify-center mb-8">
                    <Button
                      onClick={handleTimerToggle}
                      className="border-0"
                      style={{
                        height: "56px",
                        paddingLeft: "32px",
                        paddingRight: "32px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                        color: "#000000",
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        boxShadow: "0px 6px 20px rgba(254, 207, 56, 0.3)"
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
                          Start
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleTimerReset}
                      className="border-0"
                      style={{
                        height: "56px",
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        borderRadius: "16px",
                        background: "#000000",
                        color: "#FFFFFF",
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)"
                      }}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  {/* Session Stats */}
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "28px",
                          fontWeight: 700,
                          color: "#000000",
                          marginBottom: "4px"
                        }}
                      >
                        {sessionsCompleted}
                      </p>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "13px",
                          color: "#666666",
                          marginTop: 0
                        }}
                      >
                        Sessions Today
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "28px",
                          fontWeight: 700,
                          color: "#000000",
                          marginBottom: "4px"
                        }}
                      >
                        {totalFocusTime}m
                      </p>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "13px",
                          color: "#666666",
                          marginTop: 0
                        }}
                      >
                        Total Focus
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QUIZZES TAB */}
              {activeTab === "quizzes" && (
                <div>
                  {!activeQuiz ? (
                    <>
                      <h3
                        className="mb-2"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#000000",
                          marginTop: 0
                        }}
                      >
                        Adaptive Quiz Generator
                      </h3>
                      <p
                        className="mb-6"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "14px",
                          color: "#666666",
                          marginTop: 0
                        }}
                      >
                        Practice questions targeting your weak areas
                      </p>

                      {/* Weak Areas */}
                      <div className="mb-6">
                        <p
                          className="mb-3"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#999999",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                        >
                          Focus Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {weakAreas.map((area) => (
                            <span
                              key={area.topic}
                              className="px-4 py-2 rounded-full"
                              style={{
                                background: `${area.color}22`,
                                border: `1px solid ${area.color}44`,
                                color: "#000000",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600
                              }}
                            >
                              {area.topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={generateAdaptiveQuiz}
                          className="w-full border-0"
                          style={{
                            height: "56px",
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                            color: "#000000",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            fontWeight: 700,
                            boxShadow: "0px 6px 20px rgba(254, 207, 56, 0.3)"
                          }}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Weekly Quiz (15 Questions)
                        </Button>

                        <Dialog open={showQuizBank} onOpenChange={setShowQuizBank}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full"
                              style={{
                                height: "48px",
                                borderRadius: "12px",
                                borderColor: "#E6E6E6",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "15px",
                                fontWeight: 600,
                                color: "#000000"
                              }}
                            >
                              <Archive className="w-5 h-5 mr-2" />
                              Quiz Bank - Previous Weeks
                            </Button>
                          </DialogTrigger>
                          <DialogContent
                            className="max-w-2xl max-h-[80vh] overflow-y-auto"
                            style={{
                              background: "#FFFCF4",
                              borderRadius: "24px",
                              border: "1px solid #E6E6E6"
                            }}
                          >
                            <DialogHeader>
                              <DialogTitle
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "24px",
                                  fontWeight: 700,
                                  color: "#000000"
                                }}
                              >
                                Quiz Bank - Previous Weeks
                              </DialogTitle>
                              <DialogDescription
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "14px",
                                  color: "#666666"
                                }}
                              >
                                Select a previous week to practice those topics
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 mt-4">
                              {getPastWeeksForQuizBank("Mathematics").map((weekLesson) => (
                                <Card
                                  key={weekLesson.weekNumber}
                                  className="border-0 cursor-pointer transition-all hover:shadow-lg"
                                  style={{
                                    background: "#FFFFFF",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    boxShadow: "0px 2px 8px rgba(0,0,0,0.04)"
                                  }}
                                  onClick={() => generateQuizFromWeek(weekLesson)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          style={{
                                            background: "#FFD84D22",
                                            color: "#000000",
                                            border: "1px solid #FFD84D44",
                                            fontFamily: "Neurial Grotesk, sans-serif",
                                            fontSize: "12px",
                                            fontWeight: 600
                                          }}
                                        >
                                          Week {weekLesson.weekNumber}
                                        </Badge>
                                        <span
                                          style={{
                                            fontFamily: "Neurial Grotesk, sans-serif",
                                            fontSize: "12px",
                                            color: "#999999"
                                          }}
                                        >
                                          {weekLesson.weekStartDate.toLocaleDateString('en-AU', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })} - {weekLesson.weekEndDate.toLocaleDateString('en-AU', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </span>
                                      </div>
                                      <h4
                                        className="mb-1"
                                        style={{
                                          fontFamily: "Neurial Grotesk, sans-serif",
                                          fontSize: "16px",
                                          fontWeight: 700,
                                          color: "#000000",
                                          marginTop: 0
                                        }}
                                      >
                                        {weekLesson.topics.join(", ")}
                                      </h4>
                                      <p
                                        style={{
                                          fontFamily: "Neurial Grotesk, sans-serif",
                                          fontSize: "13px",
                                          color: "#666666",
                                          margin: 0
                                        }}
                                      >
                                        {weekLesson.subject} • Year {weekLesson.yearLevel}
                                      </p>
                                    </div>
                                    <Sparkles className="w-5 h-5 mt-1" style={{ color: "#FFD500" }} />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  ) : !showResults ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#000000",
                            margin: 0
                          }}
                        >
                          {activeQuiz.topic}
                        </h3>
                        <Badge
                          style={{
                            background: "#FFD84D22",
                            color: "#000000",
                            border: "1px solid #FFD84D44"
                          }}
                        >
                          Question {currentQuestionIndex + 1}/{activeQuiz.questions.length}
                        </Badge>
                      </div>

                      <div className="mb-6">
                        <p
                          className="mb-4"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            color: "#000000"
                          }}
                        >
                          {activeQuiz.questions[currentQuestionIndex].question}
                        </p>

                        {activeQuiz.questions[currentQuestionIndex].type === "multiple-choice" ? (
                          <div className="space-y-2">
                            {activeQuiz.questions[currentQuestionIndex].options?.map((option) => (
                              <button
                                key={option}
                                onClick={() => answerQuestion(option)}
                                className="w-full p-4 text-left rounded-xl transition-all"
                                style={{
                                  background: activeQuiz.questions[currentQuestionIndex].userAnswer === option 
                                    ? "#FFD84D22" 
                                    : "#F5F5F5",
                                  border: activeQuiz.questions[currentQuestionIndex].userAnswer === option 
                                    ? "2px solid #FFD84D" 
                                    : "1px solid #E6E6E6",
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "15px",
                                  color: "#000000",
                                  cursor: "pointer"
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Input
                            value={activeQuiz.questions[currentQuestionIndex].userAnswer}
                            onChange={(e) => answerQuestion(e.target.value)}
                            placeholder="Type your answer..."
                            style={{
                              height: "48px",
                              borderRadius: "12px",
                              fontFamily: "Neurial Grotesk, sans-serif"
                            }}
                          />
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={resetQuiz}
                          variant="outline"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600
                          }}
                        >
                          Exit Quiz
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          disabled={!activeQuiz.questions[currentQuestionIndex].userAnswer}
                          className="flex-1 border-0"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                            color: "#000000",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 700,
                            boxShadow: "0px 4px 12px rgba(254, 207, 56, 0.3)"
                          }}
                        >
                          {currentQuestionIndex === activeQuiz.questions.length - 1 ? "Finish" : "Next"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div
                        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                          boxShadow: "0px 8px 24px rgba(254, 207, 56, 0.3)"
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "32px",
                            fontWeight: 700,
                            color: "#000000"
                          }}
                        >
                          {calculateScore().percentage}%
                        </span>
                      </div>
                      <h3
                        className="mb-2"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "24px",
                          fontWeight: 700,
                          color: "#000000",
                          marginTop: 0
                        }}
                      >
                        Quiz Complete!
                      </h3>
                      <p
                        className="mb-8"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "16px",
                          color: "#666666",
                          marginTop: 0
                        }}
                      >
                        You scored {calculateScore().score} out of {calculateScore().total}
                      </p>
                      <Button
                        onClick={resetQuiz}
                        className="border-0"
                        style={{
                          height: "56px",
                          paddingLeft: "32px",
                          paddingRight: "32px",
                          borderRadius: "16px",
                          background: "#000000",
                          color: "#FFFFFF",
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "16px",
                          fontWeight: 700,
                          boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        Back to Quizzes
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* MEMORY TAB - Flashcards */}
              {activeTab === "memory" && (
                <div>
                  {!isAddingCard && flashcards.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#000000",
                            margin: 0
                          }}
                        >
                          Flashcard Review
                        </h3>
                        <Badge
                          style={{
                            background: "#FFD84D22",
                            color: "#000000",
                            border: "1px solid #FFD84D44"
                          }}
                        >
                          {currentFlashcardIndex + 1}/{totalFlashcards}
                        </Badge>
                      </div>

                      {/* Flashcard */}
                      <div
                        onClick={() => flipCard(currentCard.id)}
                        className="relative mb-6 cursor-pointer"
                        style={{
                          height: "280px",
                          perspective: "1000px"
                        }}
                      >
                        <motion.div
                          className="w-full h-full rounded-2xl flex items-center justify-center p-8"
                          style={{
                            background: currentCard.flipped 
                              ? "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)" 
                              : "#F5F5F5",
                            border: currentCard.flipped ? "none" : "1px solid #E6E6E6",
                            boxShadow: "0px 4px 16px rgba(0,0,0,0.06)",
                            transformStyle: "preserve-3d"
                          }}
                          animate={{ rotateY: currentCard.flipped ? 180 : 0 }}
                          transition={{ duration: 0.6 }}
                        >
                          <p
                            className="text-center"
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "18px",
                              color: currentCard.flipped ? "#000000" : "#333333",
                              transform: currentCard.flipped ? "rotateY(180deg)" : "none"
                            }}
                          >
                            {currentCard.flipped ? currentCard.answer : currentCard.question}
                          </p>
                        </motion.div>

                        {currentCard.mastered && (
                          <div
                            className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1"
                            style={{
                              background: "#22C55E22",
                              border: "1px solid #22C55E44"
                            }}
                          >
                            <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
                            <span
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#22C55E"
                              }}
                            >
                              Mastered
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Navigation */}
                      <div className="flex gap-3 mb-6">
                        <Button
                          onClick={prevCard}
                          variant="outline"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600
                          }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => markAsMastered(currentCard.id)}
                          disabled={currentCard.mastered}
                          className="flex-1 border-0"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            background: currentCard.mastered ? "#E6E6E6" : "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                            color: "#000000",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 700,
                            boxShadow: currentCard.mastered ? "none" : "0px 4px 12px rgba(254, 207, 56, 0.3)"
                          }}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          {currentCard.mastered ? "Mastered" : "Mark as Mastered"}
                        </Button>
                        <Button
                          onClick={nextCard}
                          variant="outline"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>

                      <Separator className="my-6" />

                      {/* Card Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setIsAddingCard(true)}
                          variant="outline"
                          className="flex-1"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600
                          }}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add Card
                        </Button>
                        <Button
                          onClick={() => deleteFlashcard(currentCard.id)}
                          variant="outline"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600,
                            color: "#EF4444",
                            borderColor: "#EF444422"
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h3
                        className="mb-6"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#000000",
                          marginTop: 0
                        }}
                      >
                        Create New Flashcard
                      </h3>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#000000",
                              marginBottom: "8px"
                            }}
                          >
                            Question
                          </label>
                          <Textarea
                            value={newCardQuestion}
                            onChange={(e) => setNewCardQuestion(e.target.value)}
                            placeholder="Enter the question..."
                            style={{
                              borderRadius: "12px",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              minHeight: "100px"
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#000000",
                              marginBottom: "8px"
                            }}
                          >
                            Answer
                          </label>
                          <Textarea
                            value={newCardAnswer}
                            onChange={(e) => setNewCardAnswer(e.target.value)}
                            placeholder="Enter the answer..."
                            style={{
                              borderRadius: "12px",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              minHeight: "100px"
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#000000",
                              marginBottom: "8px"
                            }}
                          >
                            Category
                          </label>
                          <Select value={newCardCategory} onValueChange={setNewCardCategory}>
                            <SelectTrigger style={{ height: "48px", borderRadius: "12px" }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Math">Math</SelectItem>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="History">History</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setIsAddingCard(false);
                            setNewCardQuestion("");
                            setNewCardAnswer("");
                          }}
                          variant="outline"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addFlashcard}
                          disabled={!newCardQuestion.trim() || !newCardAnswer.trim()}
                          className="flex-1 border-0"
                          style={{
                            height: "48px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                            color: "#000000",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 700,
                            boxShadow: "0px 4px 12px rgba(254, 207, 56, 0.3)"
                          }}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create Card
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REVISION TAB */}
              {activeTab === "revision" && (
                <div>
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#000000",
                      marginTop: 0
                    }}
                  >
                    Smart Revision Summary
                  </h3>
                  <p
                    className="mb-6"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      color: "#666666",
                      marginTop: 0
                    }}
                  >
                    Auto-generated recap of this week's progress
                  </p>

                  {/* Topics Covered */}
                  <div className="mb-6">
                    <p
                      className="mb-3"
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#999999",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      Topics Covered
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Algebra", "Geometry", "Trigonometry"].map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: "8px"
                          }}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Key Improvements */}
                  <div className="mb-6">
                    <p
                      className="mb-3"
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#999999",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      Key Improvements
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-4 h-4 mt-0.5 text-green-600" />
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#333333",
                            margin: 0
                          }}
                        >
                          Quadratic equations: 68% → 85% accuracy
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="w-4 h-4 mt-0.5 text-yellow-600" />
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#333333",
                            margin: 0
                          }}
                        >
                          Mastered 3 new geometry theorems
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 mt-0.5 text-purple-600" />
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#333333",
                            margin: 0
                          }}
                        >
                          Completed 5/5 practice days
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Focus Areas Alert */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: "#FFF4E6",
                      border: "1px solid #FFE4B8"
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 mt-0.5 text-orange-600" />
                      <div>
                        <p
                          className="mb-1"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#B45309",
                            marginTop: 0
                          }}
                        >
                          Needs Attention
                        </p>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            color: "#92400E",
                            margin: 0
                          }}
                        >
                          Word problems and ratio calculations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Collapsed Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between p-5 rounded-2xl transition-all"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E6E6",
              cursor: "pointer",
              boxShadow: "0px 4px 16px rgba(0,0,0,0.04)"
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" style={{ color: "#FFD500" }} />
              <span
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#000000"
                }}
              >
                Insights & Recommendations
              </span>
            </div>
            {showInsights ? (
              <ChevronUp className="w-5 h-5" style={{ color: "#666666" }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: "#666666" }} />
            )}
          </button>

          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4"
              >
                {/* Focus Tab Insights */}
                {activeTab === "focus" && (
                  <>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-0.5" style={{ color: "#FFD500" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Peak Focus Time
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            Your best focus hours are 9-11 AM. Schedule deep work then!
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 mt-0.5" style={{ color: "#22C55E" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            {sessionsCompleted >= 5 ? "Solar System Streak!" : "Build Your Solar System"}
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            {sessionsCompleted >= 5 
                              ? "Amazing! You've completed a full solar system. Keep the momentum!" 
                              : `${5 - sessionsCompleted} more ${sessionsCompleted >= 4 ? 'session' : 'sessions'} to complete your solar system!`}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 mt-0.5" style={{ color: "#3B82F6" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Productivity Insight
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            You're 35% more productive with 25-minute sessions vs longer blocks
                          </p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {/* Quizzes Tab Insights */}
                {activeTab === "quizzes" && (
                  <>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 mt-0.5" style={{ color: "#FFD500" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Quiz Streak Active
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            You've completed 3 quizzes this week. Take 2 more for a streak badge!
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "#FF6B6B" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Focus on Weak Areas
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            Algebra and Geometry need attention - adaptive quiz ready to generate
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 mt-0.5" style={{ color: "#FFD500" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Achievement Progress
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            3 more perfect scores to unlock "Quiz Master" badge
                          </p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {/* Memory Tab Insights */}
                {activeTab === "memory" && (
                  <>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 mt-0.5" style={{ color: "#A78BFA" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            AI-Generated Flashcards
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            12 new cards ready based on your recent lessons and mistakes
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 mt-0.5" style={{ color: "#FFD500" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Memory Mastery
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            You've mastered {flashcards.filter(c => c.mastered).length}/{flashcards.length} cards. Keep reviewing!
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 mt-0.5" style={{ color: "#22C55E" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Spaced Repetition
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            Review Biology cards tomorrow for optimal retention (80% recall rate)
                          </p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {/* Revision Tab Insights */}
                {activeTab === "revision" && (
                  <>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 mt-0.5" style={{ color: "#3B82F6" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Weekly Improvement
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            Your average score increased by 12% this week - great progress!
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 mt-0.5" style={{ color: "#FFD500" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Consistency Streak
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            7-day study streak! Keep it up to unlock the "Dedicated Learner" badge
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border-0" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0px 4px 16px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 mt-0.5" style={{ color: "#A78BFA" }} />
                        <div>
                          <h4 className="mb-1" style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "15px", fontWeight: 700, color: "#000000", marginTop: 0 }}>
                            Next Focus Topic
                          </h4>
                          <p style={{ fontFamily: "Neurial Grotesk, sans-serif", fontSize: "13px", color: "#666666", margin: 0 }}>
                            Trigonometry - review sine/cosine rules before Friday's test
                          </p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
