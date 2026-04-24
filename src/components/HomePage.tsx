import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { BookOpen, ChevronRight, Calendar, Clock, TrendingUp, Target, ArrowUpRight, Zap, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

// Inspirational quotes that rotate every minute
const inspirationalQuotes = [
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentStudent, getUpcomingClasses, loading } = useData();
  const upcomingClasses = getUpcomingClasses(currentStudent?.id);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quote every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % inspirationalQuotes.length);
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-marquis-grey" style={{ fontFamily: 'Neurial Grotesk, sans-serif' }}>Loading...</p>
      </div>
    );
  }

  // Quiz results data - Marquis Brand Compliant
  const quizResults = [
    {
      id: 1,
      subject: 'Mathematics',
      average: 88,
      subjects: [
        { name: 'Algebra', progress: 95, icon: '📐' },
        { name: 'Geometry', progress: 85, icon: '📊' },
        { name: 'Calculus', progress: 82, icon: '🔢' },
      ]
    },
    {
      id: 2,
      subject: 'English',
      average: 92,
      subjects: [
        { name: 'Grammar', progress: 90, icon: '📝' },
        { name: 'Reading', progress: 95, icon: '📖' },
        { name: 'Writing', progress: 88, icon: '✍️' },
      ]
    },
  ];

  const currentQuiz = quizResults[activeQuizIndex];

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Warm Yellow Vignette at Top */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at top right, rgba(255,213,0,0.25), transparent 60%)',
          height: '50%'
        }}
      />

      {/* Welcome Section */}
      <div className="p-6 pt-8 pb-6 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1
  className="mt-0 mb-2"
  style={{
    fontFamily: 'Neurial Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '28px',
    color: '#000000',
    lineHeight: '1.2',
  }}
>
  Hey {currentStudent?.name?.split(' ')[0] || 'there'}! 👋
</h1>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <p 
                    className="mt-0 mb-1" 
                    style={{ 
                      fontFamily: 'Neurial Grotesk, sans-serif', 
                      fontSize: '14px',
                      color: '#6E6E70',
                      fontStyle: 'italic',
                      lineHeight: '1.4'
                    }}
                  >
                    "{inspirationalQuotes[currentQuoteIndex].text}"
                  </p>
                  <p 
                    className="mt-0 mb-0" 
                    style={{ 
                      fontFamily: 'Neurial Grotesk, sans-serif', 
                      fontSize: '13px',
                      color: '#999',
                      fontWeight: 600
                    }}
                  >
                    — {inspirationalQuotes[currentQuoteIndex].author}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Momentum Streak Badge */}
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: '#FFD500',
                  boxShadow: '0px 8px 16px rgba(255,213,0,0.3)'
                }}
              >
                <Zap className="w-8 h-8" style={{ color: '#000000', strokeWidth: 2.5 }} />
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#000000', color: '#FFD500', fontSize: '11px', fontWeight: 700 }}
                >
                  5
                </div>
              </div>
              <p 
                className="mt-2 text-xs text-center" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  fontWeight: 600,
                  color: '#6E6E70'
                }}
              >
                Day Streak
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 space-y-6 relative">
        {/* Weekly Test Overview - Grey Background Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl"
          style={{ background: '#FAFAFA' }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 
                className="mb-1 flex items-center gap-2" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '22px',
                  color: '#000000'
                }}
              >
                Weekly Performance
                <ArrowUpRight className="w-5 h-5" style={{ color: '#FFD500' }} />
              </h2>
              <p 
                className="text-sm" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  color: '#6E6E70'
                }}
              >
                Your latest results
              </p>
            </div>
            <div className="flex gap-1.5">
              {quizResults.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveQuizIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeQuizIndex ? 'w-8' : 'w-1.5'
                  }`}
                  style={{ 
                    background: index === activeQuizIndex ? '#FFD500' : '#E6E6E6'
                  }}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuizIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="border-0 p-6"
                style={{ 
                  borderRadius: '20px',
                  boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.06)',
                  background: '#FFFFFF'
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 
                      className="mb-1 flex items-center gap-2" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        fontWeight: 700,
                        fontSize: '20px',
                        color: '#000000'
                      }}
                    >
                      {currentQuiz.subject}
                      <span style={{ fontSize: '18px' }}>
                        {currentQuiz.subject.includes('Math') ? '📐' : '📚'}
                      </span>
                    </h3>
                    <p 
                      className="text-sm" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        color: '#6E6E70'
                      }}
                    >
                      Year {currentStudent?.year || '10'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Score Circle with Shadow */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="absolute inset-0 rounded-full" 
                      style={{ 
                        background: '#FFD500',
                        filter: 'blur(12px)',
                        opacity: 0.3,
                        transform: 'scale(0.9)'
                      }}
                    />
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90">
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#E8E8E8" 
                          strokeWidth="6" 
                          fill="none" 
                        />
                        <circle
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#FFD500" 
                          strokeWidth="6" 
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - currentQuiz.average / 100)}`}
                          strokeLinecap="round"
                          style={{ 
                            filter: 'drop-shadow(0px 2px 4px rgba(255,213,0,0.3))'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span 
                          style={{ 
                            fontFamily: 'Neurial Grotesk, sans-serif',
                            fontWeight: 700,
                            fontSize: '26px',
                            color: '#000000'
                          }}
                        >
                          {currentQuiz.average}%
                        </span>
                        <span 
                          className="text-xs" 
                          style={{ 
                            fontFamily: 'Neurial Grotesk, sans-serif',
                            color: '#6E6E70',
                            marginTop: '-2px'
                          }}
                        >
                          Average
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Progress Bars */}
                  <div className="flex-1 space-y-4">
                    {currentQuiz.subjects.map((subject, index) => (
                      <motion.div
                        key={subject.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p 
                            className="text-sm flex items-center gap-1.5" 
                            style={{ 
                              fontFamily: 'Neurial Grotesk, sans-serif',
                              fontWeight: 600,
                              color: '#000000'
                            }}
                          >
                            <span>{subject.icon}</span>
                            {subject.name}
                          </p>
                          <p 
                            className="text-sm" 
                            style={{ 
                              fontFamily: 'Neurial Grotesk, sans-serif',
                              fontWeight: 700,
                              color: subject.progress >= 90 ? '#FFD500' : '#6E6E70'
                            }}
                          >
                            {subject.progress}%
                          </p>
                        </div>
                        <div 
                          className="h-2.5 rounded-full overflow-hidden"
                          style={{ background: '#E8E8E8' }}
                        >
                          <motion.div 
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.progress}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                            style={{ 
                              background: subject.progress >= 90 ? '#FFD500' : '#000000'
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Next Class - Grey Background Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl"
          style={{ background: '#FAFAFA' }}
        >
          <div className="mb-5">
            <h2 
              className="mb-1 flex items-center gap-2" 
              style={{ 
                fontFamily: 'Neurial Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '22px',
                color: '#000000'
              }}
            >
              Coming Up Next
              <Clock className="w-5 h-5" style={{ color: '#FFD500' }} />
            </h2>
            <p 
              className="text-sm" 
              style={{ 
                fontFamily: 'Neurial Grotesk, sans-serif',
                color: '#6E6E70'
              }}
            >
              Your next session
            </p>
          </div>

          {upcomingClasses.length > 0 ? (
            <motion.div
              onClick={() => onNavigate("bookings")}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="border-0 p-5 overflow-hidden"
                style={{ 
                  borderRadius: '20px',
                  boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.06)',
                  background: upcomingClasses[0].subject.includes('Mathematics') 
                    ? 'linear-gradient(135deg, #FFD500 0%, #FFC700 100%)'
                    : '#000000'
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: upcomingClasses[0].subject.includes('Mathematics') 
                        ? 'rgba(0,0,0,0.1)' 
                        : 'rgba(255,213,0,0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <BookOpen 
                      className="w-7 h-7" 
                      style={{ 
                        color: upcomingClasses[0].subject.includes('Mathematics') ? '#000000' : '#FFD500',
                        strokeWidth: 2.5 
                      }} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="mb-1" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        fontWeight: 700,
                        fontSize: '18px',
                        color: upcomingClasses[0].subject.includes('Mathematics') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {upcomingClasses[0].subject}
                    </h3>
                    <p 
                      className="text-sm" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        color: upcomingClasses[0].subject.includes('Mathematics') 
                          ? 'rgba(0,0,0,0.7)' 
                          : 'rgba(255,255,255,0.8)'
                      }}
                    >
                      {upcomingClasses[0].dayOfWeek} • {upcomingClasses[0].time}
                    </p>
                  </div>
                  <ChevronRight 
                    className="w-6 h-6" 
                    style={{ 
                      color: upcomingClasses[0].subject.includes('Mathematics') 
                        ? 'rgba(0,0,0,0.4)' 
                        : 'rgba(255,255,255,0.6)'
                    }} 
                  />
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              onClick={() => onNavigate('bookings')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="border border-marquis-border p-6"
                style={{ 
                  borderRadius: '20px',
                  boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.06)',
                  background: '#FFFFFF'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className="mb-2 flex items-center gap-2" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#000000'
                      }}
                    >
                      Book Your First Class
                      <ArrowUpRight className="w-5 h-5" style={{ color: '#FFD500' }} />
                    </h3>
                    <p 
                      className="text-sm mb-4" 
                      style={{ 
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        color: '#6E6E70'
                      }}
                    >
                      Let's get you started!
                    </p>
                    <Button 
                      className="rounded-xl border-0"
                      style={{ 
                        background: '#FFD500',
                        color: '#000000',
                        fontFamily: 'Neurial Grotesk, sans-serif',
                        fontWeight: 700,
                        padding: '12px 24px',
                        boxShadow: '0px 8px 16px rgba(255,213,0,0.3)'
                      }}
                    >
                      View Schedule
                    </Button>
                  </div>
                  <Calendar className="w-16 h-16" style={{ color: '#FFD500', opacity: 0.3 }} />
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onNavigate('study')}
            className="cursor-pointer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className="border-0 p-5 text-center overflow-hidden relative"
              style={{ 
                borderRadius: '20px',
                boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.06)',
                background: '#FFFFFF'
              }}
            >
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-full"
                style={{ 
                  background: 'rgba(255,213,0,0.1)',
                  transform: 'translate(30%, -30%)'
                }}
              />
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
                style={{ 
                  background: '#000000',
                  boxShadow: '0px 8px 16px rgba(0,0,0,0.15)'
                }}
              >
                <Target className="w-7 h-7" style={{ color: '#FFD500', strokeWidth: 2.5 }} />
              </div>
              <h4 
                className="mb-1" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#000000'
                }}
              >
                Study Tools
              </h4>
              <p 
                className="text-xs" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  color: '#6E6E70'
                }}
              >
                Flashcards & Quizzes
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onNavigate('progress')}
            className="cursor-pointer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className="border-0 p-5 text-center overflow-hidden relative"
              style={{ 
                borderRadius: '20px',
                boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.06)',
                background: '#FFFFFF'
              }}
            >
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-full"
                style={{ 
                  background: 'rgba(255,213,0,0.1)',
                  transform: 'translate(30%, -30%)'
                }}
              />
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
                style={{ 
                  background: '#FFD500',
                  boxShadow: '0px 8px 16px rgba(255,213,0,0.3)'
                }}
              >
                <TrendingUp className="w-7 h-7" style={{ color: '#000000', strokeWidth: 2.5 }} />
              </div>
              <h4 
                className="mb-1" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#000000'
                }}
              >
                My Progress
              </h4>
              <p 
                className="text-xs" 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  color: '#6E6E70'
                }}
              >
                Track achievements
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}