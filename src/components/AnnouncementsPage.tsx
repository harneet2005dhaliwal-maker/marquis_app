import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, Calendar, AlertCircle, Info, Star, Megaphone, Heart, ThumbsUp, MessageCircle, Sparkles, BookOpen, PartyPopper, Flame, Lightbulb, Check, Bookmark, User, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { useData } from "../contexts/DataContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Category color mapping - Marquis Brand
const categoryColors: { [key: string]: { bg: string; icon: string; dot: string; border: string } } = {
  schedule: { bg: '#A78BFA', icon: '#A78BFA', dot: '#A78BFA', border: '#A78BFA' }, // Soft Purple for scheduled
  academic: { bg: '#FFD500', icon: '#FFD500', dot: '#FFD500', border: '#FFD500' }, // Yellow
  exam: { bg: '#FFB449', icon: '#FFB449', dot: '#FFB449', border: '#FFB449' }, // Warm Orange
  celebration: { bg: '#FFD500', icon: '#FFD500', dot: '#FFD500', border: '#FFD500' }, // Yellow
  system: { bg: '#74D889', icon: '#74D889', dot: '#74D889', border: '#74D889' }, // Soft Green
  default: { bg: '#FFD500', icon: '#FFD500', dot: '#FFD500', border: '#FFD500' } // Yellow
};

const getCategoryColors = (category: string) => {
  return categoryColors[category] || categoryColors.default;
};

// Emoji reactions
const emojiReactions = [
  { emoji: '👍', label: 'Helpful' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '💡', label: 'Insightful' }
];

export function AnnouncementsPage() {
  const { currentStudent } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [readPosts, setReadPosts] = useState<number[]>([3, 4, 5]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [hoveredReaction, setHoveredReaction] = useState<{ postId: number; emoji: string } | null>(null);
  const [postReactions, setPostReactions] = useState<{ [key: number]: { [emoji: string]: number } }>({
    1: { '👍': 8, '❤️': 3, '🎉': 1 },
    2: { '👍': 15, '💡': 9 },
    3: { '👍': 12, '❤️': 4, '🔥': 2 },
    4: { '❤️': 30, '🎉': 15 },
    5: { '👍': 5 }
  });
  const [userReactions, setUserReactions] = useState<{ [key: number]: string }>({});

  const announcements = [
    {
      id: 1,
      title: "Holiday Schedule Update",
      message: "Classes will resume on Monday, October 14th after the school break. Make sure to complete any assigned homework during this time.",
      fullMessage: "Classes will resume on Monday, October 14th after the school break. Make sure to complete any assigned homework during this time. We're excited to see everyone back and ready to learn! Don't forget to bring your completed worksheets.",
      date: "2 hours ago",
      timestamp: "Posted 2h ago by Marquis Team",
      type: "info",
      category: "schedule",
      isNew: true,
      likes: 12,
      comments: 3,
      recentComments: [
        { user: "Zara", message: "Thanks for the update!" },
        { user: "Alex", message: "Looking forward to coming back!" }
      ],
      author: "Marquis Team"
    },
    {
      id: 2,
      title: "New Study Materials Available",
      message: "We've added new practice worksheets for Year 10 Mathematics covering quadratic equations. Check the Study Resources section!",
      fullMessage: "We've added new practice worksheets for Year 10 Mathematics covering quadratic equations. Check the Study Resources section! These worksheets include step-by-step solutions and extra practice problems to help you master the concepts.",
      date: "1 day ago",
      timestamp: "Posted 1d ago by Ms. Johnson",
      type: "info",
      category: "academic",
      isNew: true,
      likes: 24,
      comments: 7,
      recentComments: [
        { user: "Jordan", message: "Can't wait to try these!" },
        { user: "Sam", message: "Very helpful!" }
      ],
      author: "Ms. Johnson"
    },
    {
      id: 3,
      title: "Upcoming Test Week",
      message: "Test week is scheduled for October 18-22. Review your notes and use the practice materials available in the Study section.",
      fullMessage: "Test week is scheduled for October 18-22. Review your notes and use the practice materials available in the Study section. Make sure to get plenty of rest and arrive prepared. Good luck to everyone!",
      date: "3 days ago",
      timestamp: "Posted 3d ago by Dr. Smith",
      type: "warning",
      category: "exam",
      isNew: false,
      likes: 45,
      comments: 12,
      recentComments: [
        { user: "Emma", message: "Let's ace this!" },
        { user: "Michael", message: "Study group anyone?" }
      ],
      author: "Dr. Smith"
    },
    {
      id: 4,
      title: "Congratulations to Alex!",
      message: "Alex Jones has achieved a perfect score in Mathematics this week! Amazing work! 🎉",
      fullMessage: "Alex Jones has achieved a perfect score in Mathematics this week! Your dedication and hard work have truly paid off. Keep up the excellent work and continue inspiring your peers! 🎉",
      date: "5 days ago",
      timestamp: "Posted 5d ago by Marquis Team",
      type: "success",
      category: "celebration",
      isNew: false,
      likes: 67,
      comments: 18,
      recentComments: [
        { user: "Sarah", message: "So proud of you!" },
        { user: "David", message: "Incredible!" }
      ],
      author: "Marquis Team"
    },
    {
      id: 5,
      title: "System Maintenance",
      message: "The learning platform will undergo scheduled maintenance on Saturday from 2-4 AM. Please save your work before then.",
      fullMessage: "The learning platform will undergo scheduled maintenance on Saturday from 2-4 AM. Please save your work before then. We apologize for any inconvenience and appreciate your patience as we improve our services.",
      date: "1 week ago",
      timestamp: "Posted 1w ago by Tech Team",
      type: "info",
      category: "system",
      isNew: false,
      likes: 8,
      comments: 2,
      recentComments: [
        { user: "Chris", message: "Thanks for letting us know!" }
      ],
      author: "Tech Team"
    }
  ];

  const categories = [
    { id: "all", label: "All", icon: Bell },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "exam", label: "Exams", icon: AlertCircle },
    { id: "celebration", label: "Wins", icon: PartyPopper },
  ];

  const filteredAnnouncements = selectedCategory === "all"
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  const handleLike = (id: number) => {
    setLikedPosts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleBookmark = (id: number) => {
    setBookmarkedPosts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedPost(expandedPost === id ? null : id);
    if (!readPosts.includes(id)) {
      setReadPosts([...readPosts, id]);
    }
  };

  const handleReaction = (postId: number, emoji: string) => {
    const currentUserReaction = userReactions[postId];
    
    setPostReactions(prev => {
      const postReactionsData = { ...prev[postId] } || {};
      
      if (currentUserReaction === emoji) {
        postReactionsData[emoji] = Math.max(0, (postReactionsData[emoji] || 0) - 1);
        if (postReactionsData[emoji] === 0) delete postReactionsData[emoji];
      } else {
        if (currentUserReaction) {
          postReactionsData[currentUserReaction] = Math.max(0, (postReactionsData[currentUserReaction] || 0) - 1);
          if (postReactionsData[currentUserReaction] === 0) delete postReactionsData[currentUserReaction];
        }
        postReactionsData[emoji] = (postReactionsData[emoji] || 0) + 1;
      }
      
      return {
        ...prev,
        [postId]: postReactionsData
      };
    });

    setUserReactions(prev => {
      const newReactions = { ...prev };
      if (currentUserReaction === emoji) {
        delete newReactions[postId];
      } else {
        newReactions[postId] = emoji;
      }
      return newReactions;
    });
  };

  const unreadCount = announcements.filter(a => !readPosts.includes(a.id)).length;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Warm Yellow Vignette at Top */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at top right, rgba(255,213,0,0.22), transparent 65%)',
          height: '50%'
        }}
      />

      <div className="p-6 space-y-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 
              className="mt-0 mb-1 flex items-center gap-2" 
              style={{ 
                fontFamily: 'Neurial Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '28px',
                color: '#000000'
              }}
            >
              News & Updates
              <Bell className="w-7 h-7" style={{ color: '#FFD500' }} />
            </h1>
            <p 
              className="text-sm" 
              style={{ 
                fontFamily: 'Neurial Grotesk, sans-serif',
                color: '#6E6E70',
                marginTop: '0'
              }}
            >
              Stay updated with latest info
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-full"
              style={{ 
                background: '#FFD500',
                boxShadow: '0px 4px 12px rgba(255,213,0,0.3)'
              }}
            >
              <span 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#000000'
                }}
              >
                {unreadCount} New
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Category Filters - Grey Background Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-3xl"
          style={{ background: '#FAFAFA' }}
        >
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: isActive ? '#FFD500' : '#FFFFFF',
                    border: isActive ? 'none' : '1px solid #E6E6E6',
                    fontFamily: 'Neurial Grotesk, sans-serif',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '14px',
                    color: '#000000',
                    boxShadow: isActive ? '0px 4px 12px rgba(255,213,0,0.3)' : 'none'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    style={{ 
                      color: '#000000',
                      strokeWidth: isActive ? 2.5 : 2
                    }} 
                  />
                  {category.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Announcements List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAnnouncements.map((announcement, index) => {
              const colors = getCategoryColors(announcement.category);
              const isExpanded = expandedPost === announcement.id;
              const isRead = readPosts.includes(announcement.id);
              const isLiked = likedPosts.includes(announcement.id);
              const isBookmarked = bookmarkedPosts.includes(announcement.id);
              const reactions = postReactions[announcement.id] || {};
              const userReaction = userReactions[announcement.id];
              const hasReacted = !!userReaction;

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card 
                    className="border-0 overflow-hidden cursor-pointer"
                    style={{ 
                      borderRadius: '20px',
                      boxShadow: '0px 10px 26px rgba(0, 0, 0, 0.06)',
                      background: '#FFFFFF',
                      borderLeft: `4px solid ${colors.border}`
                    }}
                    onClick={() => toggleExpand(announcement.id)}
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${colors.bg}20` }}
                          >
                            {announcement.category === 'schedule' && <Calendar className="w-6 h-6" style={{ color: colors.icon, strokeWidth: 2.5 }} />}
                            {announcement.category === 'academic' && <BookOpen className="w-6 h-6" style={{ color: colors.icon, strokeWidth: 2.5 }} />}
                            {announcement.category === 'exam' && <AlertCircle className="w-6 h-6" style={{ color: colors.icon, strokeWidth: 2.5 }} />}
                            {announcement.category === 'celebration' && <PartyPopper className="w-6 h-6" style={{ color: colors.icon, strokeWidth: 2.5 }} />}
                            {announcement.category === 'system' && <Info className="w-6 h-6" style={{ color: colors.icon, strokeWidth: 2.5 }} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 
                                className="mb-0" 
                                style={{ 
                                  fontFamily: 'Neurial Grotesk, sans-serif',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  color: '#000000'
                                }}
                              >
                                {announcement.title}
                              </h3>
                              {announcement.isNew && !isRead && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="px-2 py-0.5 rounded-full"
                                  style={{ 
                                    background: '#FFD500',
                                    fontSize: '10px',
                                    fontFamily: 'Neurial Grotesk, sans-serif',
                                    fontWeight: 700,
                                    color: '#000000'
                                  }}
                                >
                                  NEW
                                </motion.div>
                              )}
                            </div>
                            <p 
                              className="text-xs mb-2" 
                              style={{ 
                                fontFamily: 'Neurial Grotesk, sans-serif',
                                color: '#6E6E70'
                              }}
                            >
                              {announcement.author} • {announcement.date}
                            </p>
                            <p 
                              className="text-sm" 
                              style={{ 
                                fontFamily: 'Neurial Grotesk, sans-serif',
                                color: '#000000',
                                lineHeight: '1.5'
                              }}
                            >
                              {isExpanded ? announcement.fullMessage : announcement.message}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(announcement.id);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="ml-2 flex-shrink-0"
                        >
                          <Bookmark 
                            className="w-5 h-5" 
                            style={{ 
                              color: isBookmarked ? '#FFD500' : '#6E6E70',
                              fill: isBookmarked ? '#FFD500' : 'none',
                              strokeWidth: 2
                            }} 
                          />
                        </motion.button>
                      </div>

                      {/* Expand indicator */}
                      {!isExpanded && announcement.fullMessage.length > announcement.message.length && (
                        <p 
                          className="text-xs mb-3" 
                          style={{ 
                            fontFamily: 'Neurial Grotesk, sans-serif',
                            fontWeight: 600,
                            color: '#FFD500'
                          }}
                        >
                          Tap to read more →
                        </p>
                      )}

                      {/* Comments Preview */}
                      {isExpanded && announcement.recentComments && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 space-y-2"
                          style={{ borderTop: '1px solid #E6E6E6' }}
                        >
                          <p 
                            className="text-xs mb-2" 
                            style={{ 
                              fontFamily: 'Neurial Grotesk, sans-serif',
                              fontWeight: 600,
                              color: '#6E6E70'
                            }}
                          >
                            Recent Comments
                          </p>
                          {announcement.recentComments.map((comment, idx) => (
                            <div 
                              key={idx} 
                              className="p-3 rounded-xl"
                              style={{ background: '#FAFAFA' }}
                            >
                              <p 
                                className="text-xs mb-1" 
                                style={{ 
                                  fontFamily: 'Neurial Grotesk, sans-serif',
                                  fontWeight: 600,
                                  color: '#000000'
                                }}
                              >
                                {comment.user}
                              </p>
                              <p 
                                className="text-xs" 
                                style={{ 
                                  fontFamily: 'Neurial Grotesk, sans-serif',
                                  color: '#6E6E70'
                                }}
                              >
                                {comment.message}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* Reactions Bar */}
                      <div 
                        className="mt-4 pt-4 flex items-center justify-between"
                        style={{ borderTop: '1px solid #E6E6E6' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {emojiReactions.map((reaction) => {
                            const count = reactions[reaction.emoji] || 0;
                            const isUserReaction = userReaction === reaction.emoji;
                            
                            return count > 0 || isUserReaction ? (
                              <TooltipProvider key={reaction.emoji}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      onClick={() => handleReaction(announcement.id, reaction.emoji)}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                      style={{
                                        background: isUserReaction ? '#FFD500' : '#FAFAFA',
                                        border: isUserReaction ? 'none' : '1px solid #E6E6E6'
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <span style={{ fontSize: '14px' }}>{reaction.emoji}</span>
                                      <span 
                                        className="text-xs" 
                                        style={{ 
                                          fontFamily: 'Neurial Grotesk, sans-serif',
                                          fontWeight: 600,
                                          color: isUserReaction ? '#000000' : '#6E6E70'
                                        }}
                                      >
                                        {count}
                                      </span>
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p style={{ fontFamily: 'Neurial Grotesk, sans-serif', fontSize: '12px' }}>{reaction.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null;
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          {emojiReactions.map((reaction) => {
                            const count = reactions[reaction.emoji] || 0;
                            const isUserReaction = userReaction === reaction.emoji;
                            
                            if (count === 0 && !isUserReaction) {
                              return (
                                <motion.button
                                  key={reaction.emoji}
                                  onClick={() => handleReaction(announcement.id, reaction.emoji)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ background: '#FAFAFA' }}
                                  whileHover={{ scale: 1.1, background: '#FFD50020' }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <span style={{ fontSize: '14px' }}>{reaction.emoji}</span>
                                </motion.button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredAnnouncements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card 
              className="border-0 p-8 text-center"
              style={{ 
                borderRadius: '20px',
                boxShadow: '0px 10px 26px rgba(0, 0, 0, 0.06)',
                background: '#FFFFFF'
              }}
            >
              <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: '#E6E6E6' }} />
              <p 
                style={{ 
                  fontFamily: 'Neurial Grotesk, sans-serif',
                  color: '#6E6E70'
                }}
              >
                No announcements in this category
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
