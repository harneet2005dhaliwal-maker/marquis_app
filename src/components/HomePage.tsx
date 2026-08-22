import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

import {
  getGoogleClassroomCourses,
  getGoogleClassroomCoursework,
  getMyGoogleClassroomSubmissions,
  type GoogleClassroomCourse,
  type GoogleClassroomCourseWork,
  type GoogleClassroomSubmission,
} from "../services/googleClassroom";

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

type ClassroomWorkItem = GoogleClassroomCourseWork & {
  courseName: string;
  submission?: GoogleClassroomSubmission;
};

interface CoursePerformance {
  id: string;
  subject: string;
  average: number;
  yearLabel: string;
  metrics: Array<{
    name: string;
    progress: number;
    icon: string;
  }>;
}

const inspirationalQuotes = [
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
];

function getDueDate(work: GoogleClassroomCourseWork): Date | null {
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

function isSubmitted(work: ClassroomWorkItem): boolean {
  return (
    work.submission?.state === "TURNED_IN" ||
    work.submission?.state === "RETURNED"
  );
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentStudent, getUpcomingClasses, loading } = useData();
  const { googleProviderToken } = useAuth();

  const upcomingClasses = getUpcomingClasses(currentStudent?.id);

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [activePerformanceIndex, setActivePerformanceIndex] = useState(0);

  const [googleCourses, setGoogleCourses] = useState<
    GoogleClassroomCourse[]
  >([]);

  const [googleCoursework, setGoogleCoursework] = useState<
    ClassroomWorkItem[]
  >([]);

  const [classroomLoading, setClassroomLoading] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex(
        (prev) => (prev + 1) % inspirationalQuotes.length
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadClassroom = async () => {
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

            return coursework.map(
              (work): ClassroomWorkItem => ({
                ...work,
                courseName: course.name,
                submission: submissions.find(
                  (submission) =>
                    submission.courseWorkId === work.id
                ),
              })
            );
          })
        );

        setGoogleCoursework(courseworkByCourse.flat());
      } catch (error) {
        console.error("Home Classroom load failed:", error);

        setClassroomError(
          error instanceof Error
            ? error.message
            : "Unable to load Google Classroom."
        );
      } finally {
        setClassroomLoading(false);
      }
    };

    void loadClassroom();
  }, [googleProviderToken]);

  const classroomData = useMemo(() => {
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysEnd = new Date(todayEnd);
    sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 7);

    const recentCutoff = new Date(todayStart);
    recentCutoff.setDate(recentCutoff.getDate() - 60);

    const relevantWork = googleCoursework.filter((work) => {
      const dueDate = getDueDate(work);
      return !dueDate || dueDate >= recentCutoff;
    });

    const overdue = relevantWork.filter((work) => {
      const dueDate = getDueDate(work);

      return (
        !isSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! < todayStart
      );
    });

    const dueToday = relevantWork.filter((work) => {
      const dueDate = getDueDate(work);

      return (
        !isSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! >= todayStart &&
        dueDate! <= todayEnd
      );
    });

    const dueNext7Days = relevantWork.filter((work) => {
      const dueDate = getDueDate(work);

      return (
        !isSubmitted(work) &&
        Boolean(dueDate) &&
        dueDate! > todayEnd &&
        dueDate! <= sevenDaysEnd
      );
    });

    const completed = relevantWork.filter((work) =>
      isSubmitted(work)
    );

    const gradedResults = relevantWork
      .filter(
        (work) =>
          typeof work.submission?.assignedGrade === "number"
      )
      .sort((a, b) => {
        const aDate = getDueDate(a)?.getTime() ?? 0;
        const bDate = getDueDate(b)?.getTime() ?? 0;
        return bDate - aDate;
      });

    const performanceByCourse: CoursePerformance[] = googleCourses
      .map((course) => {
        const courseWork = relevantWork.filter(
          (work) => work.courseId === course.id
        );

        if (courseWork.length === 0) return null;

        const courseCompleted = courseWork.filter(isSubmitted).length;

        const courseOverdue = courseWork.filter((work) => {
          const dueDate = getDueDate(work);

          return (
            !isSubmitted(work) &&
            Boolean(dueDate) &&
            dueDate! < todayStart
          );
        }).length;

        const courseUpcoming = courseWork.filter((work) => {
          const dueDate = getDueDate(work);

          return (
            !isSubmitted(work) &&
            Boolean(dueDate) &&
            dueDate! >= todayStart
          );
        }).length;

        const total = courseWork.length;

        const completionRate =
          total > 0 ? (courseCompleted / total) * 100 : 0;

        const submittedPercent =
          total > 0 ? (courseCompleted / total) * 100 : 0;

        const upcomingPercent =
          total > 0 ? (courseUpcoming / total) * 100 : 0;

        const overduePercent =
          total > 0 ? (courseOverdue / total) * 100 : 0;

        return {
          id: course.id,
          subject: course.name,
          average: clampPercent(completionRate),
          yearLabel: currentStudent?.yearLevel ?? "",
          metrics: [
            {
              name: "Completed",
              progress: clampPercent(submittedPercent),
              icon: "✓",
            },
            {
              name: "Upcoming",
              progress: clampPercent(upcomingPercent),
              icon: "📅",
            },
            {
              name: "Overdue",
              progress: clampPercent(overduePercent),
              icon: "!",
            },
          ],
        };
      })
      .filter(
        (value): value is CoursePerformance => value !== null
      )
      .sort((a, b) => b.average - a.average);

    const nextAssignment = relevantWork
      .filter((work) => {
        const dueDate = getDueDate(work);

        return (
          !isSubmitted(work) &&
          Boolean(dueDate) &&
          dueDate! >= todayStart
        );
      })
      .sort((a, b) => {
        const aDate =
          getDueDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        const bDate =
          getDueDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return aDate - bDate;
      })[0];

    return {
      overdue,
      dueToday,
      dueNext7Days,
      completed,
      gradedResults,
      performanceByCourse,
      nextAssignment,
    };
  }, [googleCourses, googleCoursework, currentStudent]);

  useEffect(() => {
    if (
      activePerformanceIndex >=
      classroomData.performanceByCourse.length
    ) {
      setActivePerformanceIndex(0);
    }
  }, [
    activePerformanceIndex,
    classroomData.performanceByCourse.length,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p
          className="text-marquis-grey"
          style={{
            fontFamily: "Neurial Grotesk, sans-serif",
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  const currentPerformance =
    classroomData.performanceByCourse[activePerformanceIndex];

  const latestResult = classroomData.gradedResults[0];

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{ background: "#FFFFFF" }}
    >
      {/* Warm Yellow Vignette at Top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255,213,0,0.25), transparent 60%)",
          height: "50%",
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
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  color: "#000000",
                  lineHeight: "1.2",
                }}
              >
                Hey {currentStudent?.name?.split(" ")[0] || "there"}! 👋
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
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      color: "#6E6E70",
                      fontStyle: "italic",
                      lineHeight: "1.4",
                    }}
                  >
                    "{inspirationalQuotes[currentQuoteIndex].text}"
                  </p>

                  <p
                    className="mt-0 mb-0"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      color: "#999",
                      fontWeight: 600,
                    }}
                  >
                    — {inspirationalQuotes[currentQuoteIndex].author}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Same visual badge as before, but now real live data */}
            <motion.div
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("study")}
            >
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer"
                style={{
                  background: "#FFD500",
                  boxShadow:
                    "0px 8px 16px rgba(255,213,0,0.3)",
                }}
              >
                <Zap
                  className="w-8 h-8"
                  style={{
                    color: "#000000",
                    strokeWidth: 2.5,
                  }}
                />

                <div
                  className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full flex items-center justify-center"
                  style={{
                    background: "#000000",
                    color: "#FFD500",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {classroomData.dueToday.length}
                </div>
              </div>

              <p
                className="mt-2 text-xs text-center"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 600,
                  color: "#6E6E70",
                }}
              >
                Due Today
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 space-y-6 relative">
        {/* Weekly Performance - original visual style, real Classroom data */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl"
          style={{ background: "#FAFAFA" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2
                className="mb-1 flex items-center gap-2"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "#000000",
                }}
              >
                Weekly Performance
                <ArrowUpRight
                  className="w-5 h-5"
                  style={{ color: "#FFD500" }}
                />
              </h2>

              <p
                className="text-sm"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  color: "#6E6E70",
                }}
              >
                Live from Google Classroom
              </p>
            </div>

            {classroomData.performanceByCourse.length > 1 && (
              <div className="flex gap-1.5">
                {classroomData.performanceByCourse.map(
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setActivePerformanceIndex(index)
                      }
                      className={`h-1.5 rounded-full transition-all ${
                        index === activePerformanceIndex
                          ? "w-8"
                          : "w-1.5"
                      }`}
                      style={{
                        background:
                          index === activePerformanceIndex
                            ? "#FFD500"
                            : "#E6E6E6",
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {!googleProviderToken ? (
            <Card
              className="border-0 p-6"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#6E6E70",
                  fontSize: "14px",
                }}
              >
                Sign in with Google to see your live performance.
              </p>
            </Card>
          ) : classroomLoading ? (
            <Card
              className="border-0 p-6"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#6E6E70",
                  fontSize: "14px",
                }}
              >
                Loading Classroom performance…
              </p>
            </Card>
          ) : classroomError ? (
            <Card
              className="border-0 p-6"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFF4F4",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#B91C1C",
                  fontSize: "14px",
                }}
              >
                {classroomError}
              </p>
            </Card>
          ) : currentPerformance ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPerformance.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="border-0 p-6"
                  style={{
                    borderRadius: "20px",
                    boxShadow:
                      "0px 12px 28px rgba(0, 0, 0, 0.06)",
                    background: "#FFFFFF",
                  }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3
                        className="mb-1 flex items-center gap-2"
                        style={{
                          fontFamily:
                            "Neurial Grotesk, sans-serif",
                          fontWeight: 700,
                          fontSize: "20px",
                          color: "#000000",
                        }}
                      >
                        {currentPerformance.subject}
                        <span style={{ fontSize: "18px" }}>
                          📚
                        </span>
                      </h3>

                      {currentPerformance.yearLabel && (
                        <p
                          className="text-sm"
                          style={{
                            fontFamily:
                              "Neurial Grotesk, sans-serif",
                            color: "#6E6E70",
                          }}
                        >
                          {String(
                            currentPerformance.yearLabel
                          ).startsWith("Year")
                            ? currentPerformance.yearLabel
                            : `Year ${currentPerformance.yearLabel}`}
                        </p>
                      )}
                    </div>

                    <Badge
                      style={{
                        background: "#FFF8D8",
                        color: "#000000",
                        border: "1px solid #FFD50055",
                      }}
                    >
                      Live
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Original score-circle graphic, now completion rate */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "#FFD500",
                          filter: "blur(12px)",
                          opacity: 0.3,
                          transform: "scale(0.9)",
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
                            strokeDashoffset={`${
                              2 *
                              Math.PI *
                              40 *
                              (1 -
                                currentPerformance.average /
                                  100)
                            }`}
                            strokeLinecap="round"
                            style={{
                              filter:
                                "drop-shadow(0px 2px 4px rgba(255,213,0,0.3))",
                            }}
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            style={{
                              fontFamily:
                                "Neurial Grotesk, sans-serif",
                              fontWeight: 700,
                              fontSize: "26px",
                              color: "#000000",
                            }}
                          >
                            {currentPerformance.average}%
                          </span>

                          <span
                            className="text-xs"
                            style={{
                              fontFamily:
                                "Neurial Grotesk, sans-serif",
                              color: "#6E6E70",
                              marginTop: "-2px",
                            }}
                          >
                            Complete
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Original animated progress bars, now real workload */}
                    <div className="flex-1 space-y-4">
                      {currentPerformance.metrics.map(
                        (metric, index) => (
                          <motion.div
                            key={metric.name}
                            initial={{
                              opacity: 0,
                              x: 20,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay:
                                0.1 + index * 0.1,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p
                                className="text-sm flex items-center gap-1.5"
                                style={{
                                  fontFamily:
                                    "Neurial Grotesk, sans-serif",
                                  fontWeight: 600,
                                  color: "#000000",
                                }}
                              >
                                <span>{metric.icon}</span>
                                {metric.name}
                              </p>

                              <p
                                className="text-sm"
                                style={{
                                  fontFamily:
                                    "Neurial Grotesk, sans-serif",
                                  fontWeight: 700,
                                  color:
                                    metric.name ===
                                    "Completed"
                                      ? "#B89500"
                                      : "#6E6E70",
                                }}
                              >
                                {metric.progress}%
                              </p>
                            </div>

                            <div
                              className="h-2.5 rounded-full overflow-hidden"
                              style={{
                                background: "#E8E8E8",
                              }}
                            >
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${metric.progress}%`,
                                }}
                                transition={{
                                  duration: 1,
                                  delay:
                                    0.2 +
                                    index * 0.1,
                                  ease: "easeOut",
                                }}
                                style={{
                                  background:
                                    metric.name ===
                                    "Completed"
                                      ? "#FFD500"
                                      : "#000000",
                                }}
                              />
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Card
              className="border-0 p-6"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#6E6E70",
                  fontSize: "14px",
                }}
              >
                No current Classroom work found.
              </p>
            </Card>
          )}
        </motion.div>

        {/* Live Classroom snapshot, still matching original rounded style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-3xl"
          style={{ background: "#FAFAFA" }}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                className="mb-1 flex items-center gap-2"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "#000000",
                }}
              >
                Classroom Snapshot
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: "#FFD500" }}
                />
              </h2>

              <p
                className="text-sm"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  color: "#6E6E70",
                }}
              >
                What needs your attention
              </p>
            </div>

            <Badge
              style={{
                background: "#FFF8D8",
                color: "#000000",
                border: "1px solid #FFD50055",
              }}
            >
              {googleCourses.length} Classes
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: classroomData.overdue.length,
                label: "Overdue",
                background: "#FFF0F0",
                color: "#B91C1C",
              },
              {
                value: classroomData.dueToday.length,
                label: "Due Today",
                background: "#FFF8D8",
                color: "#8A6A00",
              },
              {
                value: classroomData.dueNext7Days.length,
                label: "Next 7 Days",
                background: "#FFFFFF",
                color: "#000000",
              },
              {
                value: classroomData.completed.length,
                label: "Completed",
                background: "#ECFDF3",
                color: "#166534",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -2 }}
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: item.background,
                  boxShadow:
                    "0px 8px 20px rgba(0,0,0,0.04)",
                }}
              >
                <p
                  style={{
                    fontFamily:
                      "Neurial Grotesk, sans-serif",
                    fontSize: "25px",
                    fontWeight: 700,
                    color: item.color,
                    margin: 0,
                  }}
                >
                  {item.value}
                </p>

                <p
                  style={{
                    fontFamily:
                      "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: item.color,
                    margin: "4px 0 0",
                  }}
                >
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => onNavigate("study")}
            className="w-full rounded-xl border-0 mt-4"
            style={{
              background: "#000000",
              color: "#FFFFFF",
              fontFamily: "Neurial Grotesk, sans-serif",
              fontWeight: 700,
              height: "44px",
            }}
          >
            View Study Dashboard
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        {/* Latest real Google Classroom result */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18 }}
          className="p-6 rounded-3xl"
          style={{ background: "#FAFAFA" }}
        >
          <div className="mb-5">
            <h2
              className="mb-1 flex items-center gap-2"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                color: "#000000",
              }}
            >
              Recent Result
              <TrendingUp
                className="w-5 h-5"
                style={{ color: "#FFD500" }}
              />
            </h2>

            <p
              className="text-sm"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                color: "#6E6E70",
              }}
            >
              Latest grade returned in Classroom
            </p>
          </div>

          {latestResult ? (
            <Card
              className="border-0 p-5"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p
                    style={{
                      fontFamily:
                        "Neurial Grotesk, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#999999",
                      margin: "0 0 5px",
                    }}
                  >
                    {latestResult.courseName}
                  </p>

                  <h3
                    style={{
                      fontFamily:
                        "Neurial Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: "17px",
                      color: "#000000",
                      margin: 0,
                    }}
                  >
                    {latestResult.title}
                  </h3>
                </div>

                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#FFD500",
                    boxShadow:
                      "0px 8px 18px rgba(255,213,0,0.25)",
                  }}
                >
                  <span
                    style={{
                      fontFamily:
                        "Neurial Grotesk, sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#000000",
                    }}
                  >
                    {latestResult.submission?.assignedGrade}
                    {typeof latestResult.maxPoints === "number"
                      ? `/${latestResult.maxPoints}`
                      : ""}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              className="border-0 p-5"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily:
                    "Neurial Grotesk, sans-serif",
                  fontSize: "14px",
                  color: "#6E6E70",
                }}
              >
                No graded Classroom results available yet.
              </p>
            </Card>
          )}
        </motion.div>

        {/* Next Class - preserve original visual style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl"
          style={{ background: "#FAFAFA" }}
        >
          <div className="mb-5">
            <h2
              className="mb-1 flex items-center gap-2"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                color: "#000000",
              }}
            >
              Coming Up Next
              <Clock
                className="w-5 h-5"
                style={{ color: "#FFD500" }}
              />
            </h2>

            <p
              className="text-sm"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                color: "#6E6E70",
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
                  borderRadius: "20px",
                  boxShadow:
                    "0px 12px 28px rgba(0, 0, 0, 0.06)",
                  background: upcomingClasses[0].subject.includes(
                    "Mathematics"
                  )
                    ? "linear-gradient(135deg, #FFD500 0%, #FFC700 100%)"
                    : "#000000",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        upcomingClasses[0].subject.includes(
                          "Mathematics"
                        )
                          ? "rgba(0,0,0,0.1)"
                          : "rgba(255,213,0,0.2)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <BookOpen
                      className="w-7 h-7"
                      style={{
                        color:
                          upcomingClasses[0].subject.includes(
                            "Mathematics"
                          )
                            ? "#000000"
                            : "#FFD500",
                        strokeWidth: 2.5,
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h3
                      className="mb-1"
                      style={{
                        fontFamily:
                          "Neurial Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: "18px",
                        color:
                          upcomingClasses[0].subject.includes(
                            "Mathematics"
                          )
                            ? "#000000"
                            : "#FFFFFF",
                      }}
                    >
                      {upcomingClasses[0].subject}
                    </h3>

                    <p
                      className="text-sm"
                      style={{
                        fontFamily:
                          "Neurial Grotesk, sans-serif",
                        color:
                          upcomingClasses[0].subject.includes(
                            "Mathematics"
                          )
                            ? "rgba(0,0,0,0.7)"
                            : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {upcomingClasses[0].dayOfWeek} •{" "}
                      {upcomingClasses[0].time}
                    </p>
                  </div>

                  <ChevronRight
                    className="w-6 h-6"
                    style={{
                      color:
                        upcomingClasses[0].subject.includes(
                          "Mathematics"
                        )
                          ? "rgba(0,0,0,0.4)"
                          : "rgba(255,255,255,0.6)",
                    }}
                  />
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              onClick={() => onNavigate("bookings")}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="border border-marquis-border p-6"
                style={{
                  borderRadius: "20px",
                  boxShadow:
                    "0px 12px 28px rgba(0, 0, 0, 0.06)",
                  background: "#FFFFFF",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="mb-2 flex items-center gap-2"
                      style={{
                        fontFamily:
                          "Neurial Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: "18px",
                        color: "#000000",
                      }}
                    >
                      View Your Schedule
                      <ArrowUpRight
                        className="w-5 h-5"
                        style={{ color: "#FFD500" }}
                      />
                    </h3>

                    <p
                      className="text-sm mb-4"
                      style={{
                        fontFamily:
                          "Neurial Grotesk, sans-serif",
                        color: "#6E6E70",
                      }}
                    >
                      No upcoming class is showing right now.
                    </p>

                    <Button
                      className="rounded-xl border-0"
                      style={{
                        background: "#FFD500",
                        color: "#000000",
                        fontFamily:
                          "Neurial Grotesk, sans-serif",
                        fontWeight: 700,
                        padding: "12px 24px",
                        boxShadow:
                          "0px 8px 16px rgba(255,213,0,0.3)",
                      }}
                    >
                      View Schedule
                    </Button>
                  </div>

                  <Calendar
                    className="w-16 h-16"
                    style={{
                      color: "#FFD500",
                      opacity: 0.3,
                    }}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions Grid - preserve original graphics */}
        <div className="grid grid-cols-2 gap-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onNavigate("study")}
            className="cursor-pointer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="border-0 p-5 text-center overflow-hidden relative"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full"
                style={{
                  background: "rgba(255,213,0,0.1)",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
                style={{
                  background: "#000000",
                  boxShadow:
                    "0px 8px 16px rgba(0,0,0,0.15)",
                }}
              >
                <Target
                  className="w-7 h-7"
                  style={{
                    color: "#FFD500",
                    strokeWidth: 2.5,
                  }}
                />
              </div>

              <h4
                className="mb-1"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#000000",
                }}
              >
                Study Tools
              </h4>

              <p
                className="text-xs"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  color: "#6E6E70",
                }}
              >
                Classroom, Focus & Memory
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onNavigate("progress")}
            className="cursor-pointer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="border-0 p-5 text-center overflow-hidden relative"
              style={{
                borderRadius: "20px",
                boxShadow:
                  "0px 12px 28px rgba(0, 0, 0, 0.06)",
                background: "#FFFFFF",
              }}
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full"
                style={{
                  background: "rgba(255,213,0,0.1)",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
                style={{
                  background: "#FFD500",
                  boxShadow:
                    "0px 8px 16px rgba(255,213,0,0.3)",
                }}
              >
                <TrendingUp
                  className="w-7 h-7"
                  style={{
                    color: "#000000",
                    strokeWidth: 2.5,
                  }}
                />
              </div>

              <h4
                className="mb-1"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#000000",
                }}
              >
                My Progress
              </h4>

              <p
                className="text-xs"
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  color: "#6E6E70",
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