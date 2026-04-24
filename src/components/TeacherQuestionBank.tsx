import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Plus, Search, Filter, Edit, Trash2, BookOpen, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { questionBank, curriculumTopics, Question, QuestionType, DifficultyLevel, SubjectArea } from '../data/questionBank';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

export function TeacherQuestionBank() {
  const [questions, setQuestions] = useState<Question[]>(questionBank);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  // New question form state
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: '',
    type: 'multiple-choice',
    difficulty: 'medium',
    correctAnswer: '',
    options: ['', '', '', ''],
    explanation: '',
    tags: [],
    curriculumTopicId: curriculumTopics[0]?.id || ''
  });

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const topic = curriculumTopics.find(t => t.id === q.curriculumTopicId);
    const matchesSubject = filterSubject === 'all' || topic?.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const addQuestion = () => {
    if (!newQuestion.question || !newQuestion.correctAnswer) return;
    
    const question: Question = {
      id: `q-${Date.now()}`,
      curriculumTopicId: newQuestion.curriculumTopicId!,
      question: newQuestion.question,
      type: newQuestion.type as QuestionType,
      difficulty: newQuestion.difficulty as DifficultyLevel,
      correctAnswer: newQuestion.correctAnswer,
      options: newQuestion.type === 'multiple-choice' ? newQuestion.options : undefined,
      explanation: newQuestion.explanation,
      tags: newQuestion.tags || [],
      createdBy: 'teacher-current',
      createdAt: new Date(),
      lastModified: new Date(),
      timesAsked: 0,
      timesCorrect: 0,
      avgTimeToAnswer: 0,
      discriminationIndex: 1.0
    };
    
    setQuestions([...questions, question]);
    setIsAddingQuestion(false);
    setNewQuestion({
      question: '',
      type: 'multiple-choice',
      difficulty: 'medium',
      correctAnswer: '',
      options: ['', '', '', ''],
      explanation: '',
      tags: [],
      curriculumTopicId: curriculumTopics[0]?.id || ''
    });
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const getQuestionStats = (q: Question) => {
    const accuracy = q.timesAsked > 0 ? (q.timesCorrect / q.timesAsked) * 100 : 0;
    return {
      accuracy: Math.round(accuracy),
      timesAsked: q.timesAsked,
      avgTime: Math.round(q.avgTimeToAnswer)
    };
  };

  const getTopicName = (topicId: string) => {
    const topic = curriculumTopics.find(t => t.id === topicId);
    return topic ? `${topic.subject} - ${topic.topic}` : topicId;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-neutral-900 mb-2">Question Bank Management</h1>
          <p className="text-neutral-600">Curate questions for adaptive AI quizzes and flashcards</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={20} style={{ color: '#6366F1' }} />
              <span className="text-neutral-500">Total Questions</span>
            </div>
            <div className="text-neutral-900">{questions.length}</div>
          </Card>
          
          <Card className="p-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} style={{ color: '#10B981' }} />
              <span className="text-neutral-500">Avg Accuracy</span>
            </div>
            <div className="text-neutral-900">
              {Math.round(questions.reduce((sum, q) => {
                const acc = q.timesAsked > 0 ? (q.timesCorrect / q.timesAsked) : 0;
                return sum + acc;
              }, 0) / questions.length * 100)}%
            </div>
          </Card>
          
          <Card className="p-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} style={{ color: '#F59E0B' }} />
              <span className="text-neutral-500">Total Attempts</span>
            </div>
            <div className="text-neutral-900">
              {questions.reduce((sum, q) => sum + q.timesAsked, 0)}
            </div>
          </Card>
          
          <Card className="p-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Brain size={20} style={{ color: '#8B5CF6' }} />
              <span className="text-neutral-500">AI Curated</span>
            </div>
            <div className="text-neutral-900">
              {questions.filter(q => q.discriminationIndex > 1.5).length}
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search questions by content or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="History">History</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => setIsAddingQuestion(true)}
            style={{ backgroundColor: '#6366F1' }}
            className="text-white"
          >
            <Plus size={20} className="mr-2" />
            Add Question
          </Button>
        </div>

        {/* Add Question Modal */}
        <AnimatePresence>
          {isAddingQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsAddingQuestion(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              >
                <h2 className="text-neutral-900 mb-6">Add New Question</h2>
                
                <div className="space-y-6">
                  <div>
                    <Label>Curriculum Topic</Label>
                    <Select 
                      value={newQuestion.curriculumTopicId} 
                      onValueChange={(val) => setNewQuestion({...newQuestion, curriculumTopicId: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {curriculumTopics.map(topic => (
                          <SelectItem key={topic.id} value={topic.id}>
                            Year {topic.yearLevel} - {topic.subject}: {topic.topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Question</Label>
                    <Textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      placeholder="Enter your question..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Question Type</Label>
                      <Select 
                        value={newQuestion.type} 
                        onValueChange={(val) => setNewQuestion({...newQuestion, type: val as QuestionType})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="short-answer">Short Answer</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Difficulty</Label>
                      <Select 
                        value={newQuestion.difficulty} 
                        onValueChange={(val) => setNewQuestion({...newQuestion, difficulty: val as DifficultyLevel})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {newQuestion.type === 'multiple-choice' && (
                    <div>
                      <Label>Answer Options</Label>
                      <div className="space-y-2 mt-2">
                        {newQuestion.options?.map((opt, idx) => (
                          <Input
                            key={idx}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(newQuestion.options || [])];
                              newOptions[idx] = e.target.value;
                              setNewQuestion({...newQuestion, options: newOptions});
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Correct Answer</Label>
                    <Input
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                      placeholder="Enter the correct answer..."
                    />
                  </div>
                  
                  <div>
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      placeholder="Explain the answer..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingQuestion(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addQuestion}
                      style={{ backgroundColor: '#6366F1' }}
                      className="text-white"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => {
            const stats = getQuestionStats(question);
            
            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className={
                          question.difficulty === 'hard' ? 'border-red-300 text-red-700 bg-red-50' :
                          question.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          'border-green-300 text-green-700 bg-green-50'
                        }>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 text-neutral-700">
                          {question.type}
                        </Badge>
                        <span className="text-neutral-500">
                          {getTopicName(question.curriculumTopicId)}
                        </span>
                      </div>
                      
                      <p className="text-neutral-900 mb-2">{question.question}</p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-neutral-600">
                          Correct Answer: {question.correctAnswer}
                        </span>
                      </div>
                      
                      {question.explanation && (
                        <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                          💡 {question.explanation}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Question Performance Stats */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-600" />
                        <span className="text-neutral-500">Accuracy</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={stats.accuracy} className="flex-1" />
                        <span className="text-neutral-900">{stats.accuracy}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-600" />
                        <span className="text-neutral-500">Avg Time</span>
                      </div>
                      <div className="text-neutral-900">{stats.avgTime}s</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-purple-600" />
                        <span className="text-neutral-500">ML Quality Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(question.discriminationIndex / 2) * 100} 
                          className="flex-1" 
                        />
                        <span className="text-neutral-900">
                          {question.discriminationIndex.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          
          {filteredQuestions.length === 0 && (
            <Card className="p-12 text-center bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <AlertCircle size={48} className="mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-600">No questions found matching your filters</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
