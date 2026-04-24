import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Brain, Sparkles, TrendingUp, Target, Clock, 
  CheckCircle, XCircle, ArrowRight, RotateCcw, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { questionBank, Question } from '../data/questionBank';
import { 
  generateAdaptiveQuiz, 
  selectNextQuestion,
  updateSpacedRepetition,
  predictPerformance,
  calculateAbilityLevel,
  StudentAttempt 
} from '../lib/adaptiveLearning';
import { buildMockStudentProfile, mockSpacedRepData } from '../data/mockStudentData';
import { toast } from 'sonner';

interface QuizQuestion extends Question {
  userAnswer: string;
  timeStarted: Date;
  timeSpent?: number;
  prediction?: {
    predictedAccuracy: number;
    confidence: number;
    reasoning: string;
  };
}

export function AdaptiveQuizPage() {
  const [studentProfile, setStudentProfile] = useState(buildMockStudentProfile());
  const [spacedRepData, setSpacedRepData] = useState(mockSpacedRepData);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPrediction, setShowPrediction] = useState(true);
  
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const [quizLength, setQuizLength] = useState(5);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const startAdaptiveQuiz = () => {
    const selectedQuestions = generateAdaptiveQuiz(
      questionBank,
      studentProfile,
      spacedRepData,
      {
        length: quizLength,
        focusTopic: selectedTopic,
        targetWeakAreas: true
      }
    );

    const quizQs: QuizQuestion[] = selectedQuestions.map(q => {
      const prediction = predictPerformance(q, studentProfile);
      return {
        ...q,
        userAnswer: '',
        timeStarted: new Date(),
        prediction
      };
    });

    setQuizQuestions(quizQs);
    setCurrentQuestionIndex(0);
    setIsQuizActive(true);
    setShowResults(false);
    
    toast.success('Adaptive quiz generated based on your learning profile!');
  };

  const answerQuestion = (answer: string) => {
    if (!currentQuestion) return;

    const updatedQuestions = [...quizQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      timeSpent: Math.floor((new Date().getTime() - currentQuestion.timeStarted.getTime()) / 1000)
    };
    setQuizQuestions(updatedQuestions);
  };

  const nextQuestion = () => {
    if (!currentQuestion.userAnswer) {
      toast.error('Please select an answer before continuing');
      return;
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    // Update student profile with new attempts
    const newAttempts: StudentAttempt[] = quizQuestions.map(q => ({
      questionId: q.id,
      studentId: studentProfile.studentId,
      isCorrect: q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
      timeSpent: q.timeSpent || 0,
      attemptDate: new Date(),
      difficulty: q.difficulty,
      topicId: q.curriculumTopicId
    }));

    // Update spaced repetition data
    const newSpacedRepData = new Map(spacedRepData);
    quizQuestions.forEach(q => {
      const isCorrect = q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      const updated = updateSpacedRepetition(
        q.id,
        isCorrect,
        spacedRepData.get(q.id)
      );
      newSpacedRepData.set(q.id, updated);
    });

    setSpacedRepData(newSpacedRepData);

    // Recalculate ability level
    const allAttempts = [...studentProfile.attempts, ...newAttempts];
    const newAbilityLevel = calculateAbilityLevel(allAttempts);

    setStudentProfile({
      ...studentProfile,
      attempts: allAttempts,
      abilityLevel: newAbilityLevel
    });

    setShowResults(true);
    setIsQuizActive(false);
  };

  const calculateScore = () => {
    const correct = quizQuestions.filter(
      q => q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
    ).length;
    return {
      correct,
      total: quizQuestions.length,
      percentage: Math.round((correct / quizQuestions.length) * 100)
    };
  };

  const resetQuiz = () => {
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setIsQuizActive(false);
    setShowResults(false);
  };

  if (showResults) {
    const score = calculateScore();
    const improvedAbility = studentProfile.abilityLevel > 0;

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 bg-white text-center" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div className="mb-6">
                {score.percentage >= 70 ? (
                  <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                ) : (
                  <Target size={64} className="mx-auto text-orange-600 mb-4" />
                )}
                
                <h2 className="text-neutral-900 mb-2">Quiz Complete!</h2>
                <p className="text-neutral-600">Here's how you performed</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-neutral-500 mb-2">Score</div>
                  <div className="text-neutral-900">{score.correct} / {score.total}</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-2">Accuracy</div>
                  <div className="text-neutral-900">{score.percentage}%</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-2">Ability Level</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-neutral-900">
                      {studentProfile.abilityLevel > 0 ? '+' : ''}{studentProfile.abilityLevel.toFixed(1)}
                    </div>
                    {improvedAbility && (
                      <TrendingUp size={16} className="text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* AI Insights */}
              <div className="bg-indigo-50 p-6 rounded-xl mb-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={20} style={{ color: '#6366F1' }} />
                  <span className="text-neutral-900">AI Learning Insights</span>
                </div>
                
                <div className="space-y-3">
                  {quizQuestions.map((q, idx) => {
                    const isCorrect = q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                    const prediction = q.prediction;
                    
                    return (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        {isCorrect ? (
                          <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-neutral-700">{q.question}</div>
                          {prediction && (
                            <div className="text-neutral-500 mt-1">
                              Predicted: {Math.round(prediction.predictedAccuracy * 100)}% accuracy
                              {' · '}
                              {prediction.reasoning}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white border border-neutral-200 p-6 rounded-xl mb-6 text-left">
                <h4 className="text-neutral-900 mb-4">Recommended Next Steps</h4>
                <div className="space-y-2">
                  {score.percentage < 70 && (
                    <div className="flex items-start gap-2 text-neutral-600">
                      <Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                      <span>Review these topics with flashcards for better retention</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-neutral-600">
                    <Clock size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                    <span>Questions will reappear based on spaced repetition in {Math.min(...Array.from(spacedRepData.values()).map(d => d.interval))} days</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-600">
                    <TrendingUp size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                    <span>Your ability level has been updated for more personalized questions</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={resetQuiz}
                style={{ backgroundColor: '#6366F1' }}
                className="text-white w-full"
              >
                <RotateCcw size={20} className="mr-2" />
                Start New Quiz
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isQuizActive && currentQuestion) {
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-8 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-600">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </span>
                  <Badge 
                    variant="outline"
                    className={
                      currentQuestion.difficulty === 'hard' ? 'border-red-300 text-red-700 bg-red-50' :
                      currentQuestion.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                      'border-green-300 text-green-700 bg-green-50'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* AI Prediction (can be toggled) */}
              {showPrediction && currentQuestion.prediction && (
                <div className="bg-indigo-50 p-4 rounded-xl mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain size={18} style={{ color: '#6366F1' }} />
                      <span className="text-neutral-900">AI Prediction</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrediction(false)}
                      className="h-6 p-0 px-2"
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                  <div className="text-neutral-600">
                    Expected accuracy: <strong>{Math.round(currentQuestion.prediction.predictedAccuracy * 100)}%</strong>
                    {' · '}
                    {currentQuestion.prediction.reasoning}
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-neutral-900 mb-6">{currentQuestion.question}</h3>

                {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
                  <RadioGroup value={currentQuestion.userAnswer} onValueChange={answerQuestion}>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
                          onClick={() => answerQuestion(option)}
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-neutral-700">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Input
                    value={currentQuestion.userAnswer}
                    onChange={(e) => answerQuestion(e.target.value)}
                    placeholder="Type your answer..."
                    className="text-lg"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetQuiz}
                >
                  Exit Quiz
                </Button>
                <Button
                  onClick={nextQuestion}
                  style={{ backgroundColor: '#6366F1' }}
                  className="text-white"
                  disabled={!currentQuestion.userAnswer}
                >
                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <>Next Question <ArrowRight size={20} className="ml-2" /></>
                  ) : (
                    <>Finish Quiz <CheckCircle size={20} className="ml-2" /></>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz Setup Screen
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-neutral-900 mb-2">Adaptive AI Quiz</h1>
          <p className="text-neutral-600">Questions personalized to your learning profile</p>
        </div>

        {/* Student Profile Overview */}
        <Card className="p-6 bg-white mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Brain size={24} style={{ color: '#6366F1' }} />
            <h3 className="text-neutral-900">Your Learning Profile</h3>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-neutral-500 mb-2">Ability Level</div>
              <div className="text-neutral-900">
                {studentProfile.abilityLevel > 0 ? '+' : ''}{studentProfile.abilityLevel.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 mb-2">Total Attempts</div>
              <div className="text-neutral-900">{studentProfile.attempts.length}</div>
            </div>
            <div>
              <div className="text-neutral-500 mb-2">Weak Areas</div>
              <div className="text-neutral-900">{studentProfile.weakAreas.length}</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <div className="text-neutral-700 mb-3">Topic Mastery</div>
            <div className="space-y-3">
              {Array.from(studentProfile.topicMastery.entries()).map(([topic, mastery]) => (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600">{topic}</span>
                    <span className="text-neutral-900">{Math.round(mastery * 100)}%</span>
                  </div>
                  <Progress value={mastery * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quiz Configuration */}
        <Card className="p-6 bg-white mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3 className="text-neutral-900 mb-6">Configure Quiz</h3>

          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Number of Questions: {quizLength}</Label>
              <input
                type="range"
                min="3"
                max="10"
                value={quizLength}
                onChange={(e) => setQuizLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-neutral-500 mt-2">
                <span>3</span>
                <span>10</span>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Sparkles size={20} style={{ color: '#6366F1' }} className="mt-0.5 flex-shrink-0" />
                <div className="text-neutral-700">
                  <strong>Adaptive Features:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-600">
                    <li>Questions matched to your current ability level</li>
                    <li>Focus on your weak areas (Geometry, Quadratics)</li>
                    <li>Spaced repetition for optimal memory retention</li>
                    <li>Difficulty adjusts based on your performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={startAdaptiveQuiz}
          style={{ backgroundColor: '#6366F1' }}
          className="text-white w-full"
          size="lg"
        >
          <Brain size={20} className="mr-2" />
          Generate Adaptive Quiz
        </Button>
      </div>
    </div>
  );
}
