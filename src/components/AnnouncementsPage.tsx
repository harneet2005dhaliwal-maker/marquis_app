import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, Calendar, AlertCircle, Info, Star, Megaphone, Heart, ThumbsUp, MessageCircle, Sparkles, BookOpen, PartyPopper, Flame, Lightbulb, Check, Bookmark, User, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { useData } from "../contexts/DataContext";
import { supabase } from "../lib/supabase";
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

interface AnnouncementRecord {
  id: number;
  title: string;
  message: string;
  full_message?: string | null;
  category: string;
  type?: string | null;
  author?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "Recently";

  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (Number.isNaN(diffMs)) return "Recently";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}


export function AnnouncementsPage() {
  const { currentStudent } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [readPosts, setReadPosts] = useState<number[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [hoveredReaction, setHoveredReaction] = useState<{ postId: number; emoji: string } | null>(null);
  const [postReactions, setPostReactions] = useState<{ [key: number]: { [emoji: string]: number } }>({});
  const [userReactions, setUserReactions] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);
        setAnnouncementError(null);

        const nowIso = new Date().toISOString();

        const { data, error } = await supabase
          .from("announcements")
          .select(
            "id, title, message, full_message, category, type, author, published_at, expires_at, is_published, created_at"
          )
          .eq("is_published", true)
          .lte("published_at", nowIso)
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
          .order("published_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (mounted) {
          setAnnouncements((data ?? []) as AnnouncementRecord[]);
        }
      } catch (error) {
        console.error("Failed to load announcements:", error);

        if (mounted) {
          setAnnouncementError(
            error instanceof Error
              ? error.message
              : "Unable to load announcements."
          );
        }
      } finally {
        if (mounted) {
          setLoadingAnnouncements(false);
        }
      }
    };

    void loadAnnouncements();

    const channel = supabase
      .channel("announcements-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          void loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const categories = [
    { id: "all", label: "All", icon: Bell },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "exam", label: "Exams", icon: AlertCircle },
    { id: "celebration", label: "Wins", icon: PartyPopper },
  ];

  const filteredAnnouncements = useMemo(
    () =>
      selectedCategory === "all"
        ? announcements
        : announcements.filter(
            (announcement) => announcement.category === selectedCategory
          ),
    [announcements, selectedCategory]
  );

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
const postReactionsData = {
  ...(prev[postId] ?? {}),
};
      
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

        {loadingAnnouncements && (
          <Card
            className="border-0 p-6 text-center"
            style={{
              borderRadius: "20px",
              background: "#FFFFFF",
              boxShadow: "0px 10px 26px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                color: "#6E6E70",
                margin: 0,
              }}
            >
              Loading announcements…
            </p>
          </Card>
        )}

        {announcementError && (
          <Card
            className="border-0 p-6"
            style={{
              borderRadius: "20px",
              background: "#FFF4F4",
              boxShadow: "0px 10px 26px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                color: "#B91C1C",
                margin: 0,
              }}
            >
              {announcementError}
            </p>
          </Card>
        )}

        {/* Announcements List */}
        {!loadingAnnouncements && !announcementError && (
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
                              {(() => {
                                const published = announcement.published_at
                                  ? new Date(announcement.published_at)
                                  : null;
                                const isNew =
                                  published &&
                                  Date.now() - published.getTime() <
                                    48 * 60 * 60 * 1000;

                                return isNew && !isRead;
                              })() && (
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
                              {announcement.author || "Marquis Team"} • {formatRelativeDate(announcement.published_at || announcement.created_at)}
                            </p>
                            <p 
                              className="text-sm" 
                              style={{ 
                                fontFamily: 'Neurial Grotesk, sans-serif',
                                color: '#000000',
                                lineHeight: '1.5'
                              }}
                            >
                              {isExpanded ? announcement.full_message || announcement.message : announcement.message}
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
                      {!isExpanded && (announcement.full_message?.length ?? 0) > announcement.message.length && (
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
        )}

        {!loadingAnnouncements &&
          !announcementError &&
          filteredAnnouncements.length === 0 && (
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