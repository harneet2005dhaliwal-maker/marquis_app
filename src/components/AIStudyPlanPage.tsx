import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { Button } from "./ui/button";

import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

import {
  getGoogleClassroomCourses,
  getGoogleClassroomCoursework,
  getMyGoogleClassroomSubmissions,
  type GoogleClassroomCourseWork,
  type GoogleClassroomSubmission,
} from "../services/googleClassroom";

interface AIStudyPlanPageProps {
  onBack: () => void;
  onStartSession?: () => void;
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

interface StudyBlock {
  id: string;
  day: string;
  dateKey: string;
  time: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  priority: "high" | "medium" | "low";
  dueDate: Date | null;
  alternateLink?: string;
  source: "Google Classroom" | "School";
  reason: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getDueDate(work: GoogleClassroomCourseWork): Date | null {
  if (!work.dueDate) return null;

  return new Date(
    work.dueDate.year,
    work.dueDate.month - 1,
    work.dueDate.day,
    work.dueTime?.hours ?? 23,
    work.dueTime?.minutes ?? 59
  );
}

function isSubmitted(work: ClassroomWorkItem) {
  return (
    work.submission?.state === "TURNED_IN" ||
    work.submission?.state === "RETURNED"
  );
}

function startOfToday() {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

function dayDiff(date: Date) {
  const today = startOfToday();
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  return Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getPriority(item: ClassroomWorkItem) {
  const due = getDueDate(item);
  if (!due) return "low" as const;

  const days = dayDiff(due);
  if (days <= 3) return "high" as const;
  if (days <= 10) return "medium" as const;
  return "low" as const;
}

function recommendedMinutes(priority: StudyBlock["priority"]) {
  if (priority === "high") return 45;
  if (priority === "medium") return 35;
  return 25;
}

function formatDisplayTime(time: string) {
  const [hourRaw, minute] = time.split(":");
  const hour = Number(hourRaw);

  if (!Number.isFinite(hour)) return time;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getNextSevenDays() {
  const today = startOfToday();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      date,
      dateKey: date.toISOString().slice(0, 10),
      day: date.toLocaleDateString("en-AU", {
        weekday: "long",
      }),
      shortDay: date.toLocaleDateString("en-AU", {
        weekday: "short",
      }),
      dayNumber: date.getDate(),
    };
  });
}

type PlanCandidate = {
  id: string;
  subject: string;
  topic: string;
  dueDate: Date;
  priority: StudyBlock["priority"];
  alternateLink: string | undefined;
  source: "Google Classroom" | "School";
  weighting: number | null;
  difficulty: number | null;
  confidence: number | null;
  score: number;
  sessionsNeeded: number;
  reason: string;
};

function buildSchedule(
  items: ClassroomWorkItem[],
  assessments: SchoolAssessment[]
): StudyBlock[] {
  const week = getNextSevenDays();
  const today = startOfToday();

  // IMPORTANT:
  // This planner intentionally does NOT schedule every incomplete Classroom item.
  // It selects the highest-value work for the next week.
  const classroomCandidates: PlanCandidate[] = items
    .filter((item) => !isSubmitted(item))
    .map((item): PlanCandidate | null => {
      const dueDate = getDueDate(item);
      if (!dueDate) return null;

      const days = dayDiff(dueDate);

      // Ignore extremely old backlog in the automatic weekly plan.
      // Students can still deal with those through Progress/Study.
      if (days < -30 || days > 21) return null;

      let score = 0;
      if (days < 0) {
        score += 58 - Math.min(24, Math.abs(days));
      } else {
        score += Math.max(12, 52 - days * 3);
      }

      const priority = getPriority(item);
      if (priority === "high") score += 16;
      if (priority === "medium") score += 7;

      return {
        id: `${item.courseId}-${item.id}`,
        subject: item.courseName,
        topic: item.title,
        dueDate,
        priority,
        alternateLink: item.alternateLink,
        source: "Google Classroom" as const,
        weighting: null,
        difficulty: null,
        confidence: null,
        score,
        sessionsNeeded: 1,
        reason:
          days < 0
            ? `${Math.abs(days)}d overdue`
            : days === 0
            ? "Due today"
            : `${days}d until due`,
      };
    })
    .filter((value): value is PlanCandidate => value !== null);

  const schoolCandidates: PlanCandidate[] = assessments
    .filter((assessment) => new Date(assessment.due_at) >= today)
    .map((assessment): PlanCandidate | null => {
      const dueDate = new Date(assessment.due_at);
      const days = dayDiff(dueDate);

      // Keep important school assessments in view further ahead.
      if (days > 35) return null;

      const weighting = assessment.weighting ?? 10;
      const difficulty = assessment.difficulty ?? 3;
      const confidence = assessment.confidence ?? 3;

      let score =
        Math.max(10, 56 - days * 2.2) +
        weighting * 0.75 +
        difficulty * 5 +
        (6 - confidence) * 6;

      let sessionsNeeded = 1;
      if (weighting >= 25 || confidence <= 2 || difficulty >= 4) {
        sessionsNeeded = days <= 7 ? 3 : 2;
        score += 18;
      } else if (days <= 10) {
        sessionsNeeded = 2;
      }

      const priority: StudyBlock["priority"] =
        score >= 80 ? "high" : score >= 55 ? "medium" : "low";

      return {
        id: `school-${assessment.id}`,
        subject: assessment.subject,
        topic: `${assessment.assessment_type}: ${assessment.title}`,
        dueDate,
        priority,
        alternateLink: undefined,
        source: "School" as const,
        weighting: assessment.weighting,
        difficulty: assessment.difficulty,
        confidence: assessment.confidence,
        score,
        sessionsNeeded,
        reason:
          assessment.weighting !== null
            ? `${assessment.weighting}% assessment`
            : `${Math.max(0, days)}d until assessment`,
      };
    })
    .filter((value): value is PlanCandidate => value !== null);

  // Keep the weekly plan deliberately small and useful.
  const selected = [...schoolCandidates, ...classroomCandidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const expanded: Array<PlanCandidate & { sessionIndex: number }> = [];

  selected.forEach((item) => {
    for (let sessionIndex = 0; sessionIndex < item.sessionsNeeded; sessionIndex += 1) {
      expanded.push({
        ...item,
        sessionIndex,
      });
    }
  });

  // Hard ceiling: no "167 hour" weekly plans.
  const sessions = expanded
    .sort((a, b) => b.score - a.score)
    .slice(0, 14);

  const usedByDay = new Map<number, number>();
  const blocks: StudyBlock[] = [];

  sessions.forEach((item) => {
    const rawDueOffset = dayDiff(item.dueDate);

    // Overdue work should be RECOVERED across the week rather than
    // stacked onto today's column.
    const latestDay =
      rawDueOffset < 0
        ? 5
        : Math.min(6, Math.max(0, rawDueOffset - 1));

    const preferred =
      item.sessionsNeeded > 1
        ? Math.max(
            0,
            latestDay -
              (item.sessionsNeeded - 1 - item.sessionIndex) * 2
          )
        : rawDueOffset < 0
        ? Math.min(4, item.sessionIndex + 1)
        : latestDay;

    const eligibleDays = Array.from(
      { length: latestDay + 1 },
      (_, dayIndex) => dayIndex
    ).sort(
      (a, b) =>
        Math.abs(a - preferred) - Math.abs(b - preferred)
    );

    const chosenDay = eligibleDays.find((candidateDay) => {
      const date = week[candidateDay].date;
      const weekend =
        date.getDay() === 0 || date.getDay() === 6;
      const capacity = weekend ? 3 : 2;
      const used = usedByDay.get(candidateDay) ?? 0;

      return used < capacity;
    });

    // If the week is genuinely full before this task's deadline,
    // leave it out instead of creating an impossible plan.
    if (chosenDay === undefined) {
      return;
    }

    const slot = usedByDay.get(chosenDay) ?? 0;
    usedByDay.set(chosenDay, slot + 1);

    const weekend =
      week[chosenDay].date.getDay() === 0 ||
      week[chosenDay].date.getDay() === 6;

    const baseHour = weekend ? 10 : 16;
    const hour = baseHour + slot;
    let durationMinutes = recommendedMinutes(item.priority);

    if (
      item.source === "School" &&
      ((item.weighting !== null && item.weighting >= 25) ||
        (item.confidence !== null && item.confidence <= 2))
    ) {
      durationMinutes = Math.max(durationMinutes, 45);
    }

    blocks.push({
      id: `${item.id}-session-${item.sessionIndex}`,
      day: week[chosenDay].day,
      dateKey: week[chosenDay].dateKey,
      time: `${String(hour).padStart(2, "0")}:00`,
      subject: item.subject,
      topic: item.topic,
      durationMinutes,
      priority: item.priority,
      dueDate: item.dueDate,
      alternateLink: item.alternateLink,
      source: item.source,
      reason: item.reason,
    });
  });

  return blocks.sort((a, b) => {
    const aIndex = week.findIndex((d) => d.dateKey === a.dateKey);
    const bIndex = week.findIndex((d) => d.dateKey === b.dateKey);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.time.localeCompare(b.time);
  });
}

export function AIStudyPlanPage({
  onBack,
  onStartSession,
}: AIStudyPlanPageProps) {
  const { googleProviderToken, studentId } = useAuth();

  const [work, setWork] = useState<ClassroomWorkItem[]>([]);
  const [schoolAssessments, setSchoolAssessments] =
    useState<SchoolAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedBlocks, setCompletedBlocks] =
    useState<Set<string>>(new Set());

  const weekDays = useMemo(() => getNextSevenDays(), []);

  const [selectedDay, setSelectedDay] = useState(
    weekDays[0]?.day ?? "Monday"
  );

  useEffect(() => {
    const load = async () => {
      if (!googleProviderToken) return;

      setLoading(true);
      setError(null);

      try {
        const courses =
          await getGoogleClassroomCourses(googleProviderToken);

        const all = await Promise.all(
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
        console.error("Study plan load failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to build a study plan."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [googleProviderToken]);

  useEffect(() => {
    const loadSchoolAssessments = async () => {
      if (!studentId) {
        setSchoolAssessments([]);
        return;
      }

      const { data, error: assessmentError } = await supabase
        .from("school_assessments")
        .select(
          "id, student_id, subject, title, assessment_type, due_at, weighting, difficulty, confidence, notes"
        )
        .eq("student_id", studentId)
        .gte("due_at", new Date().toISOString())
        .order("due_at", { ascending: true });

      if (assessmentError) {
        console.error(
          "Study plan school assessments failed:",
          assessmentError
        );
        return;
      }

      setSchoolAssessments((data ?? []) as SchoolAssessment[]);
    };

    void loadSchoolAssessments();
  }, [studentId]);

  const schedule = useMemo(
    () => buildSchedule(work, schoolAssessments),
    [work, schoolAssessments]
  );

  const todayBlocks = schedule.filter(
    (block) => block.day === selectedDay
  );

  const selectedDayInfo =
    weekDays.find((item) => item.day === selectedDay) ??
    weekDays[0];

  const totalRecommendedMinutes = schedule.reduce(
    (sum, block) => sum + block.durationMinutes,
    0
  );

  const completionRate =
    schedule.length > 0
      ? (completedBlocks.size / schedule.length) * 100
      : 0;

  const nextSession = todayBlocks.find(
    (block) => !completedBlocks.has(block.id)
  );

  const toggleComplete = (id: string) => {
    setCompletedBlocks((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleStartSession = () => {
    if (!nextSession) return;

    toast.success(`Starting: ${nextSession.subject}`, {
      description: `${nextSession.topic} • ${nextSession.durationMinutes} min`,
    });

    onStartSession?.();
  };

  const exportToCalendar = () => {
    if (schedule.length === 0) return;

    const nextSevenDays = getNextSevenDays();

    const dateForDay = new Map(
      nextSevenDays.map((item) => [item.day, item.date])
    );

    const formatICS = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const h = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");

      return `${y}${m}${d}T${h}${min}00`;
    };

    let ics = "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "PRODID:-//Marquis Education//Study Plan//EN\n";

    schedule.forEach((block) => {
      const base = dateForDay.get(block.day);
      if (!base) return;

      const start = new Date(base);
      const [hour, minute] = block.time.split(":").map(Number);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + block.durationMinutes);

      ics += "BEGIN:VEVENT\n";
      ics += `UID:${block.id}-${Date.now()}@marquis.education\n`;
      ics += `DTSTAMP:${formatICS(new Date())}\n`;
      ics += `DTSTART:${formatICS(start)}\n`;
      ics += `DTEND:${formatICS(end)}\n`;
      ics += `SUMMARY:${block.subject}: ${block.topic}\n`;
      ics += `DESCRIPTION:Recommended Marquis study session. Priority: ${block.priority}.\n`;
      ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR";

    const blob = new Blob([ics], {
      type: "text/calendar;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "marquis-study-plan.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Study plan exported");
  };

  return (
    <div
      className="min-h-screen"
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg,#F7F5EF 0%,#FBFAF7 50%,#F0ECE3 82%,#ECE7DE 100%)",
        color: "#111111",
        paddingBottom: "132px",
      }}
    >
      <div style={{ padding: "18px 14px 0" }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center gap-2"
          style={{
            border: "none",
            background: "transparent",
            padding: "5px 0",
            marginBottom: "14px",
            color: "#68635C",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Study Coach
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "17px" }}
        >
          <div className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4" style={{ color: "#A98700" }} />
            <span
              style={{
                color: "#9A7D00",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Smart weekly plan
            </span>
          </div>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: "38px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.045em",
            }}
          >
            Your week, mapped out.
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              maxWidth: "320px",
              color: "#77716A",
              fontSize: "13px",
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            A focused study routine built from school assessments and the
            highest-value Classroom work — not every unfinished task.
          </p>
        </motion.header>

        {!googleProviderToken ? (
          <section
            style={{
              padding: "17px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(255,255,255,0.96)",
            }}
          >
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 800 }}>
              Connect Google Classroom to generate your week.
            </p>
          </section>
        ) : loading ? (
          <section
            className="flex items-center gap-3"
            style={{
              padding: "17px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.82)",
            }}
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span style={{ fontSize: "12px", color: "#77716A" }}>
              Building a realistic weekly plan…
            </span>
          </section>
        ) : error ? (
          <section
            style={{
              padding: "17px",
              borderRadius: "24px",
              background: "#FFF2F2",
              color: "#B54242",
              fontSize: "12px",
            }}
          >
            {error}
          </section>
        ) : (
          <div className="space-y-4">
            {/* SUMMARY GLASS */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "18px",
                borderRadius: "28px",
                background:
                  "linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))",
                backdropFilter: "blur(26px)",
                WebkitBackdropFilter: "blur(26px)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow:
                  "0 18px 40px rgba(36,30,15,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <motion.div
                aria-hidden="true"
                animate={{ rotate: [0, 7, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  width: "120px",
                  height: "120px",
                  right: "-48px",
                  top: "-55px",
                  borderRadius: "36px",
                  background: "rgba(255,213,0,0.28)",
                  transform: "rotate(12deg)",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: "#9A7D00",
                        fontSize: "13px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      This week
                    </p>
                    <h2
                      style={{
                        margin: "5px 0 0",
                        fontSize: "12px",
                        fontWeight: 900,
                        letterSpacing: "-0.025em",
                      }}
                    >
                      {schedule.length} focused study blocks
                    </h2>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#817A72",
                        fontSize: "12px",
                        lineHeight: 1.45,
                      }}
                    >
                      {(totalRecommendedMinutes / 60).toFixed(1)} hours total
                      across the week.
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "15px",
                      background: "#111111",
                      color: "#FFD500",
                    }}
                  >
                    <Target className="h-5 w-5" />
                  </div>
                </div>

                <div style={{ marginTop: "15px" }}>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        color: "#7D766E",
                        fontSize: "13px",
                        fontWeight: 800,
                      }}
                    >
                      Weekly completion
                    </span>
                    <strong style={{ fontSize: "12px" }}>
                      {completedBlocks.size}/{schedule.length}
                    </strong>
                  </div>

                  <div
                    style={{
                      height: "8px",
                      marginTop: "7px",
                      borderRadius: "999px",
                      overflow: "hidden",
                      background: "#EAE6DE",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 0.7 }}
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: "#FFD500",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* WEEK STRIP / CALENDAR */}
            <section
              style={{
                padding: "12px",
                borderRadius: "25px",
                background: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                  gap: "5px",
                }}
              >
                {weekDays.map((day) => {
                  const active = day.day === selectedDay;
                  const dayBlocks = schedule.filter(
                    (block) => block.dateKey === day.dateKey
                  );
                  const completedForDay = dayBlocks.filter((block) =>
                    completedBlocks.has(block.id)
                  ).length;

                  return (
                    <motion.button
                      type="button"
                      key={day.dateKey}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSelectedDay(day.day)}
                      style={{
                        minWidth: 0,
                        minHeight: "68px",
                        padding: "8px 3px",
                        border: "none",
                        borderRadius: "17px",
                        background: active ? "#111111" : "transparent",
                        color: active ? "#FFFFFF" : "#111111",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: active
                            ? "rgba(255,255,255,0.58)"
                            : "#918A81",
                          fontSize: "13px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {day.shortDay}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          marginTop: "5px",
                          fontSize: "18px",
                          lineHeight: 1,
                        }}
                      >
                        {day.dayNumber}
                      </strong>

                      <div
                        className="flex justify-center gap-1"
                        style={{ marginTop: "8px", minHeight: "5px" }}
                      >
                        {dayBlocks.slice(0, 3).map((block, index) => (
                          <span
                            key={block.id}
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: completedBlocks.has(block.id)
                                ? "#4EC67A"
                                : active
                                ? "#FFD500"
                                : "#D6B100",
                            }}
                          />
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* SELECTED DAY */}
            <section
              style={{
                padding: "17px",
                borderRadius: "28px",
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 14px 32px rgba(0,0,0,0.055)",
              }}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: "#A28300",
                      fontSize: "13px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Selected day
                  </p>
                  <h2
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {selectedDayInfo?.day}
                  </h2>
                </div>

                <span
                  style={{
                    padding: "6px 9px",
                    borderRadius: "999px",
                    background: "#F3F0E9",
                    color: "#77716A",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  {todayBlocks.length} {todayBlocks.length === 1 ? "block" : "blocks"}
                </span>
              </div>

              {todayBlocks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: "30px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    className="mx-auto flex items-center justify-center"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "15px",
                      background: "#FFF5BF",
                    }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "13px",
                      fontWeight: 850,
                    }}
                  >
                    Keep this day light
                  </p>
                  <p
                    style={{
                      margin: "4px auto 0",
                      maxWidth: "210px",
                      color: "#8A837A",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    No priority study block is needed here. Use it for rest,
                    catch-up or your normal school routine.
                  </p>
                </motion.div>
              ) : (
                <div
                  style={{
                    position: "relative",
                    marginTop: "16px",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "11px",
                      top: "18px",
                      bottom: "18px",
                      width: "2px",
                      borderRadius: "999px",
                      background:
                        "linear-gradient(180deg,#FFD500 0%,#E6E2DA 32%,#E6E2DA 100%)",
                    }}
                  />

                  {todayBlocks.map((block, index) => {
                    const completed = completedBlocks.has(block.id);

                    return (
                      <motion.button
                        type="button"
                        key={block.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => toggleComplete(block.id)}
                        style={{
                          position: "relative",
                          width: "calc(100% - 27px)",
                          minHeight: "122px",
                          marginLeft: "27px",
                          marginBottom:
                            index === todayBlocks.length - 1
                              ? 0
                              : "11px",
                          padding: "13px",
                          border: completed
                            ? "1px solid rgba(78,198,122,0.24)"
                            : "1px solid rgba(0,0,0,0.055)",
                          borderRadius: "21px",
                          background: completed
                            ? "rgba(236,250,241,0.94)"
                            : "linear-gradient(145deg,#FFFFFF,#FAF9F6)",
                          boxShadow:
                            "0 9px 22px rgba(0,0,0,0.045)",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: "-20px",
                            top: "20px",
                            width: "9px",
                            height: "9px",
                            borderRadius: "50%",
                            background: completed
                              ? "#4EC67A"
                              : "#FFD500",
                            boxShadow:
                              "0 0 0 5px rgba(255,255,255,0.96)",
                          }}
                        />

                        <div
                          className="flex items-center justify-between gap-3"
                          style={{ marginBottom: "10px" }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: "999px",
                                background: "#111111",
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 900,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {formatDisplayTime(block.time)}
                            </span>

                            <span
                              style={{
                                padding: "5px 8px",
                                borderRadius: "999px",
                                background:
                                  block.source === "School"
                                    ? "#111111"
                                    : "#FFF4B5",
                                color:
                                  block.source === "School"
                                    ? "#FFD500"
                                    : "#111111",
                                fontSize: "13px",
                                fontWeight: 850,
                              }}
                            >
                              {block.source}
                            </span>

                            <span
                              style={{
                                color:
                                  block.priority === "high"
                                    ? "#B33F3F"
                                    : block.priority === "medium"
                                    ? "#9B7B00"
                                    : "#6C756D",
                                fontSize: "13px",
                                fontWeight: 900,
                                textTransform: "uppercase",
                              }}
                            >
                              {block.priority}
                            </span>
                          </div>

                          <div
                            className="flex shrink-0 items-center justify-center"
                            style={{
                              width: "31px",
                              height: "31px",
                              borderRadius: "11px",
                              background: completed
                                ? "#4EC67A"
                                : "#F4F1EA",
                              color: completed
                                ? "#FFFFFF"
                                : "#111111",
                            }}
                          >
                            {completed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            lineHeight: 1.25,
                            fontWeight: 900,
                            textDecoration: completed
                              ? "line-through"
                              : "none",
                            opacity: completed ? 0.58 : 1,
                          }}
                        >
                          {block.subject}
                        </h3>

                        <p
                          style={{
                            margin: "4px 0 0",
                            color: "#746E67",
                            fontSize: "12px",
                            lineHeight: 1.45,
                          }}
                        >
                          {block.topic}
                        </p>

                        <div
                          className="flex items-center gap-2 flex-wrap"
                          style={{
                            marginTop: "11px",
                            color: "#8A837A",
                            fontSize: "12px",
                            fontWeight: 750,
                          }}
                        >
                          <span
                            style={{
                              padding: "5px 7px",
                              borderRadius: "999px",
                              background: "#F4F1EA",
                            }}
                          >
                            {block.durationMinutes} min
                          </span>

                          <span>{block.reason}</span>

                          {block.dueDate && (
                            <>
                              <span>•</span>
                              <span>
                                due{" "}
                                {block.dueDate.toLocaleDateString(
                                  "en-AU",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* NEXT UP + ACTIONS */}
            {nextSession && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "17px",
                  borderRadius: "26px",
                  background:
                    "linear-gradient(145deg,#171717,#080808)",
                  color: "#FFFFFF",
                  boxShadow:
                    "0 16px 34px rgba(0,0,0,0.14)",
                }}
              >
                <motion.div
                  aria-hidden="true"
                  animate={{
                    scale: [1, 1.06, 1],
                    rotate: [0, 7, 0],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    width: "115px",
                    height: "115px",
                    borderRadius: "34px",
                    right: "-45px",
                    top: "-48px",
                    background: "#FFD500",
                    opacity: 0.95,
                  }}
                />

                <div className="relative z-10">
                  <p
                    style={{
                      margin: 0,
                      color: "#FFD500",
                      fontSize: "13px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Next up
                  </p>

                  <div
                    className="flex items-start justify-between gap-3"
                    style={{ marginTop: "7px" }}
                  >
                    <div className="min-w-0">
                      <h3
                        style={{
                          margin: 0,
                          maxWidth: "250px",
                          fontSize: "12px",
                          lineHeight: 1.2,
                          fontWeight: 900,
                        }}
                      >
                        {nextSession.subject}
                      </h3>

                      <p
                        style={{
                          margin: "5px 0 0",
                          maxWidth: "260px",
                          color:
                            "rgba(255,255,255,0.58)",
                          fontSize: "12px",
                          lineHeight: 1.45,
                        }}
                      >
                        {nextSession.topic}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 flex-wrap"
                    style={{ marginTop: "12px" }}
                  >
                    <span
                      style={{
                        padding: "6px 9px",
                        borderRadius: "999px",
                        background:
                          "rgba(255,255,255,0.09)",
                        fontSize: "12px",
                        fontWeight: 850,
                      }}
                    >
                      {nextSession.day} ·{" "}
                      {formatDisplayTime(nextSession.time)}
                    </span>

                    <span
                      style={{
                        padding: "6px 9px",
                        borderRadius: "999px",
                        background:
                          "rgba(255,255,255,0.09)",
                        fontSize: "12px",
                        fontWeight: 850,
                      }}
                    >
                      {nextSession.durationMinutes} min
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartSession}
                    style={{
                      marginTop: "14px",
                      border: "none",
                      borderRadius: "13px",
                      background: "#FFD500",
                      color: "#111111",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    <Play className="inline h-4 w-4 mr-2" />
                    Start this session
                  </motion.button>
                </div>
              </motion.section>
            )}

            <section
              style={{
                padding: "15px",
                borderRadius: "24px",
                background:
                  "rgba(255,255,255,0.80)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border:
                  "1px solid rgba(255,255,255,0.96)",
                boxShadow:
                  "0 12px 28px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    Plan controls
                  </h3>
                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#837D75",
                      fontSize: "12px",
                    }}
                  >
                    Take the week with you.
                  </p>
                </div>

                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "12px",
                    background: "#FFF3A8",
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportToCalendar}
                disabled={schedule.length === 0}
                style={{
                  width: "100%",
                  minHeight: "47px",
                  marginTop: "12px",
                  border:
                    "1px solid rgba(0,0,0,0.07)",
                  borderRadius: "15px",
                  background: "#FFFFFF",
                  color: "#111111",
                  fontSize: "12px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Add all sessions to my calendar
              </motion.button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,minmax(0,1fr))",
                  gap: "8px",
                  marginTop: "9px",
                }}
              >
                {[
                  {
                    label: "Sessions",
                    value: schedule.length,
                  },
                  {
                    label: "Complete",
                    value: `${Math.round(
                      completionRate
                    )}%`,
                  },
                  {
                    label: "Hours",
                    value: (
                      totalRecommendedMinutes / 60
                    ).toFixed(1),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "10px 7px",
                      borderRadius: "14px",
                      background: "#F5F2EB",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 900,
                      }}
                    >
                      {item.value}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        color: "#8A837A",
                        fontSize: "12px",
                        fontWeight: 750,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                padding: "13px 14px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg,rgba(255,248,207,0.70),rgba(255,255,255,0.75))",
                border:
                  "1px solid rgba(255,213,0,0.14)",
              }}
            >
              <div className="flex items-start gap-3">
                <Sparkles
                  className="h-4 w-4 shrink-0"
                  style={{ color: "#9C7C00" }}
                />
                <p
                  style={{
                    margin: 0,
                    color: "#746C61",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  This plan deliberately leaves breathing room.
                  Important assessments can get multiple prep
                  sessions, while old low-value backlog stays out
                  of the automatic week.
                </p>
              </div>
            </section>
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            height: "34px",
            margin: "10px -14px -132px",
            paddingBottom: "132px",
            background:
              "linear-gradient(180deg, rgba(240,236,227,0) 0%, rgba(236,231,222,0.86) 45%, #ECE7DE 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}