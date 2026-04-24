# Marquis Adaptive Learning System - ML Documentation

## Overview

The Marquis tutoring app features a sophisticated machine learning-powered adaptive learning system that personalizes quizzes and flashcards based on individual student progress. Questions are derived from a central, teacher-curated question bank that aligns with class curriculum.

## System Architecture

### 1. Question Bank (`/data/questionBank.ts`)

**Central repository** of all questions curated by teachers.

#### Data Structure:
- **Curriculum Topics**: Organized by subject, year level, and subtopics
- **Questions**: Each question includes:
  - Curriculum alignment
  - Question content & type (multiple-choice, short-answer, true-false)
  - Difficulty level (easy, medium, hard)
  - Correct answer & explanation
  - Tags for categorization
  - **ML Metadata**:
    - `timesAsked`: How many times this question has been presented
    - `timesCorrect`: How many times answered correctly
    - `avgTimeToAnswer`: Average time students take (seconds)
    - `discriminationIndex`: IRT parameter measuring how well the question distinguishes between high/low ability students (0-2 scale)

#### Teacher Curation Features:
- Add new questions aligned to curriculum
- Edit existing questions
- View performance analytics per question
- Filter by subject, year level, difficulty
- See ML quality scores for each question

### 2. Adaptive Learning Engine (`/lib/adaptiveLearning.ts`)

**Core ML algorithms** that power question selection and difficulty adaptation.

#### Key Algorithms:

##### A. Item Response Theory (IRT) - Student Ability Calculation
```typescript
calculateAbilityLevel(attempts: StudentAttempt[]): number
```
- Estimates student ability on a scale from -3 to +3
- Uses simplified 1-parameter logistic model
- Weights recent attempts more heavily
- Factors in question difficulty and correctness
- Updates dynamically as students complete more questions

##### B. Topic Mastery Calculation
```typescript
calculateTopicMastery(topicId: string, attempts: StudentAttempt[]): number
```
- Returns mastery level from 0 to 1 for each curriculum topic
- Considers:
  - Recent accuracy (last 10 attempts)
  - Time spent on correct answers (faster = better mastery)
  - Question difficulty
- Used to identify weak areas and strengths

##### C. Weak Area Identification
```typescript
identifyWeakAreas(attempts: StudentAttempt[], threshold: number): string[]
```
- Analyzes recent performance (last 50 attempts)
- Identifies topics where accuracy < 50% (configurable threshold)
- Requires minimum 3 attempts per topic for valid assessment
- Automatically flags areas needing review

##### D. Spaced Repetition Algorithm (SM-2)
```typescript
updateSpacedRepetition(questionId: string, isCorrect: boolean): SpacedRepetitionData
```
- Implements simplified SuperMemo SM-2 algorithm
- Calculates optimal review intervals:
  - Correct answer: Increases interval (1 day → 6 days → exponential growth)
  - Incorrect answer: Resets to 1 day
- Adjusts easiness factor (1.3 to 2.5) based on performance
- Schedules questions for optimal memory retention

##### E. Adaptive Question Selection
```typescript
selectNextQuestion(
  availableQuestions: Question[],
  studentProfile: StudentProfile,
  spacedRepData: Map<string, SpacedRepetitionData>,
  focusTopic?: string
): Question
```

**Multi-factor scoring algorithm** that selects the optimal next question:

1. **Difficulty Matching (Weight: 2x)**
   - Prefers questions near student's current ability level
   - Avoids questions that are too easy or too hard

2. **Topic Mastery Focus (Weight: 3x)**
   - Prioritizes weak areas (low mastery topics)
   - Ensures balanced practice across curriculum

3. **Spaced Repetition Priority (Weight: 4x)**
   - Highest priority for questions due for review
   - Optimizes long-term retention

4. **Question Quality (Weight: 1x)**
   - Considers discrimination index
   - Prefers high-quality questions that better assess understanding

5. **Variety Penalty (-5)**
   - Penalizes recently asked questions
   - Ensures diverse practice

**Selection Process:**
- Scores all candidate questions
- Ranks by total score
- Randomly selects from top 3 to add variety
- Prevents monotonous patterns

##### F. Adaptive Quiz Generation
```typescript
generateAdaptiveQuiz(
  questionBank: Question[],
  studentProfile: StudentProfile,
  spacedRepData: Map<string, SpacedRepetitionData>,
  options: {
    length?: number;
    focusTopic?: string;
    targetWeakAreas?: boolean;
  }
): Question[]
```

**Intelligent quiz generation:**
- 70% questions from weak areas, 30% from other areas
- Applies all selection algorithms per question
- Ensures no duplicate questions
- Balances difficulty across quiz
- Can focus on specific topics if needed

##### G. Performance Prediction
```typescript
predictPerformance(
  question: Question,
  studentProfile: StudentProfile
): {
  predictedAccuracy: number;
  confidence: number;
  reasoning: string;
}
```

**ML prediction for each question:**
- Combines topic mastery (60% weight) and ability matching (40% weight)
- Calculates confidence based on historical data
- Provides reasoning for prediction
- Helps students understand their learning state

### 3. Student Profile Tracking (`/data/mockStudentData.ts`)

**Comprehensive learning profile** for each student:

```typescript
interface StudentProfile {
  studentId: string;
  abilityLevel: number;           // -3 to +3 (IRT scale)
  topicMastery: Map<string, number>; // 0-1 mastery per topic
  attempts: StudentAttempt[];     // Historical performance
  weakAreas: string[];            // Topics needing focus
  strengths: string[];            // Topics mastered
  lastUpdated: Date;
}
```

**Attempt Tracking:**
```typescript
interface StudentAttempt {
  questionId: string;
  studentId: string;
  isCorrect: boolean;
  timeSpent: number;              // seconds
  attemptDate: Date;
  difficulty: DifficultyLevel;
  topicId: string;
}
```

Every quiz question answered updates:
1. Student ability level
2. Topic mastery levels
3. Weak area identification
4. Spaced repetition schedules
5. Performance predictions

## User Interfaces

### Student View (`/components/AdaptiveQuizPage.tsx`)

**Features:**
- **Learning Profile Dashboard**
  - Current ability level visualization
  - Topic mastery breakdown with progress bars
  - Weak areas highlighted
  
- **Quiz Configuration**
  - Adjustable quiz length (3-10 questions)
  - Shows adaptive features enabled
  
- **Adaptive Quiz Experience**
  - AI prediction shown for each question (optional)
  - Real-time difficulty badges
  - Progress tracking
  - Multiple choice and short answer support
  
- **Results & Insights**
  - Score and accuracy
  - Updated ability level
  - Per-question AI predictions vs actual performance
  - Recommended next steps
  - Spaced repetition schedule information

### Teacher View (`/components/TeacherQuestionBank.tsx`)

**Features:**
- **Question Bank Management**
  - Add/edit/delete questions
  - Align questions to curriculum topics
  - Set difficulty levels
  - Add explanations and tags
  
- **Analytics Dashboard**
  - Total questions count
  - Average accuracy across all questions
  - Total student attempts
  - AI quality scores (discrimination index)
  
- **Question Performance Tracking**
  - Accuracy rate per question
  - Average time to answer
  - ML quality score visualization
  - Times asked statistics
  
- **Advanced Filtering**
  - By subject (Mathematics, English, Science, History)
  - By difficulty (easy, medium, hard)
  - By curriculum topic
  - Search by content or tags

## ML Benefits

### For Students:
1. **Personalized Learning Paths**
   - Questions matched to current ability
   - Focus on individual weak areas
   - Gradual difficulty progression

2. **Optimal Challenge Level**
   - Not too easy (boring)
   - Not too hard (frustrating)
   - "Zone of proximal development" targeting

3. **Efficient Study Time**
   - Spaced repetition maximizes retention
   - No wasted time on mastered content
   - Prioritizes high-impact practice

4. **Predictive Insights**
   - Know expected performance before attempting
   - Understand reasoning behind question selection
   - Track ability growth over time

### For Teachers:
1. **Curriculum-Aligned Content**
   - Central bank organized by year level & subject
   - Easy to add questions for specific topics
   - Ensures comprehensive coverage

2. **Data-Driven Insights**
   - See which questions are most effective
   - Identify questions needing improvement
   - Track overall class performance

3. **Reduced Prep Time**
   - AI handles question selection
   - Automatic difficulty adaptation
   - Built-in review scheduling

4. **Quality Metrics**
   - Discrimination index shows question effectiveness
   - Performance data guides improvements
   - Remove ineffective questions

## API Integration (Production)

For production deployment, replace mock data with API calls:

### Endpoints:

```typescript
// Question Bank
GET    /api/questions              // Fetch all questions
POST   /api/questions              // Add new question
PUT    /api/questions/:id          // Update question
DELETE /api/questions/:id          // Delete question
GET    /api/questions/:id/stats    // Get question performance

// Student Profile
GET    /api/students/:id/profile   // Fetch student profile
PUT    /api/students/:id/profile   // Update profile
POST   /api/students/:id/attempts  // Record new attempts

// Adaptive Learning
POST   /api/quiz/generate          // Generate adaptive quiz
GET    /api/quiz/:id/next-question // Get next question
POST   /api/quiz/:id/submit        // Submit quiz results
GET    /api/students/:id/prediction/:questionId  // Get performance prediction

// Spaced Repetition
GET    /api/students/:id/due-reviews  // Get questions due for review
PUT    /api/students/:id/spaced-rep  // Update spaced repetition data
```

## Future Enhancements

### Planned ML Features:

1. **Multi-Parameter IRT**
   - Add difficulty and guessing parameters
   - More accurate ability estimation

2. **Collaborative Filtering**
   - Recommend questions based on similar students
   - Identify peer learning patterns

3. **Adaptive Flashcards**
   - Apply same ML algorithms to flashcard system
   - Integrated spaced repetition

4. **Learning Style Detection**
   - Identify visual vs textual learners
   - Adapt question presentation

5. **Time-of-Day Optimization**
   - Learn when student performs best
   - Suggest optimal study times

6. **Topic Dependency Mapping**
   - Model prerequisite relationships
   - Ensure foundational knowledge first

7. **Natural Language Processing**
   - Analyze short-answer responses
   - Provide detailed feedback

8. **A/B Testing Framework**
   - Test different algorithms
   - Optimize based on learning outcomes

## Technical Implementation Notes

### Performance Considerations:
- Question selection algorithm runs in O(n log n) time
- Student profile updates are incremental
- Spaced repetition data stored efficiently in Map structures
- Predictions calculated on-demand, could be cached

### Data Privacy:
- Student performance data should be encrypted
- Comply with education data privacy laws (FERPA, COPPA)
- Allow data export and deletion per GDPR

### Scalability:
- Question bank can grow to 10,000+ questions
- Student profiles remain lightweight
- Consider database indexing on topicId, difficulty, discriminationIndex
- Cache frequently accessed questions

## Testing the System

### Included Mock Data:
- **12 sample questions** across Mathematics and English
- **5 curriculum topics** covering Years 7-10
- **Mock student profile** with realistic attempt history
- **Spaced repetition data** showing different review states

### Try These Scenarios:

1. **Generate Adaptive Quiz**
   - Notice questions focus on Geometry and Quadratics (weak areas)
   - Difficulty matches ability level
   - Predictions shown for each question

2. **Complete Quiz**
   - Answer questions correctly → ability level increases
   - Answer incorrectly → questions reschedule for review
   - See updated topic mastery levels

3. **Teacher Question Bank**
   - Add new questions aligned to curriculum
   - View performance statistics
   - See ML quality scores

## Conclusion

This adaptive learning system represents a sophisticated application of machine learning to education. By combining Item Response Theory, spaced repetition, and multi-factor question selection, it creates a truly personalized learning experience that adapts to each student's unique needs while maintaining alignment with curriculum requirements.

The system is designed to scale from a small tutoring company to a large educational institution, with clear APIs and extensible architecture for future enhancements.
