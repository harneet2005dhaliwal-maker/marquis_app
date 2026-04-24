import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  ChevronRight,
  Plus,
  Laptop,
  Users,
  ArrowLeft,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";

interface ClassSession {
  id: string;
  subject: string;
  tutor: string;
  date: string;
  time: string;
  duration: string;
  type: "online" | "in-person";
  location: string;
  status: "upcoming" | "completed" | "cancelled";
  dayOfMonth?: number;
}

export function ParentSchedulePage() {
  const { login, studentId } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<"this" | "next">("this");
  const [view, setView] = useState<"schedule" | "calendar" | "reschedule">("schedule");
  const [currentMonth, setCurrentMonth] = useState(10); // November = 10 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<number | null>(16); // Today is 16th

  // Function to switch to student portal
  const handleOpenStudentPortal = () => {
    // Switch to student view for the same student
    login(studentId || 'student-1', 'student');
  };

  // Mock calendar data with day numbers
  const calendarSessions = [
    { id: "1", subject: "Mathematics", time: "4:00 PM", dayOfMonth: 16, type: "online" as const },
    { id: "2", subject: "English", time: "3:30 PM", dayOfMonth: 17, type: "in-person" as const },
    { id: "3", subject: "Mathematics", time: "5:00 PM", dayOfMonth: 19, type: "online" as const },
    { id: "4", subject: "Mathematics", time: "4:00 PM", dayOfMonth: 20, type: "online" as const },
    { id: "5", subject: "English", time: "3:30 PM", dayOfMonth: 21, type: "in-person" as const },
    { id: "6", subject: "Mathematics", time: "4:00 PM", dayOfMonth: 23, type: "online" as const },
    { id: "7", subject: "English", time: "3:30 PM", dayOfMonth: 24, type: "in-person" as const },
  ];

  const thisWeekSessions: ClassSession[] = [
    {
      id: "1",
      subject: "Mathematics",
      tutor: "Araf",
      date: "Today",
      time: "4:00 PM",
      duration: "1 hour",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
    {
      id: "2",
      subject: "English",
      tutor: "Zara",
      date: "Tomorrow",
      time: "3:30 PM",
      duration: "1 hour",
      type: "in-person",
      location: "Marquis Learning Center",
      status: "upcoming",
    },
    {
      id: "3",
      subject: "Mathematics",
      tutor: "Naveen",
      date: "Wednesday",
      time: "5:00 PM",
      duration: "1.5 hours",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
    {
      id: "4",
      subject: "Mathematics",
      tutor: "Araf",
      date: "Thursday",
      time: "4:00 PM",
      duration: "1 hour",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
    {
      id: "5",
      subject: "English",
      tutor: "Ria",
      date: "Friday",
      time: "3:30 PM",
      duration: "1 hour",
      type: "in-person",
      location: "Marquis Learning Center",
      status: "upcoming",
    },
  ];

  const nextWeekSessions: ClassSession[] = [
    {
      id: "6",
      subject: "Mathematics",
      tutor: "Araf",
      date: "Monday",
      time: "4:00 PM",
      duration: "1 hour",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
    {
      id: "7",
      subject: "English",
      tutor: "Jiya",
      date: "Tuesday",
      time: "3:30 PM",
      duration: "1 hour",
      type: "in-person",
      location: "Marquis Learning Center",
      status: "upcoming",
    },
    {
      id: "8",
      subject: "Mathematics",
      tutor: "Naveen",
      date: "Wednesday",
      time: "5:00 PM",
      duration: "1.5 hours",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
    {
      id: "9",
      subject: "English",
      tutor: "Abhimita",
      date: "Thursday",
      time: "4:00 PM",
      duration: "1 hour",
      type: "online",
      location: "Zoom",
      status: "upcoming",
    },
  ];

  const sessions = selectedWeek === "this" ? thisWeekSessions : nextWeekSessions;
  const upcomingSessions = sessions.filter(s => s.status === "upcoming");

  const totalLessons = upcomingSessions.length;
  const onlineCount = upcomingSessions.filter(s => s.type === "online").length;
  const inPersonCount = upcomingSessions.filter(s => s.type === "in-person").length;

  // Reschedule Request Page
  if (view === "reschedule") {
    return (
      <div 
        className="px-6 py-8 max-w-md mx-auto"
        style={{
          background: "#FAF9F5",
          minHeight: "100vh",
        }}
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            onClick={() => setView("schedule")}
            variant="ghost"
            className="flex items-center gap-2 -ml-2"
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              color: "#6B6B6B",
              fontWeight: 500,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "28px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "8px",
            }}
          >
            Request Schedule Change
          </h1>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#6B6B6B",
            }}
          >
            Choose how you'd like to reschedule Alex's lessons
          </p>
        </motion.div>

        {/* Option 1: Student Portal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-5"
        >
          <Card
            className="border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{
              background: "#FFFFFF",
              borderRadius: "22px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
            onClick={handleOpenStudentPortal}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#F4C247",
                }}
              >
                <Calendar className="w-6 h-6" style={{ color: "#1A1A1A", strokeWidth: 2 }} />
              </div>
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "6px",
                  }}
                >
                  Use Student Portal
                </h3>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                    marginBottom: "12px",
                  }}
                >
                  Alex can reschedule directly through their student portal with real-time availability
                </p>
                <Button
                  className="flex items-center gap-2"
                  style={{
                    background: "#F4C247",
                    color: "#1A1A1A",
                    borderRadius: "10px",
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    padding: "8px 16px",
                    border: "none",
                  }}
                >
                  Open Student Portal
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Option 2: Email Request */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className="border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{
              background: "#FFFFFF",
              borderRadius: "22px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
            onClick={() => window.location.href = "mailto:hi@marquis.education?subject=Schedule Change Request for Alex Johnson"}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#E5F1FF",
                }}
              >
                <Mail className="w-6 h-6" style={{ color: "#0077FF", strokeWidth: 2 }} />
              </div>
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "6px",
                  }}
                >
                  Email Our Team
                </h3>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                    marginBottom: "12px",
                  }}
                >
                  Send a message to hi@marquis.education and we'll help you find the perfect time
                </p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{
                    background: "#E5F1FF",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#0077FF",
                    }}
                  >
                    hi@marquis.education
                  </p>
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: "#0077FF" }} />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card
            className="border-0 p-5"
            style={{
              background: "rgba(244, 194, 71, 0.08)",
              borderRadius: "16px",
            }}
          >
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "#6B6B6B",
                lineHeight: "1.6",
              }}
            >
              💡 <strong style={{ color: "#1A1A1A" }}>Tip:</strong> For urgent changes within 24 hours, 
              please email us directly for the fastest response.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Calendar View
  if (view === "calendar") {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Get first day of month (0 = Sunday, 6 = Saturday)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Navigate to next month
    const handleNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    return (
      <div 
        className="px-6 py-8 max-w-md mx-auto"
        style={{
          background: "#FAF9F5",
          minHeight: "100vh",
        }}
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            onClick={() => setView("schedule")}
            variant="ghost"
            className="flex items-center gap-2 -ml-2"
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              color: "#6B6B6B",
              fontWeight: 500,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule
          </Button>
        </motion.div>

        {/* Calendar Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card
            className="border-0 p-5"
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                }}
              >
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{
                  background: "#F4C247",
                }}
              >
                <ChevronRightIcon className="w-5 h-5" style={{ color: "#1A1A1A", strokeWidth: 2.5 }} />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6B6B6B",
                    }}
                  >
                    {day}
                  </p>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Days with classes */}
              {daysArray.map(day => {
                const hasClass = calendarSessions.some(s => s.dayOfMonth === day);
                const classInfo = calendarSessions.find(s => s.dayOfMonth === day);
                const isToday = day === 16 && currentMonth === 10 && currentYear === 2025; // Nov 16, 2025
                const isSelected = day === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 hover:scale-105"
                    style={{
                      background: isToday ? "#F4C247" : isSelected ? "#FFF9E6" : hasClass ? "#FFFDF5" : "#F9F9F9",
                      border: isSelected && !isToday ? "2px solid #F4C247" : hasClass && !isToday && !isSelected ? "1.5px solid #F4C247" : "none",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "14px",
                        fontWeight: isToday || isSelected ? 700 : 500,
                        color: isToday ? "#1A1A1A" : hasClass ? "#1A1A1A" : "#6B6B6B",
                      }}
                    >
                      {day}
                    </p>
                    {hasClass && (
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1"
                        style={{
                          background: classInfo?.type === "online" ? "#0077FF" : "#2DAA4A",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card
            className="border-0 p-5"
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: "12px",
              }}
            >
              Legend
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#0077FF" }}
                />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                  }}
                >
                  Online
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#2DAA4A" }}
                />
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                  }}
                >
                  In-Person
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Classes This Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "12px",
            }}
          >
            Upcoming Classes
          </h3>
          <div className="space-y-3">
            {calendarSessions.slice(0, 4).map((session, index) => (
              <Card
                key={session.id}
                className="border-0 p-4"
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: "#F4C247",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        {session.dayOfMonth}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1A1A1A",
                        }}
                      >
                        {session.subject}
                      </p>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "12px",
                          fontWeight: 400,
                          color: "#6B6B6B",
                        }}
                      >
                        {session.time}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: session.type === "online" ? "#0077FF" : "#2DAA4A",
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Default Schedule View
  return (
    <div 
      className="px-6 py-8 max-w-md mx-auto"
      style={{
        background: "#FAF9F5",
        minHeight: "100vh",
      }}
    >
      {/* Page Title Block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "28px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "8px",
            }}
          >
            Class Schedule
          </h1>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#6B6B6B",
            }}
          >
            Manage and review Alex's upcoming lessons.
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E8",
          }}
        >
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6B6B6B",
            }}
          >
            Updated: Today, 4:00 PM
          </p>
        </div>
      </motion.div>

      {/* Week Switcher (Pill Tabs) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-3 mb-6"
      >
        <button
          onClick={() => setSelectedWeek("this")}
          className="flex-1 py-3 px-4 rounded-full transition-all duration-300"
          style={{
            background: selectedWeek === "this" ? "#F4C247" : "transparent",
            border: selectedWeek === "this" ? "none" : "1.5px solid #E0E0E0",
            fontFamily: "Neurial Grotesk, sans-serif",
            fontSize: "14px",
            fontWeight: selectedWeek === "this" ? 600 : 500,
            color: selectedWeek === "this" ? "#1A1A1A" : "#6B6B6B",
          }}
        >
          ● This Week
        </button>
        <button
          onClick={() => setSelectedWeek("next")}
          className="flex-1 py-3 px-4 rounded-full transition-all duration-300"
          style={{
            background: selectedWeek === "next" ? "#F4C247" : "transparent",
            border: selectedWeek === "next" ? "none" : "1.5px solid #E0E0E0",
            fontFamily: "Neurial Grotesk, sans-serif",
            fontSize: "14px",
            fontWeight: selectedWeek === "next" ? 600 : 500,
            color: selectedWeek === "next" ? "#1A1A1A" : "#6B6B6B",
          }}
        >
          Next Week
        </button>
      </motion.div>

      {/* Week Summary Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-3 gap-4 mb-12"
      >
        {/* Total Lessons */}
        <Card
          className="border-0 p-5"
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Calendar className="w-5 h-5 mb-3" style={{ color: "#F4C247", strokeWidth: 2 }} />
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "34px",
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: "4px",
            }}
          >
            {totalLessons}
          </p>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "#6B6B6B",
            }}
          >
            Lessons
          </p>
        </Card>

        {/* Online */}
        <Card
          className="border-0 p-5"
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Laptop className="w-5 h-5 mb-3" style={{ color: "#0077FF", strokeWidth: 2 }} />
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "34px",
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: "4px",
            }}
          >
            {onlineCount}
          </p>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "#6B6B6B",
            }}
          >
            Online
          </p>
        </Card>

        {/* In-Person */}
        <Card
          className="border-0 p-5"
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <MapPin className="w-5 h-5 mb-3" style={{ color: "#2DAA4A", strokeWidth: 2 }} />
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "34px",
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: "4px",
            }}
          >
            {inPersonCount}
          </p>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "#6B6B6B",
            }}
          >
            In-Person
          </p>
        </Card>
      </motion.div>

      {/* Upcoming Lessons Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            Upcoming Lessons
          </h2>
          <button
            onClick={() => setView("calendar")}
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "#6B6B6B",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            View Calendar →
          </button>
        </div>

        {/* Lesson Cards */}
        <div className="space-y-4">
          {upcomingSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            >
              <Card
                className="border-0 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                style={{
                  background: "#FFFFFF",
                  borderRadius: "22px",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Gold Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "#F4C247",
                    }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: "#1A1A1A", strokeWidth: 2.5 }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Subject + Teacher + Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            marginBottom: "4px",
                          }}
                        >
                          {session.subject}
                        </h3>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#6B6B6B",
                          }}
                        >
                          {session.tutor} • {session.type === "online" ? "Online" : "In-Person"}
                        </p>
                      </div>
                    </div>

                    {/* Date + Time + Duration */}
                    <div className="flex items-center gap-1 mb-3">
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: session.date === "Today" ? "#F4C247" : "#1A1A1A",
                        }}
                      >
                        {session.date}
                      </p>
                      <span style={{ color: "#6B6B6B", fontSize: "14px" }}>•</span>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1A1A1A",
                        }}
                      >
                        {session.time}
                      </p>
                      <span style={{ color: "#6B6B6B", fontSize: "14px" }}>•</span>
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "#6B6B6B",
                        }}
                      >
                        {session.duration}
                      </p>
                    </div>

                    {/* Location/Link Badge */}
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        background: session.type === "online" ? "#E5F1FF" : "#E8F8EA",
                      }}
                    >
                      {session.type === "online" ? (
                        <>
                          <Video className="w-3.5 h-3.5" style={{ color: "#0077FF", strokeWidth: 2 }} />
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#0077FF",
                            }}
                          >
                            {session.location}
                          </p>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5" style={{ color: "#2DAA4A", strokeWidth: 2 }} />
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#2DAA4A",
                            }}
                          >
                            {session.location}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Reschedule CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-12"
      >
        <Card
          className="border p-6"
          style={{
            background: "#FFFFFF",
            borderRadius: "22px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            border: "1.5px solid #F0F0F0",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: "4px",
                }}
              >
                Need to reschedule?
              </h3>
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#6B6B6B",
                }}
              >
                We're here to help adjust Alex's timetable.
              </p>
            </div>
            <Button
              onClick={() => setView("reschedule")}
              className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
              style={{
                background: "#F4C247",
                color: "#1A1A1A",
                borderRadius: "12px",
                fontFamily: "Neurial Grotesk, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                padding: "10px 18px",
                border: "none",
              }}
            >
              <Plus className="w-4 h-4" />
              Request Change
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}