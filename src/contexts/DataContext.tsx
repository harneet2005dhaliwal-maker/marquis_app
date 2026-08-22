// src/contexts/DataContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

export interface Student {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email?: string | null;
  yearLevel?: string | null;
  subject?: string | null;
}

export interface Teacher {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name: string;
  email?: string | null;
}

export interface Class {
  id: string;
  className: string;
  subject: string;
  yearLevel?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  teacher?: string | null;
  dayOfWeek?: string | null;
  lessonDay?: string | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  time?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  location?: string | null;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
}

export interface DataContextValue {
  students: Student[];
  classes: Class[];
  teachers: Teacher[];
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  currentStudent?: Student;
  refreshData: () => Promise<void>;
  getStudentClasses: (studentId?: string) => Class[];
  getAlternativeClasses: (studentId?: string) => Class[];
  getUpcomingClasses: (studentId?: string) => Class[];
  getPastClasses: (studentId?: string) => Class[];
  getAvailableClasses: () => Class[];
  getTeacher: (name: string) => Teacher | undefined;
}

const DataContext =
  createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  studentId?: string;
}

type StudentRow = {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  year_level?: string | null;
  subject?: string | null;
};

type TeacherRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
};

type ClassRow = {
  id: string;
  class_name?: string | null;
  subject?: string | null;
  year_level?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  day_of_week?: string | null;
  lesson_day?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  location?: string | null;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  class_id: string;
};

const buildName = (
  firstName?: string | null,
  lastName?: string | null
): string =>
  [firstName, lastName].filter(Boolean).join(" ").trim();

const normaliseSubject = (subject: string): string =>
  subject
    .toLowerCase()
    .replace(/^individual\s*-\s*/i, "")
    .replace(/\bmaths\b/g, "math")
    .replace(/\s+/g, " ")
    .trim();

const formatTime = (
  value?: string | null
): string | null => {
  if (!value) return null;
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const formatTimeRange = (
  startTime?: string | null,
  endTime?: string | null
): string | null => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (!start || !end) return null;

  return `${start}–${end}`;
};

const mapStudent = (row: StudentRow): Student => {
  const name = buildName(row.first_name, row.last_name);

  return {
    id: row.id,
    userId: row.user_id ?? null,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    name: name || "Student",
    email: row.email ?? null,
    yearLevel: row.year_level ?? null,
    subject: row.subject ?? null,
  };
};

const mapTeacher = (row: TeacherRow): Teacher => {
  const generatedName = buildName(
    row.first_name,
    row.last_name
  );

  return {
    id: row.id,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    name: row.name?.trim() || generatedName || "Teacher",
    email: row.email ?? null,
  };
};

const mapClass = (row: ClassRow): Class => {
  const subject =
    row.subject?.trim() && row.subject.trim() !== "#REF!"
      ? row.subject.trim()
      : "Untitled class";

  const day = row.day_of_week ?? row.lesson_day ?? null;
  const teacherName = row.teacher_name?.trim() || null;
  const className =
    row.class_name?.trim() ||
    `${row.year_level ?? ""} ${subject}`.trim() ||
    subject;

  return {
    id: row.id,
    className,
    subject,
    yearLevel: row.year_level ?? null,
    teacherId: row.teacher_id ?? null,
    teacherName,
    teacher: teacherName,
    dayOfWeek: day,
    lessonDay: row.lesson_day ?? day,
    day,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    time: formatTimeRange(row.start_time, row.end_time),
    startDateTime: row.start_datetime ?? null,
    endDateTime: row.end_datetime ?? null,
    location: row.location ?? null,
  };
};

const mapEnrollment = (
  row: EnrollmentRow
): Enrollment => ({
  id: row.id,
  studentId: row.student_id,
  classId: row.class_id,
});

const parseDate = (
  value?: string | null
): Date | null => {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function DataProvider({
  children,
  studentId,
}: DataProviderProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollments, setEnrollments] =
    useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!studentId) {
      setStudents([]);
      setClasses([]);
      setTeachers([]);
      setEnrollments([]);
      setError("No logged-in student ID was provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        studentResult,
        enrollmentResult,
        classesResult,
        teachersResult,
      ] = await Promise.all([
        supabase
          .from("students")
          .select(
            "id, user_id, first_name, last_name, email, year_level, subject"
          )
          .eq("id", studentId)
          .maybeSingle(),

        supabase
          .from("enrollments")
          .select("id, student_id, class_id")
          .eq("student_id", studentId),

        supabase
          .from("classes")
          .select(
            "id, class_name, subject, year_level, teacher_id, teacher_name, day_of_week, lesson_day, start_time, end_time, start_datetime, end_datetime, location"
          ),

        supabase
          .from("teachers")
          .select(
            "id, first_name, last_name, name, email"
          ),
      ]);

      if (studentResult.error) throw studentResult.error;

      if (!studentResult.data) {
        throw new Error(
          "The logged-in student record could not be found."
        );
      }

      if (enrollmentResult.error) {
        throw enrollmentResult.error;
      }

      if (classesResult.error) {
        throw classesResult.error;
      }

      if (teachersResult.error) {
        throw teachersResult.error;
      }

      setStudents([
        mapStudent(
          studentResult.data as unknown as StudentRow
        ),
      ]);

      setEnrollments(
        (enrollmentResult.data ?? []).map((row) =>
          mapEnrollment(row as unknown as EnrollmentRow)
        )
      );

      setClasses(
        (classesResult.data ?? []).map((row) =>
          mapClass(row as unknown as ClassRow)
        )
      );

      setTeachers(
        (teachersResult.data ?? []).map((row) =>
          mapTeacher(row as unknown as TeacherRow)
        )
      );
    } catch (caughtError) {
      console.error(
        "Failed to load Supabase app data:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load your student data."
      );

      setStudents([]);
      setClasses([]);
      setTeachers([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const currentStudent = useMemo(
    () =>
      studentId
        ? students.find(
            (student) => student.id === studentId
          )
        : undefined,
    [studentId, students]
  );

  const getStudentClasses = useCallback(
    (id?: string): Class[] => {
      const targetStudentId = id ?? currentStudent?.id;

      if (!targetStudentId) return [];

      const classIds = new Set(
        enrollments
          .filter(
            (enrollment) =>
              enrollment.studentId === targetStudentId
          )
          .map((enrollment) => enrollment.classId)
      );

      return classes.filter((classItem) =>
        classIds.has(classItem.id)
      );
    },
    [classes, enrollments, currentStudent?.id]
  );

  const getAlternativeClasses = useCallback(
    (id?: string): Class[] => {
      const enrolledClasses = getStudentClasses(id);

      if (enrolledClasses.length === 0) return [];

      const enrolledClassIds = new Set(
        enrolledClasses.map((classItem) => classItem.id)
      );

      return classes
        .filter((candidateClass) => {
          if (enrolledClassIds.has(candidateClass.id)) {
            return false;
          }

          return enrolledClasses.some((enrolledClass) => {
            const sameYearLevel =
              candidateClass.yearLevel ===
              enrolledClass.yearLevel;

            const sameSubject =
              normaliseSubject(candidateClass.subject) ===
              normaliseSubject(enrolledClass.subject);

            return sameYearLevel && sameSubject;
          });
        })
        .sort((a, b) => {
          const dayComparison = (
            a.dayOfWeek ?? ""
          ).localeCompare(b.dayOfWeek ?? "");

          if (dayComparison !== 0) {
            return dayComparison;
          }

          return (
            a.startTime ?? ""
          ).localeCompare(b.startTime ?? "");
        });
    },
    [classes, getStudentClasses]
  );

  const getUpcomingClasses = useCallback(
    (id?: string): Class[] => {
      const now = new Date();

      return getStudentClasses(id)
        .filter((classItem) => {
          const start = parseDate(
            classItem.startDateTime
          );

          return start ? start >= now : true;
        })
        .sort((a, b) => {
          const aDate =
            parseDate(a.startDateTime)?.getTime() ?? 0;

          const bDate =
            parseDate(b.startDateTime)?.getTime() ?? 0;

          return aDate - bDate;
        });
    },
    [getStudentClasses]
  );

  const getPastClasses = useCallback(
    (id?: string): Class[] => {
      const now = new Date();

      return getStudentClasses(id)
        .filter((classItem) => {
          const end =
            parseDate(classItem.endDateTime) ??
            parseDate(classItem.startDateTime);

          return end ? end < now : false;
        })
        .sort((a, b) => {
          const aDate =
            (
              parseDate(a.endDateTime) ??
              parseDate(a.startDateTime)
            )?.getTime() ?? 0;

          const bDate =
            (
              parseDate(b.endDateTime) ??
              parseDate(b.startDateTime)
            )?.getTime() ?? 0;

          return bDate - aDate;
        });
    },
    [getStudentClasses]
  );

  const getAvailableClasses = useCallback(
    (): Class[] => classes,
    [classes]
  );

  const getTeacher = useCallback(
    (name: string): Teacher | undefined => {
      const normalisedName = name.trim().toLowerCase();

      return teachers.find(
        (teacher) =>
          teacher.name.trim().toLowerCase() ===
          normalisedName
      );
    },
    [teachers]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      students,
      classes,
      teachers,
      enrollments,
      loading,
      error,
      currentStudent,
      refreshData,
      getStudentClasses,
      getAlternativeClasses,
      getUpcomingClasses,
      getPastClasses,
      getAvailableClasses,
      getTeacher,
    }),
    [
      students,
      classes,
      teachers,
      enrollments,
      loading,
      error,
      currentStudent,
      refreshData,
      getStudentClasses,
      getAlternativeClasses,
      getUpcomingClasses,
      getPastClasses,
      getAvailableClasses,
      getTeacher,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      "useData must be used inside a DataProvider"
    );
  }

  return context;
}