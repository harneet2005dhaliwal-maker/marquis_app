import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Calendar, 
  Clock, 
  Flame,
  Award,
  BookOpen,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  CheckCircle2,
  Target,
  Lightbulb,
  Brain,
  Heart,
  Star,
  Bell,
  Megaphone,
  AlertCircle
} from "lucide-react";

interface SubjectData {
  subject: string;
  grade: number;
  trend: "up" | "down" | "stable";
  nextClass: string;
  recentTopic: string;
  tutorNote: string;
  tutor: string;
  weeklyProgress: number;
  areasOfConcern: string[];
  strengths: string[];
  attendance: number;
  homeworkCompletion: number;
}

interface ParentDashboardPageProps {
  onNavigateToReports: () => void;
}

export function ParentDashboardPage({ onNavigateToReports }: ParentDashboardPageProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const subjects: SubjectData[] = [
    {
      subject: "Mathematics",
      grade: 85,
      trend: "up",
      nextClass: "Thu, 4:00 PM",
      recentTopic: "Quadratic Equations",
      tutorNote: "Alex has shown excellent improvement in problem-solving speed. Keep up the great work!",
      tutor: "Araf",
      weeklyProgress: 78,
      areasOfConcern: ["Complex word problems", "Test time management"],
      strengths: ["Quick calculations", "Algebra fundamentals"],
      attendance: 100,
      homeworkCompletion: 95,
    },
    {
      subject: "English",
      grade: 92,
      trend: "stable",
      nextClass: "Tue, 3:30 PM",
      recentTopic: "Essay Writing Techniques",
      tutorNote: "Strong analytical skills. Encouraging more creative expression in writing.",
      tutor: "Zara",
      weeklyProgress: 88,
      areasOfConcern: ["Creative expression"],
      strengths: ["Critical analysis", "Grammar"],
      attendance: 100,
      homeworkCompletion: 100,
    },
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #FFFDF6 0%, #FEF9E2 100%)",
        position: "relative",
        paddingTop: "0px",
        paddingBottom: "0px",
      }}
    >
      {/* Decorative Background Icons */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <BookOpen 
          style={{ 
            position: "absolute", 
            top: "10%", 
            right: "5%", 
            width: "120px", 
            height: "120px", 
            color: "#F8D548", 
            opacity: 0.04,
            transform: "rotate(-15deg)"
          }} 
        />
        <Award 
          style={{ 
            position: "absolute", 
            bottom: "20%", 
            left: "8%", 
            width: "100px", 
            height: "100px", 
            color: "#F8D548", 
            opacity: 0.03,
            transform: "rotate(12deg)"
          }} 
        />
        <Sparkles 
          style={{ 
            position: "absolute", 
            top: "50%", 
            right: "10%", 
            width: "80px", 
            height: "80px", 
            color: "#F8D548", 
            opacity: 0.05,
          }} 
        />
      </div>

      <div 
        className="px-6 max-w-md mx-auto space-y-8"
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: "88px", // Space for header
          paddingBottom: "88px", // Space for bottom nav
        }}
      >
        
        {/* Welcome Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-5"
        >
          <div>
            <h1
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "36px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              Hi Mrs. Johnson 👋
            </h1>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "17px",
                fontWeight: 400,
                color: "#666666",
                lineHeight: "1.5",
              }}
            >
              Here's Alex's progress this week — summarised clearly for you.
            </p>
          </div>

          {/* Student Profile Card */}
          <div
            className="p-5 rounded-3xl relative overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* Subtle gold glow behind avatar */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                width: "60px",
                height: "60px",
                background: "radial-gradient(circle, rgba(248, 213, 72, 0.2) 0%, rgba(248, 213, 72, 0) 70%)",
                borderRadius: "50%",
                filter: "blur(10px)",
              }}
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{
                    background: "linear-gradient(135deg, #F8D548 0%, #FFD84D 100%)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#000000",
                    }}
                  >
                    AJ
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#000000",
                      marginBottom: "2px",
                      borderBottom: "2px solid #F8D548",
                      paddingBottom: "2px",
                      display: "inline-block",
                    }}
                  >
                    Alex Johnson
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#666666",
                      marginTop: "4px",
                    }}
                  >
                    Year 10 Student
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  borderRadius: "12px",
                  border: "1.5px solid #000000",
                  background: "transparent",
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#000000",
                  padding: "10px 16px",
                  transition: "all 0.2s ease",
                }}
                onClick={onNavigateToReports}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F8D548";
                  e.currentTarget.style.borderColor = "#F8D548";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#000000";
                }}
              >
                View Report
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 mt-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#35A853",
                  boxShadow: "0 0 8px rgba(53, 168, 83, 0.4)",
                }}
              />
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#666666",
                }}
              >
                Last updated today, 4:00 PM
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Snapshot - Pill Capsules Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Attendance Capsule */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "#EAF7EC",
              border: "1px solid rgba(53, 168, 83, 0.15)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(53, 168, 83, 0.12)",
                }}
              >
                <Calendar className="w-5 h-5" style={{ color: "#35A853", strokeWidth: 2.5 }} />
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "2px",
                letterSpacing: "-0.02em",
              }}
            >
              96%
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666666",
                marginBottom: "6px",
              }}
            >
              Attendance
            </p>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "#35A853" }} />
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#35A853",
                }}
              >
                +2% this week
              </p>
            </div>
          </div>

          {/* Study Hours Capsule */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "#EDF4FF",
              border: "1px solid rgba(79, 128, 255, 0.15)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(79, 128, 255, 0.12)",
                }}
              >
                <Clock className="w-5 h-5" style={{ color: "#4F80FF", strokeWidth: 2.5 }} />
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "2px",
                letterSpacing: "-0.02em",
              }}
            >
              42h
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666666",
                marginBottom: "6px",
              }}
            >
              Study Hours
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#666666",
              }}
            >
              This month
            </p>
          </div>

          {/* Streak Capsule */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "#FFF3E5",
              border: "1px solid rgba(255, 152, 0, 0.15)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255, 152, 0, 0.12)",
                }}
              >
                <Flame className="w-5 h-5" style={{ color: "#FF9800", strokeWidth: 2.5 }} />
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "2px",
                letterSpacing: "-0.02em",
              }}
            >
              12
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666666",
                marginBottom: "6px",
              }}
            >
              Days Streak
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#FF9800",
              }}
            >
              Personal best! 🔥
            </p>
          </div>

          {/* Performance Capsule */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "#F6EEFF",
              border: "1px solid rgba(156, 39, 176, 0.15)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(156, 39, 176, 0.12)",
                }}
              >
                <Award className="w-5 h-5" style={{ color: "#9C27B0", strokeWidth: 2.5 }} />
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "2px",
                letterSpacing: "-0.02em",
              }}
            >
              85%
            </p>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666666",
                marginBottom: "6px",
              }}
            >
              Performance
            </p>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "#9C27B0" }} />
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#9C27B0",
                }}
              >
                +8% this month
              </p>
            </div>
          </div>
        </motion.div>

        {/* Highlight Banner Strip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className="p-5 rounded-2xl flex items-start gap-4"
            style={{
              background: "#FFF7D4",
              border: "1px solid rgba(248, 213, 72, 0.3)",
              boxShadow: "0 2px 8px rgba(248, 213, 72, 0.08)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#F8D548",
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "#000000", strokeWidth: 2.5 }} />
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                color: "#000000",
                lineHeight: "1.6",
              }}
            >
              ⭐ Alex focuses best on <strong>Wednesdays</strong> — 92% engagement.
            </p>
          </div>
        </motion.div>

        {/* AI INSIGHTS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                }}
              >
                <Brain className="w-5 h-5" style={{ color: "#FFFFFF", strokeWidth: 2.5 }} />
              </div>
              <h2
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#000000",
                  letterSpacing: "-0.01em",
                }}
              >
                AI Insights
              </h2>
            </div>
            <div
              className="px-3 py-1 rounded-full"
              style={{
                background: "rgba(102, 126, 234, 0.1)",
              }}
            >
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#667EEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Personalized
              </p>
            </div>
          </div>

          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#666666",
              lineHeight: "1.5",
            }}
          >
            Based on Alex's progress this week, here's how you can best support their learning at home.
          </p>

          {/* Insight Cards */}
          <div className="space-y-3">
            {/* Insight 1 - Strengths */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-5 rounded-2xl"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E8E8E8",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                  }}
                >
                  <Star className="w-6 h-6" style={{ color: "#FFFFFF", strokeWidth: 2.5 }} />
                </div>
                <div className="flex-1">
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#000000",
                      marginBottom: "8px",
                    }}
                  >
                    Celebrating Strengths
                  </h3>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "#444444",
                      lineHeight: "1.6",
                      marginBottom: "12px",
                    }}
                  >
                    Alex is excelling in <strong>analytical thinking</strong> and <strong>problem-solving</strong>. Their mathematics performance has improved 15% this month!
                  </p>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#166534",
                        lineHeight: "1.5",
                      }}
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" style={{ color: "#10B981" }} />
                      <strong>Recommendation:</strong> Encourage Alex to tackle more challenging word problems to build confidence further.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Insight 2 - Focus Area */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-5 rounded-2xl"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E8E8E8",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                  }}
                >
                  <Target className="w-6 h-6" style={{ color: "#FFFFFF", strokeWidth: 2.5 }} />
                </div>
                <div className="flex-1">
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#000000",
                      marginBottom: "8px",
                    }}
                  >
                    Area to Focus On
                  </h3>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "#444444",
                      lineHeight: "1.6",
                      marginBottom: "12px",
                    }}
                  >
                    Alex sometimes rushes through <strong>test time management</strong>, leaving complex questions till the end. This creates unnecessary pressure.
                  </p>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#92400E",
                        lineHeight: "1.5",
                      }}
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" style={{ color: "#F59E0B" }} />
                      <strong>Recommendation:</strong> Practice timed quizzes at home (15-20 min) to build confidence with pacing.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Insight 3 - Learning Style */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-5 rounded-2xl"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E8E8E8",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
                  }}
                >
                  <Heart className="w-6 h-6" style={{ color: "#FFFFFF", strokeWidth: 2.5 }} />
                </div>
                <div className="flex-1">
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#000000",
                      marginBottom: "8px",
                    }}
                  >
                    Learning Style Insight
                  </h3>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "#444444",
                      lineHeight: "1.6",
                      marginBottom: "12px",
                    }}
                  >
                    Alex learns best through <strong>visual examples</strong> and <strong>real-world applications</strong>. Their engagement peaks when concepts connect to everyday scenarios.
                  </p>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "#FDF2F8",
                      border: "1px solid #FBCFE8",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#831843",
                        lineHeight: "1.5",
                      }}
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" style={{ color: "#EC4899" }} />
                      <strong>Recommendation:</strong> Use diagrams, charts, or online videos to reinforce lesson concepts at home.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ANNOUNCEMENTS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "#F8D548",
              }}
            >
              <Megaphone className="w-5 h-5" style={{ color: "#000000", strokeWidth: 2.5 }} />
            </div>
            <h2
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#000000",
                letterSpacing: "-0.01em",
              }}
            >
              Center Announcements
            </h2>
          </div>

          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#666666",
              lineHeight: "1.5",
            }}
          >
            Stay up to date with what's happening at Marquis.
          </p>

          {/* Announcement Cards - Horizontal Scroll */}
          <div 
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Announcement 1 - Important */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="p-5 rounded-2xl flex-shrink-0"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "2px solid #F8D548",
                width: "320px",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#FFF7D4",
                  }}
                >
                  <Bell className="w-5 h-5" style={{ color: "#F8D548", strokeWidth: 2.5 }} />
                </div>
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: "#F8D548",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#000000",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Important
                  </p>
                </div>
              </div>
              <h3
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}
              >
                Holiday Break Schedule
              </h3>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#666666",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                Marquis will be closed from Dec 23 - Jan 5 for the holiday break. Lessons resume on Jan 6, 2025.
              </p>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#999999",
                }}
              >
                Posted 2 days ago
              </p>
            </motion.div>

            {/* Announcement 2 - New Program */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="p-5 rounded-2xl flex-shrink-0"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E8E8E8",
                width: "320px",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#EDF4FF",
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "#4F80FF", strokeWidth: 2.5 }} />
                </div>
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: "#EDF4FF",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#4F80FF",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    New
                  </p>
                </div>
              </div>
              <h3
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}
              >
                Advanced Math Program
              </h3>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#666666",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                New extension program for Year 11-12 students starting Term 1, 2025. Focus on competition-level mathematics.
              </p>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#999999",
                }}
              >
                Posted 5 days ago
              </p>
            </motion.div>

            {/* Announcement 3 - Reminder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="p-5 rounded-2xl flex-shrink-0"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E8E8E8",
                width: "320px",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#FFF3E5",
                  }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: "#FF9800", strokeWidth: 2.5 }} />
                </div>
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: "#FFF3E5",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#FF9800",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Reminder
                  </p>
                </div>
              </div>
              <h3
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}
              >
                Parent-Teacher Conferences
              </h3>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#666666",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                Book your 15-minute conference slot for Term 4 review. Available dates: Dec 15-20. Contact admin to schedule.
              </p>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#999999",
                }}
              >
                Posted 1 week ago
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Key Highlights - Horizontal Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "-0.01em",
            }}
          >
            Key Highlights
          </h2>

          {/* Mathematics Improvement Bar */}
          <div
            className="p-4 rounded-2xl flex items-center gap-4"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
              borderLeft: "4px solid #DFF3E0",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#DFF3E0",
              }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: "#35A853", strokeWidth: 2.5 }} />
            </div>
            <div className="flex-1">
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                Mathematics
              </p>
              <div className="flex items-center gap-2">
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#666666",
                  }}
                >
                  +15% improvement this month
                </p>
                <ArrowUpRight className="w-4 h-4" style={{ color: "#35A853" }} />
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div
            className="p-4 rounded-2xl flex items-center gap-4"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
              borderLeft: "4px solid #FFEEC0",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#FFEEC0",
              }}
            >
              <Award className="w-6 h-6" style={{ color: "#F8D548", strokeWidth: 2.5 }} />
            </div>
            <div className="flex-1">
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                Overall Progress
              </p>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#666666",
                }}
              >
                Strong & consistent across subjects
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subject Highlights - Interactive Accordions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "-0.01em",
            }}
          >
            Subject Highlights
          </h2>

          <div className="space-y-3">
            {subjects.map((subject, index) => {
              const isExpanded = expandedSubject === subject.subject;
              return (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
                    border: "1px solid #F0F0F0",
                  }}
                >
                  {/* Collapsed State */}
                  <button
                    className="w-full p-5 flex items-center justify-between text-left"
                    onClick={() => setExpandedSubject(isExpanded ? null : subject.subject)}
                    style={{
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = "#FAFAFA";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: subject.subject === "Mathematics" ? "#EDF4FF" : "#FFF3E5",
                        }}
                      >
                        <BookOpen 
                          className="w-6 h-6" 
                          style={{ 
                            color: subject.subject === "Mathematics" ? "#4F80FF" : "#FF9800", 
                            strokeWidth: 2.5 
                          }} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "19px",
                              fontWeight: 600,
                              color: "#000000",
                            }}
                          >
                            {subject.subject}
                          </p>
                          <div
                            className="px-3 py-1 rounded-lg"
                            style={{
                              background: subject.grade >= 90 ? "#DFF3E0" : "#FFF3E5",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#000000",
                              }}
                            >
                              {subject.grade}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {subject.trend === "up" ? (
                            <>
                              <TrendingUp className="w-4 h-4" style={{ color: "#35A853", strokeWidth: 2.5 }} />
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  color: "#35A853",
                                }}
                              >
                                Improving
                              </p>
                            </>
                          ) : (
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#666666",
                              }}
                            >
                              Stable
                            </p>
                          )}
                          <span style={{ color: "#999999", margin: "0 4px" }}>•</span>
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#666666",
                            }}
                          >
                            Next: {subject.nextClass}
                          </p>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: "#666666", strokeWidth: 2.5 }} />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "#666666", strokeWidth: 2.5 }} />
                    )}
                  </button>

                  {/* Expanded State */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div
                          className="px-5 pb-5 space-y-5"
                          style={{
                            borderTop: "1px solid #F0F0F0",
                            paddingTop: "20px",
                          }}
                        >
                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#666666",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Weekly Progress
                              </p>
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#000000",
                                }}
                              >
                                {subject.weeklyProgress}%
                              </p>
                            </div>
                            <div
                              className="w-full h-2 rounded-full overflow-hidden"
                              style={{
                                background: "#F0F0F0",
                              }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.weeklyProgress}%` }}
                                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                                style={{
                                  height: "100%",
                                  background: "linear-gradient(90deg, #F8D548 0%, #FFD84D 100%)",
                                  borderRadius: "9999px",
                                }}
                              />
                            </div>
                          </div>

                          {/* Mini Capsules */}
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              className="p-3 rounded-xl"
                              style={{
                                background: "#F8F8F8",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="w-4 h-4" style={{ color: "#35A853" }} />
                                <p
                                  style={{
                                    fontFamily: "Neurial Grotesk, sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#666666",
                                  }}
                                >
                                  Attendance
                                </p>
                              </div>
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "22px",
                                  fontWeight: 700,
                                  color: "#000000",
                                }}
                              >
                                {subject.attendance}%
                              </p>
                            </div>
                            <div
                              className="p-3 rounded-xl"
                              style={{
                                background: "#F8F8F8",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4" style={{ color: "#4F80FF" }} />
                                <p
                                  style={{
                                    fontFamily: "Neurial Grotesk, sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#666666",
                                  }}
                                >
                                  Homework
                                </p>
                              </div>
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "22px",
                                  fontWeight: 700,
                                  color: "#000000",
                                }}
                              >
                                {subject.homeworkCompletion}%
                              </p>
                            </div>
                          </div>

                          {/* Strengths Pills */}
                          <div>
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#666666",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "10px",
                              }}
                            >
                              Strengths
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {subject.strengths.map((strength) => (
                                <span
                                  key={strength}
                                  className="px-3 py-1.5 rounded-full"
                                  style={{
                                    background: "#DFF3E0",
                                    fontFamily: "Neurial Grotesk, sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#35A853",
                                  }}
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Focus Areas Pills */}
                          <div>
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#666666",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "10px",
                              }}
                            >
                              Focus Areas
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {subject.areasOfConcern.map((area) => (
                                <span
                                  key={area}
                                  className="px-3 py-1.5 rounded-full"
                                  style={{
                                    background: "#FFF3E5",
                                    fontFamily: "Neurial Grotesk, sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#FF9800",
                                  }}
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Tutor Note */}
                          <div
                            className="p-4 rounded-xl"
                            style={{
                              background: "#FAFAFA",
                              border: "1px solid #E5E5E5",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#666666",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "8px",
                              }}
                            >
                              Tutor Note
                            </p>
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "15px",
                                fontWeight: 400,
                                color: "#000000",
                                lineHeight: "1.6",
                                marginBottom: "8px",
                              }}
                            >
                              "{subject.tutorNote}"
                            </p>
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#666666",
                              }}
                            >
                              — {subject.tutor}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}