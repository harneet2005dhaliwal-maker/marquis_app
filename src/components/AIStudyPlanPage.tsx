import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
  time: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  priority: "high" | "medium" | "low";
  dueDate: Date | null;
  alternateLink?: string;
  source: "Google Classroom" | "School";
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

  if (days <= 2) return "high" as const;
  if (days <= 7) return "medium" as const;
  return "low" as const;
}

function recommendedMinutes(priority: StudyBlock["priority"]) {
  if (priority === "high") return 60;
  if (priority === "medium") return 45;
  return 30;
}

function getNextSevenDays() {
  const today = startOfToday();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      date,
      day: date.toLocaleDateString("en-AU", {
        weekday: "long",
      }),
    };
  });
}

function buildSchedule(
  items: ClassroomWorkItem[],
  assessments: SchoolAssessment[]
): StudyBlock[] {
  const upcomingDays = getNextSevenDays();

  const classroomItems = items
    .filter((item) => !isSubmitted(item))
    .map((item) => ({
      id: `${item.courseId}-${item.id}`,
      subject: item.courseName,
      topic: item.title,
      dueDate: getDueDate(item),
      priority: getPriority(item),
      alternateLink: item.alternateLink,
      source: "Google Classroom" as const,
      weighting: null as number | null,
      difficulty: null as number | null,
      confidence: null as number | null,
    }));

  const schoolItems = assessments
    .filter((assessment) => new Date(assessment.due_at) >= startOfToday())
    .map((assessment) => {
      const dueDate = new Date(assessment.due_at);
      const days = dayDiff(dueDate);

      let priority: StudyBlock["priority"] =
        days <= 2 ? "high" : days <= 7 ? "medium" : "low";

      // Student-entered context can legitimately raise priority.
      if (
        (assessment.weighting !== null &&
          assessment.weighting >= 25) ||
        (assessment.confidence !== null &&
          assessment.confidence <= 2) ||
        (assessment.difficulty !== null &&
          assessment.difficulty >= 4)
      ) {
        priority = "high";
      }

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
      };
    });

  const pending = [...classroomItems, ...schoolItems].sort((a, b) => {
    const aDue =
      a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue =
      b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (aDue !== bDue) return aDue - bDue;

    const priorityRank = { high: 0, medium: 1, low: 2 };
    return (
      priorityRank[a.priority] - priorityRank[b.priority]
    );
  });

  const perDayCount = new Map<number, number>();

  return pending.map((item, index) => {
    const dueDays =
      item.dueDate === null ? 7 : Math.max(0, dayDiff(item.dueDate));

    const urgencyIndex = Math.max(
      0,
      Math.min(
        upcomingDays.length - 1,
        Math.min(index, Math.max(0, dueDays - 1))
      )
    );

    const slot = perDayCount.get(urgencyIndex) ?? 0;
    perDayCount.set(urgencyIndex, slot + 1);

    // Recommendation, not a claimed historical habit.
    const hour = 16 + Math.min(slot, 3);

    let minutes = recommendedMinutes(item.priority);

    // Give high-weight or low-confidence assessments more room.
    if (
      item.source === "School" &&
      ((item.weighting !== null && item.weighting >= 25) ||
        (item.confidence !== null && item.confidence <= 2))
    ) {
      minutes = Math.max(minutes, 60);
    }

    return {
      id: item.id,
      day: upcomingDays[urgencyIndex].day,
      time: `${String(hour).padStart(2, "0")}:00`,
      subject: item.subject,
      topic: item.topic,
      durationMinutes: minutes,
      priority: item.priority,
      dueDate: item.dueDate,
      alternateLink: item.alternateLink,
      source: item.source,
    };
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

  const todayName = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
  });

  const [selectedDay, setSelectedDay] = useState(
    DAYS.includes(todayName) ? todayName : "Monday"
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
    <div className="min-h-screen pb-24 px-6 pt-6"
      style={{
        background:
          "linear-gradient(to bottom, #FFF9EB 0%, #FFFFFF 55%, #FFF7D9 100%)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Insights
      </Button>

      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#C59F00]" />
            <h1 className="m-0 text-2xl font-bold">
              Smart Study Plan
            </h1>
          </div>
          <p className="m-0 text-sm text-[#595959]">
            Built from Google Classroom plus school assessments
            you add yourself
          </p>
        </div>

        {!googleProviderToken ? (
          <Card className="p-5">
            Sign in with Google to build your schedule.
          </Card>
        ) : loading ? (
          <Card className="p-5 flex items-center gap-3">
            <Clock className="w-5 h-5" />
            Building your schedule...
          </Card>
        ) : error ? (
          <Card className="p-5 text-red-700">
            {error}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                icon={<Clock className="w-5 h-5" />}
                value={`${(totalRecommendedMinutes / 60).toFixed(1)}h`}
                label="Recommended"
              />
              <Stat
                icon={<Target className="w-5 h-5" />}
                value={String(schedule.length)}
                label="Tasks"
              />
              <Stat
                icon={<CheckCircle2 className="w-5 h-5" />}
                value={`${Math.round(completionRate)}%`}
                label="Done"
              />
            </div>

            {schedule.length > 0 && (
              <Card className="p-5 border border-black/5">
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="m-0 text-sm font-bold">
                      Plan Completion
                    </h3>
                    <p className="m-0 mt-1 text-xs text-[#595959]">
                      Check off recommended study blocks
                    </p>
                  </div>
                  <span className="font-bold">
                    {completedBlocks.size}/{schedule.length}
                  </span>
                </div>
                <Progress value={completionRate} className="h-2.5" />
              </Card>
            )}

            {schedule.length === 0 ? (
              <Card className="p-6 text-center border border-black/5">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-600" />
                <h3 className="m-0 font-bold">
                  No incomplete Classroom work
                </h3>
                <p className="m-0 mt-2 text-sm text-[#595959]">
                  There is nothing to schedule from your current
                  Google Classroom data.
                </p>
              </Card>
            ) : (
              <Tabs
                value={selectedDay}
                onValueChange={setSelectedDay}
              >
                <TabsList className="grid grid-cols-7 w-full p-1 h-auto">
                  {DAYS.map((day) => (
                    <TabsTrigger
                      key={day}
                      value={day}
                      className="text-xs py-2"
                    >
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {DAYS.map((day) => {
                  const blocks = schedule.filter(
                    (block) => block.day === day
                  );

                  return (
                    <TabsContent
                      key={day}
                      value={day}
                      className="mt-4 space-y-3"
                    >
                      {blocks.length === 0 ? (
                        <Card className="p-5 text-sm text-[#595959]">
                          No study blocks recommended for {day}.
                        </Card>
                      ) : (
                        blocks.map((block) => {
                          const completed =
                            completedBlocks.has(block.id);

                          return (
                            <motion.div
                              key={block.id}
                              whileTap={{ scale: 0.99 }}
                            >
                              <Card
                                className="p-4 cursor-pointer border border-black/5"
                                onClick={() =>
                                  toggleComplete(block.id)
                                }
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-300" />
                                    )}
                                  </div>

                                  <Badge variant="outline">
                                    {block.time}
                                  </Badge>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3
                                            className={`m-0 text-sm font-bold ${
                                              completed
                                                ? "line-through opacity-60"
                                                : ""
                                            }`}
                                          >
                                            {block.subject}
                                          </h3>
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1.5 py-0"
                                          >
                                            {block.source}
                                          </Badge>
                                        </div>
                                        <p className="m-0 mt-1 text-xs text-[#595959]">
                                          {block.topic}
                                        </p>
                                      </div>

                                      <PriorityBadge
                                        priority={block.priority}
                                      />
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#666]">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {block.durationMinutes} min recommended
                                      </span>

                                      {block.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          Due{" "}
                                          {block.dueDate.toLocaleDateString(
                                            "en-AU",
                                            {
                                              day: "numeric",
                                              month: "short",
                                            }
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}

            <Card
              className="p-4 border border-[#FFD50044]"
              style={{ background: "#FFFDF4" }}
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#C59F00] shrink-0" />
                <p className="m-0 text-xs text-[#595959] leading-relaxed">
                  Marquis is currently estimating session length from
                  deadline urgency because Google Classroom does not
                  provide how long an assignment will take. Once study
                  sessions are saved in Supabase, we can personalise
                  these durations from the student's real history.
                </p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={exportToCalendar}
                disabled={schedule.length === 0}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button
                className="flex-1"
                onClick={handleStartSession}
                disabled={!nextSession}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </div>

            {nextSession && (
              <p className="text-xs text-center text-[#595959]">
                Next: {nextSession.subject} — {nextSession.topic}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
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

function PriorityBadge({
  priority,
}: {
  priority: StudyBlock["priority"];
}) {
  if (priority === "high") {
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200">
        High
      </Badge>
    );
  }

  if (priority === "medium") {
    return (
      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
        Medium
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-50 text-green-700 border-green-200">
      Low
    </Badge>
  );
}