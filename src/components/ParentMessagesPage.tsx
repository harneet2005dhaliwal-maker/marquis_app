import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { 
  Send,
  User,
  Clock,
  ArrowLeft
} from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderType: "admin" | "educator" | "parent";
  senderRole?: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
  canReply: boolean;
  section?: "today" | "yesterday" | "this-week";
}

export function ParentMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [view, setView] = useState<"inbox" | "history">("inbox");

  const inboxMessages: Message[] = [
    {
      id: "1",
      sender: "Araf",
      senderType: "educator",
      senderRole: "Mathematics Tutor",
      subject: "Excellent Progress in Quadratic Equations",
      message: "Hi Mrs. Johnson! I wanted to personally share how impressed I am with Alex's progress this week. He's been working really hard on quadratic equations and his problem-solving approach has matured significantly. Today he solved a complex word problem entirely on his own - I could see the confidence building! Please encourage him to keep practicing the problem-solving checklist we created together. He's doing wonderfully!",
      timestamp: "Today, 2:30 PM",
      read: false,
      canReply: false,
      section: "today"
    },
    {
      id: "2",
      sender: "Marquis Admin Team",
      senderType: "admin",
      subject: "Weekly Summary & Upcoming Assessments",
      message: "Hi Mrs. Johnson! We wanted to share Alex's wonderful progress this week. His tutors report strong engagement across all subjects, with particular improvement in Mathematics. Just a reminder that Alex has upcoming assessments in Physics and English next month. His tutors have prepared customized study plans which have been shared with him. Please feel free to reach out if you have any questions.",
      timestamp: "Today, 10:00 AM",
      read: false,
      canReply: true,
      section: "today"
    },
    {
      id: "3",
      sender: "Naveen",
      senderType: "educator",
      senderRole: "Mathematics Tutor",
      subject: "Strong Problem-Solving Skills",
      message: "Hello Mrs. Johnson, I wanted to highlight Alex's outstanding performance in our mathematics session this week. His approach to solving complex problems was very methodical and thoughtful. We're working on building his confidence with word problems. I've given him some targeted practice problems - your encouragement at home would be wonderful!",
      timestamp: "Yesterday, 5:45 PM",
      read: true,
      canReply: false,
      section: "yesterday"
    },
    {
      id: "4",
      sender: "Zara",
      senderType: "educator",
      senderRole: "English Tutor",
      subject: "Creative Writing Development",
      message: "Hi Mrs. Johnson, I'm pleased to share that Alex submitted an excellent analytical essay this week. His critical thinking skills are developing beautifully. I've provided detailed feedback on his essay structure. I'd love to see him explore more creative writing - perhaps encouraging him to keep a personal journal or write short stories about topics that interest him would help develop his creative voice alongside his strong analytical skills.",
      timestamp: "2 days ago",
      read: true,
      canReply: false,
      section: "this-week"
    },
  ];

  const historyMessages: Message[] = [
    {
      id: "h1",
      sender: "Marquis Admin Team",
      senderType: "admin",
      subject: "Re: Schedule Change Request",
      message: "Hi Mrs. Johnson, thank you for your message. We've successfully rescheduled Alex's Thursday Mathematics session from 4:00 PM to 5:30 PM starting next week. Sarah has confirmed this works with her schedule. The updated calendar has been sent to your email. Please let us know if you need any other adjustments!",
      timestamp: "3 days ago",
      read: true,
      canReply: true,
      section: "this-week"
    },
    {
      id: "h2",
      sender: "Abi",
      senderType: "educator",
      senderRole: "English & Math Tutor",
      subject: "First Session Update",
      message: "Hello Mrs. Johnson! I just wanted to reach out after my first session with Alex. He's a wonderful student - engaged, curious, and asks great questions. We had a productive session covering algebraic fundamentals and I'm excited to work with him. I can already see his potential and I'm looking forward to helping him achieve his goals!",
      timestamp: "1 week ago",
      read: true,
      canReply: false,
      section: "this-week"
    },
    {
      id: "h3",
      sender: "Marquis Admin Team",
      senderType: "admin",
      subject: "Welcome to Marquis",
      message: "Dear Mrs. Johnson, Welcome to the Marquis family! We're thrilled to have Alex join us. You now have access to your parent portal where you can track progress, view schedules, communicate with our team, and manage billing. Our educators are excited to work with Alex and support his academic journey. If you have any questions, we're always here to help!",
      timestamp: "2 weeks ago",
      read: true,
      canReply: true,
      section: "this-week"
    },
  ];

  const messages = view === "inbox" ? inboxMessages : historyMessages;
  const unreadCount = inboxMessages.filter(m => !m.read).length;
  const selected = messages.find(m => m.id === selectedMessage);

  // Group messages by section
  const groupedMessages = {
    today: messages.filter(m => m.section === "today"),
    yesterday: messages.filter(m => m.section === "yesterday"),
    "this-week": messages.filter(m => m.section === "this-week"),
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      // Handle sending reply
      setReplyText("");
      setSelectedMessage(null);
    }
  };

  // Avatar colors for different educators
  const getAvatarColor = (sender: string, senderType: string) => {
    if (senderType === "admin") return "#F8D548";
    
    const colors: Record<string, string> = {
      "Araf": "#6B9BD1",
      "Naveen": "#8B7FC5",
      "Zara": "#E87FA7",
      "Ria": "#F0A574",
      "Jiya": "#7DCDB5",
      "Abhimita": "#E6A45F",
      "Zuhayer": "#89B9D8",
      "Abi": "#A594D3"
    };
    
    return colors[sender] || "#999999";
  };

  return (
    <div 
      className="px-6 max-w-md mx-auto"
      style={{
        paddingTop: "48px",
        paddingBottom: "48px"
      }}
    >
      {!selectedMessage ? (
        <>
          {/* Header Section - Cleaner & Aligned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h1
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "32px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  Messages
                </h1>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                  }}
                >
                  Updates from educators and admin team
                </p>
              </div>
              {unreadCount > 0 && view === "inbox" && (
                <div
                  className="px-4 py-2 rounded-full"
                  style={{
                    background: "#F6C84A",
                    display: "flex",
                    alignItems: "baseline"
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {unreadCount} New
                  </p>
                </div>
              )}
            </div>

            {/* View Toggle Tabs - Tighter spacing */}
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setView("inbox")}
                className="flex-1 relative"
                style={{
                  padding: "16px 32px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "15px",
                  fontWeight: view === "inbox" ? 600 : 400,
                  color: view === "inbox" ? "#1A1A1A" : "#999999",
                  transition: "all 0.2s ease"
                }}
              >
                Inbox
                {view === "inbox" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "3px",
                      background: "#F6C84A",
                      borderRadius: "3px 3px 0 0"
                    }}
                  />
                )}
              </button>
              <button
                onClick={() => setView("history")}
                className="flex-1 relative"
                style={{
                  padding: "16px 32px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "15px",
                  fontWeight: view === "history" ? 600 : 400,
                  color: view === "history" ? "#1A1A1A" : "#999999",
                  transition: "all 0.2s ease"
                }}
              >
                History
                {view === "history" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "3px",
                      background: "#F6C84A",
                      borderRadius: "3px 3px 0 0"
                    }}
                  />
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#E5E5E5", marginBottom: "12px" }} />
          </motion.div>

          {/* Note Box - Smaller, cleaner */}
          {view === "inbox" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-6"
            >
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#FFF8E7",
                  border: "1px solid #F7EBC8",
                }}
              >
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    color: "#1A1A1A",
                    lineHeight: "1.5",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Note:</span> Educators share updates directly with you. To ask questions or discuss concerns, please reply to admin team messages.
                </p>
              </div>
            </motion.div>
          )}

          {/* Messages List with Section Dividers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Today Section */}
            {groupedMessages.today.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#999999",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "12px"
                  }}
                >
                  Today
                </p>
                <div className="space-y-4">
                  {groupedMessages.today.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      whileHover={{ 
                        y: -2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                      }}
                      onClick={() => setSelectedMessage(message.id)}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "20px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        padding: "20px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Accent Strip */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20px",
                          bottom: "20px",
                          width: "4px",
                          background: message.read ? "#E5E5E5" : "#F6C84A",
                          borderRadius: "0 4px 4px 0"
                        }}
                      />

                      {/* Content */}
                      <div style={{ paddingLeft: "12px" }}>
                        {/* Top Row - Avatar + Name + Badge + Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                              className="rounded-full flex items-center justify-center"
                              style={{
                                width: "48px",
                                height: "48px",
                                background: getAvatarColor(message.sender, message.senderType),
                              }}
                            >
                              <User className="w-6 h-6" style={{ color: "#FFFFFF" }} />
                            </div>

                            {/* Name + Badge */}
                            <div className="flex items-center gap-2">
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "16px",
                                  fontWeight: 600,
                                  color: "#1A1A1A",
                                }}
                              >
                                {message.sender}
                              </p>
                              {message.senderType === "educator" && (
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "20px",
                                    background: "#EAF8EA",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontFamily: "Neurial Grotesk, sans-serif",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#3B7C3B",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.03em"
                                    }}
                                  >
                                    Educator
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" style={{ color: "#999999" }} />
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                color: "#777777",
                              }}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Message Title */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            fontWeight: message.read ? 500 : 600,
                            color: "#E6B800",
                            marginBottom: "8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            opacity: message.read ? 0.85 : 1
                          }}
                        >
                          {message.subject}
                        </p>

                        {/* Message Preview */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#555555",
                            lineHeight: "1.5",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {message.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday Section */}
            {groupedMessages.yesterday.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#999999",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "12px",
                    marginTop: "24px"
                  }}
                >
                  Yesterday
                </p>
                <div className="space-y-4">
                  {groupedMessages.yesterday.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      whileHover={{ 
                        y: -2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                      }}
                      onClick={() => setSelectedMessage(message.id)}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "20px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        padding: "20px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Accent Strip */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20px",
                          bottom: "20px",
                          width: "4px",
                          background: message.read ? "#E5E5E5" : "#F6C84A",
                          borderRadius: "0 4px 4px 0"
                        }}
                      />

                      {/* Content */}
                      <div style={{ paddingLeft: "12px" }}>
                        {/* Top Row - Avatar + Name + Badge + Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                              className="rounded-full flex items-center justify-center"
                              style={{
                                width: "48px",
                                height: "48px",
                                background: getAvatarColor(message.sender, message.senderType),
                              }}
                            >
                              <User className="w-6 h-6" style={{ color: "#FFFFFF" }} />
                            </div>

                            {/* Name + Badge */}
                            <div className="flex items-center gap-2">
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "16px",
                                  fontWeight: 600,
                                  color: "#1A1A1A",
                                }}
                              >
                                {message.sender}
                              </p>
                              {message.senderType === "educator" && (
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "20px",
                                    background: "#EAF8EA",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontFamily: "Neurial Grotesk, sans-serif",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#3B7C3B",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.03em"
                                    }}
                                  >
                                    Educator
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" style={{ color: "#999999" }} />
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                color: "#777777",
                              }}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Message Title */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            fontWeight: message.read ? 500 : 600,
                            color: "#E6B800",
                            marginBottom: "8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            opacity: message.read ? 0.85 : 1
                          }}
                        >
                          {message.subject}
                        </p>

                        {/* Message Preview */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#555555",
                            lineHeight: "1.5",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {message.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* This Week Section */}
            {groupedMessages["this-week"].length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#999999",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "12px",
                    marginTop: "24px"
                  }}
                >
                  This Week
                </p>
                <div className="space-y-4">
                  {groupedMessages["this-week"].map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      whileHover={{ 
                        y: -2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                      }}
                      onClick={() => setSelectedMessage(message.id)}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "20px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        padding: "20px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Accent Strip */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20px",
                          bottom: "20px",
                          width: "4px",
                          background: message.read ? "#E5E5E5" : "#F6C84A",
                          borderRadius: "0 4px 4px 0"
                        }}
                      />

                      {/* Content */}
                      <div style={{ paddingLeft: "12px" }}>
                        {/* Top Row - Avatar + Name + Badge + Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                              className="rounded-full flex items-center justify-center"
                              style={{
                                width: "48px",
                                height: "48px",
                                background: getAvatarColor(message.sender, message.senderType),
                              }}
                            >
                              <User className="w-6 h-6" style={{ color: "#FFFFFF" }} />
                            </div>

                            {/* Name + Badge */}
                            <div className="flex items-center gap-2">
                              <p
                                style={{
                                  fontFamily: "Neurial Grotesk, sans-serif",
                                  fontSize: "16px",
                                  fontWeight: 600,
                                  color: "#1A1A1A",
                                }}
                              >
                                {message.sender}
                              </p>
                              {message.senderType === "educator" && (
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "20px",
                                    background: "#EAF8EA",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontFamily: "Neurial Grotesk, sans-serif",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#3B7C3B",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.03em"
                                    }}
                                  >
                                    Educator
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" style={{ color: "#999999" }} />
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "13px",
                                color: "#777777",
                              }}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Message Title */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "16px",
                            fontWeight: message.read ? 500 : 600,
                            color: "#E6B800",
                            marginBottom: "8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            opacity: message.read ? 0.85 : 1
                          }}
                        >
                          {message.subject}
                        </p>

                        {/* Message Preview */}
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "14px",
                            color: "#555555",
                            lineHeight: "1.5",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {message.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        // Message Detail View
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Back Button */}
          <Button
            onClick={() => setSelectedMessage(null)}
            variant="ghost"
            className="flex items-center gap-2 -ml-2"
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              color: "#6B6B6B",
              fontWeight: 500,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Messages
          </Button>

          {/* Message Content */}
          {selected && (
            <>
              <Card
                className="border-0 p-6"
                style={{
                  background: "#FFFFFF",
                  borderRadius: "24px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  border: "1px solid #EDEDED",
                }}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-4 pb-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <div
                      className="rounded-full flex items-center justify-center"
                      style={{
                        width: "56px",
                        height: "56px",
                        background: getAvatarColor(selected.sender, selected.senderType),
                      }}
                    >
                      <User className="w-7 h-7" style={{ color: "#FFFFFF" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                          }}
                        >
                          {selected.sender}
                        </p>
                        {selected.senderType === "educator" && (
                          <div
                            style={{
                              padding: "4px 8px",
                              borderRadius: "20px",
                              background: "#EAF8EA",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#3B7C3B",
                                textTransform: "uppercase",
                              }}
                            >
                              Educator
                            </p>
                          </div>
                        )}
                      </div>
                      {selected.senderRole && (
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            color: "#6B6B6B",
                            marginBottom: "4px",
                          }}
                        >
                          {selected.senderRole}
                        </p>
                      )}
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "13px",
                          color: "#999999",
                        }}
                      >
                        {selected.timestamp}
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#999999",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Subject
                    </p>
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "#1A1A1A",
                      }}
                    >
                      {selected.subject}
                    </p>
                  </div>

                  {/* Message Body */}
                  <div>
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "15px",
                        color: "#1A1A1A",
                        lineHeight: "1.7",
                      }}
                    >
                      {selected.message}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Reply Section or Info */}
              {selected.canReply ? (
                <Card
                  className="border-0 p-6"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "24px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: "1px solid #EDEDED",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      marginBottom: "12px",
                    }}
                  >
                    Reply to {selected.sender}
                  </p>
                  <Textarea
                    placeholder="Type your message here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-32 mb-4"
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      borderRadius: "12px",
                      border: "1px solid #E5E5E5",
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      background: "#F8D548",
                      color: "#1A1A1A",
                      borderRadius: "12px",
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontWeight: 600,
                      padding: "12px",
                      border: "none",
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Send Reply to Admin Team
                  </Button>
                </Card>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#FFF8E7",
                    border: "1px solid #F7EBC8",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      color: "#1A1A1A",
                      lineHeight: "1.6",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Educator Update:</span> This is an informational message from your child's educator. If you have questions or concerns, please contact the Marquis Admin Team through the inbox messages.
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
