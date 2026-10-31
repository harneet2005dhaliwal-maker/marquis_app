// src/components/BookingsPage.tsx
import { useState, type PointerEvent } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Calendar,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  XCircle,
  Check,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

// Subject color mapping - Marquis Brand
const getSubjectStyle = (subject: string) => {
  const isMath = subject.includes("Mathematics");
  return {
    bg: isMath ? "#FFD500" : "#000000",
    iconColor: isMath ? "#000000" : "#FFFFFF",
    textColor: isMath ? "#000000" : "#FFFFFF",
    border: isMath ? "#FFD500" : "#000000",
  };
};

type ViewMode = "schedule" | "book-new" | "reschedule";

interface RescheduleDetails {
  classId: number | string;
  originalDate: string;
  originalTime: string;
  newDate: string;
  newTime: string;
}

interface LocalClass {
  id: number;
  subject: string;
  teacher: string;
  dayOfWeek: string;
  time: string;
  date: string;
  cancelled: boolean;
}

type TimeSlotStatus = "available" | "scheduled";

interface TimeSlot {
  time: string;
  available: boolean;
  status: TimeSlotStatus;
  classId?: string;
  teacher?: string | null;
}

interface ChangeRequest {
  id: number;
  subject: string;
  requestedDate: string; // pretty (Wed, Dec 17)
  requestedISODate: string; // YYYY-MM-DD
  requestedTime: string;
  note?: string;
  status: "pending";
}

export function BookingsPage() {
  const {
    currentStudent,
    getUpcomingClasses,
    classes,
  } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterEducator, setFilterEducator] = useState("all");
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [rescheduleDetails, setRescheduleDetails] =
    useState<RescheduleDetails | null>(null);
  const [classToReschedule, setClassToReschedule] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Local state for managing classes (additions and cancellations)
  const [localClasses, setLocalClasses] = useState<LocalClass[]>([]);
  const [cancelledClassIds, setCancelledClassIds] = useState<
    Set<string | number>
  >(new Set());

  // Change request state
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState("");
  const [requestTime, setRequestTime] = useState("");
  const [requestNote, setRequestNote] = useState("");

  // Interactive lava background
  const [lavaPointer, setLavaPointer] = useState({
    x: 0,
    y: 0,
    active: false,
  });

  const updateLavaPointer = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setLavaPointer({
      x:
        (event.clientX - rect.left) /
          rect.width -
        0.5,
      y:
        (event.clientY - rect.top) /
          rect.height -
        0.5,
      active: true,
    });
  };

  const resetLavaPointer = () => {
    setLavaPointer({
      x: 0,
      y: 0,
      active: false,
    });
  };

  // Merge API classes with local classes
  const apiClasses = getUpcomingClasses(currentStudent?.id);
  const allClasses = [
    ...apiClasses.map((cls) => ({
      ...cls,
      cancelled: cancelledClassIds.has(cls.id),
    })),
    ...localClasses,
  ];

  const upcomingClasses = allClasses;

  // ---------- calendar helpers ----------

  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dates: (Date | null)[] = [];

    // Empty slots before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }

    // All days of month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }

    return dates;
  };

  const calendarDates = generateCalendarDates();

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // ---------- REAL time-slot builder (from real classes) ----------

  const normaliseSubject = (subject?: string | null) =>
    (subject ?? "")
      .toLowerCase()
      .replace(/^individual\\s*-\\s*/i, "")
      .replace(/\\bmaths\\b/g, "math")
      .replace(/\\s+/g, " ")
      .trim();

  const buildAvailableTimeSlotsForDate = (
    date: Date | null
  ): TimeSlot[] => {
    if (!date || !currentStudent) return [];

    const weekdayShort = date
      .toLocaleDateString("en-AU", {
        weekday: "short",
      })
      .slice(0, 3)
      .toLowerCase();

    const subjectFilter =
      classToReschedule?.subject ??
      currentStudent.subject ??
      "";

    const yearFilter =
      classToReschedule?.yearLevel ??
      currentStudent.yearLevel ??
      "";

    const candidateClasses = classes.filter((cls) => {
      const sameSubject =
        !subjectFilter ||
        normaliseSubject(cls.subject) ===
          normaliseSubject(subjectFilter);

      const sameYear =
        !yearFilter ||
        cls.yearLevel === yearFilter;

      const isDifferentClass =
        cls.id !== classToReschedule?.id;

      return (
        sameSubject &&
        sameYear &&
        isDifferentClass
      );
    });

    const slotMap = new Map<string, TimeSlot>();

    candidateClasses.forEach((cls) => {
      const clsDay = (
        cls.dayOfWeek ??
        cls.lessonDay ??
        ""
      )
        .slice(0, 3)
        .toLowerCase();

      if (clsDay !== weekdayShort) return;

      const time =
        cls.time ??
        (cls.startTime && cls.endTime
          ? `${cls.startTime.slice(0, 5)}–${cls.endTime.slice(0, 5)}`
          : "");

      if (!time) return;

      // Do not offer the exact class currently being rescheduled.
      if (
        viewMode === "reschedule" &&
        cls.id === classToReschedule?.id
      ) {
        return;
      }

      if (!slotMap.has(time)) {
        slotMap.set(time, {
          time,
          available: true,
          status: "available",
          classId: cls.id,
          teacher:
            cls.teacherName ??
            cls.teacher ??
            null,
        });
      }
    });

    return Array.from(slotMap.values()).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  };

  // Build slots for the *currently* selected date
  const availableTimeSlots = buildAvailableTimeSlotsForDate(selectedDate);

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
    }
  };

  const handleRescheduleClick = (cls: any) => {
    setClassToReschedule(cls);
    setViewMode("reschedule");
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const handleCancelClass = (cls: any) => {
    // Mark API classes as cancelled via ID set
    setCancelledClassIds((prev) => new Set([...prev, cls.id]));

    // Also mark any local class with that ID as cancelled
    setLocalClasses((prev) =>
      prev.map((c) => (c.id === cls.id ? { ...c, cancelled: true } : c))
    );

    toast.error("Class Cancelled", {
      description: `${cls.subject} on ${cls.dayOfWeek} at ${cls.time} has been cancelled.`,
      duration: 4000,
    });
  };

  const confirmReschedule = () => {
    if (classToReschedule && selectedDate && selectedTimeSlot) {
      const selectedSlot = availableTimeSlots.find(
        (slot) => slot.time === selectedTimeSlot
      );

      const selectedReplacementClass = selectedSlot?.classId
        ? classes.find(
            (cls) => cls.id === selectedSlot.classId
          )
        : undefined;

      const newClass: LocalClass = {
        id: Date.now(),
        subject:
          selectedReplacementClass?.subject ??
          classToReschedule.subject,
        teacher:
          selectedReplacementClass?.teacherName ??
          selectedReplacementClass?.teacher ??
          selectedSlot?.teacher ??
          classToReschedule.teacher,
        dayOfWeek: selectedDate.toLocaleDateString("en-AU", {
          weekday: "short",
        }),
        time:
          selectedReplacementClass?.time ??
          selectedTimeSlot,
        date: selectedDate.toLocaleDateString("en-AU", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        cancelled: false,
      };

      setCancelledClassIds((prev) => new Set([...prev, classToReschedule.id]));
      setLocalClasses((prev) => [...prev, newClass]);

      setRescheduleDetails({
        classId: classToReschedule.id,
        originalDate: classToReschedule.date,
        originalTime: classToReschedule.time,
        newDate: selectedDate.toLocaleDateString("en-AU", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        newTime: selectedTimeSlot,
      });
      setShowRescheduleSuccess(true);
      setViewMode("schedule");
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    }
  };

  // NEW: booking uses real teacher from matching class in `classes`
  const confirmBooking = () => {
    if (selectedDate && selectedTimeSlot) {
      const weekdayShort = selectedDate
        .toLocaleDateString("en-AU", { weekday: "short" })
        .toLowerCase();

      const subjectFilter = currentStudent?.subject;
      const yearFilter = currentStudent?.yearLevel;

      // Find a real class that matches this day + time (+ subject/year)
      const matchingClass = classes.find((cls) => {
        const clsDay = (cls.dayOfWeek || "").slice(0, 3).toLowerCase();
        if (clsDay !== weekdayShort) return false;
        if (cls.time !== selectedTimeSlot) return false;
        if (subjectFilter && cls.subject !== subjectFilter) return false;
        if (yearFilter && cls.yearLevel !== yearFilter) return false;
        return true;
      });

      const subject =
        classToReschedule?.subject ||
        matchingClass?.subject ||
        currentStudent?.subject ||
        "Mathematics";

      const teacher =
        classToReschedule?.teacher ||
        matchingClass?.teacher ||
        "Araf"; // fallback only

      const newClass: LocalClass = {
        id: Date.now(),
        subject,
        teacher,
        dayOfWeek: selectedDate.toLocaleDateString("en-AU", {
          weekday: "short",
        }),
        time: selectedTimeSlot,
        date: selectedDate.toLocaleDateString("en-AU", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        cancelled: false,
      };

      setLocalClasses((prev) => [...prev, newClass]);

      toast.success("Class Booked Successfully! 🎉", {
        description: `${newClass.subject} on ${newClass.dayOfWeek} at ${newClass.time}`,
        duration: 4000,
      });

      setViewMode("schedule");
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    }
  };

  const uniqueSubjects = Array.from(
    new Set(upcomingClasses.map((c) => c.subject))
  );
  const uniqueEducators = Array.from(
    new Set(upcomingClasses.map((c) => c.teacher))
  );

  const filteredClasses = upcomingClasses.filter((cls) => {
    const matchesSubject =
      filterSubject === "all" || cls.subject === filterSubject;
    const matchesEducator =
      filterEducator === "all" || cls.teacher === filterEducator;
    return matchesSubject && matchesEducator;
  });

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      onPointerMove={updateLavaPointer}
      onPointerLeave={resetLavaPointer}
      onPointerDown={(event) => {
        updateLavaPointer(event);
        setLavaPointer((prev) => ({
          ...prev,
          active: true,
        }));
      }}
      onPointerUp={() =>
        setLavaPointer((prev) => ({
          ...prev,
          active: false,
        }))
      }
      style={{
        background:
          "linear-gradient(180deg, #F7F5EF 0%, #FBFAF7 48%, #F0ECE3 100%)",
        color: "#111111",
        touchAction: "pan-y",
      }}
    >
      {/* Faster, interactive lava-lamp background */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <motion.div
          animate={{
            x: lavaPointer.active
              ? lavaPointer.x * 70
              : [0, 36, -18, 0],
            y: lavaPointer.active
              ? lavaPointer.y * 52
              : [0, 28, -12, 0],
            scale: lavaPointer.active
              ? 1.22
              : [1, 1.11, 0.97, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.38 : 8.5,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius:
              "46% 54% 58% 42% / 48% 42% 58% 52%",
            top: "-86px",
            right: "-118px",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,213,0,0.46), rgba(255,213,0,0.14) 56%, transparent 74%)",
            filter: "blur(14px)",
          }}
        />

        <motion.div
          animate={{
            x: lavaPointer.active
              ? lavaPointer.x * -52
              : [0, -30, 20, 0],
            y: lavaPointer.active
              ? lavaPointer.y * -42
              : [0, -22, 30, 0],
            scale: lavaPointer.active
              ? 1.16
              : [1, 0.95, 1.09, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.42 : 10,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "250px",
            height: "250px",
            borderRadius:
              "58% 42% 46% 54% / 42% 58% 44% 56%",
            top: "285px",
            left: "-128px",
            background:
              "radial-gradient(circle at 55% 40%, rgba(17,17,17,0.16), rgba(125,125,125,0.08) 52%, transparent 72%)",
            filter: "blur(17px)",
          }}
        />

        <motion.div
          animate={{
            x: lavaPointer.active
              ? lavaPointer.x * 58
              : [0, 22, -30, 0],
            y: lavaPointer.active
              ? lavaPointer.y * 44
              : [0, 30, 12, 0],
            scale: lavaPointer.active
              ? 1.18
              : [1, 1.07, 0.96, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.4 : 9,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "235px",
            height: "235px",
            borderRadius:
              "43% 57% 51% 49% / 56% 44% 58% 42%",
            bottom: "110px",
            right: "-102px",
            background:
              "radial-gradient(circle at 42% 38%, rgba(255,213,0,0.31), rgba(170,170,170,0.10) 58%, transparent 74%)",
            filter: "blur(16px)",
          }}
        />

        <motion.div
          animate={{
            x: lavaPointer.active
              ? lavaPointer.x * -30
              : [0, 15, -15, 0],
            y: lavaPointer.active
              ? lavaPointer.y * 28
              : [0, -18, 18, 0],
            scale: lavaPointer.active
              ? 1.26
              : [1, 1.06, 1],
          }}
          transition={{
            duration: lavaPointer.active ? 0.32 : 7,
            repeat: lavaPointer.active ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            top: "54%",
            left: "58%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.58), rgba(255,255,255,0.08) 65%, transparent 78%)",
            filter: "blur(12px)",
          }}
        />
      </div>

      <div className="p-6 relative" style={{ zIndex: 2 }}>
        {/* Header */}
        {viewMode === "schedule" ? (
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: "relative",
              overflow: "hidden",
              marginBottom: "20px",
              padding: "22px",
              borderRadius: "30px",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.50))",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.94)",
              boxShadow:
                "0 18px 42px rgba(35,30,20,0.08), inset 0 1px 0 rgba(255,255,255,0.90)",
            }}
          >
            <motion.div
              aria-hidden="true"
              animate={{
                x: [0, 12, -7, 0],
                y: [0, -8, 7, 0],
                scale: [1, 1.07, 0.98, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                width: "160px",
                height: "160px",
                right: "-65px",
                top: "-62px",
                borderRadius:
                  "46% 54% 58% 42% / 48% 42% 58% 52%",
                background:
                  "radial-gradient(circle at 40% 35%, rgba(255,213,0,0.34), rgba(255,213,0,0.08) 60%, transparent 76%)",
                filter: "blur(8px)",
              }}
            />

            <div className="relative z-10">
              <p
                style={{
                  margin: 0,
                  color: "#9A7D00",
                  fontSize: "11px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Classes
              </p>

              <div
                className="flex items-center gap-3"
                style={{ marginTop: "6px" }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontFamily:
                      "Neurial Grotesk, sans-serif",
                    fontWeight: 800,
                    fontSize: "34px",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "#000000",
                  }}
                >
                  My Classes
                </h1>
                <Calendar
                  className="w-8 h-8"
                  style={{ color: "#FFD500" }}
                />
              </div>

              <p
                style={{
                  margin: "9px 0 0",
                  fontFamily:
                    "Neurial Grotesk, sans-serif",
                  color: "#6E6E70",
                  fontSize: "15px",
                  lineHeight: 1.45,
                }}
              >
                Your upcoming sessions
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0,1fr) 58px",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <motion.div
                  whileHover={{
                    y: -2,
                    scale: 1.01,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() =>
                      setViewMode("book-new")
                    }
                    className="w-full border-0"
                    style={{
                      minHeight: "56px",
                      borderRadius: "18px",
                      background:
                        "linear-gradient(135deg,#FFD500 0%,#FFDE3F 55%,#E8B600 100%)",
                      color: "#111111",
                      fontFamily:
                        "Neurial Grotesk, sans-serif",
                      fontSize: "16px",
                      fontWeight: 800,
                      boxShadow:
                        "0 12px 28px rgba(255,213,0,0.22), inset 0 1px 0 rgba(255,255,255,0.58)",
                    }}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book New Class
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() =>
                      setShowFilters(!showFilters)
                    }
                    variant="outline"
                    className="w-full h-full p-0"
                    style={{
                      minHeight: "56px",
                      borderRadius: "18px",
                      border:
                        "1px solid rgba(255,255,255,0.92)",
                      background:
                        "rgba(255,255,255,0.62)",
                      backdropFilter:
                        "blur(18px)",
                      WebkitBackdropFilter:
                        "blur(18px)",
                      boxShadow:
                        "0 10px 24px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Filter className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setViewMode("schedule");
                  setSelectedDate(null);
                  setSelectedTimeSlot(null);
                  setClassToReschedule(null);
                }}
                className="px-3"
                style={{
                  fontFamily:
                    "Neurial Grotesk, sans-serif",
                  fontWeight: 600,
                  color: "#6E6E70",
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>

            <h1
              className="mt-0 mb-1"
              style={{
                fontFamily:
                  "Neurial Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "#000000",
              }}
            >
              {viewMode === "book-new"
                ? "Book a Class"
                : "Reschedule Class"}
            </h1>

            <p
              className="text-sm"
              style={{
                fontFamily:
                  "Neurial Grotesk, sans-serif",
                color: "#6E6E70",
                marginTop: "0",
              }}
            >
              {viewMode === "book-new"
                ? "Choose a date and time"
                : "Select a new date and time"}
            </p>
          </motion.div>
        )}

        {/* Schedule View */}
        {viewMode === "schedule" && (
          <div className="space-y-6">
            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card
                    className="border-0 p-5"
                    style={{
                      borderRadius: "22px",
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(22px)",
                      WebkitBackdropFilter: "blur(22px)",
                      border: "1px solid rgba(255,255,255,0.90)",
                      boxShadow:
                        "0 14px 30px rgba(30,26,18,0.07), inset 0 1px 0 rgba(255,255,255,0.88)",
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          className="text-xs mb-2 block"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600,
                            color: "#6E6E70",
                          }}
                        >
                          Subject
                        </Label>
                        <Select
                          value={filterSubject}
                          onValueChange={setFilterSubject}
                        >
                          <SelectTrigger
                            className="rounded-xl"
                            style={{ borderColor: "#E6E6E6" }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {uniqueSubjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          className="text-xs mb-2 block"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600,
                            color: "#6E6E70",
                          }}
                        >
                          Educator
                        </Label>
                        <Select
                          value={filterEducator}
                          onValueChange={setFilterEducator}
                        >
                          <SelectTrigger
                            className="rounded-xl"
                            style={{ borderColor: "#E6E6E6" }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Educators</SelectItem>
                            {uniqueEducators.map((educator) => (
                              <SelectItem key={educator} value={educator}>
                                {educator}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Class List */}
            {filteredClasses.length === 0 ? (
              <Card
                className="border-0 p-8 text-center"
                style={{
                  borderRadius: "24px",
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                  border: "1px solid rgba(255,255,255,0.92)",
                  boxShadow:
                    "0 16px 36px rgba(30,26,18,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
                }}
              >
                <Calendar
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: "#E6E6E6" }}
                />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif ",
                    color: "#6E6E70",
                  }}
                >
                  No upcoming classes booked
                </p>
                <p
                  style={{
                    marginTop: "6px",
                    color: "#9A938B",
                    fontSize: "13px",
                    lineHeight: 1.45,
                  }}
                >
                  Looks like your schedule is wide open. Let’s change that.
                </p>
                <Button
                  onClick={() => setViewMode("book-new")}
                  className="mt-4 rounded-xl border-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFD500 0%, #FFDF42 58%, #F0BD00 100%)",
                    color: "#000000",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 700,
                    boxShadow: "0 8px 18px rgba(255,213,0,0.20)",
                  }}
                >
                  Book a Class
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredClasses.map((cls, index) => {
                  const styles = getSubjectStyle(cls.subject);

                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <Card
                        className="border-0 p-5"
                        style={{
                          borderRadius: "22px",
                          boxShadow: cls.cancelled
                            ? "0px 4px 12px rgba(0, 0, 0, 0.04)"
                            : "0px 10px 26px rgba(0, 0, 0, 0.06)",
                          background: "rgba(255,255,255,0.72)",
                          backdropFilter: "blur(22px)",
                          WebkitBackdropFilter: "blur(22px)",
                          border: "1px solid rgba(255,255,255,0.90)",
                          borderLeft: `4px solid ${styles.border}`,
                          opacity: cls.cancelled ? 0.6 : 1,
                        }}
                      >
                        {/* Status Badge */}
                        {cls.cancelled && (
                          <div className="mb-3">
                            <Badge
                              className="border-0"
                              style={{
                                background: "#FFEBEE",
                                color: "#E57373",
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontWeight: 600,
                                fontSize: "11px",
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelled
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <motion.div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: styles.bg }}
                            whileHover={{ scale: 1.05, rotate: 3 }}
                          >
                            <BookOpen
                              className="w-7 h-7"
                              style={{
                                color: styles.iconColor,
                                strokeWidth: 2.5,
                              }}
                            />
                          </motion.div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3
                              className="mb-1"
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontWeight: 500,
                                fontSize: "18px",
                                color: cls.cancelled ? "#9CA3AF" : "#000000",
                                textDecoration: cls.cancelled
                                  ? "line-through"
                                  : "none",
                                textDecorationColor: cls.cancelled
                                  ? "#E57373"
                                  : undefined,
                              }}
                            >
                              {cls.subject}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <User
                                className="w-3.5 h-3.5"
                                style={{ color: "#6E6E70" }}
                              />
                              <p
                                className="text-sm"
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontWeight: 400,
                                  color: cls.cancelled
                                    ? "#9CA3AF"
                                    : "#6E6E70",
                                }}
                              >
                                {cls.teacher}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                                style={{
                                  background: cls.cancelled
                                    ? "#F3F4F6"
                                    : "#FAFAFA",
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontWeight: 600,
                                  color: cls.cancelled
                                    ? "#9CA3AF"
                                    : "#000000",
                                }}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                {cls.dayOfWeek}
                              </div>
                              <div
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                                style={{
                                  background: cls.cancelled
                                    ? "#F3F4F6"
                                    : "#FAFAFA",
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontWeight: 600,
                                  color: cls.cancelled
                                    ? "#9CA3AF"
                                    : "#000000",
                                  textDecoration: cls.cancelled
                                    ? "line-through"
                                    : "none",
                                  textDecorationColor: cls.cancelled
                                    ? "#E57373"
                                    : undefined,
                                }}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {cls.time}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {!cls.cancelled && (
                          <div
                            className="flex gap-2 mt-4 pt-4"
                            style={{ borderTop: "1px solid #F3F4F6" }}
                          >
                            <motion.div
                              className="flex-1"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={() => handleRescheduleClick(cls)}
                                variant="outline"
                                className="w-full rounded-xl"
                                style={{
                                  borderWidth: "2px",
                                  borderColor: "#E6E6E6",
                                  color: "#000000",
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                🔄 Reschedule
                              </Button>
                            </motion.div>
                            <motion.div
                              className="flex-1"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={() => handleCancelClass(cls)}
                                variant="outline"
                                className="w-full rounded-xl"
                                style={{
                                  borderWidth: "2px",
                                  borderColor: "#FFCDD2",
                                  color: "#E57373",
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                ❌ Cancel
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Book New / Reschedule View */}
        {(viewMode === "book-new" || viewMode === "reschedule") && (
          <div className="space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="border-0 p-6"
                style={{
                  borderRadius: "24px",
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                  border: "1px solid rgba(255,255,255,0.92)",
                  boxShadow:
                    "0 16px 36px rgba(30,26,18,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
                }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="mb-0"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: "20px",
                      color: "#000000",
                    }}
                  >
                    {currentMonth.toLocaleDateString("en-AU", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1
                          )
                        )
                      }
                      className="w-9 h-9 p-0 rounded-xl"
                    >
                      <ChevronLeft
                        className="w-4 h-4"
                        style={{ color: "#000000" }}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1
                          )
                        )
                      }
                      className="w-9 h-9 p-0 rounded-xl"
                    >
                      <ChevronRight
                        className="w-4 h-4"
                        style={{ color: "#000000" }}
                      />
                    </Button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs py-2"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontWeight: 600,
                          color: "#6E6E70",
                        }}
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDates.map((date, index) => {
                    const isSelected =
                      date &&
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString();
                    const isTodayDate = isToday(date);
                    const isPast = isPastDate(date);

                    const slotsForThisDay =
                      buildAvailableTimeSlotsForDate(date);
                    const hasScheduled = slotsForThisDay.some(
                      (s) => s.status === "scheduled"
                    );
                    const hasAvailable = slotsForThisDay.some(
                      (s) => s.status === "available"
                    );

                    const iso = date ? date.toISOString().slice(0, 10) : "";
                    const hasPendingRequest =
                      date &&
                      changeRequests.some(
                        (r) => r.requestedISODate === iso && r.status === "pending"
                      );

                    return (
                      <motion.button
                        key={index}
                        onClick={() => !isPast && handleDateClick(date)}
                        disabled={!date || isPast}
                        className="aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all disabled:cursor-not-allowed"
                        style={{
                          background: isSelected
                            ? "#FFD500"
                            : date && !isPast
                            ? "rgba(255,255,255,0.52)"
                            : "transparent",
                          color: isSelected
                            ? "#000000"
                            : isPast || !date
                            ? "#D1D5DB"
                            : "#000000",
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: "14px",
                          border:
                            isTodayDate && !isSelected
                              ? "2px solid #FFD500"
                              : hasPendingRequest && !isSelected
                              ? "1px dashed #F59E0B"
                              : "none",
                          boxShadow: isSelected
                            ? "0px 4px 12px rgba(255,213,0,0.3)"
                            : "none",
                        }}
                        whileHover={
                          date && !isPast ? { scale: 1.05, y: -2 } : {}
                        }
                        whileTap={date && !isPast ? { scale: 0.95 } : {}}
                      >
                        {date && (
                          <>
                            <span>{date.getDate()}</span>
                            {(hasScheduled ||
                              hasAvailable ||
                              hasPendingRequest) && (
                              <div className="flex gap-0.5 mt-1">
                                {hasScheduled && (
                                  <div
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: "#A78BFA" }}
                                  />
                                )}
                                {hasAvailable && (
                                  <div
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: "#74D889" }}
                                  />
                                )}
                                {hasPendingRequest && (
                                  <div
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: "#F59E0B" }}
                                  />
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            {/* Time Slots */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="border-0 p-6"
                  style={{
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(22px)",
                    WebkitBackdropFilter: "blur(22px)",
                    border: "1px solid rgba(255,255,255,0.92)",
                    boxShadow:
                      "0 16px 36px rgba(30,26,18,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
                  }}
                >
                  <h3
                    className="mb-4"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: "18px",
                      color: "#000000",
                    }}
                  >
                    Available Times
                  </h3>
                  <p
                    className="text-sm mb-4"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      color: "#6E6E70",
                    }}
                  >
                    {selectedDate.toLocaleDateString("en-AU", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {availableTimeSlots.length === 0 && (
                      <p
                        className="col-span-2 text-sm"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          color: "#6E6E70",
                        }}
                      >
                        No matching alternative classes run on this day.
                      </p>
                    )}

                    {availableTimeSlots.map((slot) => {
                      const isSelectedTime = selectedTimeSlot === slot.time;
                      const isAvailable = slot.available;

                      return (
                        <motion.button
                          key={slot.time}
                          onClick={() =>
                            isAvailable && setSelectedTimeSlot(slot.time)
                          }
                          disabled={!isAvailable}
                          className="p-4 rounded-2xl text-left transition-all disabled:cursor-not-allowed"
                          style={{
                            background: isSelectedTime
                              ? "linear-gradient(135deg,#FFD500,#FFDF42)"
                              : "rgba(255,255,255,0.62)",
                            backdropFilter: "blur(18px)",
                            WebkitBackdropFilter: "blur(18px)",
                            border: isSelectedTime
                              ? "none"
                              : "2px solid #E6E6E6",
                            boxShadow: isSelectedTime
                              ? "0px 4px 12px rgba(255,213,0,0.3)"
                              : "0px 4px 12px rgba(0, 0, 0, 0.04)",
                            opacity: !isAvailable ? 0.5 : 1,
                          }}
                          whileHover={
                            isAvailable ? { scale: 1.03, y: -2 } : {}
                          }
                          whileTap={isAvailable ? { scale: 0.97 } : {}}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontWeight: 700,
                                fontSize: "16px",
                                color: "#000000",
                              }}
                            >
                              {slot.time}
                            </span>
                            {isSelectedTime && (
                              <Check
                                className="w-4 h-4"
                                style={{ color: "#000000" }}
                              />
                            )}
                          </div>
                          <div
                            className="px-2 py-1 rounded-lg inline-block text-xs"
                            style={{
                              background:
                                slot.status === "available"
                                  ? "rgba(116, 216, 137, 0.15)"
                                  : "rgba(167, 139, 250, 0.15)",
                              color:
                                slot.status === "available"
                                  ? "#74D889"
                                  : "#A78BFA",
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {slot.status === "available"
                              ? "Available"
                              : "Scheduled"}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Request a different time (only when booking new) */}
            {viewMode === "book-new" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="border-0 p-5"
                  style={{
                    borderRadius: "22px",
                    background: "rgba(255,255,255,0.68)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.88)",
                    boxShadow: "0 12px 28px rgba(30,26,18,0.06)",
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "#000000",
                      }}
                    >
                      Can’t see a time that works?
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRequestForm((prev) => !prev)}
                      className="px-3"
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontWeight: 600,
                        color: "#6E6E70",
                      }}
                    >
                      {showRequestForm ? "Close" : "Request change"}
                    </Button>
                  </div>

                  {showRequestForm && (
                    <div className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label
                            className="text-xs mb-1 block"
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontWeight: 600,
                              color: "#6E6E70",
                            }}
                          >
                            Preferred date
                          </Label>
                          <input
                            type="date"
                            value={requestDate}
                            onChange={(e) => setRequestDate(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ borderColor: "#E6E6E6" }}
                          />
                        </div>
                        <div>
                          <Label
                            className="text-xs mb-1 block"
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontWeight: 600,
                              color: "#6E6E70",
                            }}
                          >
                            Preferred time
                          </Label>
                          <input
                            type="time"
                            value={requestTime}
                            onChange={(e) => setRequestTime(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            style={{ borderColor: "#E6E6E6" }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          className="text-xs mb-1 block"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600,
                            color: "#6E6E70",
                          }}
                        >
                          Note (optional)
                        </Label>
                        <textarea
                          value={requestNote}
                          onChange={(e) => setRequestNote(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          style={{ borderColor: "#E6E6E6" }}
                          placeholder="e.g. clashes with sport, prefer after 5pm..."
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!requestDate || !requestTime) {
                            toast.error("Please pick a date and time");
                            return;
                          }

                          if (!currentStudent?.id) {
                            toast.error("Student account not found");
                            return;
                          }

                          try {
                            const requestedDateTime = new Date(
                              `${requestDate}T${requestTime}:00`
                            );

                            if (Number.isNaN(requestedDateTime.getTime())) {
                              toast.error("Please enter a valid date and time");
                              return;
                            }

                            const { data, error } = await supabase
                              .from("class_change_requests")
                              .insert({
                                student_id: currentStudent.id,
                                class_id: classToReschedule?.id
                                  ? String(classToReschedule.id)
                                  : null,
                                current_class_time: null,
                                requested_class_time:
                                  requestedDateTime.toISOString(),
                                reason: requestNote.trim() || null,
                                status: "pending",
                              })
                              .select("id")
                              .single();

                            if (error) {
                              console.error(
                                "Change request insert failed:",
                                error
                              );
                              toast.error("Could not send request", {
                                description:
                                  error.message ||
                                  "Please try again in a moment.",
                              });
                              return;
                            }

                            const displayDate =
                              requestedDateTime.toLocaleDateString(
                                "en-AU",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              );

                            const studentRecord = currentStudent as any;

                            const studentName =
                              studentRecord.fullName ||
                              studentRecord.name ||
                              [
                                studentRecord.firstName,
                                studentRecord.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") ||
                              studentRecord.email ||
                              `Student ${currentStudent.id}`;

                            const { error: emailError } =
                              await supabase.functions.invoke(
                                "send-class-change-email",
                                {
                                  body: {
                                    requestId: data.id,
                                    studentName,
                                    subject:
                                      currentStudent.subject ||
                                      classToReschedule?.subject ||
                                      "Class",
                                    requestedDate: displayDate,
                                    requestedTime: requestTime,
                                    reason:
                                      requestNote.trim() ||
                                      "No reason supplied",
                                  },
                                }
                              );

                            if (emailError) {
                              console.error(
                                "Change request was saved, but admin email failed:",
                                emailError
                              );

                              toast.warning(
                                "Request saved, but notification failed",
                                {
                                  description:
                                    "Your request is safely stored in Marquis. The admin email could not be sent automatically.",
                                }
                              );
                            }

                            const newRequest: ChangeRequest = {
                              id:
                                typeof data?.id === "number"
                                  ? data.id
                                  : Date.now(),
                              subject:
                                currentStudent.subject || "Class",
                              requestedDate: displayDate,
                              requestedISODate: requestDate,
                              requestedTime: requestTime,
                              note:
                                requestNote.trim() || undefined,
                              status: "pending",
                            };

                            setChangeRequests((prev) => [
                              ...prev,
                              newRequest,
                            ]);
                            setRequestDate("");
                            setRequestTime("");
                            setRequestNote("");
                            setShowRequestForm(false);

                            if (!emailError) {
                              toast.success("Request sent to Marquis", {
                                description:
                                  "Your preferred class time has been saved and the Marquis admin team has been notified by email.",
                              });
                            }
                          } catch (err) {
                            console.error(
                              "Unexpected change request error:",
                              err
                            );
                            toast.error("Something went wrong", {
                              description:
                                "Your request could not be submitted. Please try again.",
                            });
                          }
                        }}
                        className="w-full rounded-2xl border-0"
                        style={{
                          background: "#FFD500",
                          color: "#000000",
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        Submit request
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Confirm Button */}
            {selectedDate && selectedTimeSlot && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode("schedule");
                    setSelectedDate(null);
                    setSelectedTimeSlot(null);
                    setClassToReschedule(null);
                  }}
                  className="flex-1 rounded-2xl"
                  style={{
                    borderWidth: "2px",
                    borderColor: "#E6E6E6",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 600,
                    color: "#000000",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    viewMode === "reschedule"
                      ? confirmReschedule
                      : confirmBooking
                  }
                  className="flex-1 rounded-2xl border-0"
                  style={{
                    background: "#FFD500",
                    color: "#000000",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 700,
                    boxShadow: "0px 8px 16px rgba(255,213,0,0.25)",
                  }}
                >
                  {viewMode === "reschedule"
                    ? "Confirm Reschedule"
                    : "Confirm Booking"}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Success Modal */}
      <AnimatePresence>
        {showRescheduleSuccess && rescheduleDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setShowRescheduleSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card
                className="border-0 p-8 max-w-md mx-auto text-center"
                style={{
                  borderRadius: "26px",
                  background: "rgba(255,255,255,0.90)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: "1px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 22px 46px rgba(0,0,0,0.16)",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "#FFD500",
                    boxShadow: "0px 8px 20px rgba(255,213,0,0.3)",
                  }}
                >
                  <Check
                    className="w-10 h-10"
                    style={{ color: "#000000", strokeWidth: 3 }}
                  />
                </motion.div>

                <h2
                  className="mb-3"
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 700,
                    fontSize: "24px",
                    color: "#000000",
                  }}
                >
                  Class Rescheduled! 🎉
                </h2>
                <p
                  className="mb-6"
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    color: "#6E6E70",
                  }}
                >
                  Your class has been successfully moved to the new time.
                </p>

                <div
                  className="p-5 rounded-2xl mb-6"
                  style={{ background: "#FAFAFA" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-left">
                      <p
                        className="text-xs mb-1"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontWeight: 600,
                          color: "#6E6E70",
                        }}
                      >
                        Original
                      </p>
                      <p
                        className="text-sm line-through"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          color: "#9CA3AF",
                        }}
                      >
                        {rescheduleDetails.originalDate}
                      </p>
                      <p
                        className="text-sm line-through"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          color: "#9CA3AF",
                        }}
                      >
                        {rescheduleDetails.originalTime}
                      </p>
                    </div>

                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FFD500" }}
                    >
                      <span style={{ fontSize: "16px" }}>→</span>
                    </div>

                    <div className="flex-1 text-right">
                      <p
                        className="text-xs mb-1"
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontWeight: 600,
                          color: "#6E6E70",
                        }}
                      >
                        New Time
                      </p>
                      <div
                        className="p-2 rounded-xl inline-block"
                        style={{ background: "#FFD50020" }}
                      >
                        <p
                          className="text-sm mb-0"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 700,
                            color: "#000000",
                          }}
                        >
                          {rescheduleDetails.newDate}
                        </p>
                        <p
                          className="text-sm mb-0"
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 700,
                            color: "#000000",
                          }}
                        >
                          {rescheduleDetails.newTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowRescheduleSuccess(false)}
                  className="w-full rounded-2xl border-0"
                  style={{
                    background: "#FFD500",
                    color: "#000000",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Got it!
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}