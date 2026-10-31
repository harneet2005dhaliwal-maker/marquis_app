import { useState, useEffect, type PointerEvent } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import {
  getGoogleClassroomCourses,
  getGoogleClassroomCoursework,
  getMyGoogleClassroomSubmissions,
  type GoogleClassroomCourse,
  type GoogleClassroomCourseWork,
  type GoogleClassroomSubmission,
} from "../services/googleClassroom";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
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

type ClassroomWorkItem = GoogleClassroomCourseWork & {
  courseName: string;
  submission?: GoogleClassroomSubmission;
};

function getClassroomDueDate(work: GoogleClassroomCourseWork): Date | null {
  if (!work.dueDate) return null;

  return new Date(
    work.dueDate.year,
    work.dueDate.month - 1,
    work.dueDate.day,
    work.dueTime?.hours ?? 23,
    work.dueTime?.minutes ?? 59,
    0,
    0
  );
}

function isClassroomSubmitted(work: ClassroomWorkItem): boolean {
  return (
    work.submission?.state === "TURNED_IN" ||
    work.submission?.state === "RETURNED"
  );
}


export function StudyPage() {
  const { currentStudent } = useData();
  const {
    googleProviderToken,
    googleIdentityLinked,
    isConnectingGoogle,
    connectGoogleClassroom,
  } = useAuth();

  // Google Classroom State
  const [googleCourses, setGoogleCourses] = useState<GoogleClassroomCourse[]>([]);
  const [googleCoursework, setGoogleCoursework] = useState<ClassroomWorkItem[]>([]);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);
  const [googleConnectError, setGoogleConnectError] = useState<string | null>(null);
  const [classroomCourseFilter, setClassroomCourseFilter] = useState("all");
  const [classroomSearch, setClassroomSearch] = useState("");
  const [focusAssignment, setFocusAssignment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("focus");
  const [showInsights, setShowInsights] = useState(false);
  const [showClassroomDetails, setShowClassroomDetails] = useState(false);
  const [lavaPointer, setLavaPointer] = useState({
    x: 0,
    y: 0,
    active: false,
  });

  const handleStudyPointerMove = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLavaPointer({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
      active: true,
    });
  };

  const resetStudyPointer = () => {
    setLavaPointer({ x: 0, y: 0, active: false });
  };
  
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
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [newCardCategory, setNewCardCategory] = useState("Math");
  const [flashcardsReviewedToday, setFlashcardsReviewedToday] = useState(0);

  // Quiz State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

  const focusTopicColors = ["#FFD84D", "#A7F3D0", "#BFDBFE", "#FBCFE8"];

  const weakAreas: Array<{
    topic: string;
    difficulty: DifficultyLevel;
    color: string;
  }> = Array.from(
    new Map(
      googleCoursework
        .filter((work) => !isClassroomSubmitted(work))
        .map((work) => [
          `${work.courseName}:${work.title}`,
          {
            topic: work.title,
            difficulty: "medium" as DifficultyLevel,
          },
        ])
    ).values()
  )
    .slice(0, 4)
    .map((area, index) => ({
      ...area,
      color: focusTopicColors[index % focusTopicColors.length],
    }));

  // Trigger celebration helper
  const triggerCelebration = (message: string, type: "confetti" | "stars" | "fireworks" = "confetti") => {
    setCelebrationMessage(message);
    setCelebrationType(type);
    setShowCelebration(true);
  };

  // Google Classroom Effect
  useEffect(() => {
    const loadGoogleClassroom = async () => {
      if (!googleProviderToken) {
        setGoogleCourses([]);
        setGoogleCoursework([]);
        setClassroomError(null);
        return;
      }

      setClassroomLoading(true);
      setClassroomError(null);

      try {
        const courses = await getGoogleClassroomCourses(
          googleProviderToken
        );

        setGoogleCourses(courses);

        const courseworkByCourse = await Promise.all(
          courses.map(async (course) => {
            const [coursework, submissions] = await Promise.all([
              getGoogleClassroomCoursework(
                course.id,
                googleProviderToken
              ),
              getMyGoogleClassroomSubmissions(
                course.id,
                googleProviderToken
              ),
            ]);

            return coursework.map((work) => ({
              ...work,
              courseName: course.name,
              submission: submissions.find(
                (submission) =>
                  submission.courseWorkId === work.id
              ),
            }));
          })
        );

        const flattenedCoursework = courseworkByCourse
          .flat()
          .sort((a, b) => {
            const aDate = a.dueDate
              ? new Date(
                  a.dueDate.year,
                  a.dueDate.month - 1,
                  a.dueDate.day,
                  a.dueTime?.hours ?? 23,
                  a.dueTime?.minutes ?? 59
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

            const bDate = b.dueDate
              ? new Date(
                  b.dueDate.year,
                  b.dueDate.month - 1,
                  b.dueDate.day,
                  b.dueTime?.hours ?? 23,
                  b.dueTime?.minutes ?? 59
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

            return aDate - bDate;
          });

        setGoogleCoursework(flattenedCoursework);
      } catch (error) {
        console.error(
          "Google Classroom load failed:",
          error
        );

        setClassroomError(
          error instanceof Error
            ? error.message
            : "Unable to load Google Classroom."
        );
      } finally {
        setClassroomLoading(false);
      }
    };

    void loadGoogleClassroom();
  }, [googleProviderToken]);
// Pomodoro Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

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
    const subject = "Mathematics";
    const topicIds = getCurrentAndLastWeekTopicIds(subject);

    let relevantQuestions = questionBank.filter((q) =>
      topicIds.includes(q.curriculumTopicId)
    );

    // If the weekly topic mapping does not match anything, use the local
    // question bank instead of creating a broken zero-question quiz.
    if (relevantQuestions.length === 0) {
      relevantQuestions = [...questionBank];
    }

    if (relevantQuestions.length === 0) {
      toast.error(
        "No quiz questions are available yet. Add questions to the question bank first."
      );
      return;
    }

    const shuffleArray = <T,>(items: T[]): T[] =>
      [...items].sort(() => Math.random() - 0.5);

    const easyQuestions = shuffleArray(
      relevantQuestions.filter((q) => q.difficulty === "easy")
    );
    const mediumQuestions = shuffleArray(
      relevantQuestions.filter((q) => q.difficulty === "medium")
    );
    const hardQuestions = shuffleArray(
      relevantQuestions.filter((q) => q.difficulty === "hard")
    );

    const selectedQuestions: Question[] = [
      ...easyQuestions.slice(0, 5),
      ...mediumQuestions.slice(0, 7),
      ...hardQuestions.slice(0, 3),
    ];

    const selectedSet = new Set(selectedQuestions);
    const remainingQuestions = shuffleArray(
      relevantQuestions.filter((q) => !selectedSet.has(q))
    );

    const finalQuestions = [
      ...selectedQuestions,
      ...remainingQuestions,
    ].slice(0, 15);

    if (finalQuestions.length === 0) {
      toast.error("No suitable quiz questions were found.");
      return;
    }

    const adaptiveQuestions: QuizQuestion[] = finalQuestions.map(
      (q, index) => ({
        id: Date.now() + index,
        question: q.question,
        type: q.type as QuestionType,
        difficulty: q.difficulty,
        correctAnswer: q.correctAnswer,
        options: q.options,
        userAnswer: "",
        wasWrong: false,
      })
    );

    const classroomTopics = googleCoursework
      .filter((work) => !isClassroomSubmitted(work))
      .slice(0, 3)
      .map((work) => work.title);

    const topicLabel =
      classroomTopics.length > 0
        ? classroomTopics.join(", ")
        : "Weekly Practice";

    const adaptiveQuiz: Quiz = {
      id: Date.now(),
      topic: `Weekly Review: ${topicLabel}`,
      questions: adaptiveQuestions,
      isAdaptive: true,
    };

    startQuiz(adaptiveQuiz);

    toast.success(
      `Created a ${adaptiveQuestions.length}-question practice quiz.`
    );
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
    
    
    if (finalQuestions.length === 0) {
      toast.error(
        `No questions are available for Week ${weekLesson.weekNumber} yet.`
      );
      return;
    }

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
    if (!quiz.questions || quiz.questions.length === 0) {
      toast.error("This quiz has no questions, so it was not started.");
      return;
    }

    setActiveQuiz({
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        userAnswer: "",
      })),
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
    if (!activeQuiz || activeQuiz.questions.length === 0) {
      return {
        score: 0,
        total: 0,
        percentage: 0,
      };
    }

    const correct = activeQuiz.questions.filter(
      (q) =>
        q.userAnswer.toLowerCase().trim() ===
        q.correctAnswer.toLowerCase().trim()
    ).length;

    return {
      score: correct,
      total: activeQuiz.questions.length,
      percentage: Math.round(
        (correct / activeQuiz.questions.length) * 100
      ),
    };
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const totalFlashcards = flashcards.length;
  const currentCard = flashcards[currentFlashcardIndex];

  // Google Classroom dashboard
  const classroomNow = new Date();
  const classroomTodayStart = new Date(
    classroomNow.getFullYear(),
    classroomNow.getMonth(),
    classroomNow.getDate()
  );
  const classroomTodayEnd = new Date(classroomTodayStart);
  classroomTodayEnd.setHours(23, 59, 59, 999);

  // Monday-Sunday calendar week.
  const classroomWeekEnd = new Date(classroomTodayEnd);
  const dayOfWeek = classroomTodayStart.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  classroomWeekEnd.setDate(classroomWeekEnd.getDate() + daysUntilSunday);

  // Hide stale incomplete work from more than 60 days ago by default.
  const classroomOldCutoff = new Date(classroomTodayStart);
  classroomOldCutoff.setDate(classroomOldCutoff.getDate() - 60);

  const classroomSearchTerm = classroomSearch.trim().toLowerCase();

  const classroomFilteredWork = googleCoursework.filter((work) => {
    if (
      classroomCourseFilter !== "all" &&
      work.courseId !== classroomCourseFilter
    ) {
      return false;
    }

    if (classroomSearchTerm) {
      const searchableText = [
        work.courseName,
        work.title,
        work.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(classroomSearchTerm)) {
        return false;
      }
    }

    const dueDate = getClassroomDueDate(work);
    const submitted = isClassroomSubmitted(work);

    // Old completed work is hidden after 60 days, and old stale missing
    // work is also hidden so the Study page stays useful.
    if (dueDate && dueDate < classroomOldCutoff) {
      return false;
    }

    // Keep undated work because it may still be active.
    return submitted || !dueDate || dueDate >= classroomOldCutoff;
  });

  const sortByDueDate = (a: ClassroomWorkItem, b: ClassroomWorkItem) => {
    const aDue = getClassroomDueDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = getClassroomDueDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  };

  const classroomOverdue = classroomFilteredWork
    .filter((work) => {
      const dueDate = getClassroomDueDate(work);
      return (
        !isClassroomSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! < classroomTodayStart
      );
    })
    .sort(sortByDueDate);

  const classroomDueToday = classroomFilteredWork
    .filter((work) => {
      const dueDate = getClassroomDueDate(work);
      return (
        !isClassroomSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! >= classroomTodayStart &&
        dueDate! <= classroomTodayEnd
      );
    })
    .sort(sortByDueDate);

  const classroomDueThisWeek = classroomFilteredWork
    .filter((work) => {
      const dueDate = getClassroomDueDate(work);
      return (
        !isClassroomSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! > classroomTodayEnd &&
        dueDate! <= classroomWeekEnd
      );
    })
    .sort(sortByDueDate);

  const classroomUpcoming = classroomFilteredWork
    .filter((work) => {
      const dueDate = getClassroomDueDate(work);
      return (
        !isClassroomSubmitted(work) &&
        (!dueDate || dueDate > classroomWeekEnd)
      );
    })
    .sort(sortByDueDate);

  const classroomCompleted = classroomFilteredWork
    .filter((work) => isClassroomSubmitted(work))
    .sort((a, b) => {
      const aDue = getClassroomDueDate(a)?.getTime() ?? 0;
      const bDue = getClassroomDueDate(b)?.getTime() ?? 0;
      return bDue - aDue;
    });

  const startFocusForAssignment = (work: ClassroomWorkItem) => {
    setFocusAssignment(`${work.courseName} — ${work.title}`);
    setActiveTab("focus");
    setTimerMode("work");

    if (!isRunning) {
      setTimeLeft(workDuration * 60);
    }

    toast.success(`Focus session ready for "${work.title}"`);
  };

  const formatClassroomDue = (dueDate: Date | null) => {
    if (!dueDate) return "No due date";

    return dueDate.toLocaleString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="min-h-screen pb-28 relative overflow-hidden"
      onPointerMove={handleStudyPointerMove}
      onPointerLeave={resetStudyPointer}
      onPointerDown={handleStudyPointerMove}
      onPointerUp={() =>
        setLavaPointer((prev) => ({ ...prev, active: false }))
      }
      style={{
        background:
          "linear-gradient(180deg, #F8F6F1 0%, #FCFBF8 48%, #F1EEE7 100%)",
        color: "#111111",
        touchAction: "pan-y",
      }}
    >
      {/* Celebration Overlay */}
      <CelebrationOverlay
        show={showCelebration}
        message={celebrationMessage}
        type={celebrationType}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Interactive Marquis lava background */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <motion.div
          animate={{
            x: lavaPointer.active ? lavaPointer.x * 72 : [0, 34, -18, 0],
            y: lavaPointer.active ? lavaPointer.y * 56 : [0, 24, -14, 0],
            scale: lavaPointer.active ? 1.22 : [1, 1.1, 0.97, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.38 : 9,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "310px",
            height: "310px",
            top: "-90px",
            right: "-125px",
            borderRadius:
              "46% 54% 58% 42% / 48% 42% 58% 52%",
            background:
              "radial-gradient(circle at 38% 34%, rgba(255,213,0,0.40), rgba(255,213,0,0.10) 58%, transparent 75%)",
            filter: "blur(17px)",
          }}
        />

        <motion.div
          animate={{
            x: lavaPointer.active ? lavaPointer.x * -54 : [0, -28, 18, 0],
            y: lavaPointer.active ? lavaPointer.y * -42 : [0, -18, 26, 0],
            scale: lavaPointer.active ? 1.15 : [1, 0.96, 1.07, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.42 : 11,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "250px",
            height: "250px",
            top: "33%",
            left: "-130px",
            borderRadius:
              "58% 42% 46% 54% / 42% 58% 44% 56%",
            background:
              "radial-gradient(circle at 52% 40%, rgba(18,18,18,0.12), rgba(135,135,135,0.06) 54%, transparent 72%)",
            filter: "blur(18px)",
          }}
        />

        <motion.div
          animate={{
            x: lavaPointer.active ? lavaPointer.x * 58 : [0, 20, -26, 0],
            y: lavaPointer.active ? lavaPointer.y * 44 : [0, 30, 8, 0],
            scale: lavaPointer.active ? 1.18 : [1, 1.06, 0.97, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.4 : 10,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "240px",
            height: "240px",
            bottom: "100px",
            right: "-105px",
            borderRadius:
              "43% 57% 51% 49% / 56% 44% 58% 42%",
            background:
              "radial-gradient(circle at 44% 38%, rgba(255,213,0,0.25), rgba(180,180,180,0.08) 58%, transparent 74%)",
            filter: "blur(17px)",
          }}
        />
      </div>

      <div
        className="mx-auto relative"
        style={{
          zIndex: 2,
          width: "100%",
          maxWidth: "760px",
          padding: "24px 18px 0",
          boxSizing: "border-box",
        }}
      >
        {/* Compact Study Hero */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            position: "relative",
            overflow: "hidden",
            marginBottom: "18px",
            padding: "24px 22px",
            borderRadius: "30px",
            textAlign: "center",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.80), rgba(255,255,255,0.56))",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.94)",
            boxShadow:
              "0 18px 42px rgba(35,30,20,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
          }}
        >
          <motion.div
            aria-hidden="true"
            animate={{
              x: [0, 10, -8, 0],
              y: [0, -8, 7, 0],
              scale: [1, 1.05, 0.98, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              width: "145px",
              height: "145px",
              right: "-58px",
              top: "-54px",
              borderRadius:
                "48% 52% 60% 40% / 44% 58% 42% 56%",
              background:
                "radial-gradient(circle at 40% 35%, rgba(255,213,0,0.30), rgba(255,213,0,0.06) 62%, transparent 76%)",
              filter: "blur(7px)",
            }}
          />

          <div className="relative z-10">
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 900,
                color: "#9A7D00",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Study space
            </p>

            <h1
              style={{
                margin: "7px 0 0",
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "32px",
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#111111",
              }}
            >
              Study
            </h1>

            <p
              style={{
                margin: "9px auto 0",
                maxWidth: "470px",
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#77716A",
                fontWeight: 500,
              }}
            >
              Focus, practise and review without the clutter.
            </p>
          </div>
        </motion.section>

        {/* Google Classroom - compact live summary */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          style={{
            marginBottom: "18px",
            borderRadius: "26px",
            background: "rgba(255,255,255,0.70)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.92)",
            boxShadow:
              "0 14px 34px rgba(35,30,20,0.07), inset 0 1px 0 rgba(255,255,255,0.86)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setShowClassroomDetails((prev) => !prev)}
            style={{
              width: "100%",
              border: 0,
              background: "transparent",
              padding: "18px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background:
                      "linear-gradient(145deg, rgba(255,213,0,0.95), rgba(255,224,73,0.86))",
                    boxShadow: "0 8px 18px rgba(255,213,0,0.20)",
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#111111",
                    }}
                  >
                    Google Classroom
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "12px",
                      lineHeight: 1.35,
                      color: "#77716A",
                    }}
                  >
                    {googleProviderToken
                      ? `${classroomDueToday.length} due today · ${classroomDueThisWeek.length} this week`
                      : "Connect your school account to bring coursework into Study"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {googleProviderToken && (
                  <Badge
                    style={{
                      background: "rgba(255,248,220,0.82)",
                      color: "#6B5400",
                      border: "1px solid rgba(255,213,0,0.28)",
                      fontSize: "11px",
                    }}
                  >
                    {googleCourses.length} classes
                  </Badge>
                )}
                {showClassroomDetails ? (
                  <ChevronUp className="w-5 h-5" style={{ color: "#77716A" }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: "#77716A" }} />
                )}
              </div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {showClassroomDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    padding: "0 14px 14px",
                  }}
                >
<motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8"
        >
          <Card
            className="border-0"
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0px 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen
                    className="w-5 h-5"
                    style={{ color: "#000000" }}
                  />
                  <h2
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#000000",
                      margin: 0,
                    }}
                  >
                    Google Classroom
                  </h2>
                </div>

                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    color: "#666666",
                    margin: "6px 0 0",
                  }}
                >
                  Your live homework, deadlines and submission status
                </p>
              </div>

              {googleProviderToken && (
                <Badge
                  style={{
                    background: "#FFD84D22",
                    color: "#000000",
                    border: "1px solid #FFD84D44",
                    whiteSpace: "nowrap",
                  }}
                >
                  {googleCourses.length}{" "}
                  {googleCourses.length === 1 ? "Class" : "Classes"}
                </Badge>
              )}
            </div>

            {!googleProviderToken && (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "16px",
                  background: "#FFF8E5",
                  border: "1px solid #FFD84D66",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#FFD500",
                    }}
                  >
                    <BookOpen
                      className="w-5 h-5"
                      style={{ color: "#000000" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#111111",
                        margin: 0,
                      }}
                    >
                      {googleIdentityLinked
                        ? "Reconnect Google Classroom"
                        : "Connect Google Classroom"}
                    </p>

                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        color: "#666666",
                        margin: "5px 0 14px",
                      }}
                    >
                      {googleIdentityLinked
                        ? "Your Google account is linked to Marquis. Re-authorise Classroom to load your current classes and assignments."
                        : "Use your school Google account once to give Marquis permission to read your classes, homework and submission status."}
                    </p>

                    <Button
                      type="button"
                      disabled={isConnectingGoogle}
                      onClick={async () => {
                        setGoogleConnectError(null);

                        try {
                          await connectGoogleClassroom();
                        } catch (error) {
                          setGoogleConnectError(
                            error instanceof Error
                              ? error.message
                              : "Unable to connect Google Classroom."
                          );
                        }
                      }}
                      className="border-0"
                      style={{
                        minHeight: "44px",
                        borderRadius: "12px",
                        padding: "0 18px",
                        background:
                          "linear-gradient(135deg, #111111 0%, #272727 100%)",
                        color: "#FFFFFF",
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: isConnectingGoogle
                          ? "wait"
                          : "pointer",
                        opacity: isConnectingGoogle ? 0.7 : 1,
                      }}
                    >
                      {isConnectingGoogle
                        ? "Connecting..."
                        : googleIdentityLinked
                          ? "Authorise Classroom"
                          : "Connect Google Classroom"}
                    </Button>

                    {googleConnectError && (
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "12px",
                          color: "#B91C1C",
                          margin: "10px 0 0",
                        }}
                      >
                        {googleConnectError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {googleProviderToken && classroomLoading && (
              <div
                className="flex items-center gap-3"
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#F8F8F8",
                }}
              >
                <RotateCcw className="w-4 h-4 animate-spin" />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    color: "#666666",
                    margin: 0,
                  }}
                >
                  Loading Google Classroom…
                </p>
              </div>
            )}

            {googleProviderToken &&
              !classroomLoading &&
              classroomError && (
                <div
                  className="flex items-start gap-3"
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#FFF1F1",
                    border: "1px solid #FECACA",
                  }}
                >
                  <AlertCircle
                    className="w-5 h-5 mt-0.5"
                    style={{ color: "#DC2626" }}
                  />
                  <div>
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#B91C1C",
                        margin: 0,
                      }}
                    >
                      Google Classroom couldn't load
                    </p>
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "13px",
                        color: "#7F1D1D",
                        margin: "4px 0 0",
                      }}
                    >
                      {classroomError}
                    </p>
                  </div>
                </div>
              )}

            {googleProviderToken &&
              !classroomLoading &&
              !classroomError && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      {
                        label: "Overdue",
                        value: classroomOverdue.length,
                        background: "#FFF1F1",
                        text: "#B91C1C",
                      },
                      {
                        label: "Due Today",
                        value: classroomDueToday.length,
                        background: "#FFF8DC",
                        text: "#7A5D00",
                      },
                      {
                        label: "This Week",
                        value: classroomDueThisWeek.length,
                        background: "#FFF8E5",
                        text: "#6B5400",
                      },
                      {
                        label: "Completed",
                        value: classroomCompleted.length,
                        background: "#ECFDF3",
                        text: "#166534",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "15px",
                          borderRadius: "16px",
                          background: item.background,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "24px",
                            fontWeight: 700,
                            color: item.text,
                            margin: 0,
                          }}
                        >
                          {item.value}
                        </p>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: item.text,
                            margin: "3px 0 0",
                          }}
                        >
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Search and course filter */}
                  <div className="grid gap-3 md:grid-cols-2 mb-7">
                    <Input
                      value={classroomSearch}
                      onChange={(event) =>
                        setClassroomSearch(event.target.value)
                      }
                      placeholder="Search assignments..."
                      style={{
                        height: "46px",
                        borderRadius: "12px",
                        borderColor: "#E6E6E6",
                        fontFamily: "Neurial Grotesk, sans-serif",
                      }}
                    />

                    <Select
                      value={classroomCourseFilter}
                      onValueChange={setClassroomCourseFilter}
                    >
                      <SelectTrigger
                        style={{
                          height: "46px",
                          borderRadius: "12px",
                          borderColor: "#E6E6E6",
                          fontFamily: "Neurial Grotesk, sans-serif",
                        }}
                      >
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {googleCourses
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((course) => (
                            <SelectItem
                              key={course.id}
                              value={course.id}
                            >
                              {course.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {classroomFilteredWork.length === 0 ? (
                    <div
                      style={{
                        padding: "22px",
                        borderRadius: "14px",
                        background: "#F8F8F8",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "14px",
                          color: "#666666",
                          margin: 0,
                        }}
                      >
                        No current assignments match these filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      {[
                        {
                          title: "Overdue",
                          subtitle: "Needs attention",
                          items: classroomOverdue,
                          accent: "#DC2626",
                          background: "#FFF7F7",
                        },
                        {
                          title: "Due Today",
                          subtitle: "Priority for today",
                          items: classroomDueToday,
                          accent: "#B7791F",
                          background: "#FFFBEB",
                        },
                        {
                          title: "Due This Week",
                          subtitle: "Coming up before Sunday",
                          items: classroomDueThisWeek,
                          accent: "#9A7200",
                          background: "#FFFDF3",
                        },
                        {
                          title: "Upcoming",
                          subtitle: "Later work and undated tasks",
                          items: classroomUpcoming,
                          accent: "#4B5563",
                          background: "#FAFAFA",
                        },
                        {
                          title: "Completed",
                          subtitle: "Recently submitted or returned",
                          items: classroomCompleted,
                          accent: "#166534",
                          background: "#F7FCF8",
                        },
                      ]
                        .filter((section) => section.items.length > 0)
                        .map((section) => (
                          <div key={section.title}>
                            <div className="flex items-end justify-between gap-3 mb-3">
                              <div>
                                <h3
                                  style={{
                                    fontFamily:
                                      "Neurial Grotesk, sans-serif",
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    color: "#000000",
                                    margin: 0,
                                  }}
                                >
                                  {section.title}
                                </h3>
                                <p
                                  style={{
                                    fontFamily:
                                      "Neurial Grotesk, sans-serif",
                                    fontSize: "12px",
                                    color: "#888888",
                                    margin: "3px 0 0",
                                  }}
                                >
                                  {section.subtitle}
                                </p>
                              </div>

                              <Badge
                                style={{
                                  background: section.background,
                                  color: section.accent,
                                  border: `1px solid ${section.accent}22`,
                                }}
                              >
                                {section.items.length}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {section.items.map((work) => {
                                const dueDate = getClassroomDueDate(work);
                                const submitted =
                                  isClassroomSubmitted(work);
                                const returned =
                                  work.submission?.state === "RETURNED";

                                const statusLabel = submitted
                                  ? returned
                                    ? "Returned"
                                    : "Submitted"
                                  : section.title === "Overdue"
                                    ? "Missing"
                                    : "Assigned";

                                return (
                                  <div
                                    key={`${work.courseId}-${work.id}`}
                                    style={{
                                      padding: "18px",
                                      borderRadius: "16px",
                                      background: section.background,
                                      border: "1px solid #ECECEC",
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0 flex-1">
                                        <p
                                          style={{
                                            fontFamily:
                                              "Neurial Grotesk, sans-serif",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#888888",
                                            margin: "0 0 6px",
                                          }}
                                        >
                                          {work.courseName}
                                        </p>

                                        <h4
                                          style={{
                                            fontFamily:
                                              "Neurial Grotesk, sans-serif",
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            color: "#000000",
                                            margin: 0,
                                          }}
                                        >
                                          {work.title}
                                        </h4>

                                        <p
                                          style={{
                                            fontFamily:
                                              "Neurial Grotesk, sans-serif",
                                            fontSize: "13px",
                                            color: section.accent,
                                            margin: "8px 0 0",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {dueDate
                                            ? `Due ${formatClassroomDue(
                                                dueDate
                                              )}`
                                            : "No due date"}
                                        </p>

                                        {typeof work.submission
                                          ?.assignedGrade === "number" && (
                                          <p
                                            style={{
                                              fontFamily:
                                                "Neurial Grotesk, sans-serif",
                                              fontSize: "13px",
                                              color: "#666666",
                                              margin: "5px 0 0",
                                            }}
                                          >
                                            Grade:{" "}
                                            {
                                              work.submission
                                                .assignedGrade
                                            }
                                            {typeof work.maxPoints ===
                                            "number"
                                              ? ` / ${work.maxPoints}`
                                              : ""}
                                          </p>
                                        )}
                                      </div>

                                      <Badge
                                        style={{
                                          background: submitted
                                            ? "#DCFCE7"
                                            : section.title === "Overdue"
                                              ? "#FEE2E2"
                                              : "#FFF4CC",
                                          color: submitted
                                            ? "#166534"
                                            : section.title === "Overdue"
                                              ? "#B91C1C"
                                              : "#7A5D00",
                                          border: "none",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {statusLabel}
                                      </Badge>
                                    </div>

                                    {work.description && (
                                      <p
                                        style={{
                                          fontFamily:
                                            "Neurial Grotesk, sans-serif",
                                          fontSize: "13px",
                                          color: "#666666",
                                          lineHeight: 1.5,
                                          margin: "12px 0 0",
                                          whiteSpace: "pre-line",
                                        }}
                                      >
                                        {work.description.length > 180
                                          ? `${work.description.slice(
                                              0,
                                              180
                                            )}…`
                                          : work.description}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4">
                                      {!submitted && (
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            startFocusForAssignment(work)
                                          }
                                          className="border-0"
                                          style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            background:
                                              "linear-gradient(135deg, #FFD84D 0%, #FECF38 100%)",
                                            color: "#000000",
                                            fontFamily:
                                              "Neurial Grotesk, sans-serif",
                                            fontWeight: 700,
                                          }}
                                        >
                                          <Play className="w-4 h-4 mr-2" />
                                          Start Focus
                                        </Button>
                                      )}

                                      {work.alternateLink && (
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            window.open(
                                              work.alternateLink,
                                              "_blank",
                                              "noopener,noreferrer"
                                            )
                                          }
                                          variant="outline"
                                          style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            fontFamily:
                                              "Neurial Grotesk, sans-serif",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Open in Classroom
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
          </Card>
        </motion.div>


                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Centered glass tool navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "6px",
            marginBottom: "18px",
            padding: "6px",
            borderRadius: "22px",
            background: "rgba(255,255,255,0.64)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.92)",
            boxShadow: "0 12px 30px rgba(30,26,18,0.07)",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  minWidth: 0,
                  minHeight: "58px",
                  border: "1px solid",
                  borderColor: isActive
                    ? "rgba(255,213,0,0.55)"
                    : "transparent",
                  borderRadius: "17px",
                  background: isActive
                    ? "linear-gradient(145deg, rgba(255,213,0,0.96), rgba(255,225,80,0.90))"
                    : "transparent",
                  color: isActive ? "#111111" : "#77716A",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 8px 18px rgba(255,213,0,0.18)"
                    : "none",
                }}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "11px",
                    fontWeight: isActive ? 800 : 700,
                  }}
                >
                  {tab.id === "quizzes" ? "Practice" : tab.label}
                </span>
              </motion.button>
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
              className="border-0 mb-6"
              style={{
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.60))",
                backdropFilter: "blur(26px)",
                WebkitBackdropFilter: "blur(26px)",
                border: "1px solid rgba(255,255,255,0.94)",
                borderRadius: "28px",
                padding: "clamp(20px, 4vw, 28px)",
                boxShadow:
                  "0 16px 38px rgba(30,26,18,0.08), inset 0 1px 0 rgba(255,255,255,0.88)"
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
                          padding: "24px"
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

                  {focusAssignment && timerMode === "work" && (
                    <div
                      className="flex items-center justify-between gap-3 mb-6"
                      style={{
                        padding: "14px 16px",
                        borderRadius: "14px",
                        background: "#FFF8E5",
                        border: "1px solid #FFD84D55",
                        textAlign: "left",
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#8A6A00",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            margin: 0,
                          }}
                        >
                          Focusing on
                        </p>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#000000",
                            margin: "4px 0 0",
                          }}
                        >
                          {focusAssignment}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFocusAssignment(null)}
                        aria-label="Clear focus assignment"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          border: "1px solid #E6E6E6",
                          background: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Orbital Solar System */}
                  <div
                    className="mb-5 mx-auto"
                    style={{
                      width: "100%",
                      maxWidth: "360px",
                      overflow: "hidden",
                      borderRadius: "24px",
                      background:
                        "radial-gradient(circle at 50% 70%, rgba(255,213,0,0.14), transparent 66%)",
                    }}
                  >
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
                      fontSize: "46px",
                      fontWeight: 700,
                      color: "#000000",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    {formatTime(timeLeft)}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex gap-3 justify-center flex-wrap mb-7">
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
                  <div className="grid grid-cols-2 gap-3">
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
                        Practice
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
                        Short, targeted practice built around what matters now.
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
                          Recommended from your current workload
                        </p>
                        <div className="grid gap-2">
                          {weakAreas.length === 0 && (
                            <span
                              className="px-4 py-3 rounded-2xl"
                              style={{
                                background: "rgba(255,255,255,0.58)",
                                border: "1px solid rgba(230,230,230,0.80)",
                                color: "#777777",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                textAlign: "left",
                              }}
                            >
                              Connect Google Classroom to show current focus topics
                            </span>
                          )}

                          {weakAreas.map((area) => (
                            <span
                              key={area.topic}
                              className="px-4 py-3 rounded-2xl"
                              style={{
                                background: "rgba(255,255,255,0.62)",
                                border: `1px solid ${area.color}55`,
                                color: "#111111",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                lineHeight: 1.35,
                                fontWeight: 700,
                                textAlign: "left",
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
                          Build weekly practice quiz
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
              background: "rgba(255,255,255,0.66)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(255,255,255,0.92)",
              cursor: "pointer",
              boxShadow: "0 12px 28px rgba(30,26,18,0.06)"
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
                Study coach
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