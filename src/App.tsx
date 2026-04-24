// App.tsx
import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { BookingsPage } from "./components/BookingsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { StudyPage } from "./components/StudyPage";
import { ProgressPage } from "./components/ProgressPage";
import { ParentPortalPage } from "./components/ParentPortalPage";
import { LoginPage } from "./components/LoginPage";

import { DataProvider, useData } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import { Home, Calendar, Bell, BookOpen, TrendingUp, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "./components/ui/sonner";
import logo from "../assets/Logo.png";
console.log(logo);

const HEADER_H = 72;
const NAV_H = 86; // tweak if your bottom nav is taller/shorter

function StudentApp() {
  const { logout } = useAuth();
  const { currentStudent } = useData();
  const [activeTab, setActiveTab] = useState("home");

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "bookings", label: "Classes", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "study", label: "Study", icon: BookOpen },
    { id: "announcements", label: "News", icon: Bell },
  ] as const;

  return (
    // ✅ Center a single "device frame" that controls width for header/content/nav
    <div className="min-h-dvh w-full bg-white flex justify-center">
      <div className="w-full max-w-md min-h-dvh bg-white relative overflow-hidden">
        {/* Header (pinned inside the frame) */}
        <header
          className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-marquis-border"
          style={{
            height: `${HEADER_H}px`,
            boxShadow: "0px 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between h-full px-5">
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#000" }}>MARQUIS</h1>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid #E6E6E6",
                  color: "#6E6E70",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                whileHover={{ scale: 1.05, background: "rgba(0,0,0,0.02)" }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>

              <Avatar
                className="w-9 h-9 bg-white"
                style={{
                  border: "2px solid #E6E6E6",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <AvatarFallback
                  className="bg-white text-black"
                  style={{ fontSize: "14px", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  {currentStudent?.name ? getInitials(currentStudent.name) : "AJ"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main (only scroll area) */}
        <main
          className="h-dvh overflow-y-auto bg-white"
          style={{
            paddingTop: `${HEADER_H}px`,
            paddingBottom: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "home" && <HomePage onNavigate={setActiveTab} />}
              {activeTab === "bookings" && <BookingsPage />}
              {activeTab === "progress" && <ProgressPage onNavigate={setActiveTab} />}
              {activeTab === "study" && <StudyPage />}
              {activeTab === "announcements" && <AnnouncementsPage />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom nav (pinned inside the frame) */}
        <motion.nav
          className="absolute left-0 right-0 bottom-0 z-50 bg-white border-t border-marquis-border"
          style={{
            height: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
            paddingBottom: "env(safe-area-inset-bottom)",
            boxShadow: "0px -4px 20px rgba(0,0,0,0.08)",
          }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="h-full flex items-center justify-around px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all relative ${
                    isActive ? "text-black" : "text-marquis-grey"
                  }`}
                  style={{
                    background: isActive ? "rgba(255,213,0,0.1)" : "transparent",
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{
                      color: isActive ? "#FFD500" : "#6E6E70",
                      strokeWidth: isActive ? 2.5 : 2,
                      filter: isActive ? "drop-shadow(0px 2px 4px rgba(255,213,0,0.3))" : "none",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#000000" : "#6E6E70",
                    }}
                  >
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 w-1 h-1 rounded-full"
                      style={{ backgroundColor: "#FFD500" }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
      </div>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, studentId, userType, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(id, role) => {
          // use the REAL id from /api/login
          login(id, role);
        }}
      />
    );
  }

  if (userType === "parent") {
    return (
      <DataProvider studentId={studentId || "student-1"}>
        <ParentPortalPage />
      </DataProvider>
    );
  }

  return (
    <DataProvider studentId={studentId || "student-1"}>
      <StudentApp />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
