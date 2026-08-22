import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Plus,
  Sparkles,
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

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
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

  return (
    <div
      className="min-h-full pb-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFF9E9 0%, #FFFFFF 38%, #F7F5FF 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 95% 0%, rgba(255,213,0,.22), transparent 32%), radial-gradient(circle at 0% 45%, rgba(167,139,250,.10), transparent 30%)",
        }}
      />

      <div className="p-5 space-y-4 relative">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between gap-3"
        >
          <div>
            <h1 className="m-0 text-[30px] font-bold tracking-tight">
              Your Progress
            </h1>
            <p className="m-0 mt-1 text-sm text-[#656565]">
              Results, deadlines & study priorities
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-black text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assessment
          </Button>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => setShowAIInsights(true)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left"
        >
          <Card
            className="border-0 p-5 overflow-hidden relative"
            style={{
              borderRadius: "22px",
              background:
                "linear-gradient(135deg, #151515 0%, #28211A 52%, #4A3D08 100%)",
              boxShadow: "0 12px 30px rgba(0,0,0,.16)",
            }}
          >
            <div
              className="absolute -right-8 -top-10 w-32 h-32 rounded-full"
              style={{
                background: "rgba(255,213,0,.22)",
                filter: "blur(4px)",
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#FFD500]">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="m-0 text-[11px] font-bold tracking-widest text-[#FFD500] uppercase">
                    Marquis
                  </p>
                  <h3 className="m-0 mt-1 text-base font-bold text-white">
                    Insights & Study Planner
                  </h3>
                  <p className="m-0 mt-1 text-xs text-white/60">
                    Classroom + your school assessments
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </Card>
        </motion.button>

        {!googleProviderToken ? (
          <Card className="p-5 border-0 rounded-2xl">
            Sign in with Google to load Classroom progress.
          </Card>
        ) : loading ? (
          <Card className="p-5 border-0 rounded-2xl flex gap-3">
            <Clock className="w-5 h-5" />
            Loading your progress...
          </Card>
        ) : error ? (
          <Card className="p-5 border-0 rounded-2xl text-red-700">
            {error}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Average"
                value={
                  data.overallAverage === null
                    ? "—"
                    : `${Math.round(data.overallAverage)}%`
                }
                caption={`${data.graded.length} graded`}
                variant="yellow"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <MetricCard
                label="Completion"
                value={`${Math.round(data.completionRate)}%`}
                caption={`${data.completed.length}/${data.filtered.length} tasks`}
                variant="green"
                icon={<CheckCircle2 className="w-5 h-5" />}
              />
              <MetricCard
                label="Overdue"
                value={String(data.overdue.length)}
                caption="Incomplete"
                variant="coral"
                icon={<AlertCircle className="w-5 h-5" />}
              />
              <MetricCard
                label="Assessments"
                value={String(
                  data.upcomingAssessments.filter(
                    (item) => item.source === "School"
                  ).length
                )}
                caption="Added by you"
                variant="purple"
                icon={<GraduationCap className="w-5 h-5" />}
              />
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-11 p-1 rounded-xl bg-black/5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card
                  className="border-0 p-5"
                  style={{
                    borderRadius: "22px",
                    boxShadow: "0 8px 26px rgba(0,0,0,.06)",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="m-0 text-lg font-bold">
                        Performance
                      </h2>
                      <p className="m-0 mt-1 text-xs text-[#666]">
                        Real Classroom data over time
                      </p>
                    </div>

                    <div className="flex p-1 bg-black/5 rounded-lg">
                      <button
                        onClick={() => setGraphMode("results")}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold"
                        style={{
                          background:
                            graphMode === "results"
                              ? "#FFFFFF"
                              : "transparent",
                          boxShadow:
                            graphMode === "results"
                              ? "0 2px 7px rgba(0,0,0,.08)"
                              : "none",
                        }}
                      >
                        Results
                      </button>
                      <button
                        onClick={() => setGraphMode("completion")}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold"
                        style={{
                          background:
                            graphMode === "completion"
                              ? "#FFFFFF"
                              : "transparent",
                          boxShadow:
                            graphMode === "completion"
                              ? "0 2px 7px rgba(0,0,0,.08)"
                              : "none",
                        }}
                      >
                        Completion
                      </button>
                    </div>
                  </div>

                  {graphData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-[#777]">
                      No graph data available yet.
                    </div>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={graphData}
                          margin={{
                            top: 8,
                            right: 8,
                            left: -24,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#ECECEC"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid #eee",
                              fontSize: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#E1B800"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#FFD500",
                              stroke: "#111111",
                              strokeWidth: 1.5,
                            }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card
                  className="border-0 p-5"
                  style={{
                    borderRadius: "22px",
                    boxShadow: "0 8px 26px rgba(0,0,0,.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="m-0 text-lg font-bold">
                        Upcoming
                      </h2>
                      <p className="m-0 mt-1 text-xs text-[#666]">
                        Classroom + school assessments
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddOpen(true)}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {assessmentLoading ? (
                    <p className="text-sm text-[#777]">
                      Loading school assessments...
                    </p>
                  ) : data.upcomingAssessments.length === 0 ? (
                    <div className="py-7 text-center">
                      <CalendarDays className="w-7 h-7 mx-auto mb-2 text-[#C59F00]" />
                      <p className="m-0 text-sm font-semibold">
                        Nothing upcoming
                      </p>
                      <p className="m-0 mt-1 text-xs text-[#777]">
                        Add an exam or assessment if it isn't in Classroom.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.upcomingAssessments.map((item) => {
                        const days = daysFromNow(item.dueAt);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-2xl"
                            style={{
                              background:
                                item.source === "School"
                                  ? "#F5F1FF"
                                  : "#FFF9DF",
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background:
                                  item.source === "School"
                                    ? "#E8DEFF"
                                    : "#FFD50033",
                              }}
                            >
                              {item.source === "School" ? (
                                <GraduationCap className="w-5 h-5 text-[#7357B8]" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-[#A88400]" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex gap-2 items-center">
                                <p className="m-0 text-[11px] font-bold text-[#777] truncate">
                                  {item.subject}
                                </p>
                                <Badge
                                  className="text-[9px] px-1.5 py-0 border-0"
                                  style={{
                                    background: "rgba(255,255,255,.75)",
                                    color: "#555",
                                  }}
                                >
                                  {item.source}
                                </Badge>
                              </div>
                              <p className="m-0 mt-1 text-sm font-bold truncate">
                                {item.title}
                              </p>
                              <p className="m-0 mt-1 text-[11px] text-[#666]">
                                {item.type}
                                {item.weighting !== null
                                  ? ` • ${item.weighting}% weighting`
                                  : ""}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p
                                className="m-0 text-sm font-extrabold"
                                style={{
                                  color:
                                    days <= 2
                                      ? "#D44949"
                                      : "#111111",
                                }}
                              >
                                {days === 0
                                  ? "Today"
                                  : days === 1
                                  ? "Tomorrow"
                                  : `${days}d`}
                              </p>
                              <p className="m-0 mt-1 text-[10px] text-[#777]">
                                {formatShortDate(item.dueAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-3 mt-4">
                {data.recentResults.length === 0 ? (
                  <Card className="p-5 border-0 rounded-2xl">
                    No returned grades are available yet.
                  </Card>
                ) : (
                  data.recentResults.map((item) => {
                    const percentage = getPercentage(item);
                    const due = getDueDate(item);

                    return (
                      <Card
                        key={`${item.courseId}-${item.id}`}
                        className="border-0 p-4"
                        style={{
                          borderRadius: "18px",
                          boxShadow:
                            "0 5px 18px rgba(0,0,0,.05)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="m-0 text-[11px] font-bold text-[#777]">
                              {item.courseName}
                            </p>
                            <p className="m-0 mt-1 text-sm font-bold">
                              {item.title}
                            </p>
                            {due && (
                              <p className="m-0 mt-1 text-[11px] text-[#777]">
                                {formatShortDate(due)}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className="m-0 text-lg font-extrabold">
                              {item.submission?.assignedGrade}
                              {typeof item.maxPoints === "number"
                                ? `/${item.maxPoints}`
                                : ""}
                            </p>
                            {percentage !== null && (
                              <Badge
                                className="border-0 mt-1"
                                style={{
                                  background:
                                    percentage >= 80
                                      ? "#E8F8EE"
                                      : percentage >= 60
                                      ? "#FFF5C7"
                                      : "#FFE7E7",
                                  color:
                                    percentage >= 80
                                      ? "#247744"
                                      : percentage >= 60
                                      ? "#8A6A00"
                                      : "#B63E3E",
                                }}
                              >
                                {Math.round(percentage)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="subjects" className="space-y-3 mt-4">
                {data.summaries.map((summary) => (
                  <Card
                    key={summary.id}
                    className="border-0 p-4"
                    style={{
                      borderRadius: "18px",
                      boxShadow:
                        "0 5px 18px rgba(0,0,0,.05)",
                    }}
                  >
                    <div className="flex justify-between gap-4 mb-3">
                      <div>
                        <h3 className="m-0 text-sm font-bold">
                          {summary.name}
                        </h3>
                        <p className="m-0 mt-1 text-[11px] text-[#666]">
                          {summary.completed}/{summary.total} complete
                          {summary.overdue > 0
                            ? ` • ${summary.overdue} overdue`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="m-0 text-lg font-extrabold">
                          {summary.averagePercent === null
                            ? "—"
                            : `${Math.round(
                                summary.averagePercent
                              )}%`}
                        </p>
                        <p className="m-0 text-[10px] text-[#777]">
                          average
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={summary.completionRate}
                      className="h-2.5"
                    />
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <Button
              className="w-full rounded-xl"
              variant="outline"
              onClick={() => onNavigate?.("study")}
            >
              Open Study Tools
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </div>

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
              {savingAssessment
                ? "Saving..."
                : "Add Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  caption,
  variant,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  variant: "yellow" | "green" | "coral" | "purple";
  icon: React.ReactNode;
}) {
  const styles = {
    yellow: {
      background: "linear-gradient(135deg,#FFF5B8,#FFE661)",
      iconBg: "rgba(255,255,255,.52)",
      iconColor: "#876B00",
    },
    green: {
      background: "linear-gradient(135deg,#E8F8EE,#CFF0DB)",
      iconBg: "rgba(255,255,255,.55)",
      iconColor: "#287A48",
    },
    coral: {
      background: "linear-gradient(135deg,#FFE9E5,#FFD0C7)",
      iconBg: "rgba(255,255,255,.55)",
      iconColor: "#B44D42",
    },
    purple: {
      background: "linear-gradient(135deg,#F1EAFF,#DDD0FF)",
      iconBg: "rgba(255,255,255,.55)",
      iconColor: "#7357B8",
    },
  }[variant];

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card
        className="border-0 p-4"
        style={{
          borderRadius: "19px",
          background: styles.background,
          boxShadow: "0 8px 20px rgba(0,0,0,.05)",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{
            background: styles.iconBg,
            color: styles.iconColor,
          }}
        >
          {icon}
        </div>
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-black/55">
          {label}
        </p>
        <p className="m-0 mt-1 text-[28px] font-extrabold leading-none">
          {value}
        </p>
        <p className="m-0 mt-2 text-[11px] text-black/55">
          {caption}
        </p>
      </Card>
    </motion.div>
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