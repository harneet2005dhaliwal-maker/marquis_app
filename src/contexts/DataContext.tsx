// src/contexts/DataContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import {
  useGoogleSheets,
  Student,
  Class,
  Teacher,
  Enrollment,
} from "../hooks/useGoogleSheets";

export interface DataContextValue {
  students: Student[];
  classes: Class[];
  teachers: Teacher[];
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  currentStudent?: Student;

  getStudentClasses: (studentId?: string) => Class[];
  getAlternativeClasses: (studentId?: string) => Class[];
  getUpcomingClasses: (studentId?: string) => Class[];
  getPastClasses: (studentId?: string) => Class[];
  getAvailableClasses: () => Class[];
  getTeacher: (name: string) => Teacher | undefined;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  studentId?: string;
}

export function DataProvider({ children, studentId }: DataProviderProps) {
  const { students, classes, teachers, enrollments, loading, error,
    getUpcomingClasses, getPastClasses, getAvailableClasses, getTeacher } =
    useGoogleSheets(studentId);

  // Pick the logged-in student
  const currentStudent =
    studentId && students.length > 0
      ? students.find((s) => s.id === studentId) || students[0]
      : students[0];

  console.log("Resolved current student:", currentStudent);

  /**
   * 1) Get classes the student is actually enrolled in
   */
  const getStudentClasses = (id?: string): Class[] => {
    const targetId = id || currentStudent?.id;
    if (!targetId) return [];

    // match enrollment rows
    const studentEnrollmentRows = enrollments.filter(
      (e) => e.studentId === targetId
    );

    // match those to classes[]
    const linkedClasses = studentEnrollmentRows
      .map((e) => classes.find((c) => c.id === e.classId))
      .filter((c): c is Class => Boolean(c));

    return linkedClasses;
  };

  /**
   * 2) Get alternative classes:
   * Same subject + same year level, different classId
   */
  const getAlternativeClasses = (id?: string): Class[] => {
    const myClasses = getStudentClasses(id);

    if (myClasses.length === 0) return [];

    const enrolledClassIds = new Set(myClasses.map((c) => c.id));

    // Build subject-year combos the student takes
    const combos = new Set(
      myClasses.map((c) => `${c.subject}__${c.yearLevel}`)
    );

    const alternatives = classes.filter((cls) => {
      const key = `${cls.subject}__${cls.yearLevel}`;
      const sameSubjectAndLevel = combos.has(key);
      const notAlreadyIn = !enrolledClassIds.has(cls.id);
      return sameSubjectAndLevel && notAlreadyIn;
    });

    return alternatives;
  };

  // Provide everything to the app
  const value: DataContextValue = {
    students,
    classes,
    teachers,
    enrollments,
    loading,
    error,
    currentStudent,

    getStudentClasses,
    getAlternativeClasses,

    getUpcomingClasses,
    getPastClasses,
    getAvailableClasses,
    getTeacher,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used inside a DataProvider");
  }
  return ctx;
}
