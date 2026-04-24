import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Brain, Plus, RotateCcw, Check, X, 
  Sparkles, Star, Zap, Eye, ChevronLeft, ChevronRight,
  Trophy, BookOpen, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";

type DifficultyLevel = "easy" | "medium" | "hard";
type FlashcardMode = "review" | "challenge" | "quick-recall";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: string;
  concept: string;
  difficulty: DifficultyLevel;
  flipped: boolean;
  mastered: boolean;
}

interface Constellation {
  id: number;
  name: string;
  concept: string;
  stars: number;
  starsCompleted: number;
  completed: boolean;
}

// Mock student mistakes/weak areas for AI generation
const studentWeakAreas = [
  {
    topic: "Algebra — Factoring Quadratics",
    mistakes: 3,
    lastAttempt: "2 days ago",
    concepts: ["Factor x² + 5x + 6", "Find roots of x² - 7x + 12 = 0"],
  },
  {
    topic: "Geometry — Triangle Theorems",
    mistakes: 5,
    lastAttempt: "1 day ago",
    concepts: ["Pythagorean theorem", "Triangle angle sum", "Similar triangles"],
  },
  {
    topic: "English — Literary Devices",
    mistakes: 2,
    lastAttempt: "3 days ago",
    concepts: ["Metaphor vs simile", "Personification examples"],
  },
];

// Mock flashcards
const mockFlashcards: Flashcard[] = [
  {
    id: 1,
    question: "Solve for x: 2x + 5 = 13",
    answer: "x = 4\n\nSteps:\n1. Subtract 5 from both sides: 2x = 8\n2. Divide by 2: x = 4",
    category: "Mathematics",
    concept: "Algebra — Linear Equations",
    difficulty: "medium",
    flipped: false,
    mastered: false,
  },
  {
    id: 2,
    question: "What is the area of a triangle with base 6 and height 8?",
    answer: "24 square units\n\nFormula: A = ½ × base × height\nA = ½ × 6 × 8 = 24",
    category: "Mathematics",
    concept: "Geometry — Triangle Area",
    difficulty: "easy",
    flipped: false,
    mastered: true,
  },
  {
    id: 3,
    question: "Define photosynthesis",
    answer: "The process by which plants convert light energy into chemical energy (glucose), using carbon dioxide and water, while releasing oxygen.",
    category: "Science",
    concept: "Biology — Photosynthesis",
    difficulty: "medium",
    flipped: false,
    mastered: false,
  },
  {
    id: 4,
    question: "What are the main themes in 'To Kill a Mockingbird'?",
    answer: "1. Racial injustice\n2. Loss of innocence\n3. Moral education\n4. Courage and compassion",
    category: "English",
    concept: "Literature — Themes",
    difficulty: "hard",
    flipped: false,
    mastered: false,
  },
];

const mockConstellations: Constellation[] = [
  {
    id: 1,
    name: "Algebra Constellation",
    concept: "Algebra — Factoring",
    stars: 5,
    starsCompleted: 5,
    completed: true,
  },
  {
    id: 2,
    name: "Geometry Constellation",
    concept: "Geometry — Triangle Properties",
    stars: 5,
    starsCompleted: 3,
    completed: false,
  },
  {
    id: 3,
    name: "Poetry Constellation",
    concept: "English — Poetic Devices",
    stars: 5,
    starsCompleted: 2,
    completed: false,
  },
];

export function MemoryOrbitPage() {
  const [flashcards, setFlashcards] = useState(mockFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<FlashcardMode>("review");
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [quickRecallTimer, setQuickRecallTimer] = useState<number | null>(null);
  const [challengeTimer, setChallengeTimer] = useState(0);

  // Filter cards based on mode
  const getFilteredCards = () => {
    switch (mode) {
      case "challenge":
        // Only show unmastered cards in challenge mode
        return flashcards.filter(card => !card.mastered);
      case "quick-recall":
      case "review":
      default:
        // Show all cards
        return flashcards;
    }
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
    
    // In quick recall mode, start the auto-flip timer when showing answer
    if (mode === "quick-recall" && !showAnswer) {
      const timer = window.setTimeout(() => {
        setShowAnswer(false);
        handleNext();
      }, 5000);
      setQuickRecallTimer(timer);
    }
  };

  const handleNext = () => {
    setShowAnswer(false);
    if (quickRecallTimer) {
      clearTimeout(quickRecallTimer);
      setQuickRecallTimer(null);
    }
    
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    if (quickRecallTimer) {
      clearTimeout(quickRecallTimer);
      setQuickRecallTimer(null);
    }
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  const handleMastered = (mastered: boolean) => {
    // Find the actual flashcard in the full array
    const actualCard = currentCard;
    setFlashcards(prev => prev.map(card => 
      card.id === actualCard.id ? { ...card, mastered } : card
    ));
    
    if (mastered) {
      setStudyStreak(studyStreak + 1);
      if (studyStreak + 1 >= 5) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
    
    setTimeout(handleNext, 300);
  };

  const handleModeChange = (newMode: FlashcardMode) => {
    setMode(newMode);
    setCurrentIndex(0);
    setShowAnswer(false);
    if (quickRecallTimer) {
      clearTimeout(quickRecallTimer);
      setQuickRecallTimer(null);
    }
    if (newMode === "challenge") {
      setChallengeTimer(0);
    }
  };

  // Challenge mode timer
  useEffect(() => {
    if (mode === "challenge" && filteredCards.length > 0) {
      const interval = setInterval(() => {
        setChallengeTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, filteredCards.length]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (quickRecallTimer) {
        clearTimeout(quickRecallTimer);
      }
    };
  }, [quickRecallTimer]);

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "hard": return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const masteredCount = flashcards.filter(c => c.mastered).length;
  const progressPercentage = (masteredCount / flashcards.length) * 100;

  // Generate flashcards based on student mistakes and weak areas
  const generateFlashcardsFromMistakes = () => {
    setIsGeneratingCards(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const newFlashcards: Flashcard[] = [
        {
          id: Date.now() + 1,
          question: "Factor the quadratic: x² + 5x + 6",
          answer: "(x + 2)(x + 3)\n\nSteps:\n1. Find two numbers that multiply to 6 and add to 5\n2. Those numbers are 2 and 3\n3. Write as (x + 2)(x + 3)",
          category: "Mathematics",
          concept: "Algebra — Factoring Quadratics",
          difficulty: "medium",
          flipped: false,
          mastered: false,
        },
        {
          id: Date.now() + 2,
          question: "Find the roots of: x² - 7x + 12 = 0",
          answer: "x = 3 or x = 4\n\nSteps:\n1. Factor: (x - 3)(x - 4) = 0\n2. Set each factor to zero\n3. x - 3 = 0 → x = 3\n4. x - 4 = 0 → x = 4",
          category: "Mathematics",
          concept: "Algebra — Factoring Quadratics",
          difficulty: "medium",
          flipped: false,
          mastered: false,
        },
        {
          id: Date.now() + 3,
          question: "Apply the Pythagorean theorem: Find the hypotenuse if a = 3 and b = 4",
          answer: "c = 5\n\nFormula: a² + b² = c²\n3² + 4² = c²\n9 + 16 = c²\n25 = c²\nc = 5",
          category: "Mathematics",
          concept: "Geometry — Triangle Theorems",
          difficulty: "easy",
          flipped: false,
          mastered: false,
        },
        {
          id: Date.now() + 4,
          question: "What is the triangle angle sum theorem?",
          answer: "The sum of all interior angles in a triangle is always 180°.\n\nExample: If two angles are 60° and 70°, the third angle is:\n180° - 60° - 70° = 50°",
          category: "Mathematics",
          concept: "Geometry — Triangle Theorems",
          difficulty: "easy",
          flipped: false,
          mastered: false,
        },
        {
          id: Date.now() + 5,
          question: "Explain the difference between metaphor and simile",
          answer: "SIMILE: Compares using 'like' or 'as'\nExample: 'Her smile was like sunshine'\n\nMETAPHOR: Direct comparison without 'like' or 'as'\nExample: 'Her smile was sunshine'",
          category: "English",
          concept: "English — Literary Devices",
          difficulty: "easy",
          flipped: false,
          mastered: false,
        },
      ];
      
      setFlashcards(prev => [...newFlashcards, ...prev]);
      setCurrentIndex(0);
      setIsGeneratingCards(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-16 pb-12"
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-primary"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  <Trophy className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <h3 className="mb-0">Constellation Complete!</h3>
                <p className="text-sm text-foreground-secondary">
                  Knowledge stabilized ✨
                </p>
              </div>
            </motion.div>

            {/* Confetti */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#6366F1', '#A78BFA', '#C7D2FE'][i % 3],
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 1],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="card-minimal">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary stroke-[1.5]" />
                <h3 className="mb-0">Overall Progress</h3>
              </div>
              <Badge variant="secondary">
                {masteredCount} / {flashcards.length} mastered
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span>{progressPercentage.toFixed(0)}% complete</span>
              <span>{flashcards.length - masteredCount} cards remaining</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-4"
      >
        <p className="section-label">🎯 STUDY MODE</p>

        {/* Mode description */}
        <Card className="card-minimal bg-primary/5 border-primary/20">
          <div className="text-sm">
            {mode === "review" && (
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
                <div>
                  <p className="text-foreground mb-1"><strong>Review Mode</strong></p>
                  <p className="text-xs text-foreground-secondary">
                    Study all flashcards at your own pace. Click to flip and mark cards as mastered.
                  </p>
                </div>
              </div>
            )}
            {mode === "challenge" && (
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
                <div>
                  <p className="text-foreground mb-1"><strong>Challenge Mode</strong></p>
                  <p className="text-xs text-foreground-secondary">
                    Only unmastered cards shown. Beat your time and master difficult concepts!
                    {filteredCards.length === 0 && " 🎉 All cards mastered!"}
                  </p>
                  {filteredCards.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-primary stroke-[1.5]" />
                      <span className="text-xs text-primary">
                        {Math.floor(challengeTimer / 60)}:{(challengeTimer % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs text-foreground-tertiary">·</span>
                      <span className="text-xs text-foreground-secondary">
                        {filteredCards.length} cards to master
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {mode === "quick-recall" && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
                <div>
                  <p className="text-foreground mb-1"><strong>Quick Recall Mode</strong></p>
                  <p className="text-xs text-foreground-secondary">
                    Rapid-fire review! Answer auto-advances after 5 seconds. Test your instant recall speed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant={mode === "review" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("review")}
            className="flex-col h-auto py-3"
          >
            <Eye className="w-4 h-4 mb-1 stroke-[1.5]" />
            <span className="text-xs">Review</span>
          </Button>
          <Button
            variant={mode === "challenge" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("challenge")}
            className="flex-col h-auto py-3"
          >
            <Zap className="w-4 h-4 mb-1 stroke-[1.5]" />
            <span className="text-xs">Challenge</span>
          </Button>
          <Button
            variant={mode === "quick-recall" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("quick-recall")}
            className="flex-col h-auto py-3"
          >
            <Clock className="w-4 h-4 mb-1 stroke-[1.5]" />
            <span className="text-xs">Quick Recall</span>
          </Button>
        </div>
      </motion.div>

      {/* Flashcard Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="section-label">📚 FLASHCARDS</p>
          <span className="text-xs text-foreground-secondary">
            {filteredCards.length > 0 ? `${currentIndex + 1} / ${filteredCards.length}` : "0 / 0"}
          </span>
        </div>

        {filteredCards.length === 0 ? (
          <Card className="card-minimal text-center py-12">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4 stroke-[1.5]" />
            <h4 className="mb-2 text-foreground">All Cards Mastered! 🎉</h4>
            <p className="text-sm text-foreground-secondary mb-4">
              You've mastered all flashcards in this mode. Try another mode or generate new cards!
            </p>
            <Button onClick={() => handleModeChange("review")} variant="outline">
              Switch to Review Mode
            </Button>
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="card-minimal cursor-pointer min-h-[300px] flex flex-col"
                onClick={handleFlip}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {currentCard.concept}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getDifficultyColor(currentCard.difficulty)}`}>
                        {currentCard.difficulty}
                      </Badge>
                      {currentCard.mastered && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1 stroke-[1.5]" />
                          Mastered
                        </Badge>
                      )}
                    </div>
                  </div>
                  <RotateCcw className="w-4 h-4 text-foreground-tertiary stroke-[1.5]" />
                </div>

                {/* Card content */}
                <div className="flex-1 flex items-center justify-center py-8">
                  <AnimatePresence mode="wait">
                    {!showAnswer ? (
                      <motion.div
                        key="question"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-center px-6"
                      >
                        <p className="text-lg text-foreground leading-relaxed">
                          {currentCard.question}
                        </p>
                        <p className="text-xs text-foreground-tertiary mt-6">
                          Tap to reveal answer
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-center px-6 w-full"
                      >
                        {mode === "quick-recall" && (
                          <div className="mb-3 flex items-center justify-center gap-2 text-xs text-primary">
                            <Clock className="w-3 h-3 stroke-[1.5] animate-pulse" />
                            <span>Auto-advancing in 5s...</span>
                          </div>
                        )}
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                            {currentCard.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation hint */}
                {!showAnswer && (
                  <div className="flex items-center justify-center gap-2 text-xs text-foreground-tertiary">
                    <ChevronLeft className="w-3 h-3 stroke-[1.5]" />
                    <span>Previous</span>
                    <span className="mx-2">•</span>
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3 stroke-[1.5]" />
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Action buttons */}
        {filteredCards.length > 0 && (
        <div className="space-y-3">
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleMastered(false)}
              >
                <X className="w-4 h-4 mr-2 stroke-[1.5]" />
                Review Again
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleMastered(true)}
              >
                <Check className="w-4 h-4 mr-2 stroke-[1.5]" />
                Got It!
              </Button>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2 stroke-[1.5]" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2 stroke-[1.5]" />
            </Button>
          </div>
        </div>
        )}
      </motion.div>

      {/* Constellations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="space-y-6"
      >
        <p className="section-label">⭐ PROGRESS CONSTELLATIONS</p>

        <div className="space-y-4">
          {mockConstellations.map((constellation, index) => (
            <motion.div
              key={constellation.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className={`card-minimal ${constellation.completed ? 'border-primary bg-primary/5' : ''}`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="mb-1 text-foreground">
                        {constellation.name}
                      </h4>
                      <p className="text-xs text-foreground-secondary">
                        {constellation.concept}
                      </p>
                    </div>
                    {constellation.completed && (
                      <Trophy className="w-5 h-5 text-primary stroke-[1.5]" />
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: constellation.stars }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 + i * 0.05 }}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            i < constellation.starsCompleted
                              ? 'fill-primary text-primary'
                              : 'text-border'
                          }`}
                          style={{
                            filter: i < constellation.starsCompleted 
                              ? 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' 
                              : 'none',
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <Progress 
                    value={(constellation.starsCompleted / constellation.stars) * 100} 
                    className="h-1.5"
                  />

                  <p className="text-xs text-foreground-secondary">
                    {constellation.starsCompleted} / {constellation.stars} concepts mastered
                    {constellation.completed && (
                      <span className="text-primary ml-2">— Knowledge stabilized ✨</span>
                    )}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Smart Revision Generator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="space-y-4"
      >
        <p className="section-label">✨ SMART REVISION</p>

        <Card className="card-minimal bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 stroke-[1.5] flex-shrink-0" />
            <div className="flex-1">
              <h4 className="mb-1 text-foreground">
                Generate AI Flashcards from Weak Areas
              </h4>
              <p className="text-sm text-foreground-secondary">
                Automatically create flashcards targeting your mistakes and struggles
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Show weak areas */}
          <div className="space-y-3 mb-4">
            <p className="text-xs text-foreground-tertiary uppercase tracking-wider">
              Areas Needing Practice
            </p>
            {studentWeakAreas.map((area, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between text-sm bg-white/60 rounded-lg p-3 border border-border/50"
              >
                <div className="flex-1">
                  <p className="text-foreground mb-0.5">{area.topic}</p>
                  <p className="text-xs text-foreground-secondary">
                    {area.mistakes} mistakes · Last: {area.lastAttempt}
                  </p>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                  {area.mistakes} errors
                </Badge>
              </div>
            ))}
          </div>

          <Button 
            className="w-full"
            onClick={generateFlashcardsFromMistakes}
            disabled={isGeneratingCards}
          >
            {isGeneratingCards ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 stroke-[1.5] animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 stroke-[1.5]" />
                Generate 5 Targeted Flashcards
              </>
            )}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
