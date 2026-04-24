// src/hooks/useGoogleSheets.ts
import { useEffect, useState } from "react";

/**
 * SHEET + API SETTINGS
 */
const SHEET_ID = "1GCJgqn7WX9pXF5m9TaAy7jevmjXiVYogSddla8aeE7g";
const API_KEY = "AIzaSyDHrX3Rc0IFc_TNlQ9yECBt6M2pXByhuS0";

/**
 * STUDENTS SHEET COLUMNS
 * 0: ID
 * 1: First Name
 * 2: Last Name
 * 3: Email
 * 4: role
 * 5: student_password
 * 6: Year
 * 7: Parent Name
 * 8: Parent Email
 * 9: parent_password
 * 10: Phone
 * 11: Subject
 * 12: Status
 */
export interface Student {
  id: string;
  name: string; // "FirstName LastName"
  email: string;
  role: string;
  year: string;
  parentName?: string;
  parentEmail?: string;
  phone?: string;
  subject?: string;
  status?: string;
}

/**
 * CLASSES SHEET COLUMNS
 * 0: Class ID
 * 1: Student ID (often blank)
 * 2: ClassName
 * 3: GoogleClassroomCourseID
 * 4: Teacher
 * 5: DayOfWeek
 * 6: StartT
 * 7: End
 * 8: GoogleCalendarID
 * 9: Event ID
 * 10: Room/ZoomLink
 */
interface ClassTemplate {
  id: string;
  name: string;
  teacher: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomOrLink?: string;
}

/**
 * ENROLLMENT SHEET COLUMNS
 * 0: EnrolmentID
 * 1: StudentID
 * 2: Subject
 * 3: Teacher
 * 4: ClassID
 * 5: StartDate (dd/mm/yyyy)
 * 6: EndDate (dd/mm/yyyy)
 * 7: Class_Day
 * 8: PaymentPlanID
 * 9: PaymentStatus
 */
export interface Enrollment {
  id: string;
  studentId: string;
  subject: string;
  teacher: string;
  classId: string;
  startDate: string;
  endDate: string;
  classDay: string;
  paymentPlanId?: string;
  paymentStatus?: string;
}

/**
 * UI CLASS TYPE used everywhere else in the app
 */
export interface Class {
  id: string;
  studentId: string;
  subject: string;
  teacher: string;
  dayOfWeek: string;
  time: string; // "18:30 – 20:00"
  date: string; // ISO YYYY-MM-DD (can be "")
  status: "scheduled" | "completed" | "cancelled";
  yearLevel: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  classes?: string[];
}

/* ---------------- helpers ---------------- */

async function fetchSheetData(range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}?key=${API_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("Google Sheets API error:", res.status, text);
    throw new Error(`Failed to fetch ${range}: ${res.status}`);
  }

  const data = await res.json();
  return (data.values || []) as string[][];
}

// dd/mm/yyyy → Date
function parseSheetDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [dStr, mStr, yStr] = parts;
  const d = Number(dStr);
  const m = Number(mStr);
  const y = Number(yStr);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Date → "YYYY-MM-DD"
function toISODateString(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/* ---------- parsing Google rows ---------- */

function parseStudents(rows: string[][]): Student[] {
  if (!rows) return [];
  return rows.map((row) => {
    const first = row[1] ?? "";
    const last = row[2] ?? "";
    return {
      id: row[0] ?? "",
      name: `${first} ${last}`.trim(),
      email: row[3] ?? "",
      role: row[4] ?? "",
      year: row[6] ?? "",
      parentName: row[7] ?? "",
      parentEmail: row[8] ?? "",
      phone: row[10] ?? "",
      subject: row[11] ?? "",
      status: row[12] ?? "",
    };
  });
}

function parseClassTemplates(rows: string[][]): ClassTemplate[] {
  if (!rows) return [];
  return rows.map((row) => ({
    id: row[0] ?? "",
    name: row[2] ?? "",
    teacher: row[4] ?? "",
    dayOfWeek: row[5] ?? "",
    startTime: row[6] ?? "",
    endTime: row[7] ?? "",
    roomOrLink: row[10] ?? "",
  }));
}

function parseTeachers(rows: string[][]): Teacher[] {
  if (!rows) return [];
  return rows.map((row) => ({
    id: row[0] ?? "",
    name: row[1] ?? "",
    subjects: (row[2] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    classes: (row[3] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}

function parseEnrollments(rows: string[][]): Enrollment[] {
  if (!rows) return [];
  return rows.map((row) => ({
    id: row[0] ?? "",
    studentId: row[1] ?? "",
    subject: row[2] ?? "",
    teacher: row[3] ?? "",
    classId: row[4] ?? "",
    startDate: row[5] ?? "",
    endDate: row[6] ?? "",
    classDay: row[7] ?? "",
    paymentPlanId: row[8] ?? "",
    paymentStatus: row[9] ?? "",
  }));
}

/**
 * Build UI classes from Students + Class templates + Enrollment sheets
 */
function buildUiClasses(
  students: Student[],
  templates: ClassTemplate[],
  enrollments: Enrollment[]
): Class[] {
  const templateMap = new Map<string, ClassTemplate>();
  templates.forEach((t) => t.id && templateMap.set(t.id, t));

  const studentMap = new Map<string, Student>();
  students.forEach((s) => s.id && studentMap.set(s.id, s));

  const result: Class[] = [];

  for (const enr of enrollments) {
    const tpl = templateMap.get(enr.classId);
    const student = studentMap.get(enr.studentId);
    const startDate = parseSheetDate(enr.startDate);

    result.push({
      id: enr.classId || enr.id,
      studentId: enr.studentId,
      subject: enr.subject || student?.subject || "",
      teacher: enr.teacher || tpl?.teacher || "",
      dayOfWeek: enr.classDay || tpl?.dayOfWeek || "",
      time: tpl ? `${tpl.startTime} – ${tpl.endTime}` : "",
      date: toISODateString(startDate),
      status: "scheduled",
      yearLevel: student?.year || "",
    });
  }

  return result;
}

/* ---------- main hook ---------- */

export function useGoogleSheets(activeStudentId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [studentRows, classRows, teacherRows, enrollmentRows] =
          await Promise.all([
            fetchSheetData("Students!A2:M1000"),
            fetchSheetData("Classes!A2:K1000"),
            fetchSheetData("Teacher!A2:D1000"),
            fetchSheetData("Enrollment!A2:J1000"),
          ]);

        if (cancelled) return;

        const parsedStudents = parseStudents(studentRows);
        const templates = parseClassTemplates(classRows);
        const parsedTeachers = parseTeachers(teacherRows);
        const parsedEnrollments = parseEnrollments(enrollmentRows);
        const uiClasses = buildUiClasses(
          parsedStudents,
          templates,
          parsedEnrollments
        );

        setStudents(parsedStudents);
        setClasses(uiClasses);
        setTeachers(parsedTeachers);
        setEnrollments(parsedEnrollments);
      } catch (err) {
        console.error("Failed to load Google Sheets data:", err);
        if (!cancelled) {
          setError("Failed to load data from Google Sheets");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----- helper functions ----- */

  // All classes for a student (or all if no studentId supplied)
  const getStudentClasses = (studentId?: string): Class[] => {
    if (!studentId) return classes;
    return classes.filter((cls) => cls.studentId === studentId);
  };

  // Upcoming classes (for a student if ID given)
  const getUpcomingClasses = (studentId?: string): Class[] => {
    // treat any "scheduled" class with no date as upcoming,
    // and any dated class from today onwards as upcoming
    let list = classes.filter((cls) => {
      if (cls.status !== "scheduled") return false;

      // No date? keep it – still show in UI
      if (!cls.date) return true;

      const d = new Date(cls.date);
      const today = new Date();

      d.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return d >= today;
    });

    if (studentId) {
      list = list.filter((cls) => cls.studentId === studentId);
    }

    return list.sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return ad - bd;
    });
  };

  const getPastClasses = (studentId?: string): Class[] => {
    const now = new Date();
    let list = classes.filter((cls) => {
      if (!cls.date) return false;
      const d = new Date(cls.date);
      return d < now || cls.status === "completed";
    });
    if (studentId) list = list.filter((cls) => cls.studentId === studentId);
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const getAvailableClasses = (): Class[] => getUpcomingClasses();

  const getTeacher = (name: string): Teacher | undefined =>
    teachers.find((t) => t.name === name);

  return {
    students,
    classes,
    teachers,
    enrollments,
    loading,
    error,
    getStudentClasses,
    getUpcomingClasses,
    getPastClasses,
    getAvailableClasses,
    getTeacher,
  };
}
