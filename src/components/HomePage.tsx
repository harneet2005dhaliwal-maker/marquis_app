import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  NotebookTabs,
  Target,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "./ui/button";
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
  }>;
}

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

function formatDueLabel(work: ClassroomWorkItem) {
  const due = getDueDate(work);
  if (!due) return "No due date";

  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  );

  const days = Math.round(
    (target.getTime() - start.getTime()) / 86400000
  );

  if (days < 0) {
    const overdueBy = Math.abs(days);
    return `${overdueBy} ${overdueBy === 1 ? "day" : "days"} overdue`;
  }

  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: 1.05,
          fontWeight: 850,
          letterSpacing: "-0.035em",
          color: "#080808",
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          style={{
            margin: "5px 0 0",
            color: "#77716A",
            fontSize: "10px",
            fontWeight: 650,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const {
    currentStudent,
    getUpcomingClasses,
    loading,
  } = useData();

  const {
    googleProviderToken,
    googleIdentityLinked,
    isConnectingGoogle,
    connectGoogleClassroom,
  } = useAuth();

  const upcomingClasses =
    getUpcomingClasses(currentStudent?.id);

  const [
    activePerformanceIndex,
    setActivePerformanceIndex,
  ] = useState(0);

  const [googleCourses, setGoogleCourses] =
    useState<GoogleClassroomCourse[]>([]);

  const [
    googleCoursework,
    setGoogleCoursework,
  ] = useState<ClassroomWorkItem[]>([]);

  const [
    classroomLoading,
    setClassroomLoading,
  ] = useState(false);

  const [
    classroomError,
    setClassroomError,
  ] = useState<string | null>(null);

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
        const courses =
          await getGoogleClassroomCourses(
            googleProviderToken
          );

        setGoogleCourses(courses);

        const courseworkByCourse =
          await Promise.all(
            courses.map(async (course) => {
              const [
                coursework,
                submissions,
              ] = await Promise.all([
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
                (
                  work
                ): ClassroomWorkItem => ({
                  ...work,
                  courseName: course.name,
                  submission:
                    submissions.find(
                      (submission) =>
                        submission.courseWorkId ===
                        work.id
                    ),
                })
              );
            })
          );

        setGoogleCoursework(
          courseworkByCourse.flat()
        );
      } catch (error) {
        console.error(
          "Home Classroom load failed:",
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
    sevenDaysEnd.setDate(
      sevenDaysEnd.getDate() + 7
    );

    const recentCutoff = new Date(todayStart);
    recentCutoff.setDate(
      recentCutoff.getDate() - 60
    );

    const relevantWork =
      googleCoursework.filter((work) => {
        const dueDate = getDueDate(work);
        return !dueDate || dueDate >= recentCutoff;
      });

    const overdue =
      relevantWork.filter((work) => {
        const dueDate = getDueDate(work);

        return (
          !isSubmitted(work) &&
          Boolean(dueDate) &&
          dueDate! < todayStart
        );
      });

    const dueToday =
      relevantWork.filter((work) => {
        const dueDate = getDueDate(work);

        return (
          !isSubmitted(work) &&
          Boolean(dueDate) &&
          dueDate! >= todayStart &&
          dueDate! <= todayEnd
        );
      });

    const dueNext7Days =
      relevantWork.filter((work) => {
        const dueDate = getDueDate(work);

        return (
          !isSubmitted(work) &&
          Boolean(dueDate) &&
          dueDate! > todayEnd &&
          dueDate! <= sevenDaysEnd
        );
      });

    const completed =
      relevantWork.filter((work) =>
        isSubmitted(work)
      );

    const gradedResults = relevantWork
      .filter(
        (work) =>
          typeof work.submission
            ?.assignedGrade === "number"
      )
      .sort((a, b) => {
        const aDate =
          getDueDate(a)?.getTime() ?? 0;
        const bDate =
          getDueDate(b)?.getTime() ?? 0;
        return bDate - aDate;
      });

    const performanceByCourse:
      CoursePerformance[] = googleCourses
      .map((course) => {
        const courseWork =
          relevantWork.filter(
            (work) =>
              work.courseId === course.id
          );

        if (courseWork.length === 0) {
          return null;
        }

        const courseCompleted =
          courseWork.filter(isSubmitted)
            .length;

        const courseOverdue =
          courseWork.filter((work) => {
            const dueDate =
              getDueDate(work);

            return (
              !isSubmitted(work) &&
              Boolean(dueDate) &&
              dueDate! < todayStart
            );
          }).length;

        const courseUpcoming =
          courseWork.filter((work) => {
            const dueDate =
              getDueDate(work);

            return (
              !isSubmitted(work) &&
              Boolean(dueDate) &&
              dueDate! >= todayStart
            );
          }).length;

        const total = courseWork.length;

        return {
          id: course.id,
          subject: course.name,
          average: clampPercent(
            total > 0
              ? (courseCompleted / total) *
                  100
              : 0
          ),
          yearLabel:
            currentStudent?.yearLevel ?? "",
          metrics: [
            {
              name: "Completed",
              progress: clampPercent(
                total > 0
                  ? (courseCompleted / total) *
                      100
                  : 0
              ),
            },
            {
              name: "Upcoming",
              progress: clampPercent(
                total > 0
                  ? (courseUpcoming / total) *
                      100
                  : 0
              ),
            },
            {
              name: "Overdue",
              progress: clampPercent(
                total > 0
                  ? (courseOverdue / total) *
                      100
                  : 0
              ),
            },
          ],
        };
      })
      .filter(
        (
          value
        ): value is CoursePerformance =>
          value !== null
      )
      .sort(
        (a, b) =>
          b.average - a.average
      );

    const openTasks = [
      ...overdue,
      ...dueToday,
      ...dueNext7Days,
    ]
      .filter(
        (work, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.id === work.id
          ) === index
      )
      .sort((a, b) => {
        const aDate =
          getDueDate(a)?.getTime() ??
          Number.MAX_SAFE_INTEGER;
        const bDate =
          getDueDate(b)?.getTime() ??
          Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });

    return {
      overdue,
      dueToday,
      dueNext7Days,
      completed,
      gradedResults,
      performanceByCourse,
      openTasks,
    };
  }, [
    googleCourses,
    googleCoursework,
    currentStudent,
  ]);

  useEffect(() => {
    if (
      activePerformanceIndex >=
      classroomData.performanceByCourse
        .length
    ) {
      setActivePerformanceIndex(0);
    }
  }, [
    activePerformanceIndex,
    classroomData.performanceByCourse
      .length,
  ]);

  if (loading) {
    return (
      <div
        className="flex min-h-[65vh] items-center justify-center"
        style={{
          background: "#F6F2E8",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border:
              "4px solid rgba(0,0,0,0.08)",
            borderTopColor: "#FFD500",
          }}
        />
      </div>
    );
  }

  const firstName =
    currentStudent?.name?.split(" ")[0] ??
    "there";

  const currentPerformance =
    classroomData.performanceByCourse[
      activePerformanceIndex
    ];

  const latestResult =
    classroomData.gradedResults[0];

  const overallCompletion =
    googleCoursework.length > 0
      ? clampPercent(
          (classroomData.completed.length /
            googleCoursework.length) *
            100
        )
      : 0;

  const dueSoonCount =
    classroomData.dueToday.length +
    classroomData.dueNext7Days.length;

  const latestGrade = latestResult
    ? typeof latestResult.maxPoints ===
        "number" &&
      latestResult.maxPoints > 0
      ? `${Math.round(
          ((latestResult.submission
            ?.assignedGrade ?? 0) /
            latestResult.maxPoints) *
            100
        )}%`
      : String(
          latestResult.submission
            ?.assignedGrade ?? "—"
        )
    : "—";

  const nextClass =
    upcomingClasses.length > 0
      ? upcomingClasses[0]
      : null;

  const tasks =
    classroomData.openTasks.slice(0, 3);

  const quote =
    overallCompletion >= 75
      ? {
          text: "Success is the sum of small efforts, repeated day in and day out.",
          author: "Robert Collier",
        }
      : {
          text: "The expert in anything was once a beginner.",
          author: "Helen Hayes",
        };

  return (
    <div
      className="w-full overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #F7F3EA 0%, #FBFAF6 48%, #F2ECE0 100%)",
        color: "#0A0A0A",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: "18px",
      }}
    >
      {/* HERO — app-first, no imagery */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "285px",
          margin: "0 14px",
          borderRadius: "0 0 32px 32px",
          background: "linear-gradient(135deg, #111111 0%, #191919 62%, #252525 100%)",
          color: "#FFFFFF",
          boxShadow: "0 22px 48px rgba(0,0,0,0.16)",
        }}
      >
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, 16, 0], y: [0, -10, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "190px",
            height: "190px",
            borderRadius: "54px",
            right: "-45px",
            top: "-55px",
            background: "#FFD500",
            opacity: 0.96,
            transform: "rotate(18deg)",
          }}
        />

        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.08, 1], opacity: [0.16, 0.25, 0.16] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            right: "70px",
            bottom: "-100px",
            background: "#FFD500",
            filter: "blur(4px)",
          }}
        />

        <div
          className="relative z-10"
          style={{ padding: "30px 22px 22px" }}
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.66)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Good afternoon,
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.04 }}
            style={{
              margin: "3px 0 0",
              maxWidth: "68%",
              fontSize: "42px",
              lineHeight: 0.96,
              fontWeight: 900,
              letterSpacing: "-0.055em",
            }}
          >
            {firstName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            style={{
              margin: "15px 0 0",
              maxWidth: "215px",
              color: "rgba(255,255,255,0.7)",
              fontSize: "10px",
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {tasks.length > 0
              ? `You have ${tasks.length} priority ${tasks.length === 1 ? "task" : "tasks"} waiting. Let's make a start.`
              : "You're all clear. A good time to get ahead."}
          </motion.p>

          <div className="flex gap-2" style={{ marginTop: "19px" }}>
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate(tasks.length > 0 ? "study" : "progress")}
              style={{
                border: "none",
                borderRadius: "13px",
                padding: "10px 13px",
                background: "#FFD500",
                color: "#080808",
                fontSize: "9px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(255,213,0,0.18)",
              }}
            >
              {tasks.length > 0 ? "View priorities" : "View progress"}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate("bookings")}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "13px",
                padding: "10px 13px",
                background: "rgba(255,255,255,0.07)",
                color: "#FFFFFF",
                fontSize: "9px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              My classes
            </motion.button>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03, rotate: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate("study")}
          style={{
            position: "absolute",
            zIndex: 12,
            right: "17px",
            bottom: "19px",
            width: "118px",
            minHeight: "78px",
            padding: "12px",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            color: "#FFFFFF",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "block", color: "#FFD500", fontSize: "21px", fontWeight: 900 }}>
            {dueSoonCount}
          </span>
          <span style={{ display: "block", marginTop: "2px", fontSize: "8px", fontWeight: 750 }}>
            due in the next 7 days
          </span>
          <ArrowUpRight
            className="h-4 w-4"
            style={{ position: "absolute", right: "10px", top: "10px" }}
          />
        </motion.button>
      </section>

      {/* STATS — explicitly forced into one horizontal row */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "8px",
          margin: "14px 14px 0",
        }}
      >
        {[
          { icon: Calendar, value: dueSoonCount, label: "Due soon", tab: "study" },
          { icon: CheckCircle2, value: `${overallCompletion}%`, label: "Complete", tab: "progress" },
          { icon: BookOpen, value: googleCourses.length, label: "Classes", tab: "bookings" },
          { icon: Target, value: latestGrade, label: "Latest", tab: "progress" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item.tab)}
              style={{
                minWidth: 0,
                minHeight: "92px",
                padding: "11px 4px",
                border: "1px solid rgba(0,0,0,0.055)",
                borderRadius: "20px",
                background: "#FFFFFF",
                boxShadow: "0 10px 25px rgba(0,0,0,0.055)",
                cursor: "pointer",
              }}
            >
              <div
                className="mx-auto flex items-center justify-center"
                style={{
                  width: "31px",
                  height: "31px",
                  borderRadius: "11px",
                  background: index === 0 ? "#FFD500" : "#F2F0EA",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontSize: "15px",
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                }}
              >
                {item.value}
              </strong>
              <span
                style={{
                  display: "block",
                  marginTop: "4px",
                  color: "#77716A",
                  fontSize: "7px",
                  fontWeight: 750,
                }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </section>

      <div style={{ padding: "15px 14px 0" }}>
        {!googleProviderToken && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: "14px",
              padding: "14px",
              borderRadius: "22px",
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: "39px",
                  height: "39px",
                  borderRadius: "13px",
                  background: "#FFD500",
                }}
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 850 }}>
                  {googleIdentityLinked ? "Reconnect Classroom" : "Connect Google Classroom"}
                </p>
                <p style={{ margin: "3px 0 0", color: "#77716A", fontSize: "8px" }}>
                  Bring your tasks, grades and deadlines into one place.
                </p>
              </div>
              <Button
                type="button"
                disabled={isConnectingGoogle}
                onClick={async () => {
                  try {
                    await connectGoogleClassroom();
                  } catch (error) {
                    console.error("Google Classroom connection failed:", error);
                  }
                }}
                className="border-0"
                style={{
                  height: "35px",
                  borderRadius: "11px",
                  background: "#111111",
                  color: "#FFFFFF",
                  padding: "0 11px",
                  fontSize: "8px",
                  fontWeight: 850,
                }}
              >
                {isConnectingGoogle ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </motion.section>
        )}

        {/* PRIORITIES — clean task UI, no image */}
        <section
          style={{
            marginBottom: "14px",
            padding: "17px",
            borderRadius: "27px",
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.055)",
            boxShadow: "0 14px 30px rgba(0,0,0,0.065)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.06 }}
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: "39px",
                  height: "39px",
                  borderRadius: "14px",
                  background: "#FFD500",
                }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, letterSpacing: "-0.025em" }}>
                  Today's Priorities
                </h2>
                <p style={{ margin: "3px 0 0", color: "#77716A", fontSize: "8px" }}>
                  Most urgent first · {tasks.length} showing
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("study")}
              style={{
                border: "none",
                borderRadius: "999px",
                background: "#F4F2EC",
                padding: "7px 9px",
                fontSize: "7.5px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              View all
            </motion.button>
          </div>

          <div style={{ marginTop: "13px" }}>
            {tasks.length > 0 ? (
              tasks.map((task: ClassroomWorkItem, index: number) => (
                <motion.button
                  key={task.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4, backgroundColor: "#FAF8F2" }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() =>
                    task.alternateLink
                      ? window.open(task.alternateLink, "_blank", "noopener,noreferrer")
                      : onNavigate("study")
                  }
                  className="flex w-full items-center gap-3"
                  style={{
                    minHeight: "62px",
                    padding: "9px 8px",
                    border: "none",
                    borderTop: index === 0 ? "1px solid #EEEAE2" : "none",
                    borderBottom: "1px solid #EEEAE2",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: index === 0 ? "13px 13px 0 0" : index === tasks.length - 1 ? "0 0 13px 13px" : "0",
                  }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "12px",
                      background: index === 0 ? "#FFF0F0" : "#FFF8D5",
                      color: index === 0 ? "#D94848" : "#111111",
                    }}
                  >
                    {index === 0 ? <AlertCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      style={{
                        margin: 0,
                        fontSize: "9.5px",
                        fontWeight: 850,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.title}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        color: "#77716A",
                        fontSize: "7.5px",
                        fontWeight: 650,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {formatDueLabel(task)} · {task.courseName}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </motion.button>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: "12px",
                  padding: "18px",
                  borderRadius: "17px",
                  background: "#F7F5EF",
                  color: "#68635C",
                  fontSize: "9px",
                  textAlign: "center",
                }}
              >
                No urgent tasks right now. You're clear here.
              </motion.div>
            )}
          </div>
        </section>

        {/* PROGRESS */}
        <section
          style={{
            marginBottom: "14px",
            padding: "17px",
            borderRadius: "27px",
            background: "linear-gradient(145deg, #181818, #070707)",
            color: "#FFFFFF",
            boxShadow: "0 16px 34px rgba(0,0,0,0.15)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: "39px", height: "39px", borderRadius: "14px", background: "#FFD500", color: "#000" }}
              >
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900 }}>Your Progress</h2>
                <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "8px" }}>
                  {currentPerformance ? currentPerformance.subject : "Live Classroom completion"}
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("progress")}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.07)",
                color: "#FFFFFF",
                padding: "7px 9px",
                fontSize: "7.5px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              Details
            </motion.button>
          </div>

          {classroomLoading ? (
            <p style={{ margin: "16px 0 0", color: "rgba(255,255,255,0.55)", fontSize: "9px" }}>
              Loading Classroom performance…
            </p>
          ) : classroomError ? (
            <div style={{ marginTop: "14px", padding: "10px", borderRadius: "13px", background: "#3A1717", color: "#FFD0D0", fontSize: "8.5px" }}>
              {classroomError}
            </div>
          ) : currentPerformance ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPerformance.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                style={{ marginTop: "16px" }}
              >
                {currentPerformance.metrics.map((metric: CoursePerformance["metrics"][number], index: number) => (
                  <div
                    key={metric.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "65px 1fr 31px",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: index === 0 ? 0 : "11px",
                    }}
                  >
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                      {metric.name}
                    </span>
                    <div style={{ height: "8px", borderRadius: "999px", background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.85 }}
                        style={{ height: "100%", borderRadius: "999px", background: "#FFD500" }}
                      />
                    </div>
                    <strong style={{ fontSize: "8px", textAlign: "right" }}>{metric.progress}%</strong>
                  </div>
                ))}

                {classroomData.performanceByCourse.length > 1 && (
                  <div className="flex justify-center gap-1" style={{ marginTop: "14px" }}>
                    {classroomData.performanceByCourse.map((_course: CoursePerformance, index: number) => (
                      <motion.button
                        type="button"
                        key={index}
                        whileHover={{ scale: 1.2 }}
                        aria-label={`Show course ${index + 1}`}
                        onClick={() => setActivePerformanceIndex(index)}
                        style={{
                          width: index === activePerformanceIndex ? "18px" : "5px",
                          height: "5px",
                          padding: 0,
                          border: "none",
                          borderRadius: "999px",
                          background: index === activePerformanceIndex ? "#FFD500" : "rgba(255,255,255,0.22)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <p style={{ margin: "15px 0 0", color: "rgba(255,255,255,0.55)", fontSize: "9px" }}>
              {googleProviderToken ? "No current Classroom work found." : "Connect Classroom to see progress."}
            </p>
          )}
        </section>

        {/* STUDY TOOLS — actual app controls, no decorative image */}
        <section
          style={{
            marginBottom: "14px",
            padding: "17px",
            borderRadius: "27px",
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.055)",
            boxShadow: "0 14px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -8 }}
                className="flex items-center justify-center"
                style={{ width: "39px", height: "39px", borderRadius: "14px", background: "#FFD500" }}
              >
                <Lightbulb className="h-5 w-5" />
              </motion.div>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900 }}>Study Tools</h2>
                <p style={{ margin: "3px 0 0", color: "#77716A", fontSize: "8px" }}>
                  Pick a tool and get started.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "14px",
            }}
          >
            {[
              { icon: Clock3, label: "Pomodoro" },
              { icon: NotebookTabs, label: "Flashcards" },
              { icon: FileText, label: "Notes" },
              { icon: BookOpen, label: "Past Papers" },
            ].map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  type="button"
                  key={tool.label}
                  whileHover={{ y: -4, backgroundColor: "#FFF8D5" }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onNavigate("study")}
                  style={{
                    minWidth: 0,
                    minHeight: "76px",
                    borderRadius: "17px",
                    border: "1px solid #EDE9E1",
                    background: index === 0 ? "#FFF9DB" : "#F8F6F1",
                    color: "#111111",
                    cursor: "pointer",
                  }}
                >
                  <Icon className="mx-auto h-5 w-5" />
                  <span style={{ display: "block", marginTop: "7px", fontSize: "7px", fontWeight: 800 }}>
                    {tool.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* NEXT CLASS */}
        <motion.button
          type="button"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onNavigate("bookings")}
          style={{
            width: "100%",
            marginBottom: "14px",
            padding: "14px",
            borderRadius: "23px",
            border: "1px solid rgba(0,0,0,0.055)",
            background: "#FFFFFF",
            boxShadow: "0 12px 28px rgba(0,0,0,0.055)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: "39px", height: "39px", borderRadius: "14px", background: "#FFD500" }}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 850 }}>Upcoming Class</p>
              <p
                style={{
                  margin: "3px 0 0",
                  color: "#716C65",
                  fontSize: "8px",
                  fontWeight: 650,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nextClass ? `${nextClass.subject} · ${nextClass.dayOfWeek}, ${nextClass.time}` : "View your schedule"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </div>
        </motion.button>

        {/* SMALL MOTIVATION STRIP */}
        <motion.section
          whileHover={{ scale: 1.005 }}
          style={{
            marginBottom: "12px",
            padding: "17px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #FFF5B8, #FFD500)",
            boxShadow: "0 12px 25px rgba(255,213,0,0.14)",
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: "92%",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: "13px",
              lineHeight: 1.35,
              color: "#18130A",
            }}
          >
            “{quote.text}”
          </p>
          <p style={{ margin: "7px 0 0", color: "rgba(0,0,0,0.55)", fontSize: "7.5px", fontWeight: 750 }}>
            — {quote.author}
          </p>
        </motion.section>

        {latestResult && (
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onNavigate("progress")}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "20px",
              padding: "11px 13px",
              background: "#0A0A0A",
              color: "#FFFFFF",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "7px", fontWeight: 750, textTransform: "uppercase" }}>
                  Latest result
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "9px",
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {latestResult.title}
                </p>
              </div>
              <div className="flex items-center gap-1" style={{ color: "#FFD500", fontSize: "10px", fontWeight: 900 }}>
                {latestGrade}
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}