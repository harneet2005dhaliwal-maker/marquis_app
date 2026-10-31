import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Plus,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import { AIInsightsPage } from "./AIInsightsPage";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

import {
  getGoogleClassroomCourses,
  getGoogleClassroomCoursework,
  getMyGoogleClassroomSubmissions,
  type GoogleClassroomCourse,
  type GoogleClassroomCourseWork,
  type GoogleClassroomSubmission,
} from "../services/googleClassroom";

interface ProgressPageProps {
  onNavigate?: (tab: string) => void;
}

type ClassroomWorkItem = GoogleClassroomCourseWork & {
  courseName: string;
  submission?: GoogleClassroomSubmission;
};

interface SchoolAssessment {
  id: string;
  student_id: string;
  subject: string;
  title: string;
  assessment_type: string;
  due_at: string;
  weighting: number | null;
  difficulty: number | null;
  confidence: number | null;
  notes: string | null;
}

interface CourseSummary {
  id: string;
  name: string;
  total: number;
  completed: number;
  overdue: number;
  graded: number;
  completionRate: number;
  averagePercent: number | null;
}

interface AssessmentForm {
  subject: string;
  title: string;
  assessmentType: string;
  dueDate: string;
  dueTime: string;
  weighting: string;
  difficulty: string;
  confidence: string;
  notes: string;
}

const emptyAssessmentForm: AssessmentForm = {
  subject: "",
  title: "",
  assessmentType: "Exam",
  dueDate: "",
  dueTime: "09:00",
  weighting: "",
  difficulty: "3",
  confidence: "3",
  notes: "",
};

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

function isSubmitted(work: ClassroomWorkItem) {
  return (
    work.submission?.state === "TURNED_IN" ||
    work.submission?.state === "RETURNED"
  );
}

function getPercentage(work: ClassroomWorkItem): number | null {
  const grade = work.submission?.assignedGrade;
  const maxPoints = work.maxPoints;

  if (
    typeof grade !== "number" ||
    typeof maxPoints !== "number" ||
    maxPoints <= 0
  ) {
    return null;
  }

  return Math.max(0, Math.min(100, (grade / maxPoints) * 100));
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function daysFromNow(date: Date) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  return Math.ceil(
    (target.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export function ProgressPage({ onNavigate }: ProgressPageProps) {
  const { googleProviderToken, studentId } = useAuth();

  const [showAIInsights, setShowAIInsights] = useState(false);
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([]);
  const [work, setWork] = useState<ClassroomWorkItem[]>([]);
  const [schoolAssessments, setSchoolAssessments] =
    useState<SchoolAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState("all");
  const [graphMode, setGraphMode] =
    useState<"results" | "completion">("results");
  const [activeTab, setActiveTab] =
    useState<"overview" | "results" | "subjects">("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] =
    useState<AssessmentForm>(emptyAssessmentForm);
  const [savingAssessment, setSavingAssessment] = useState(false);

  const loadSchoolAssessments = async () => {
    if (!studentId) {
      setSchoolAssessments([]);
      return;
    }

    setAssessmentLoading(true);

    const { data, error: assessmentError } = await supabase
      .from("school_assessments")
      .select(
        "id, student_id, subject, title, assessment_type, due_at, weighting, difficulty, confidence, notes"
      )
      .eq("student_id", studentId)
      .order("due_at", { ascending: true });

    if (assessmentError) {
      console.error(
        "School assessments load failed:",
        assessmentError
      );
      setAssessmentLoading(false);
      return;
    }

    setSchoolAssessments((data ?? []) as SchoolAssessment[]);
    setAssessmentLoading(false);
  };

  useEffect(() => {
    void loadSchoolAssessments();
  }, [studentId]);

  useEffect(() => {
    const load = async () => {
      if (!googleProviderToken) {
        setCourses([]);
        setWork([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const liveCourses =
          await getGoogleClassroomCourses(googleProviderToken);

        setCourses(liveCourses);

        const all = await Promise.all(
          liveCourses.map(async (course) => {
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
              (item): ClassroomWorkItem => ({
                ...item,
                courseName: course.name,
                submission: submissions.find(
                  (submission) =>
                    submission.courseWorkId === item.id
                ),
              })
            );
          })
        );

        setWork(all.flat());
      } catch (err) {
        console.error("Progress load failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Google Classroom progress."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [googleProviderToken]);

  const data = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const recentCutoff = new Date(todayStart);
    recentCutoff.setDate(recentCutoff.getDate() - 180);

    const recent = work.filter((item) => {
      const due = getDueDate(item);
      return !due || due >= recentCutoff;
    });

    const filtered =
      courseFilter === "all"
        ? recent
        : recent.filter((item) => item.courseId === courseFilter);

    const completed = filtered.filter(isSubmitted);

    const overdue = filtered.filter((item) => {
      const due = getDueDate(item);
      return (
        !isSubmitted(item) &&
        Boolean(due) &&
        due! < todayStart
      );
    });

    const graded = filtered.filter(
      (item) =>
        typeof item.submission?.assignedGrade === "number"
    );

    const percentages = graded
      .map(getPercentage)
      .filter((value): value is number => value !== null);

    const overallAverage =
      percentages.length > 0
        ? percentages.reduce((a, b) => a + b, 0) /
          percentages.length
        : null;

    const completionRate =
      filtered.length > 0
        ? (completed.length / filtered.length) * 100
        : 0;

    const summaries: CourseSummary[] = courses
      .map((course) => {
        const items = recent.filter(
          (item) => item.courseId === course.id
        );

        if (items.length === 0) return null;

        const done = items.filter(isSubmitted);

        const late = items.filter((item) => {
          const due = getDueDate(item);

          return (
            !isSubmitted(item) &&
            Boolean(due) &&
            due! < todayStart
          );
        });

        const coursePercentages = items
          .map(getPercentage)
          .filter((value): value is number => value !== null);

        return {
          id: course.id,
          name: course.name,
          total: items.length,
          completed: done.length,
          overdue: late.length,
          graded: coursePercentages.length,
          completionRate:
            items.length > 0
              ? (done.length / items.length) * 100
              : 0,
          averagePercent:
            coursePercentages.length > 0
              ? coursePercentages.reduce((a, b) => a + b, 0) /
                coursePercentages.length
              : null,
        };
      })
      .filter((value): value is CourseSummary => value !== null);

    const recentResults = graded
      .slice()
      .sort(
        (a, b) =>
          (getDueDate(b)?.getTime() ?? 0) -
          (getDueDate(a)?.getTime() ?? 0)
      )
      .slice(0, 15);

    const resultGraph = graded
      .map((item) => {
        const date = getDueDate(item);
        const percentage = getPercentage(item);

        if (!date || percentage === null) return null;

        return {
          timestamp: date.getTime(),
          label: formatShortDate(date),
          value: Math.round(percentage),
          title: item.title,
          course: item.courseName,
        };
      })
      .filter(
        (
          value
        ): value is {
          timestamp: number;
          label: string;
          value: number;
          title: string;
          course: string;
        } => value !== null
      )
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-12);

    const completionGraph = Array.from({ length: 8 }, (_, index) => {
      const start = new Date(todayStart);
      start.setDate(todayStart.getDate() - (7 - index) * 7);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const dueThisWeek = recent.filter((item) => {
        const due = getDueDate(item);
        return Boolean(due) && due! >= start && due! < end;
      });

      const doneThisWeek = dueThisWeek.filter(isSubmitted);

      return {
        label: formatShortDate(start),
        value:
          dueThisWeek.length > 0
            ? Math.round(
                (doneThisWeek.length / dueThisWeek.length) * 100
              )
            : 0,
      };
    });

    const classroomUpcoming = recent
      .filter((item) => {
        const due = getDueDate(item);
        return (
          !isSubmitted(item) &&
          Boolean(due) &&
          due! >= todayStart
        );
      })
      .map((item) => ({
        id: `classroom-${item.courseId}-${item.id}`,
        source: "Google Classroom" as const,
        subject: item.courseName,
        title: item.title,
        type: "Assignment",
        dueAt: getDueDate(item)!,
        weighting: null as number | null,
        confidence: null as number | null,
      }));

    const manualUpcoming = schoolAssessments
      .filter((item) => new Date(item.due_at) >= todayStart)
      .map((item) => ({
        id: `school-${item.id}`,
        source: "School" as const,
        subject: item.subject,
        title: item.title,
        type: item.assessment_type,
        dueAt: new Date(item.due_at),
        weighting: item.weighting,
        confidence: item.confidence,
      }));

    const upcomingAssessments = [
      ...classroomUpcoming,
      ...manualUpcoming,
    ]
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, 8);

    return {
      filtered,
      completed,
      overdue,
      graded,
      overallAverage,
      completionRate,
      summaries,
      recentResults,
      resultGraph,
      completionGraph,
      upcomingAssessments,
    };
  }, [
    courses,
    work,
    courseFilter,
    schoolAssessments,
  ]);

  const saveAssessment = async () => {
    if (
      !studentId ||
      !form.subject.trim() ||
      !form.title.trim() ||
      !form.dueDate
    ) {
      return;
    }

    setSavingAssessment(true);

    const dueAt = new Date(
      `${form.dueDate}T${form.dueTime || "09:00"}`
    );

    const { error: insertError } = await supabase
      .from("school_assessments")
      .insert({
        student_id: studentId,
        subject: form.subject.trim(),
        title: form.title.trim(),
        assessment_type: form.assessmentType,
        due_at: dueAt.toISOString(),
        weighting: form.weighting
          ? Number(form.weighting)
          : null,
        difficulty: form.difficulty
          ? Number(form.difficulty)
          : null,
        confidence: form.confidence
          ? Number(form.confidence)
          : null,
        notes: form.notes.trim() || null,
      });

    setSavingAssessment(false);

    if (insertError) {
      console.error("Assessment save failed:", insertError);
      return;
    }

    setForm(emptyAssessmentForm);
    setAddOpen(false);
    await loadSchoolAssessments();
  };

  if (showAIInsights) {
    return (
      <AIInsightsPage
        onBack={() => setShowAIInsights(false)}
        onNavigateToFocus={() => onNavigate?.("study")}
      />
    );
  }

  const graphData =
    graphMode === "results"
      ? data.resultGraph
      : data.completionGraph;

  const focusSessionsCompleted = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem("marquis_focus_sessions_completed");
    const value = Number(raw ?? "0");
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  })();

  const quizQuestionsCorrect = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem("marquis_quiz_questions_correct");
    const value = Number(raw ?? "0");
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  })();

  const xp = Math.max(
    0,
    data.completed.length * 15 +
      data.graded.length * 25 +
      schoolAssessments.length * 5 +
      focusSessionsCompleted * 10 +
      quizQuestionsCorrect * 2
  );
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const levelProgress = Math.min(100, ((xp % 250) / 250) * 100);

  const recentMomentum = data.completionGraph
    .slice(-4)
    .filter((point) => point.value > 0).length;



  const bestSubject = data.summaries
    .filter((summary) => summary.averagePercent !== null)
    .sort(
      (a, b) =>
        (b.averagePercent ?? 0) -
        (a.averagePercent ?? 0)
    )[0];

  const insightText =
    data.overdue.length > 0
      ? `${data.overdue.length} overdue ${
          data.overdue.length === 1 ? "task needs" : "tasks need"
        } attention. Clearing the oldest one is the fastest way to lift your completion trend.`
      : bestSubject?.averagePercent !== null &&
        bestSubject?.averagePercent !== undefined
      ? `${bestSubject.name} is currently your strongest subject at ${Math.round(
          bestSubject.averagePercent
        )}%. Keep that rhythm going.`
      : data.completed.length > 0
      ? `You have completed ${data.completed.length} ${
          data.completed.length === 1 ? "task" : "tasks"
        } recently. Your progress view will become richer as more grades are returned.`
      : "Once you begin completing and receiving graded work, this page will start showing meaningful trends instead of repeating your task list.";

  const achievementItems = [
    {
      icon: Clock,
      title: "Focus Finisher",
      unlocked: focusSessionsCompleted >= 1,
      value: focusSessionsCompleted,
      unit: focusSessionsCompleted === 1 ? "session" : "sessions",
      detail: "Complete a Pomodoro focus session",
      action: () => onNavigate?.("study"),
      accent: "#FFD500",
    },
    {
      icon: Star,
      title: "Quiz Sharp",
      unlocked: quizQuestionsCorrect >= 10,
      value: quizQuestionsCorrect,
      unit: "correct",
      detail: "Get 10 quiz questions right",
      action: () => onNavigate?.("study"),
      accent: "#FFF0A3",
    },
    {
      icon: CheckCircle2,
      title: "Task Finisher",
      unlocked: data.completed.length >= 1,
      value: data.completed.length,
      unit: data.completed.length === 1 ? "task" : "tasks",
      detail: "Complete tracked coursework",
      action: () => onNavigate?.("study"),
      accent: "#FFD500",
    },
  ];

  return (
    <div
      className="min-h-full relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #F8F6F0 0%, #FBFAF7 46%, #F1EEE7 100%)",
        paddingBottom: "28px",
        color: "#111111",
      }}
    >
      {/* Very subtle ambient glass background */}
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, 16, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          top: "26px",
          right: "-105px",
          background: "rgba(255,213,0,0.18)",
          filter: "blur(46px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "190px",
          height: "190px",
          borderRadius: "50%",
          top: "390px",
          left: "-120px",
          background: "rgba(255,255,255,0.72)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="relative"
        style={{
          padding: "22px 15px 0",
        }}
      >
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#9A7D00",
                fontSize: "14px",
                fontWeight: 850,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Learning overview
            </p>
            <h1
              style={{
                margin: "5px 0 0",
                fontSize: "31px",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.045em",
              }}
            >
              Your Progress
            </h1>
            <p
              style={{
                margin: "7px 0 0",
                color: "#77716A",
                fontSize: "11.5px",
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              See the pattern, not just the workload.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "15px",
              background: "rgba(255,255,255,0.74)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
              padding: "9px 11px",
              fontSize: "10.5px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </motion.button>
        </motion.header>

        {!googleProviderToken ? (
          <section
            style={{
              padding: "18px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(255,255,255,0.94)",
              boxShadow: "0 14px 32px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800 }}>
              Connect Google Classroom to see progress.
            </p>
          </section>
        ) : loading ? (
          <section
            className="flex items-center gap-3"
            style={{
              padding: "18px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(255,255,255,0.94)",
            }}
          >
            <Clock className="h-4 w-4" />
            <span style={{ fontSize: "11.5px", color: "#77716A" }}>
              Loading your progress…
            </span>
          </section>
        ) : error ? (
          <section
            style={{
              padding: "18px",
              borderRadius: "24px",
              background: "#FFF3F3",
              color: "#B63E3E",
              fontSize: "14px",
            }}
          >
            {error}
          </section>
        ) : (
          <>
            {/* HERO GLASS SNAPSHOT */}
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                position: "relative",
                overflow: "hidden",
                minHeight: "198px",
                padding: "19px",
                borderRadius: "29px",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,255,255,0.68))",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow:
                  "0 20px 48px rgba(36,30,15,0.09), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <motion.div
                aria-hidden="true"
                animate={{ rotate: [0, 8, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  width: "150px",
                  height: "150px",
                  borderRadius: "42px",
                  right: "-58px",
                  top: "-64px",
                  background:
                    "linear-gradient(145deg, rgba(255,213,0,0.38), rgba(255,213,0,0.08))",
                  transform: "rotate(14deg)",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "108px minmax(0,1fr)",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {/* Compact ring */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: "108px",
                    height: "108px",
                  }}
                >
                  <svg
                    width="108"
                    height="108"
                    viewBox="0 0 108 108"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="54"
                      cy="54"
                      r="45"
                      fill="none"
                      stroke="#ECE9E2"
                      strokeWidth="9"
                    />
                    <motion.circle
                      cx="54"
                      cy="54"
                      r="45"
                      fill="none"
                      stroke="#FFD500"
                      strokeWidth="9"
                      strokeLinecap="round"
                      pathLength="100"
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{
                        strokeDasharray: `${Math.round(
                          data.completionRate
                        )} 100`,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                      }}
                    />
                  </svg>

                  <div
                    style={{
                      position: "absolute",
                      textAlign: "center",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "27px",
                        lineHeight: 1,
                        fontWeight: 900,
                        letterSpacing: "-0.045em",
                      }}
                    >
                      {Math.round(data.completionRate)}%
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#77716A",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      completion
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Target
                      className="h-4 w-4"
                      style={{ color: "#B08E00" }}
                    />
                    <span
                      style={{
                        color: "#77716A",
                        fontSize: "14px",
                        fontWeight: 850,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Learning snapshot
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "16px",
                      lineHeight: 1.3,
                      fontWeight: 850,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {data.completed.length}{" "}
                    {data.completed.length === 1 ? "task" : "tasks"} completed
                  </p>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#77716A",
                      fontSize: "10.5px",
                      lineHeight: 1.45,
                    }}
                  >
                    {data.overdue.length > 0
                      ? `${data.overdue.length} overdue ${
                          data.overdue.length === 1 ? "task" : "tasks"
                        } still need attention.`
                      : "Nothing overdue right now — nice work."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                      gap: "6px",
                      marginTop: "13px",
                    }}
                  >
                    {[
                      {
                        value: data.completed.length,
                        label: "done",
                      },
                      {
                        value: data.graded.length,
                        label: "graded",
                      },
                      {
                        value:
                          data.overallAverage === null
                            ? "—"
                            : `${Math.round(data.overallAverage)}%`,
                        label: "average",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          minWidth: 0,
                          padding: "8px 6px",
                          borderRadius: "13px",
                          background: "rgba(245,242,235,0.82)",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: 900,
                          }}
                        >
                          {item.value}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: "2px",
                            color: "#888178",
                            fontSize: "11.5px",
                            fontWeight: 750,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* CLEAN SEGMENTED CONTROL */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: "4px",
                marginTop: "14px",
                padding: "4px",
                borderRadius: "17px",
                background: "rgba(229,225,217,0.58)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              {(
                [
                  ["overview", "Overview"],
                  ["results", "Results"],
                  ["subjects", "Subjects"],
                ] as const
              ).map(([value, label]) => {
                const selected = activeTab === value;

                return (
                  <motion.button
                    type="button"
                    key={value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab(value)}
                    style={{
                      minHeight: "38px",
                      border: "none",
                      borderRadius: "13px",
                      background: selected
                        ? "rgba(255,255,255,0.94)"
                        : "transparent",
                      boxShadow: selected
                        ? "0 5px 15px rgba(0,0,0,0.07)"
                        : "none",
                      color: "#111111",
                      fontSize: "10.5px",
                      fontWeight: selected ? 900 : 750,
                      cursor: "pointer",
                      transition: "all 180ms ease",
                    }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "14px" }}
              >
                {/* ONE MAIN CHART */}
                <section
                  style={{
                    padding: "17px",
                    borderRadius: "27px",
                    background: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.96)",
                    boxShadow: "0 14px 34px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 900,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          Performance
                        </h2>
                      </div>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#837D75",
                          fontSize: "9.5px",
                        }}
                      >
                        Your one trend view — no repeated dashboards.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        padding: "3px",
                        borderRadius: "11px",
                        background: "#F0EEE8",
                      }}
                    >
                      {(
                        [
                          ["results", "Results"],
                          ["completion", "Completion"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          type="button"
                          key={value}
                          onClick={() => setGraphMode(value)}
                          style={{
                            border: "none",
                            borderRadius: "9px",
                            padding: "6px 7px",
                            background:
                              graphMode === value ? "#FFFFFF" : "transparent",
                            boxShadow:
                              graphMode === value
                                ? "0 3px 9px rgba(0,0,0,0.07)"
                                : "none",
                            fontSize: "10.5px",
                            fontWeight: 850,
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {graphData.length === 0 ? (
                    <div
                      style={{
                        minHeight: "132px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "37px",
                          height: "37px",
                          borderRadius: "13px",
                          background: "#FFF7CF",
                          color: "#9A7B00",
                        }}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p
                        style={{
                          margin: "10px 0 0",
                          fontSize: "14px",
                          fontWeight: 800,
                        }}
                      >
                        Your trend will appear here
                      </p>
                      <p
                        style={{
                          maxWidth: "195px",
                          margin: "4px 0 0",
                          color: "#8A837A",
                          fontSize: "9.5px",
                          lineHeight: 1.45,
                        }}
                      >
                        Once grades or weekly completions come through, this
                        space becomes your visual timeline.
                      </p>
                    </div>
                  ) : (
                    <div style={{ height: "190px", marginTop: "10px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={graphData}
                          margin={{
                            top: 10,
                            right: 8,
                            left: -28,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="2 5"
                            vertical={false}
                            stroke="#E7E3DB"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{
                              fontSize: 8,
                              fill: "#8A847C",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{
                              fontSize: 8,
                              fill: "#8A847C",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{
                              stroke: "#E4DFD5",
                              strokeDasharray: "3 3",
                            }}
                            contentStyle={{
                              borderRadius: "15px",
                              border: "1px solid rgba(0,0,0,0.05)",
                              boxShadow: "0 10px 24px rgba(0,0,0,0.09)",
                              fontSize: "14px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#D7AD00"
                            strokeWidth={3}
                            dot={{
                              r: 3.5,
                              fill: "#FFD500",
                              stroke: "#FFFFFF",
                              strokeWidth: 2,
                            }}
                            activeDot={{
                              r: 5,
                              fill: "#111111",
                              stroke: "#FFD500",
                              strokeWidth: 2,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                {/* SUBJECT SNAPSHOT, NOT ANOTHER GRAPH */}
                <section
                  style={{
                    marginTop: "14px",
                    padding: "17px",
                    borderRadius: "27px",
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(255,255,255,0.96)",
                    boxShadow: "0 13px 30px rgba(0,0,0,0.055)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 900,
                        }}
                      >
                        Subject snapshot
                      </h2>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#837D75",
                          fontSize: "9.5px",
                        }}
                      >
                        Completion by subject
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("subjects")}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "9.5px",
                        fontWeight: 850,
                        cursor: "pointer",
                      }}
                    >
                      See all
                    </button>
                  </div>

                  <div style={{ marginTop: "13px" }}>
                    {data.summaries.slice(0, 4).map((summary, index) => (
                      <motion.button
                        type="button"
                        key={summary.id}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setCourseFilter(summary.id)}
                        style={{
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "86px minmax(0,1fr) 38px",
                          alignItems: "center",
                          gap: "8px",
                          padding: index === 0 ? "3px 0 9px" : "9px 0",
                          border: "none",
                          borderTop:
                            index === 0 ? "none" : "1px solid #EFECE6",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {summary.name}
                        </span>

                        <div
                          style={{
                            height: "7px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "#ECE9E2",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${Math.round(summary.completionRate)}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.75,
                              delay: index * 0.06,
                            }}
                            style={{
                              height: "100%",
                              borderRadius: "999px",
                              background: "#FFD500",
                            }}
                          />
                        </div>

                        <strong
                          style={{
                            textAlign: "right",
                            fontSize: "11.5px",
                          }}
                        >
                          {Math.round(summary.completionRate)}%
                        </strong>
                      </motion.button>
                    ))}

                    {data.summaries.length === 0 && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          color: "#888178",
                          fontSize: "11.5px",
                        }}
                      >
                        Subject progress will appear once Classroom activity is
                        available.
                      </p>
                    )}
                  </div>
                </section>

                {/* REWARD / MOMENTUM SYSTEM */}
                <section
                  style={{
                    marginTop: "14px",
                    overflow: "hidden",
                    borderRadius: "27px",
                    background:
                      "linear-gradient(145deg, #171717 0%, #080808 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 17px 36px rgba(0,0,0,0.14)",
                  }}
                >
                  <div style={{ padding: "17px" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: "39px",
                            height: "39px",
                            borderRadius: "14px",
                            background: "#FFD500",
                            color: "#000000",
                          }}
                        >
                          <Award className="h-5 w-5" />
                        </div>

                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: "#FFD500",
                              fontSize: "10.5px",
                              fontWeight: 850,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Reward system
                          </p>
                          <h2
                            style={{
                              margin: "3px 0 0",
                              fontSize: "16px",
                              fontWeight: 900,
                            }}
                          >
                            Level {level} Learner
                          </h2>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                            color: "#FFD500",
                          }}
                        >
                          {xp} XP
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: "2px",
                            color: "rgba(255,255,255,0.46)",
                            fontSize: "11.5px",
                          }}
                        >
                          academic activity
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        height: "8px",
                        marginTop: "15px",
                        borderRadius: "999px",
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.10)",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${levelProgress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.85 }}
                        style={{
                          height: "100%",
                          borderRadius: "999px",
                          background: "#FFD500",
                        }}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between"
                      style={{ marginTop: "6px" }}
                    >
                      <span
                        style={{
                          color: "rgba(255,255,255,0.46)",
                          fontSize: "11.5px",
                        }}
                      >
                        {xp % 250} / 250 XP
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.46)",
                          fontSize: "11.5px",
                        }}
                      >
                        Level {level + 1}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                      gap: "8px",
                      padding: "0 14px 14px",
                      background: "#101010",
                    }}
                  >
                    {achievementItems.map((achievement) => {
                      const Icon = achievement.icon;

                      return (
                        <motion.button
                          type="button"
                          key={achievement.title}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={achievement.action}
                          style={{
                            minWidth: 0,
                            minHeight: "118px",
                            padding: "12px 10px",
                            border: achievement.unlocked
                              ? "1px solid rgba(255,213,0,0.32)"
                              : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "18px",
                            background: achievement.unlocked
                              ? "linear-gradient(145deg, rgba(255,213,0,0.10), rgba(255,255,255,0.035))"
                              : "rgba(255,255,255,0.035)",
                            color: "#FFFFFF",
                            textAlign: "left",
                            cursor: "pointer",
                            opacity: achievement.unlocked ? 1 : 0.72,
                          }}
                        >
                          <div
                            className="flex items-center justify-between gap-2"
                          >
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: "31px",
                                height: "31px",
                                borderRadius: "11px",
                                background: achievement.unlocked
                                  ? achievement.accent
                                  : "rgba(255,255,255,0.08)",
                                color: achievement.unlocked
                                  ? "#000000"
                                  : "rgba(255,255,255,0.5)",
                              }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <span
                              style={{
                                padding: "4px 6px",
                                borderRadius: "999px",
                                background: achievement.unlocked
                                  ? "rgba(255,213,0,0.12)"
                                  : "rgba(255,255,255,0.05)",
                                color: achievement.unlocked
                                  ? "#FFD500"
                                  : "rgba(255,255,255,0.38)",
                                fontSize: "8px",
                                fontWeight: 850,
                              }}
                            >
                              {achievement.unlocked ? "Unlocked" : "Locked"}
                            </span>
                          </div>

                          <p
                            style={{
                              margin: "10px 0 0",
                              fontSize: "10.5px",
                              lineHeight: 1.1,
                              fontWeight: 900,
                            }}
                          >
                            {achievement.title}
                          </p>

                          <p
                            style={{
                              margin: "5px 0 0",
                              color: "rgba(255,255,255,0.52)",
                              fontSize: "8px",
                              lineHeight: 1.35,
                            }}
                          >
                            {achievement.detail}
                          </p>

                          <div
                            className="flex items-end justify-between gap-2"
                            style={{
                              marginTop: "11px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  color: achievement.unlocked
                                    ? "#FFD500"
                                    : "#FFFFFF",
                                  fontSize: "12px",
                                  fontWeight: 900,
                                }}
                              >
                                {achievement.value}
                              </strong>
                              <span
                                style={{
                                  display: "block",
                                  marginTop: "1px",
                                  color: "rgba(255,255,255,0.38)",
                                  fontSize: "7px",
                                  fontWeight: 700,
                                }}
                              >
                                {achievement.unit}
                              </span>
                            </div>

                            <ChevronRight
                              className="h-3.5 w-3.5"
                              style={{
                                color: achievement.unlocked
                                  ? "#FFD500"
                                  : "rgba(255,255,255,0.28)",
                              }}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* COMPACT UPCOMING */}
                <section
                  style={{
                    marginTop: "14px",
                    padding: "17px",
                    borderRadius: "27px",
                    background: "rgba(255,255,255,0.80)",
                    border: "1px solid rgba(255,255,255,0.96)",
                    boxShadow: "0 13px 30px rgba(0,0,0,0.055)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 900,
                        }}
                      >
                        Coming up
                      </h2>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#837D75",
                          fontSize: "9.5px",
                        }}
                      >
                        Classroom + your assessments
                      </p>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAddOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "none",
                        borderRadius: "11px",
                        background: "#111111",
                        color: "#FFFFFF",
                        padding: "7px 9px",
                        fontSize: "14px",
                        fontWeight: 850,
                        cursor: "pointer",
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </motion.button>
                  </div>

                  {assessmentLoading ? (
                    <p
                      style={{
                        margin: "13px 0 0",
                        color: "#837D75",
                        fontSize: "11.5px",
                      }}
                    >
                      Loading assessments…
                    </p>
                  ) : data.upcomingAssessments.length === 0 ? (
                    <div
                      style={{
                        marginTop: "13px",
                        padding: "16px",
                        borderRadius: "16px",
                        background: "#F5F2EB",
                        textAlign: "center",
                      }}
                    >
                      <CalendarDays
                        className="mx-auto h-4 w-4"
                        style={{ color: "#A48500" }}
                      />
                      <p
                        style={{
                          margin: "7px 0 0",
                          fontSize: "11.5px",
                          fontWeight: 800,
                        }}
                      >
                        Nothing upcoming
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: "12px" }}>
                      {data.upcomingAssessments.slice(0, 4).map(
                        (item, index) => {
                          const days = daysFromNow(item.dueAt);

                          return (
                            <motion.div
                              key={item.id}
                              whileHover={{ x: 3 }}
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "34px minmax(0,1fr) 45px",
                                alignItems: "center",
                                gap: "10px",
                                padding: index === 0 ? "4px 0 10px" : "10px 0",
                                borderTop:
                                  index === 0
                                    ? "none"
                                    : "1px solid #EEEAE3",
                              }}
                            >
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "12px",
                                  background:
                                    item.source === "School"
                                      ? "#111111"
                                      : "#FFF4B5",
                                  color:
                                    item.source === "School"
                                      ? "#FFD500"
                                      : "#111111",
                                }}
                              >
                                {item.source === "School" ? (
                                  <GraduationCap className="h-4 w-4" />
                                ) : (
                                  <BookOpen className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  style={{
                                    margin: 0,
                                    color: "#898279",
                                    fontSize: "10.5px",
                                    fontWeight: 800,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.subject}
                                </p>
                                <p
                                  style={{
                                    margin: "3px 0 0",
                                    fontSize: "10.5px",
                                    fontWeight: 850,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.title}
                                </p>
                                <p
                                  style={{
                                    margin: "2px 0 0",
                                    color: "#918A82",
                                    fontSize: "11.5px",
                                  }}
                                >
                                  {item.source}
                                  {item.weighting !== null
                                    ? ` · ${item.weighting}%`
                                    : ""}
                                </p>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <strong
                                  style={{
                                    display: "block",
                                    fontSize: "10.5px",
                                    color:
                                      days <= 2 ? "#C44949" : "#111111",
                                  }}
                                >
                                  {days === 0
                                    ? "Today"
                                    : days === 1
                                    ? "Tomorrow"
                                    : `${days}d`}
                                </strong>
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "3px",
                                    color: "#918A82",
                                    fontSize: "11.5px",
                                  }}
                                >
                                  {formatShortDate(item.dueAt)}
                                </span>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>

                {/* ONE SMALL INSIGHT */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAIInsights(true)}
                  style={{
                    width: "100%",
                    marginTop: "14px",
                    padding: "15px",
                    border: "1px solid rgba(0,0,0,0.05)",
                    borderRadius: "23px",
                    background:
                      "linear-gradient(135deg, rgba(255,248,207,0.92), rgba(255,255,255,0.88))",
                    boxShadow: "0 11px 26px rgba(0,0,0,0.05)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex shrink-0 items-center justify-center"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "12px",
                        background: "#FFD500",
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        style={{
                          margin: 0,
                          color: "#9A7D00",
                          fontSize: "11.5px",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Insight
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "10.5px",
                          fontWeight: 750,
                          lineHeight: 1.45,
                        }}
                      >
                        {insightText}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </div>
                </motion.button>
              </motion.div>
            )}

            {/* RESULTS TAB */}
            {activeTab === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "14px" }}
              >
                <section
                  style={{
                    padding: "17px",
                    borderRadius: "27px",
                    background: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(255,255,255,0.96)",
                    boxShadow: "0 14px 32px rgba(0,0,0,0.055)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>
                      Recent results
                    </h2>
                  </div>

                  {data.recentResults.length === 0 ? (
                    <div
                      style={{
                        padding: "34px 12px",
                        textAlign: "center",
                        color: "#837D75",
                        fontSize: "10.5px",
                      }}
                    >
                      No returned grades are available yet.
                    </div>
                  ) : (
                    <div style={{ marginTop: "12px" }}>
                      {data.recentResults.map((item, index) => {
                        const percentage = getPercentage(item);
                        const due = getDueDate(item);

                        return (
                          <motion.div
                            key={`${item.courseId}-${item.id}`}
                            whileHover={{ x: 3 }}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0,1fr) 50px",
                              gap: "10px",
                              padding: index === 0 ? "3px 0 11px" : "11px 0",
                              borderTop:
                                index === 0
                                  ? "none"
                                  : "1px solid #EEEAE3",
                            }}
                          >
                            <div className="min-w-0">
                              <p
                                style={{
                                  margin: 0,
                                  color: "#8B847B",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                }}
                              >
                                {item.courseName}
                              </p>
                              <p
                                style={{
                                  margin: "3px 0 0",
                                  fontSize: "10.5px",
                                  fontWeight: 850,
                                }}
                              >
                                {item.title}
                              </p>
                              {due && (
                                <p
                                  style={{
                                    margin: "3px 0 0",
                                    color: "#918A82",
                                    fontSize: "11.5px",
                                  }}
                                >
                                  {formatShortDate(due)}
                                </p>
                              )}
                            </div>

                            <div style={{ textAlign: "right" }}>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "14px",
                                  fontWeight: 900,
                                }}
                              >
                                {percentage === null
                                  ? "—"
                                  : `${Math.round(percentage)}%`}
                              </strong>
                              <span
                                style={{
                                  display: "block",
                                  marginTop: "3px",
                                  color: "#918A82",
                                  fontSize: "11.5px",
                                }}
                              >
                                {item.submission?.assignedGrade}
                                {typeof item.maxPoints === "number"
                                  ? `/${item.maxPoints}`
                                  : ""}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {/* SUBJECTS TAB */}
            {activeTab === "subjects" && (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "14px" }}
              >
                <section
                  style={{
                    padding: "17px",
                    borderRadius: "27px",
                    background: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(255,255,255,0.96)",
                    boxShadow: "0 14px 32px rgba(0,0,0,0.055)",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>
                    Your subjects
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#837D75",
                      fontSize: "9.5px",
                    }}
                  >
                    One clean view of completion and average.
                  </p>

                  <div style={{ marginTop: "13px" }}>
                    {data.summaries.map((summary, index) => (
                      <motion.div
                        key={summary.id}
                        whileHover={{ x: 3 }}
                        style={{
                          padding: index === 0 ? "3px 0 12px" : "12px 0",
                          borderTop:
                            index === 0 ? "none" : "1px solid #EEEAE3",
                        }}
                      >
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 850,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {summary.name}
                            </p>
                            <p
                              style={{
                                margin: "3px 0 0",
                                color: "#918A82",
                                fontSize: "10.5px",
                              }}
                            >
                              {summary.completed}/{summary.total} complete
                              {summary.overdue > 0
                                ? ` · ${summary.overdue} overdue`
                                : ""}
                            </p>
                          </div>
                          <strong
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 900,
                            }}
                          >
                            {summary.averagePercent === null
                              ? "—"
                              : `${Math.round(summary.averagePercent)}%`}
                          </strong>
                        </div>

                        <div
                          style={{
                            height: "7px",
                            marginTop: "9px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "#ECE9E2",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.round(summary.completionRate)}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              delay: index * 0.04,
                            }}
                            style={{
                              height: "100%",
                              borderRadius: "999px",
                              background: "#FFD500",
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Keep original assessment dialog/functionality */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-sm max-h-[85vh] overflow-y-auto"
          style={{ borderRadius: "22px" }}
        >
          <DialogHeader>
            <DialogTitle>Add School Assessment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Subject">
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="e.g. Chemistry"
                className="w-full h-11 px-3 rounded-xl border border-gray-200"
              />
            </Field>

            <Field label="Assessment name">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g. Equilibrium Exam"
                className="w-full h-11 px-3 rounded-xl border border-gray-200"
              />
            </Field>

            <Field label="Type">
              <select
                value={form.assessmentType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    assessmentType: e.target.value,
                  }))
                }
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white"
              >
                <option>Exam</option>
                <option>Test</option>
                <option>Assignment</option>
                <option>Practical</option>
                <option>Presentation</option>
                <option>Other</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border border-gray-200"
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={form.dueTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dueTime: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border border-gray-200"
                />
              </Field>
            </div>

            <Field label="Weighting (%) — optional">
              <input
                type="number"
                min="0"
                max="100"
                value={form.weighting}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    weighting: e.target.value,
                  }))
                }
                placeholder="25"
                className="w-full h-11 px-3 rounded-xl border border-gray-200"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Difficulty">
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white"
                >
                  <option value="1">1 — Easy</option>
                  <option value="2">2</option>
                  <option value="3">3 — Medium</option>
                  <option value="4">4</option>
                  <option value="5">5 — Hard</option>
                </select>
              </Field>

              <Field label="Confidence">
                <select
                  value={form.confidence}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confidence: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white"
                >
                  <option value="1">1 — Low</option>
                  <option value="2">2</option>
                  <option value="3">3 — Okay</option>
                  <option value="4">4</option>
                  <option value="5">5 — High</option>
                </select>
              </Field>
            </div>

            <Field label="Notes — optional">
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Topics, chapters, teacher notes..."
                className="w-full p-3 rounded-xl border border-gray-200 resize-none"
              />
            </Field>

            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => void saveAssessment()}
              disabled={
                savingAssessment ||
                !form.subject.trim() ||
                !form.title.trim() ||
                !form.dueDate
              }
            >
              {savingAssessment ? "Saving..." : "Add Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-xs font-bold text-[#555]">
        {label}
      </span>
      {children}
    </label>
  );
}