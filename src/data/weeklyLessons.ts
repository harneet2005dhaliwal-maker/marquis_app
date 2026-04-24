// Weekly Lesson Topics - Track what topics are covered each week
export interface WeeklyLesson {
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  subject: "Mathematics" | "English";
  yearLevel: 7 | 8 | 9 | 10 | 11 | 12;
  topics: string[]; // Main topics covered this week
  curriculumTopicIds: string[]; // Link to question bank
}

// Get current week number in year
export const getCurrentWeekNumber = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
};

// Mock weekly lesson data - In production, this would come from the lesson schedule system
export const weeklyLessons: WeeklyLesson[] = [
  // Current week (Week 47)
  {
    weekNumber: 47,
    weekStartDate: new Date("2024-11-18"),
    weekEndDate: new Date("2024-11-24"),
    subject: "Mathematics",
    yearLevel: 9,
    topics: ["Quadratic Equations", "Factoring Quadratics"],
    curriculumTopicIds: ["math-y9-quadratics"]
  },
  {
    weekNumber: 47,
    weekStartDate: new Date("2024-11-18"),
    weekEndDate: new Date("2024-11-24"),
    subject: "English",
    yearLevel: 10,
    topics: ["Essay Writing", "Thesis Statements"],
    curriculumTopicIds: ["eng-y10-essay"]
  },
  // Last week (Week 46)
  {
    weekNumber: 46,
    weekStartDate: new Date("2024-11-11"),
    weekEndDate: new Date("2024-11-17"),
    subject: "Mathematics",
    yearLevel: 9,
    topics: ["Geometry", "Pythagorean Theorem", "Triangle Properties"],
    curriculumTopicIds: ["math-y8-geometry"]
  },
  {
    weekNumber: 46,
    weekStartDate: new Date("2024-11-11"),
    weekEndDate: new Date("2024-11-17"),
    subject: "English",
    yearLevel: 10,
    topics: ["Literary Devices", "Metaphor & Simile"],
    curriculumTopicIds: ["eng-y8-literature"]
  },
  // Week 45 - for quiz bank
  {
    weekNumber: 45,
    weekStartDate: new Date("2024-11-04"),
    weekEndDate: new Date("2024-11-10"),
    subject: "Mathematics",
    yearLevel: 9,
    topics: ["Algebra Basics", "Linear Equations"],
    curriculumTopicIds: ["math-y7-algebra"]
  },
  {
    weekNumber: 45,
    weekStartDate: new Date("2024-11-04"),
    weekEndDate: new Date("2024-11-10"),
    subject: "English",
    yearLevel: 10,
    topics: ["Literary Analysis", "Character Development"],
    curriculumTopicIds: ["eng-y8-literature"]
  },
  // Week 44 - for quiz bank
  {
    weekNumber: 44,
    weekStartDate: new Date("2024-10-28"),
    weekEndDate: new Date("2024-11-03"),
    subject: "Mathematics",
    yearLevel: 9,
    topics: ["Number Properties", "Fractions & Decimals"],
    curriculumTopicIds: ["math-y7-algebra"]
  },
  {
    weekNumber: 44,
    weekStartDate: new Date("2024-10-28"),
    weekEndDate: new Date("2024-11-03"),
    subject: "English",
    yearLevel: 10,
    topics: ["Paragraph Structure", "Evidence & Analysis"],
    curriculumTopicIds: ["eng-y10-essay"]
  },
  // Week 43 - for quiz bank
  {
    weekNumber: 43,
    weekStartDate: new Date("2024-10-21"),
    weekEndDate: new Date("2024-10-27"),
    subject: "Mathematics",
    yearLevel: 9,
    topics: ["Statistics", "Mean, Median, Mode"],
    curriculumTopicIds: ["math-y8-geometry"]
  },
  {
    weekNumber: 43,
    weekStartDate: new Date("2024-10-21"),
    weekEndDate: new Date("2024-10-27"),
    subject: "English",
    yearLevel: 10,
    topics: ["Poetry Analysis", "Rhyme & Meter"],
    curriculumTopicIds: ["eng-y8-literature"]
  }
];

// Get lessons for current week
export const getCurrentWeekLessons = (subject: "Mathematics" | "English"): WeeklyLesson | undefined => {
  const currentWeek = getCurrentWeekNumber();
  return weeklyLessons.find(lesson => 
    lesson.weekNumber === currentWeek && lesson.subject === subject
  );
};

// Get lessons for last week
export const getLastWeekLessons = (subject: "Mathematics" | "English"): WeeklyLesson | undefined => {
  const currentWeek = getCurrentWeekNumber();
  return weeklyLessons.find(lesson => 
    lesson.weekNumber === currentWeek - 1 && lesson.subject === subject
  );
};

// Get all curriculum topic IDs for current + last week
export const getCurrentAndLastWeekTopicIds = (subject: "Mathematics" | "English"): string[] => {
  const currentWeek = getCurrentWeekLessons(subject);
  const lastWeek = getLastWeekLessons(subject);
  
  const topicIds: string[] = [];
  if (currentWeek) topicIds.push(...currentWeek.curriculumTopicIds);
  if (lastWeek) topicIds.push(...lastWeek.curriculumTopicIds);
  
  return [...new Set(topicIds)]; // Remove duplicates
};

// Get all past weeks for quiz bank (excluding current and last week)
export const getPastWeeksForQuizBank = (subject: "Mathematics" | "English"): WeeklyLesson[] => {
  const currentWeek = getCurrentWeekNumber();
  return weeklyLessons.filter(lesson => 
    lesson.weekNumber < currentWeek - 1 && lesson.subject === subject
  );
};
