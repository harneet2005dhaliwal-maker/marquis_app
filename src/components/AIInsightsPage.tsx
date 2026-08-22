import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

import { AIStudyPlanPage } from "./AIStudyPlanPage";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

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

function getPercent(work: ClassroomWorkItem) {
  const grade = work.submission?.assignedGrade;
  const maxPoints = work.maxPoints;

  if (
    typeof grade !== "number" ||
    typeof maxPoints !== "number" ||
    maxPoints <= 0
  ) {
    return null;
  }

  return (grade / maxPoints) * 100;
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
      if (!googleProviderToken) return;

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
        const percentages = items
          .map(getPercent)
          .filter((value): value is number => value !== null);

        return {
          id: course.id,
          name: course.name,
          completion:
            items.length > 0
              ? (done / items.length) * 100
              : 0,
          average:
            percentages.length > 0
              ? percentages.reduce((a, b) => a + b, 0) /
                percentages.length
              : null,
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
          average: number | null;
          pending: number;
        } => value !== null
      );

    const weakest = courseStats
      .filter((course) => course.average !== null)
      .slice()
      .sort(
        (a, b) =>
          (a.average ?? 100) - (b.average ?? 100)
      )[0];

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
      courseStats,
      weakest,
      busiest,
      upcomingSchoolAssessments,
    };
  }, [courses, work, schoolAssessments]);

  if (showStudyPlan) {
    return (
      <AIStudyPlanPage
        onBack={() => setShowStudyPlan(false)}
        onStartSession={onNavigateToFocus}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-6"
      style={{
        background:
          "linear-gradient(to bottom, #FFF9EB 0%, #FFFFFF 55%, #FFF7D9 100%)",
      }}
    >
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Progress
        </Button>
      )}

      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#C59F00]" />
            <h1 className="m-0 text-2xl font-bold">
              Marquis Insights
            </h1>
          </div>
          <p className="m-0 text-sm text-[#595959]">
            Generated from your current Google Classroom workload
          </p>
        </motion.div>

        {!googleProviderToken ? (
          <Card className="p-5">
            Sign in with Google to generate live insights.
          </Card>
        ) : loading ? (
          <Card className="p-5 flex items-center gap-3">
            <Clock className="w-5 h-5" />
            Loading your academic picture...
          </Card>
        ) : error ? (
          <Card className="p-5 text-red-700">
            {error}
          </Card>
        ) : (
          <>
            <Card
              className="border-0 p-6"
              style={{
                borderRadius: "22px",
                boxShadow:
                  "0 8px 26px rgba(0,0,0,.06)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-1 h-20 rounded-full shrink-0"
                  style={{
                    background:
                      "linear-gradient(180deg,#FFD500,#A78BFA)",
                  }}
                />

                <div>
                  <h2 className="m-0 text-lg font-bold">
                    Your current workload
                  </h2>
                  <p className="mt-3 mb-0 text-sm text-[#595959] leading-relaxed">
                    You currently have{" "}
                    <strong>{insights.incomplete.length}</strong>{" "}
                    incomplete Classroom tasks.
                    {insights.overdue.length > 0
                      ? ` ${insights.overdue.length} are overdue.`
                      : " Nothing is currently overdue."}
                    {insights.dueSevenDays.length > 0
                      ? ` ${insights.dueSevenDays.length} are due within the next 7 days.`
                      : ""}
                    {insights.upcomingSchoolAssessments.length > 0
                      ? ` You have also added ${insights.upcomingSchoolAssessments.length} upcoming school assessment(s).`
                      : ""}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Summary
                label="Overdue"
                value={insights.overdue.length}
                icon={<AlertCircle className="w-5 h-5" />}
              />
              <Summary
                label="Due 7 Days"
                value={insights.dueSevenDays.length}
                icon={<Calendar className="w-5 h-5" />}
              />
              <Summary
                label="School"
                value={insights.upcomingSchoolAssessments.length}
                icon={<BookOpen className="w-5 h-5" />}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold tracking-wider text-[#666]">
                LIVE PRIORITIES
              </p>

              {insights.overdue.length > 0 && (
                <InsightCard
                  icon={<AlertCircle className="w-5 h-5" />}
                  title="Clear overdue work first"
                  text={`${insights.overdue.length} incomplete ${
                    insights.overdue.length === 1
                      ? "task is"
                      : "tasks are"
                  } already past the due date.`}
                />
              )}

              {insights.upcoming[0] && (
                <InsightCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Closest deadline"
                  text={`${insights.upcoming[0].courseName}: ${
                    insights.upcoming[0].title
                  } is due in ${Math.max(
                    0,
                    daysUntil(getDueDate(insights.upcoming[0])!)
                  )} day(s).`}
                />
              )}

              {insights.upcomingSchoolAssessments[0] && (
                <InsightCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Next school assessment"
                  text={`${insights.upcomingSchoolAssessments[0].subject}: ${insights.upcomingSchoolAssessments[0].title} is due in ${Math.max(
                    0,
                    daysUntil(
                      new Date(
                        insights.upcomingSchoolAssessments[0].due_at
                      )
                    )
                  )} day(s)${
                    insights.upcomingSchoolAssessments[0].weighting !== null
                      ? ` and is worth ${insights.upcomingSchoolAssessments[0].weighting}%`
                      : ""
                  }.`}
                />
              )}

              {insights.weakest && (
                <InsightCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Lowest graded average"
                  text={`${insights.weakest.name} currently has the lowest available graded average at ${Math.round(
                    insights.weakest.average!
                  )}%.`}
                />
              )}

              {insights.busiest && (
                <InsightCard
                  icon={<Target className="w-5 h-5" />}
                  title="Highest workload"
                  text={`${insights.busiest.name} has ${insights.busiest.pending} incomplete task(s) in the current Classroom data.`}
                />
              )}

              {insights.incomplete.length === 0 && (
                <InsightCard
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  title="You're clear"
                  text="No incomplete Classroom work is currently visible."
                />
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold tracking-wider text-[#666]">
                CLASS OVERVIEW
              </p>

              {insights.courseStats.map((course) => (
                <Card
                  key={course.id}
                  className="p-4 border border-black/5"
                  style={{ borderRadius: "16px" }}
                >
                  <div className="flex justify-between gap-4 mb-3">
                    <div>
                      <h3 className="m-0 text-sm font-bold">
                        {course.name}
                      </h3>
                      <p className="m-0 mt-1 text-xs text-[#595959]">
                        {course.pending} incomplete
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="m-0 font-extrabold">
                        {course.average === null
                          ? "—"
                          : `${Math.round(course.average)}%`}
                      </p>
                      <p className="m-0 text-[10px] text-[#777]">
                        graded average
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={course.completion}
                    className="h-2.5"
                  />
                </Card>
              ))}
            </div>

            <Button
              className="w-full h-12"
              onClick={() => setShowStudyPlan(true)}
              disabled={insights.incomplete.length === 0 && insights.upcomingSchoolAssessments.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Build Study Schedule
            </Button>

            <p className="text-[11px] text-center text-[#777]">
              The schedule combines live Classroom deadlines with
              school assessments you add yourself. Recommended session
              lengths are planning estimates, not teacher-provided durations.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 text-center border border-black/5">
      <div className="mx-auto mb-2 w-9 h-9 rounded-xl flex items-center justify-center bg-[#FFD50022] text-[#C59F00]">
        {icon}
      </div>
      <p className="m-0 text-xl font-extrabold">{value}</p>
      <p className="m-0 mt-1 text-[10px] text-[#666]">
        {label}
      </p>
    </Card>
  );
}

function InsightCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card
      className="p-4 border border-[#FFD50044]"
      style={{
        background: "#FFFDF4",
        borderRadius: "16px",
      }}
    >
      <div className="flex gap-3">
        <div className="text-[#C59F00] mt-0.5">{icon}</div>
        <div>
          <h3 className="m-0 text-sm font-bold">{title}</h3>
          <p className="m-0 mt-1 text-xs text-[#595959] leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}