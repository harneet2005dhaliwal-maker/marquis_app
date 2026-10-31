import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Star,
  Target,
  TimerReset,
} from "lucide-react";
import { motion } from "motion/react";

import { AIStudyPlanPage } from "./AIStudyPlanPage";
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

interface AIInsightsPageProps {
  onBack?: () => void;
  onNavigateToFocus?: () => void;
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

function daysUntil(date: Date) {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
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

export function AIInsightsPage({
  onBack,
  onNavigateToFocus,
}: AIInsightsPageProps) {
  const { googleProviderToken, studentId } = useAuth();

  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([]);
  const [work, setWork] = useState<ClassroomWorkItem[]>([]);
  const [schoolAssessments, setSchoolAssessments] =
    useState<SchoolAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error("Insights load failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Classroom insights."
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
          "Insights school assessments failed:",
          assessmentError
        );
        return;
      }

      setSchoolAssessments((data ?? []) as SchoolAssessment[]);
    };

    void loadSchoolAssessments();
  }, [studentId]);

  const insights = useMemo(() => {
    const now = new Date();

    const incomplete = work.filter(
      (item) => !isSubmitted(item)
    );

    const withDueDates = incomplete.filter(
      (item) => getDueDate(item) !== null
    );

    const overdue = withDueDates.filter(
      (item) => getDueDate(item)! < now
    );

    const upcoming = withDueDates
      .filter((item) => getDueDate(item)! >= now)
      .sort(
        (a, b) =>
          getDueDate(a)!.getTime() -
          getDueDate(b)!.getTime()
      );

    const dueSevenDays = upcoming.filter(
      (item) => daysUntil(getDueDate(item)!) <= 7
    );

    const courseStats = courses
      .map((course) => {
        const items = work.filter(
          (item) => item.courseId === course.id
        );

        if (items.length === 0) return null;

        const done = items.filter(isSubmitted).length;

        return {
          id: course.id,
          name: course.name,
          completion:
            items.length > 0
              ? (done / items.length) * 100
              : 0,
          pending: items.length - done,
        };
      })
      .filter(
        (
          value
        ): value is {
          id: string;
          name: string;
          completion: number;
          pending: number;
        } => value !== null
      );

    const busiest = courseStats
      .slice()
      .sort((a, b) => b.pending - a.pending)[0];

    const upcomingSchoolAssessments = schoolAssessments
      .filter((assessment) => new Date(assessment.due_at) >= now)
      .sort(
        (a, b) =>
          new Date(a.due_at).getTime() -
          new Date(b.due_at).getTime()
      );

    return {
      incomplete,
      overdue,
      upcoming,
      dueSevenDays,
      busiest,
      upcomingSchoolAssessments,
    };
  }, [courses, work, schoolAssessments]);

  const focusSessionsCompleted = (() => {
    if (typeof window === "undefined") return 0;

    const value = Number(
      window.localStorage.getItem(
        "marquis_focus_sessions_completed"
      ) ?? "0"
    );

    return Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
  })();

  const quizQuestionsCorrect = (() => {
    if (typeof window === "undefined") return 0;

    const value = Number(
      window.localStorage.getItem(
        "marquis_quiz_questions_correct"
      ) ?? "0"
    );

    return Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
  })();

  const completedClassroom = work.filter(isSubmitted).length;

  const prioritySchoolAssessment =
    insights.upcomingSchoolAssessments
      .map((assessment) => {
        const dueIn = Math.max(
          0,
          daysUntil(new Date(assessment.due_at))
        );

        const weighting = assessment.weighting ?? 10;
        const difficulty = assessment.difficulty ?? 3;
        const confidence = assessment.confidence ?? 3;

        const score =
          Math.max(0, 28 - dueIn * 2) +
          weighting * 0.65 +
          difficulty * 4 +
          (6 - confidence) * 5;

        return {
          assessment,
          dueIn,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)[0];

  const coachFocus = prioritySchoolAssessment
    ? {
        eyebrow: "School assessment",
        title: `Prioritise ${prioritySchoolAssessment.assessment.subject}`,
        body: `${
          prioritySchoolAssessment.assessment.title
        } is due ${
          prioritySchoolAssessment.dueIn === 0
            ? "today"
            : `in ${prioritySchoolAssessment.dueIn} ${
                prioritySchoolAssessment.dueIn === 1
                  ? "day"
                  : "days"
              }`
        }${
          prioritySchoolAssessment.assessment.weighting !== null
            ? ` and is worth ${prioritySchoolAssessment.assessment.weighting}%`
            : ""
        }.${
          prioritySchoolAssessment.assessment.confidence !== null
            ? ` Your confidence is ${prioritySchoolAssessment.assessment.confidence}/5.`
            : ""
        }`,
        action: "Build this into my week",
      }
    : insights.overdue.length > 0
    ? {
        eyebrow: "Workload reset",
        title: "Reduce the overdue pile first",
        body: `${insights.overdue.length} ${
          insights.overdue.length === 1
            ? "task is"
            : "tasks are"
        } already overdue. Start with one short catch-up block instead of trying to clear everything at once.`,
        action: "Build a catch-up plan",
      }
    : insights.upcoming[0]
    ? {
        eyebrow: "Next deadline",
        title: `Start ${insights.upcoming[0].courseName} early`,
        body: `${insights.upcoming[0].title} is the closest visible Classroom deadline. One focused session now will make the rest of the week lighter.`,
        action: "Plan my week",
      }
    : {
        eyebrow: "Routine building",
        title: "Use the quiet week to build consistency",
        body: "There is no urgent deadline driving your plan right now. A few repeatable study blocks are more useful than one long catch-up session.",
        action: "Build my routine",
      };

  const coachInsight =
    prioritySchoolAssessment &&
    prioritySchoolAssessment.assessment.confidence !== null &&
    prioritySchoolAssessment.assessment.confidence <= 2
      ? `You rated your confidence low for ${prioritySchoolAssessment.assessment.subject}. Split preparation across shorter sessions and finish with practice questions rather than rereading notes.`
      : insights.busiest &&
        insights.busiest.pending >= 8
      ? `${insights.busiest.name} has the largest visible backlog. Give it one protected catch-up block this week, then return to your normal routine.`
      : focusSessionsCompleted === 0
      ? "Your routine has not recorded a completed focus session yet. Start with one 25-minute block; consistency matters more than duration at the beginning."
      : quizQuestionsCorrect < 10
      ? "Add a short retrieval-practice block after your next focus session. Quiz questions are a better check of learning than simply rereading material."
      : "You are building useful study activity. Keep session lengths sustainable and use your quiz results to decide what needs another pass.";

  const mergedNextSevenDays = [
    ...insights.dueSevenDays.map((item) => ({
      id: `classroom-${item.courseId}-${item.id}`,
      source: "Classroom",
      subject: item.courseName,
      title: item.title,
      dueAt: getDueDate(item)!,
      weighting: null as number | null,
    })),
    ...insights.upcomingSchoolAssessments
      .filter(
        (assessment) =>
          daysUntil(new Date(assessment.due_at)) <= 7
      )
      .map((assessment) => ({
        id: `school-${assessment.id}`,
        source: "School",
        subject: assessment.subject,
        title: assessment.title,
        dueAt: new Date(assessment.due_at),
        weighting: assessment.weighting,
      })),
  ]
    .sort(
      (a, b) =>
        a.dueAt.getTime() - b.dueAt.getTime()
    )
    .slice(0, 5);

  const suggestedBlocks = (() => {
    const subject =
      prioritySchoolAssessment?.assessment.subject ??
      insights.upcoming[0]?.courseName ??
      insights.busiest?.name ??
      "your priority subject";

    const confidence =
      prioritySchoolAssessment?.assessment.confidence ?? 3;

    const duration = confidence <= 2 ? 35 : 25;

    return [
      {
        label: "Block 1",
        title: subject,
        detail: `${duration} min · understand + organise`,
      },
      {
        label: "Block 2",
        title: subject,
        detail: `${duration} min · active recall / questions`,
      },
      {
        label: "Reset",
        title: "Short review",
        detail: "15 min · check mistakes + plan next step",
      },
    ];
  })();

  if (showStudyPlan) {
    return (
      <AIStudyPlanPage
        onBack={() => setShowStudyPlan(false)}
        onStartSession={onNavigateToFocus}
      />
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background:
          "linear-gradient(180deg,#F7F5EF 0%,#FBFAF7 48%,#F0ECE3 100%)",
        color: "#111111",
      }}
    >
      <div style={{ padding: "20px 15px 0" }}>
        {onBack && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onBack}
            className="flex items-center gap-2"
            style={{
              border: "none",
              background: "transparent",
              padding: "4px 0",
              marginBottom: "14px",
              color: "#6F6961",
              fontSize: "9px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Progress
          </motion.button>
        )}

        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "17px" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4"
              style={{ color: "#B38F00" }}
            />
            <span
              style={{
                color: "#9A7D00",
                fontSize: "8px",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Your Study Coach
            </span>
          </div>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: "29px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.045em",
            }}
          >
            Make this week work better.
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              maxWidth: "310px",
              color: "#77716A",
              fontSize: "10px",
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            School, assessments, tutoring and your study habits —
            considered together.
          </p>
        </motion.header>

        {!googleProviderToken ? (
          <section
            style={{
              padding: "17px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(255,255,255,0.96)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              Connect Google Classroom to combine live schoolwork
              with your study coach.
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
            <Clock className="h-4 w-4" />
            <span
              style={{
                fontSize: "9px",
                color: "#77716A",
              }}
            >
              Building your academic picture…
            </span>
          </section>
        ) : error ? (
          <section
            style={{
              padding: "17px",
              borderRadius: "24px",
              background: "#FFF2F2",
              color: "#B54242",
              fontSize: "9px",
            }}
          >
            {error}
          </section>
        ) : (
          <div className="space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "20px",
                borderRadius: "29px",
                background:
                  "linear-gradient(145deg,#171717 0%,#080808 100%)",
                color: "#FFFFFF",
                boxShadow: "0 18px 38px rgba(0,0,0,0.15)",
              }}
            >
              <motion.div
                aria-hidden="true"
                animate={{
                  rotate: [0, 8, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  width: "140px",
                  height: "140px",
                  borderRadius: "40px",
                  right: "-58px",
                  top: "-68px",
                  background: "rgba(255,213,0,0.95)",
                  transform: "rotate(14deg)",
                }}
              />

              <div className="relative z-10">
                <p
                  style={{
                    margin: 0,
                    color: "#FFD500",
                    fontSize: "7px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  This week's recommendation · {coachFocus.eyebrow}
                </p>

                <h2
                  style={{
                    margin: "8px 0 0",
                    maxWidth: "260px",
                    fontSize: "20px",
                    lineHeight: 1.08,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {coachFocus.title}
                </h2>

                <p
                  style={{
                    margin: "9px 0 0",
                    maxWidth: "280px",
                    color: "rgba(255,255,255,0.64)",
                    fontSize: "9px",
                    lineHeight: 1.5,
                  }}
                >
                  {coachFocus.body}
                </p>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowStudyPlan(true)}
                  className="flex items-center gap-2"
                  style={{
                    marginTop: "16px",
                    border: "none",
                    borderRadius: "13px",
                    background: "#FFD500",
                    color: "#090909",
                    padding: "10px 12px",
                    fontSize: "8.5px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {coachFocus.action}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.section>

            <section
              style={{
                padding: "17px",
                borderRadius: "27px",
                background: "rgba(255,255,255,0.80)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 13px 30px rgba(0,0,0,0.055)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 900,
                    }}
                  >
                    Routine pulse
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#837D75",
                      fontSize: "8px",
                    }}
                  >
                    How your study behaviour is developing.
                  </p>
                </div>

                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "13px",
                    background: "#FFF4B5",
                  }}
                >
                  <Flame className="h-4 w-4" />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: "8px",
                  marginTop: "14px",
                }}
              >
                {[
                  {
                    icon: TimerReset,
                    value: focusSessionsCompleted,
                    label: "focus sessions",
                  },
                  {
                    icon: Star,
                    value: quizQuestionsCorrect,
                    label: "quiz correct",
                  },
                  {
                    icon: CheckCircle2,
                    value: completedClassroom,
                    label: "tasks complete",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.label}
                      whileHover={{ y: -2 }}
                      style={{
                        minWidth: 0,
                        padding: "11px 9px",
                        borderRadius: "16px",
                        background: "#F6F3EC",
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: "#9C7C00" }}
                      />
                      <strong
                        style={{
                          display: "block",
                          marginTop: "7px",
                          fontSize: "15px",
                          lineHeight: 1,
                          fontWeight: 900,
                        }}
                      >
                        {item.value}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: "#837D75",
                          fontSize: "7px",
                          lineHeight: 1.25,
                          fontWeight: 750,
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <motion.section
              whileHover={{ y: -2 }}
              style={{
                padding: "17px",
                borderRadius: "27px",
                background:
                  "linear-gradient(135deg,rgba(255,248,207,0.95),rgba(255,255,255,0.90))",
                border: "1px solid rgba(255,213,0,0.18)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "13px",
                    background: "#FFD500",
                  }}
                >
                  <Lightbulb className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    style={{
                      margin: 0,
                      color: "#9A7D00",
                      fontSize: "7px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Coach insight
                  </p>

                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "10px",
                      lineHeight: 1.5,
                      fontWeight: 750,
                    }}
                  >
                    {coachInsight}
                  </p>

                  {onNavigateToFocus && (
                    <button
                      type="button"
                      onClick={onNavigateToFocus}
                      style={{
                        marginTop: "10px",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#8A6D00",
                        fontSize: "8px",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Start a focus session →
                    </button>
                  )}
                </div>
              </div>
            </motion.section>

            <section
              style={{
                padding: "17px",
                borderRadius: "27px",
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 13px 30px rgba(0,0,0,0.055)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 900,
                    }}
                  >
                    Suggested rhythm
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#837D75",
                      fontSize: "8px",
                    }}
                  >
                    A manageable way to start — not a full timetable.
                  </p>
                </div>
                <Target
                  className="h-4 w-4"
                  style={{ color: "#A78700" }}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                {suggestedBlocks.map((block, index) => (
                  <motion.div
                    key={block.label}
                    whileHover={{ x: 3 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "54px minmax(0,1fr)",
                      gap: "10px",
                      padding:
                        index === 0
                          ? "3px 0 10px"
                          : "10px 0",
                      borderTop:
                        index === 0
                          ? "none"
                          : "1px solid #EEEAE3",
                    }}
                  >
                    <span
                      style={{
                        color: "#9B7B00",
                        fontSize: "7px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {block.label}
                    </span>

                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "9px",
                          fontWeight: 850,
                        }}
                      >
                        {block.title}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          color: "#8A837A",
                          fontSize: "7.5px",
                        }}
                      >
                        {block.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section
              style={{
                padding: "17px",
                borderRadius: "27px",
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 13px 30px rgba(0,0,0,0.055)",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 900,
                  }}
                >
                  Your next 7 days
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#837D75",
                    fontSize: "8px",
                  }}
                >
                  School assessments and Classroom deadlines together.
                </p>
              </div>

              {mergedNextSevenDays.length === 0 ? (
                <div
                  style={{
                    marginTop: "13px",
                    padding: "17px",
                    borderRadius: "17px",
                    background: "#F6F3EC",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle2
                    className="mx-auto h-4 w-4"
                    style={{ color: "#9B7B00" }}
                  />
                  <p
                    style={{
                      margin: "7px 0 0",
                      fontSize: "8px",
                      fontWeight: 800,
                    }}
                  >
                    Nothing major is due in the next 7 days.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: "12px" }}>
                  {mergedNextSevenDays.map((item, index) => {
                    const dueIn = Math.max(
                      0,
                      daysUntil(item.dueAt)
                    );

                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 3 }}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "35px minmax(0,1fr) 50px",
                          alignItems: "center",
                          gap: "10px",
                          padding:
                            index === 0
                              ? "4px 0 10px"
                              : "10px 0",
                          borderTop:
                            index === 0
                              ? "none"
                              : "1px solid #EEEAE3",
                        }}
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: "35px",
                            height: "35px",
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
                              color: "#8B847B",
                              fontSize: "6.5px",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.subject} · {item.source}
                          </p>
                          <p
                            style={{
                              margin: "3px 0 0",
                              fontSize: "8.5px",
                              fontWeight: 850,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.title}
                          </p>
                          {item.weighting !== null && (
                            <p
                              style={{
                                margin: "2px 0 0",
                                color: "#918A82",
                                fontSize: "6px",
                              }}
                            >
                              {item.weighting}% weighting
                            </p>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "8px",
                              color:
                                dueIn <= 2
                                  ? "#C34C4C"
                                  : "#111111",
                            }}
                          >
                            {dueIn === 0
                              ? "Today"
                              : dueIn === 1
                              ? "Tomorrow"
                              : `${dueIn}d`}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "#918A82",
                              fontSize: "6px",
                            }}
                          >
                            {item.dueAt.toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            <motion.button
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setShowStudyPlan(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "16px",
                border: "none",
                borderRadius: "24px",
                background: "#FFD500",
                color: "#111111",
                textAlign: "left",
                cursor: "pointer",
                boxShadow:
                  "0 13px 28px rgba(255,213,0,0.17)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "7px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Routine builder
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  Build my study week
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    maxWidth: "245px",
                    fontSize: "7.5px",
                    lineHeight: 1.4,
                    color: "rgba(0,0,0,0.58)",
                  }}
                >
                  Turn deadlines and assessments into manageable study
                  blocks.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}