// Mock student performance data for demonstration
import { StudentProfile, StudentAttempt, SpacedRepetitionData } from '../lib/adaptiveLearning';

// Mock student attempts history
export const mockStudentAttempts: StudentAttempt[] = [
  // Recent algebra attempts - showing improvement
  {
    questionId: "q-alg-001",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 12,
    attemptDate: new Date("2024-11-05"),
    difficulty: "easy",
    topicId: "math-y7-algebra"
  },
  {
    questionId: "q-alg-002",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 18,
    attemptDate: new Date("2024-11-05"),
    difficulty: "easy",
    topicId: "math-y7-algebra"
  },
  {
    questionId: "q-alg-003",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 45,
    attemptDate: new Date("2024-11-06"),
    difficulty: "medium",
    topicId: "math-y7-algebra"
  },
  {
    questionId: "q-alg-003",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 28,
    attemptDate: new Date("2024-11-07"),
    difficulty: "medium",
    topicId: "math-y7-algebra"
  },
  
  // Geometry - weak area
  {
    questionId: "q-geo-001",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 15,
    attemptDate: new Date("2024-11-04"),
    difficulty: "easy",
    topicId: "math-y8-geometry"
  },
  {
    questionId: "q-geo-002",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 35,
    attemptDate: new Date("2024-11-04"),
    difficulty: "easy",
    topicId: "math-y8-geometry"
  },
  {
    questionId: "q-geo-003",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 52,
    attemptDate: new Date("2024-11-05"),
    difficulty: "medium",
    topicId: "math-y8-geometry"
  },
  {
    questionId: "q-geo-003",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 48,
    attemptDate: new Date("2024-11-06"),
    difficulty: "medium",
    topicId: "math-y8-geometry"
  },
  
  // English - strong area
  {
    questionId: "q-eng-001",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 10,
    attemptDate: new Date("2024-11-03"),
    difficulty: "easy",
    topicId: "eng-y8-literature"
  },
  {
    questionId: "q-eng-002",
    studentId: "student-1",
    isCorrect: true,
    timeSpent: 25,
    attemptDate: new Date("2024-11-04"),
    difficulty: "medium",
    topicId: "eng-y8-literature"
  },
  
  // Quadratics - challenging
  {
    questionId: "q-alg-004",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 60,
    attemptDate: new Date("2024-11-02"),
    difficulty: "medium",
    topicId: "math-y9-quadratics"
  },
  {
    questionId: "q-alg-004",
    studentId: "student-1",
    isCorrect: false,
    timeSpent: 55,
    attemptDate: new Date("2024-11-03"),
    difficulty: "medium",
    topicId: "math-y9-quadratics"
  }
];

// Mock spaced repetition data
export const mockSpacedRepData = new Map<string, SpacedRepetitionData>([
  [
    "q-alg-001",
    {
      questionId: "q-alg-001",
      easinessFactor: 2.6,
      interval: 6,
      repetitions: 2,
      nextReviewDate: new Date("2024-11-12")
    }
  ],
  [
    "q-alg-003",
    {
      questionId: "q-alg-003",
      easinessFactor: 2.3,
      interval: 1,
      repetitions: 1,
      nextReviewDate: new Date("2024-11-08")
    }
  ],
  [
    "q-geo-003",
    {
      questionId: "q-geo-003",
      easinessFactor: 1.3,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date("2024-11-07") // Due for review!
    }
  ],
  [
    "q-eng-001",
    {
      questionId: "q-eng-001",
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReviewDate: new Date("2024-11-10")
    }
  ]
]);

// Build student profile from attempts
export function buildMockStudentProfile(): StudentProfile {
  const topicMastery = new Map<string, number>();
  topicMastery.set("math-y7-algebra", 0.75);
  topicMastery.set("math-y8-geometry", 0.25); // Weak area
  topicMastery.set("math-y9-quadratics", 0.0); // Very weak
  topicMastery.set("eng-y8-literature", 1.0); // Strong
  topicMastery.set("eng-y10-essay", 0.6);
  
  return {
    studentId: "student-1",
    abilityLevel: 0.5, // Slightly above average
    topicMastery,
    attempts: mockStudentAttempts,
    weakAreas: ["math-y8-geometry", "math-y9-quadratics"],
    strengths: ["eng-y8-literature"],
    lastUpdated: new Date()
  };
}
