import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { 
  TrendingUp,
  Award,
  Target,
  Calendar,
  BookOpen,
  FileText,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface SubjectReport {
  subject: string;
  currentGrade: string;
  progress: number;
  trend: "up" | "stable";
  strengths: string[];
  focusAreas: string[];
  attendance: number;
  homeworkCompletion: number;
  parentTips: string[];
}

export function ParentReportsPage() {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const reports: SubjectReport[] = [
    {
      subject: "Mathematics",
      currentGrade: "B+",
      progress: 88,
      trend: "up",
      strengths: ["Problem-solving speed", "Algebraic thinking", "Pattern recognition"],
      focusAreas: ["Complex word problems", "Time management in tests"],
      attendance: 98,
      homeworkCompletion: 95,
      parentTips: [
        "Practice word problems daily - start with 2-3 problems focusing on careful reading",
        "Create a quiet, distraction-free study environment with all necessary materials",
        "Ask 'how did you get that answer?' rather than 'is that correct?' to develop reasoning",
        "Use real-world examples like cooking measurements or budgeting to make math relevant",
        "Celebrate effort and improvement, not just grades - this builds resilience",
      ],
    },
    {
      subject: "English",
      currentGrade: "A-",
      progress: 92,
      trend: "stable",
      strengths: ["Analytical writing", "Literary analysis", "Vocabulary"],
      focusAreas: ["Creative expression"],
      attendance: 100,
      homeworkCompletion: 100,
      parentTips: [
        "Encourage daily reading for pleasure - let Alex choose books that genuinely interest them",
        "Discuss books, movies, or articles together to develop critical thinking",
        "Create opportunities for creative writing - reviews, short stories, or keeping a journal",
        "Praise specific writing improvements: 'That metaphor really brought the scene to life!'",
        "Model reading behavior - let Alex see you reading and engaging with written content",
      ],
    },
  ];

  const overallStats = {
    averageGrade: "B+",
    totalProgress: 79,
    overallAttendance: 98,
    homeworkCompletion: 95,
  };

  return (
    <div 
      className="px-6 py-8 max-w-md mx-auto space-y-6"
      style={{
        background: "#FFFDF5",
      }}
    >
      {/* Progress Overview Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="border p-4"
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Title */}
          <div className="mb-4">
            <h1
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "24px",
                fontWeight: 600,
                color: "#1B1B1B",
                marginBottom: "4px",
              }}
            >
              Progress Report – Alex Johnson
            </h1>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "#5A5A5A",
              }}
            >
              Updated today • 4:00 PM
            </p>
          </div>

          {/* Mini Overview Metrics - 4 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Average Grade */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "#FFF9E6",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4" style={{ color: "#F4C434", strokeWidth: 2 }} />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#5A5A5A",
                  }}
                >
                  Average Grade
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#F4C434",
                }}
              >
                {overallStats.averageGrade}
              </p>
            </div>

            {/* Overall Progress */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "#EAFBEA",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#35A853", strokeWidth: 2 }} />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#5A5A5A",
                  }}
                >
                  Overall Progress
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#35A853",
                }}
              >
                {overallStats.totalProgress}%
              </p>
            </div>

            {/* Attendance */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "#EBF4FF",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: "#4F80FF", strokeWidth: 2 }} />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#5A5A5A",
                  }}
                >
                  Attendance
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#4F80FF",
                }}
              >
                {overallStats.overallAttendance}%
              </p>
            </div>

            {/* Homework */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "#F7EDFF",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: "#9C27B0", strokeWidth: 2 }} />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#5A5A5A",
                  }}
                >
                  Homework
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#9C27B0",
                }}
              >
                {overallStats.homeworkCompletion}%
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Subject Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        <h2
          style={{
            fontFamily: "Neurial Grotesk, sans-serif",
            fontSize: "22px",
            fontWeight: 600,
            color: "#1B1B1B",
          }}
        >
          Subject Breakdown
        </h2>

        {/* Subject Cards */}
        {reports.map((report, index) => (
          <motion.div
            key={report.subject}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <Card
              className="border p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
              }}
            >
              {/* Subject Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "#1B1B1B",
                      marginBottom: "6px",
                    }}
                  >
                    {report.subject}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "#1B1B1B",
                      }}
                    >
                      {report.currentGrade}
                    </p>
                    {report.trend === "up" && (
                      <div
                        className="px-3 py-1 rounded-full"
                        style={{
                          background: "#EAFBEA",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#35A853",
                          }}
                        >
                          Improving
                        </p>
                      </div>
                    )}
                    {report.trend === "stable" && (
                      <div
                        className="px-3 py-1 rounded-full"
                        style={{
                          background: "#F5F5F5",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#5A5A5A",
                          }}
                        >
                          Stable
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setExpandedInsight(expandedInsight === report.subject ? null : report.subject)}
                  variant="outline"
                  className="flex items-center gap-2"
                  style={{
                    borderRadius: "10px",
                    border: "1.5px solid #FFC107",
                    background: expandedInsight === report.subject ? "#FFF9E6" : "transparent",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    color: "#FFC107",
                    padding: "6px 12px",
                  }}
                >
                  <Lightbulb className="w-4 h-4" />
                  Insight
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#5A5A5A",
                    }}
                  >
                    Overall Progress
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1B1B1B",
                    }}
                  >
                    {report.progress}%
                  </p>
                </div>
                <div
                  className="w-full h-2 rounded-md overflow-hidden"
                  style={{
                    background: "#EDEDED",
                  }}
                >
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${report.progress}%`,
                      background: "#F4C434",
                    }}
                  />
                </div>
              </div>

              {/* Attendance + Homework Mini Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Attendance */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "#EAFBEA",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "#35A853", strokeWidth: 2 }} />
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#5A5A5A",
                      }}
                    >
                      Attendance
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#2E8B57",
                    }}
                  >
                    {report.attendance}%
                  </p>
                </div>

                {/* Homework */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "#F7EDFF",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3.5 h-3.5" style={{ color: "#9C27B0", strokeWidth: 2 }} />
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#5A5A5A",
                      }}
                    >
                      Homework
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#9C27B0",
                    }}
                  >
                    {report.homeworkCompletion}%
                  </p>
                </div>
              </div>

              {/* Strengths */}
              <div className="mb-5">
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#5A5A5A",
                    marginBottom: "8px",
                  }}
                >
                  🟡 Strengths
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.strengths.map((strength) => (
                    <div
                      key={strength}
                      className="px-4 py-2 rounded-full"
                      style={{
                        background: "#E9F7EC",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#2E8B57",
                        }}
                      >
                        {strength}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#5A5A5A",
                    marginBottom: "8px",
                  }}
                >
                  🟠 Focus Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.focusAreas.map((area) => (
                    <div
                      key={area}
                      className="px-4 py-2 rounded-full"
                      style={{
                        background: "#FFF4E5",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#E65100",
                        }}
                      >
                        {area}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent Tips - Expandable Section */}
              <AnimatePresence>
                {expandedInsight === report.subject && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 pt-5"
                    style={{
                      borderTop: "1px solid #E5E5E5",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "#FFF9E6",
                        }}
                      >
                        <Lightbulb className="w-5 h-5" style={{ color: "#FFC107", strokeWidth: 2 }} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1B1B1B",
                            marginBottom: "4px",
                          }}
                        >
                          How You Can Help at Home
                        </p>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#5A5A5A",
                          }}
                        >
                          Simple ways to support Alex's learning
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {report.parentTips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-3">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                            style={{
                              background: "#FFC107",
                            }}
                          />
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#1B1B1B",
                              lineHeight: "1.6",
                            }}
                          >
                            {tip}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}