// Adaptive Learning Engine using ML algorithms
import { Question, DifficultyLevel } from '../data/questionBank';

// Student performance tracking
export interface StudentAttempt {
  questionId: string;
  studentId: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
  attemptDate: Date;
  difficulty: DifficultyLevel;
  topicId: string;
}

export interface StudentProfile {
  studentId: string;
  abilityLevel: number; // -3 to +3 (IRT scale)
  topicMastery: Map<string, number>; // topic ID -> mastery level (0-1)
  attempts: StudentAttempt[];
  weakAreas: string[]; // topic IDs where student struggles
  strengths: string[]; // topic IDs where student excels
  lastUpdated: Date;
}

// Spaced Repetition Algorithm (SM-2 simplified)
export interface SpacedRepetitionData {
  questionId: string;
  easinessFactor: number; // 1.3 to 2.5
  interval: number; // days until next review
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate student ability level using Item Response Theory (IRT)
 * Simplified 1-parameter logistic model
 */
export function calculateAbilityLevel(attempts: StudentAttempt[]): number {
  if (attempts.length === 0) return 0;
  
  // Weight recent attempts more heavily
  const recentAttempts = attempts.slice(-20);
  
  let abilitySum = 0;
  let totalWeight = 0;
  
  recentAttempts.forEach((attempt, index) => {
    const weight = (index + 1) / recentAttempts.length; // Recent attempts get higher weight
    const difficultyValue = getDifficultyValue(attempt.difficulty);
    
    if (attempt.isCorrect) {
      abilitySum += difficultyValue * weight;
    } else {
      abilitySum -= difficultyValue * 0.5 * weight;
    }
    
    totalWeight += weight;
  });
  
  // Normalize to -3 to +3 scale
  const rawAbility = abilitySum / totalWeight;
  return Math.max(-3, Math.min(3, rawAbility));
}

function getDifficultyValue(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
  }
}

/**
 * Calculate mastery level for a specific topic (0-1 scale)
 */
export function calculateTopicMastery(
  topicId: string,
  attempts: StudentAttempt[]
): number {
  const topicAttempts = attempts.filter(a => a.topicId === topicId);
  
  if (topicAttempts.length === 0) return 0;
  
  // Recent attempts weighted more
  const recentAttempts = topicAttempts.slice(-10);
  const correctCount = recentAttempts.filter(a => a.isCorrect).length;
  const accuracy = correctCount / recentAttempts.length;
  
  // Consider time spent (faster = better mastery for correct answers)
  const avgTimeCorrect = recentAttempts
    .filter(a => a.isCorrect)
    .reduce((sum, a) => sum + a.timeSpent, 0) / correctCount || 0;
  
  const timeBonus = avgTimeCorrect > 0 ? Math.max(0, 1 - avgTimeCorrect / 60) * 0.2 : 0;
  
  // Mastery = accuracy + time bonus - difficulty penalty
  return Math.min(1, accuracy + timeBonus);
}

/**
 * Identify weak areas where student needs improvement
 */
export function identifyWeakAreas(
  attempts: StudentAttempt[],
  threshold: number = 0.5
): string[] {
  const topicAccuracy = new Map<string, { correct: number; total: number }>();
  
  // Focus on recent attempts (last 50)
  const recentAttempts = attempts.slice(-50);
  
  recentAttempts.forEach(attempt => {
    if (!topicAccuracy.has(attempt.topicId)) {
      topicAccuracy.set(attempt.topicId, { correct: 0, total: 0 });
    }
    
    const stats = topicAccuracy.get(attempt.topicId)!;
    stats.total++;
    if (attempt.isCorrect) stats.correct++;
  });
  
  const weakAreas: string[] = [];
  
  topicAccuracy.forEach((stats, topicId) => {
    if (stats.total >= 3) { // Need at least 3 attempts to assess
      const accuracy = stats.correct / stats.total;
      if (accuracy < threshold) {
        weakAreas.push(topicId);
      }
    }
  });
  
  return weakAreas;
}

/**
 * Select optimal next question using adaptive algorithm
 * Considers: student ability, topic mastery, spaced repetition, question difficulty
 */
export function selectNextQuestion(
  availableQuestions: Question[],
  studentProfile: StudentProfile,
  spacedRepData: Map<string, SpacedRepetitionData>,
  focusTopic?: string
): Question | null {
  if (availableQuestions.length === 0) return null;
  
  // Filter by focus topic if specified
  let candidateQuestions = focusTopic
    ? availableQuestions.filter(q => q.curriculumTopicId === focusTopic)
    : availableQuestions;
  
  // Score each question
  const scoredQuestions = candidateQuestions.map(question => {
    let score = 0;
    
    // 1. Difficulty matching (prefer questions near student ability)
    const questionDifficulty = getDifficultyValue(question.difficulty);
    const abilityDiff = Math.abs(questionDifficulty - (studentProfile.abilityLevel + 2));
    score += Math.max(0, 3 - abilityDiff) * 2; // Weight: 2x
    
    // 2. Topic mastery (prefer weak areas)
    const topicMastery = studentProfile.topicMastery.get(question.curriculumTopicId) || 0;
    score += (1 - topicMastery) * 3; // Weight: 3x (focus on weak areas)
    
    // 3. Spaced repetition (prefer due questions)
    const repData = spacedRepData.get(question.id);
    if (repData && repData.nextReviewDate <= new Date()) {
      score += 4; // Weight: 4x (high priority for review)
    }
    
    // 4. Question quality (discrimination index)
    score += question.discriminationIndex;
    
    // 5. Variety (penalize recently asked questions)
    const recentAttempts = studentProfile.attempts.slice(-10);
    const recentlyAsked = recentAttempts.some(a => a.questionId === question.id);
    if (recentlyAsked) score -= 5;
    
    return { question, score };
  });
  
  // Sort by score and add some randomness to top candidates
  scoredQuestions.sort((a, b) => b.score - a.score);
  
  // Select from top 3 randomly to add variety
  const topCandidates = scoredQuestions.slice(0, Math.min(3, scoredQuestions.length));
  const selectedIndex = Math.floor(Math.random() * topCandidates.length);
  
  return topCandidates[selectedIndex].question;
}

/**
 * Update spaced repetition data after an attempt
 */
export function updateSpacedRepetition(
  questionId: string,
  isCorrect: boolean,
  currentData?: SpacedRepetitionData
): SpacedRepetitionData {
  const data = currentData || {
    questionId,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date()
  };
  
  if (isCorrect) {
    if (data.repetitions === 0) {
      data.interval = 1;
    } else if (data.repetitions === 1) {
      data.interval = 6;
    } else {
      data.interval = Math.round(data.interval * data.easinessFactor);
    }
    
    data.repetitions++;
    data.easinessFactor = Math.max(1.3, data.easinessFactor + 0.1);
  } else {
    data.repetitions = 0;
    data.interval = 1;
    data.easinessFactor = Math.max(1.3, data.easinessFactor - 0.2);
  }
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + data.interval);
  data.nextReviewDate = nextDate;
  
  return data;
}

/**
 * Generate an adaptive quiz based on student profile
 */
export function generateAdaptiveQuiz(
  questionBank: Question[],
  studentProfile: StudentProfile,
  spacedRepData: Map<string, SpacedRepetitionData>,
  options: {
    length?: number;
    focusTopic?: string;
    targetWeakAreas?: boolean;
  } = {}
): Question[] {
  const {
    length = 10,
    focusTopic,
    targetWeakAreas = true
  } = options;
  
  const selectedQuestions: Question[] = [];
  const usedQuestionIds = new Set<string>();
  
  // Filter question bank
  let availableQuestions = [...questionBank];
  
  if (focusTopic) {
    availableQuestions = availableQuestions.filter(
      q => q.curriculumTopicId === focusTopic
    );
  }
  
  if (targetWeakAreas && studentProfile.weakAreas.length > 0) {
    // 70% questions from weak areas, 30% from other areas
    const weakAreaCount = Math.ceil(length * 0.7);
    
    for (let i = 0; i < weakAreaCount && selectedQuestions.length < length; i++) {
      const weakTopicQuestions = availableQuestions.filter(
        q => studentProfile.weakAreas.includes(q.curriculumTopicId) &&
             !usedQuestionIds.has(q.id)
      );
      
      const nextQ = selectNextQuestion(
        weakTopicQuestions,
        studentProfile,
        spacedRepData
      );
      
      if (nextQ) {
        selectedQuestions.push(nextQ);
        usedQuestionIds.add(nextQ.id);
      }
    }
  }
  
  // Fill remaining slots
  while (selectedQuestions.length < length) {
    const remainingQuestions = availableQuestions.filter(
      q => !usedQuestionIds.has(q.id)
    );
    
    if (remainingQuestions.length === 0) break;
    
    const nextQ = selectNextQuestion(
      remainingQuestions,
      studentProfile,
      spacedRepData
    );
    
    if (nextQ) {
      selectedQuestions.push(nextQ);
      usedQuestionIds.add(nextQ.id);
    } else {
      break;
    }
  }
  
  return selectedQuestions;
}

/**
 * Predict student performance on a question
 */
export function predictPerformance(
  question: Question,
  studentProfile: StudentProfile
): {
  predictedAccuracy: number;
  confidence: number;
  reasoning: string;
} {
  const topicMastery = studentProfile.topicMastery.get(question.curriculumTopicId) || 0;
  const difficultyValue = getDifficultyValue(question.difficulty);
  const abilityMatch = 1 - Math.abs(difficultyValue - (studentProfile.abilityLevel + 2)) / 3;
  
  // Combine factors
  const predictedAccuracy = (topicMastery * 0.6 + abilityMatch * 0.4);
  
  // Confidence based on number of attempts in this topic
  const topicAttempts = studentProfile.attempts.filter(
    a => a.topicId === question.curriculumTopicId
  ).length;
  const confidence = Math.min(1, topicAttempts / 10);
  
  let reasoning = "";
  if (predictedAccuracy > 0.7) {
    reasoning = "Strong mastery in this topic";
  } else if (predictedAccuracy > 0.4) {
    reasoning = "Moderate understanding, good for practice";
  } else {
    reasoning = "Challenging area, recommended for focused review";
  }
  
  return {
    predictedAccuracy,
    confidence,
    reasoning
  };
}
